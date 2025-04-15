// backend/server.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import route handlers and services
const authRoutes = require('./routes/auth.routes');
const notificationScheduler = require('./services/notification.scheduler');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'u265890320_user',
  password: process.env.DB_PASSWORD || 'yourpassword',
  database: process.env.DB_NAME || 'u265890320_dam_db'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Make pool available to other files
const db = {
  query: async (sql, params) => pool.query(sql, params)
};
global.db = db;

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Token format is invalid' });
    }
    
    const token = parts[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Set user info in request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    }
    
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Authorization middleware
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden - insufficient permissions' });
    }

    next();
  };
};

// Test database connection
app.get('/api/healthcheck', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.status(200).json({ status: 'Database connection successful' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Mount auth routes
app.use('/api/auth', authRoutes);

// Protected routes - require authentication
app.use('/api/providers', authenticate);
app.use('/api/domains', authenticate);
app.use('/api/websites', authenticate);
app.use('/api/stats', authenticate);

// PROVIDER ROUTES

// Get all providers
app.get('/api/providers', async (req, res) => {
  try {
    // Admin sees all providers, regular users only see their own
    let query = 'SELECT * FROM providers';
    let queryParams = [];
    
    // If not admin, filter by user_id
    if (req.user.role !== 'admin') {
      query += ' WHERE user_id = ?';
      queryParams.push(req.user.id);
    }
    
    query += ' ORDER BY provider_name';
    
    const [providers] = await pool.query(query, queryParams);
    res.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// Get provider by ID
app.get('/api/providers/:id', async (req, res) => {
  try {
    let query = 'SELECT * FROM providers WHERE provider_id = ?';
    let queryParams = [req.params.id];
    
    // If not admin, also check user_id
    if (req.user.role !== 'admin') {
      query += ' AND user_id = ?';
      queryParams.push(req.user.id);
    }
    
    const [provider] = await pool.query(query, queryParams);
    
    if (provider.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    res.json(provider[0]);
  } catch (error) {
    console.error('Error fetching provider:', error);
    res.status(500).json({ error: 'Failed to fetch provider' });
  }
});

// Add new provider
app.post('/api/providers', async (req, res) => {
  try {
    const { provider_name, provider_type, username, password, account_expiry_date, website, notes } = req.body;
    
    if (!provider_name || !provider_type) {
      return res.status(400).json({ error: 'Provider name and type are required' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO providers (provider_name, provider_type, username, password, account_expiry_date, website, notes, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [provider_name, provider_type, username, password, account_expiry_date, website, notes, req.user.id]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      message: 'Provider added successfully' 
    });
  } catch (error) {
    console.error('Error adding provider:', error);
    res.status(500).json({ error: 'Failed to add provider' });
  }
});

// Update provider
app.put('/api/providers/:id', async (req, res) => {
  try {
    const { provider_name, provider_type, username, password, account_expiry_date, website, notes } = req.body;
    const providerId = req.params.id;
    
    // Check if provider exists and belongs to user
    let checkQuery = 'SELECT provider_id FROM providers WHERE provider_id = ?';
    let checkQueryParams = [providerId];
    
    // If not admin, also check user_id
    if (req.user.role !== 'admin') {
      checkQuery += ' AND user_id = ?';
      checkQueryParams.push(req.user.id);
    }
    
    const [providers] = await pool.query(checkQuery, checkQueryParams);
    
    if (providers.length === 0) {
      return res.status(404).json({ error: 'Provider not found or access denied' });
    }
    
    const [result] = await pool.query(
      'UPDATE providers SET provider_name = ?, provider_type = ?, username = ?, password = ?, account_expiry_date = ?, website = ?, notes = ? WHERE provider_id = ?',
      [provider_name, provider_type, username, password, account_expiry_date, website, notes, providerId]
    );
    
    res.json({ message: 'Provider updated successfully' });
  } catch (error) {
    console.error('Error updating provider:', error);
    res.status(500).json({ error: 'Failed to update provider' });
  }
});

// Delete provider
app.delete('/api/providers/:id', async (req, res) => {
  try {
    let query = 'DELETE FROM providers WHERE provider_id = ?';
    let queryParams = [req.params.id];
    
    // If not admin, also check user_id
    if (req.user.role !== 'admin') {
      query += ' AND user_id = ?';
      queryParams.push(req.user.id);
    }
    
    const [result] = await pool.query(query, queryParams);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Provider not found or access denied' });
    }
    
    res.json({ message: 'Provider deleted successfully' });
  } catch (error) {
    console.error('Error deleting provider:', error);
    res.status(500).json({ error: 'Failed to delete provider' });
  }
});

// DOMAIN ROUTES

// Get all domains
app.get('/api/domains', async (req, res) => {
  try {
    let query = `
      SELECT d.*, p.provider_name 
      FROM domains d
      LEFT JOIN providers p ON d.provider_id = p.provider_id
    `;
    
    let queryParams = [];
    
    // If not admin, filter by user_id
    if (req.user.role !== 'admin') {
      query += ' WHERE d.user_id = ?';
      queryParams.push(req.user.id);
    }
    
    query += ' ORDER BY d.expiry_date';
    
    const [domains] = await pool.query(query, queryParams);
    
    // Get nameservers for each domain
    for (const domain of domains) {
      const [nameservers] = await pool.query(
        'SELECT * FROM nameservers WHERE domain_id = ? ORDER BY nameserver_order',
        [domain.domain_id]
      );
      domain.nameservers = nameservers;
    }
    
    res.json(domains);
  } catch (error) {
    console.error('Error fetching domains:', error);
    res.status(500).json({ error: 'Failed to fetch domains' });
  }
});

// Get domain by ID
app.get('/api/domains/:id', async (req, res) => {
  try {
    let query = `
      SELECT d.*, p.provider_name 
      FROM domains d
      LEFT JOIN providers p ON d.provider_id = p.provider_id
      WHERE d.domain_id = ?
    `;
    
    let queryParams = [req.params.id];
    
    // If not admin, also check user_id
    if (req.user.role !== 'admin') {
      query += ' AND d.user_id = ?';
      queryParams.push(req.user.id);
    }
    
    const [domain] = await pool.query(query, queryParams);
    
    if (domain.length === 0) {
      return res.status(404).json({ error: 'Domain not found or access denied' });
    }
    
    // Get nameservers
    const [nameservers] = await pool.query(
      'SELECT * FROM nameservers WHERE domain_id = ? ORDER BY nameserver_order',
      [req.params.id]
    );
    
    domain[0].nameservers = nameservers;
    
    res.json(domain[0]);
  } catch (error) {
    console.error('Error fetching domain:', error);
    res.status(500).json({ error: 'Failed to fetch domain' });
  }
});

// Add new domain with nameservers
app.post('/api/domains', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { domain_name, provider_id, registration_date, expiry_date, auto_renew, nameservers } = req.body;
    
    if (!domain_name || !expiry_date) {
      await connection.rollback();
      return res.status(400).json({ error: 'Domain name and expiry date are required' });
    }
    
    // If provider_id is provided, check if it exists and belongs to user
    if (provider_id) {
      let providerQuery = 'SELECT provider_id FROM providers WHERE provider_id = ?';
      let providerQueryParams = [provider_id];
      
      // If not admin, check user_id
      if (req.user.role !== 'admin') {
        providerQuery += ' AND user_id = ?';
        providerQueryParams.push(req.user.id);
      }
      
      const [providers] = await connection.query(providerQuery, providerQueryParams);
      
      if (providers.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Provider not found or access denied' });
      }
    }
    
    // Insert domain with user_id
    const [domainResult] = await connection.query(
      'INSERT INTO domains (domain_name, provider_id, registration_date, expiry_date, auto_renew, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [domain_name, provider_id, registration_date, expiry_date, auto_renew || false, req.user.id]
    );
    
    const domainId = domainResult.insertId;
    
    // Insert nameservers if provided
    if (nameservers && nameservers.length > 0) {
      for (let i = 0; i < nameservers.length; i++) {
        if (nameservers[i].trim() !== '') {
          await connection.query(
            'INSERT INTO nameservers (domain_id, nameserver_value, nameserver_order) VALUES (?, ?, ?)',
            [domainId, nameservers[i], i + 1]
          );
        }
      }
    }
    
    await connection.commit();
    
    res.status(201).json({ 
      id: domainId,
      message: 'Domain added successfully' 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error adding domain:', error);
    res.status(500).json({ error: 'Failed to add domain' });
  } finally {
    connection.release();
  }
});

// Update domain with nameservers
app.put('/api/domains/:id', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { domain_name, provider_id, registration_date, expiry_date, auto_renew, nameservers } = req.body;
    const domainId = req.params.id;
    
    // Check if domain exists and belongs to user
    let checkQuery = 'SELECT domain_id FROM domains WHERE domain_id = ?';
    let checkQueryParams = [domainId];
    
    // If not admin, also check user_id
    if (req.user.role !== 'admin') {
      checkQuery += ' AND user_id = ?';
      checkQueryParams.push(req.user.id);
    }
    
    const [domains] = await connection.query(checkQuery, checkQueryParams);
    
    if (domains.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Domain not found or access denied' });
    }
    
    // If provider_id is provided, check if it exists and belongs to user
    if (provider_id) {
      let providerQuery = 'SELECT provider_id FROM providers WHERE provider_id = ?';
      let providerQueryParams = [provider_id];
      
      // If not admin, check user_id
      if (req.user.role !== 'admin') {
        providerQuery += ' AND user_id = ?';
        providerQueryParams.push(req.user.id);
      }
      
      const [providers] = await connection.query(providerQuery, providerQueryParams);
      
      if (providers.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Provider not found or access denied' });
      }
    }
    
    // Update domain
    const [domainResult] = await connection.query(
      'UPDATE domains SET domain_name = ?, provider_id = ?, registration_date = ?, expiry_date = ?, auto_renew = ? WHERE domain_id = ?',
      [domain_name, provider_id, registration_date, expiry_date, auto_renew || false, domainId]
    );
    
    // Delete existing nameservers
    await connection.query('DELETE FROM nameservers WHERE domain_id = ?', [domainId]);
    
    // Insert updated nameservers
    if (nameservers && nameservers.length > 0) {
      for (let i = 0; i < nameservers.length; i++) {
        if (nameservers[i].trim() !== '') {
          await connection.query(
            'INSERT INTO nameservers (domain_id, nameserver_value, nameserver_order) VALUES (?, ?, ?)',
            [domainId, nameservers[i], i + 1]
          );
        }
      }
    }
    
    await connection.commit();
    
    res.json({ message: 'Domain updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating domain:', error);
    res.status(500).json({ error: 'Failed to update domain' });
  } finally {
    connection.release();
  }
});

// Delete domain
app.delete('/api/domains/:id', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const domainId = req.params.id;
    
    // Check if domain exists and belongs to user
    let checkQuery = 'SELECT domain_id FROM domains WHERE domain_id = ?';
    let checkQueryParams = [domainId];
    
    // If not admin, also check user_id
    if (req.user.role !== 'admin') {
      checkQuery += ' AND user_id = ?';
      checkQueryParams.push(req.user.id);
    }
    
    const [domains] = await connection.query(checkQuery, checkQueryParams);
    
    if (domains.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Domain not found or access denied' });
    }
    
    // Delete nameservers first (could be handled by foreign key CASCADE)
    await connection.query('DELETE FROM nameservers WHERE domain_id = ?', [domainId]);
    
    // Delete domain
    const [result] = await connection.query('DELETE FROM domains WHERE domain_id = ?', [domainId]);
    
    await connection.commit();
    
    res.json({ message: 'Domain deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting domain:', error);
    res.status(500).json({ error: 'Failed to delete domain' });
  } finally {
    connection.release();
  }
});

// WEBSITE ROUTES

// Get all websites
app.get('/api/websites', async (req, res) => {
  try {
    let query = `
      SELECT w.*, d.domain_name, p.provider_name 
      FROM websites w
      LEFT JOIN domains d ON w.domain_id = d.domain_id
      LEFT JOIN providers p ON w.hosting_provider_id = p.provider_id
    `;
    
    let queryParams = [];
    
    // If not admin, filter by user_id
    if (req.user.role !== 'admin') {
      query += ' WHERE w.user_id = ?';
      queryParams.push(req.user.id);
    }
    
    query += ' ORDER BY w.website_name';
    
    const [websites] = await pool.query(query, queryParams);
    
    res.json(websites);
  } catch (error) {
    console.error('Error fetching websites:', error);
    res.status(500).json({ error: 'Failed to fetch websites' });
  }
});

// Get website by ID
app.get('/api/websites/:id', async (req, res) => {
  try {
    let query = `
      SELECT w.*, d.domain_name, p.provider_name 
      FROM websites w
      LEFT JOIN domains d ON w.domain_id = d.domain_id
      LEFT JOIN providers p ON w.hosting_provider_id = p.provider_id
      WHERE w.website_id = ?
    `;
    
    let queryParams = [req.params.id];
    
    // If not admin, also check user_id
    if (req.user.role !== 'admin') {
      query += ' AND w.user_id = ?';
      queryParams.push(req.user.id);
    }
    
    const [website] = await pool.query(query, queryParams);
    
    if (website.length === 0) {
      return res.status(404).json({ error: 'Website not found or access denied' });
    }
    
    res.json(website[0]);
  } catch (error) {
    console.error('Error fetching website:', error);
    res.status(500).json({ error: 'Failed to fetch website' });
  }
});

// Get websites by provider ID
app.get('/api/providers/:id/websites', async (req, res) => {
  try {
    const providerId = req.params.id;
    
    // Check if provider exists and belongs to user
    let checkQuery = 'SELECT provider_id FROM providers WHERE provider_id = ?';
    let checkQueryParams = [providerId];
    
    // If not admin, also check user_id
    if (req.user.role !== 'admin') {
      checkQuery += ' AND user_id = ?';
      checkQueryParams.push(req.user.id);
    }
    
    const [providers] = await pool.query(checkQuery, checkQueryParams);
    
    if (providers.length === 0) {
      return res.status(404).json({ error: 'Provider not found or access denied' });
    }
    
    let query = `
      SELECT w.*, d.domain_name 
      FROM websites w
      LEFT JOIN domains d ON w.domain_id = d.domain_id
      WHERE w.hosting_provider_id = ?
    `;
    
    let queryParams = [providerId];
    
    // If not admin, also filter by user_id
    if (req.user.role !== 'admin') {
      query += ' AND w.user_id = ?';
      queryParams.push(req.user.id);
    }
    
    query += ' ORDER BY w.website_name';
    
    const [websites] = await pool.query(query, queryParams);
    
    res.json(websites);
  } catch (error) {
    console.error('Error fetching provider websites:', error);
    res.status(500).json({ error: 'Failed to fetch provider websites' });
  }
});

// Get domains by provider ID
app.get('/api/providers/:id/domains', async (req, res) => {
  try {
    const providerId = req.params.id;
    
    // Check if provider exists and belongs to user
    let checkQuery = 'SELECT provider_id FROM providers WHERE provider_id = ?';
    let checkQueryParams = [providerId];
    
    // If not admin, also check user_id
    if (req.user.role !== 'admin') {
      checkQuery += ' AND user_id = ?';
      checkQueryParams.push(req.user.id);
    }
    
    const [providers] = await pool.query(checkQuery, checkQueryParams);
    
    if (providers.length === 0) {
      return res.status(404).json({ error: 'Provider not found or access denied' });
    }
    
    let query = `
      SELECT d.* 
      FROM domains d
      WHERE d.provider_id = ?
    `;
    
    let queryParams = [providerId];
    
    // If not admin, also filter by user_id
    if (req.user.role !== 'admin') {
      query += ' AND d.user_id = ?';
      queryParams.push(req.user.id);
    }
    
    query += ' ORDER BY d.expiry_date';
    
    const [domains] = await pool.query(query, queryParams);
    
    // Get nameservers for each domain
    for (const domain of domains) {
      const [nameservers] = await pool.query(
        'SELECT * FROM nameservers WHERE domain_id = ? ORDER BY nameserver_order',
        [domain.domain_id]
      );
      domain.nameservers = nameservers;
    }
    
    res.json(domains);
  } catch (error) {
    console.error('Error fetching provider domains:', error);
    res.status(500).json({ error: 'Failed to fetch provider domains' });
  }
});

// Add new website
app.post('/api/websites', async (req, res) => {
  try {
    const { website_name, domain_id, hosting_provider_id, hosting_package, ip_address, is_active } = req.body;
    
    if (!website_name || !hosting_provider_id) {
      return res.status(400).json({ error: 'Website name and hosting provider are required' });
    }
    
    // Check if domain belongs to user
    if (domain_id) {
      let domainQuery = 'SELECT domain_id FROM domains WHERE domain_id = ?';
      let domainQueryParams = [domain_id];
      
      // If not admin, check user_id
      if (req.user.role !== 'admin') {
        domainQuery += ' AND user_id = ?';
        domainQueryParams.push(req.user.id);
      }
      
      const [domains] = await pool.query(domainQuery, domainQueryParams);
      
      if (domains.length === 0) {
        return res.status(404).json({ error: 'Domain not found or access denied' });
      }
    }
    
    // Check if provider belongs to user
    let providerQuery = 'SELECT provider_id FROM providers WHERE provider_id = ?';
    let providerQueryParams = [hosting_provider_id];
    
    // If not admin, check user_id
    if (req.user.role !== 'admin') {
      providerQuery += ' AND user_id = ?';
      providerQueryParams.push(req.user.id);
    }
    
    const [providers] = await pool.query(providerQuery, providerQueryParams);
    
    if (providers.length === 0) {
      return res.status(404).json({ error: 'Provider not found or access denied' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO websites (website_name, domain_id, hosting_provider_id, hosting_package, ip_address, is_active, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [website_name, domain_id, hosting_provider_id, hosting_package, ip_address, is_active, req.user.id]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      message: 'Website added successfully' 
    });
  } catch (error) {
    console.error('Error adding website:', error);
    res.status(500).json({ error: 'Failed to add website' });
  }
});

// Update website
app.put('/api/websites/:id', async (req, res) => {
  try {
    const { website_name, domain_id, hosting_provider_id, hosting_package, ip_address, is_active } = req.body;
    const websiteId = req.params.id;
    
    // Check if website exists and belongs to user
    let checkQuery = 'SELECT website_id FROM websites WHERE website_id = ?';
    let checkQueryParams = [websiteId];
    
    // If not admin, also check user_id
    if (req.user.role !== 'admin') {
      checkQuery += ' AND user_id = ?';
      checkQueryParams.push(req.user.id);
    }
    
    const [websites] = await pool.query(checkQuery, checkQueryParams);
    
    if (websites.length === 0) {
      return res.status(404).json({ error: 'Website not found or access denied' });
    }
    
    // Check if domain belongs to user
    if (domain_id) {
      let domainQuery = 'SELECT domain_id FROM domains WHERE domain_id = ?';
      let domainQueryParams = [domain_id];
      
      // If not admin, check user_id
      if (req.user.role !== 'admin') {
        domainQuery += ' AND user_id = ?';
        domainQueryParams.push(req.user.id);
      }
      
      const [domains] = await pool.query(domainQuery, domainQueryParams);
      
      if (domains.length === 0) {
        return res.status(404).json({ error: 'Domain not found or access denied' });
      }
    }
    
    // Check if provider belongs to user
    let providerQuery = 'SELECT provider_id FROM providers WHERE provider_id = ?';
    let providerQueryParams = [hosting_provider_id];
    
    // If not admin, check user_id
    if (req.user.role !== 'admin') {
      providerQuery += ' AND user_id = ?';
      providerQueryParams.push(req.user.id);
    }
    
    const [providers] = await pool.query(providerQuery, providerQueryParams);
    
    if (providers.length === 0) {
      return res.status(404).json({ error: 'Provider not found or access denied' });
    }
    
    const [result] = await pool.query(
      'UPDATE websites SET website_name = ?, domain_id = ?, hosting_provider_id = ?, hosting_package = ?, ip_address = ?, is_active = ? WHERE website_id = ?',
      [website_name, domain_id, hosting_provider_id, hosting_package, ip_address, is_active, websiteId]
    );
    
    res.json({ message: 'Website updated successfully' });
  } catch (error) {
    console.error('Error updating website:', error);
    res.status(500).json({ error: 'Failed to update website' });
  }
});

// Delete website
app.delete('/api/websites/:id', async (req, res) => {
  try {
    let query = 'DELETE FROM websites WHERE website_id = ?';
    let queryParams = [req.params.id];
    
    // If not admin, also check user_id
    if (req.user.role !== 'admin') {
      query += ' AND user_id = ?';
      queryParams.push(req.user.id);
    }
    
    const [result] = await pool.query(query, queryParams);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Website not found or access denied' });
    }
    
    res.json({ message: 'Website deleted successfully' });
  } catch (error) {
    console.error('Error deleting website:', error);
    res.status(500).json({ error: 'Failed to delete website' });
  }
});

// Statistics/Summary route
app.get('/api/stats', async (req, res) => {
  try {
    // Get count of providers by type
    let providerQuery = 'SELECT provider_type, COUNT(*) as count FROM providers';
    let providerParams = [];
    
    // If not admin, filter by user_id
    if (req.user.role !== 'admin') {
      providerQuery += ' WHERE user_id = ?';
      providerParams.push(req.user.id);
    }
    
    providerQuery += ' GROUP BY provider_type';
    
    const [providerStats] = await pool.query(providerQuery, providerParams);
    
    // Get domain expiry counts (expiring in 30 days, 90 days)
    let domainQuery = `
      SELECT 
        SUM(CASE WHEN expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as expiring_30_days,
        SUM(CASE WHEN expiry_date <= DATE_ADD(CURDATE(), INTERVAL 90 DAY) THEN 1 ELSE 0 END) as expiring_90_days,
        COUNT(*) as total
      FROM domains
    `;
    
    let domainParams = [];
    
    // If not admin, filter by user_id
    if (req.user.role !== 'admin') {
      domainQuery += ' WHERE user_id = ?';
      domainParams.push(req.user.id);
    }
    
    const [domainExpiryStats] = await pool.query(domainQuery, domainParams);
    
    // Get website stats
    let websiteQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive
      FROM websites
    `;
    
    let websiteParams = [];
    
    // If not admin, filter by user_id
    if (req.user.role !== 'admin') {
      websiteQuery += ' WHERE user_id = ?';
      websiteParams.push(req.user.id);
    }
    
    const [websiteStats] = await pool.query(websiteQuery, websiteParams);
    
    res.json({
      providers: providerStats,
      domains: domainExpiryStats[0],
      websites: websiteStats[0]
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});
  // Initialize notification services
const initNotifications = async () => {
  try {
    await notificationScheduler.initNotificationServices();
    console.log('Notification services started successfully');
  } catch (error) {
    console.error('Failed to start notification services:', error);
  }
};

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start notifications after server is running
  initNotifications();
});

module.exports = app;