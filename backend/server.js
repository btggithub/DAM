// server.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'u265890320_user',
  password: process.env.DB_PASSWORD || 'yourpassword',
  database: process.env.DB_NAME || 'u265890320_dam_db'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

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

// PROVIDER ROUTES

// Get all providers
app.get('/api/providers', async (req, res) => {
  try {
    const [providers] = await pool.query('SELECT * FROM providers ORDER BY provider_name');
    res.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// Get provider by ID
app.get('/api/providers/:id', async (req, res) => {
  try {
    const [provider] = await pool.query('SELECT * FROM providers WHERE provider_id = ?', [req.params.id]);
    
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
      'INSERT INTO providers (provider_name, provider_type, username, password, account_expiry_date, website, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [provider_name, provider_type, username, password, account_expiry_date, website, notes]
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
    
    const [result] = await pool.query(
      'UPDATE providers SET provider_name = ?, provider_type = ?, username = ?, password = ?, account_expiry_date = ?, website = ?, notes = ? WHERE provider_id = ?',
      [provider_name, provider_type, username, password, account_expiry_date, website, notes, providerId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    res.json({ message: 'Provider updated successfully' });
  } catch (error) {
    console.error('Error updating provider:', error);
    res.status(500).json({ error: 'Failed to update provider' });
  }
});

// Delete provider
app.delete('/api/providers/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM providers WHERE provider_id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Provider not found' });
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
    const [domains] = await pool.query(`
      SELECT d.*, p.provider_name 
      FROM domains d
      LEFT JOIN providers p ON d.provider_id = p.provider_id
      ORDER BY d.expiry_date
    `);
    
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
    const [domain] = await pool.query(`
      SELECT d.*, p.provider_name 
      FROM domains d
      LEFT JOIN providers p ON d.provider_id = p.provider_id
      WHERE d.domain_id = ?
    `, [req.params.id]);
    
    if (domain.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
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
    
    // Insert domain
    const [domainResult] = await connection.query(
      'INSERT INTO domains (domain_name, provider_id, registration_date, expiry_date, auto_renew) VALUES (?, ?, ?, ?, ?)',
      [domain_name, provider_id, registration_date, expiry_date, auto_renew || false]
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
    
    // Update domain
    const [domainResult] = await connection.query(
      'UPDATE domains SET domain_name = ?, provider_id = ?, registration_date = ?, expiry_date = ?, auto_renew = ? WHERE domain_id = ?',
      [domain_name, provider_id, registration_date, expiry_date, auto_renew || false, domainId]
    );
    
    if (domainResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Domain not found' });
    }
    
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
    
    // Delete nameservers first (could be handled by foreign key CASCADE)
    await connection.query('DELETE FROM nameservers WHERE domain_id = ?', [req.params.id]);
    
    // Delete domain
    const [result] = await connection.query('DELETE FROM domains WHERE domain_id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Domain not found' });
    }
    
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
    const [websites] = await pool.query(`
      SELECT w.*, d.domain_name, p.provider_name 
      FROM websites w
      LEFT JOIN domains d ON w.domain_id = d.domain_id
      LEFT JOIN providers p ON w.hosting_provider_id = p.provider_id
      ORDER BY w.website_name
    `);
    
    res.json(websites);
  } catch (error) {
    console.error('Error fetching websites:', error);
    res.status(500).json({ error: 'Failed to fetch websites' });
  }
});

// Get websites by provider ID
app.get('/api/providers/:id/websites', async (req, res) => {
  try {
    const [websites] = await pool.query(`
      SELECT w.*, d.domain_name 
      FROM websites w
      LEFT JOIN domains d ON w.domain_id = d.domain_id
      WHERE w.hosting_provider_id = ?
      ORDER BY w.website_name
    `, [req.params.id]);
    
    res.json(websites);
  } catch (error) {
    console.error('Error fetching provider websites:', error);
    res.status(500).json({ error: 'Failed to fetch provider websites' });
  }
});

// Get domains by provider ID
app.get('/api/providers/:id/domains', async (req, res) => {
  try {
    const [domains] = await pool.query(`
      SELECT d.* 
      FROM domains d
      WHERE d.provider_id = ?
      ORDER BY d.expiry_date
    `, [req.params.id]);
    
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
    
    const [result] = await pool.query(
      'INSERT INTO websites (website_name, domain_id, hosting_provider_id, hosting_package, ip_address, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [website_name, domain_id, hosting_provider_id, hosting_package, ip_address, is_active]
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
    
    const [result] = await pool.query(
      'UPDATE websites SET website_name = ?, domain_id = ?, hosting_provider_id = ?, hosting_package = ?, ip_address = ?, is_active = ? WHERE website_id = ?',
      [website_name, domain_id, hosting_provider_id, hosting_package, ip_address, is_active, websiteId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Website not found' });
    }
    
    res.json({ message: 'Website updated successfully' });
  } catch (error) {
    console.error('Error updating website:', error);
    res.status(500).json({ error: 'Failed to update website' });
  }
});

// Delete website
app.delete('/api/websites/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM websites WHERE website_id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Website not found' });
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
    const [providerStats] = await pool.query(`
      SELECT provider_type, COUNT(*) as count 
      FROM providers 
      GROUP BY provider_type
    `);
    
    // Get domain expiry counts (expiring in 30 days, 90 days)
    const [domainExpiryStats] = await pool.query(`
      SELECT 
        SUM(CASE WHEN expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as expiring_30_days,
        SUM(CASE WHEN expiry_date <= DATE_ADD(CURDATE(), INTERVAL 90 DAY) THEN 1 ELSE 0 END) as expiring_90_days,
        COUNT(*) as total
      FROM domains
    `);
    
    // Get website stats
    const [websiteStats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive
      FROM websites
    `);
    
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
// Get website by ID
app.get('/api/websites/:id', async (req, res) => {
    try {
      const [website] = await pool.query(`
        SELECT w.*, d.domain_name, p.provider_name 
        FROM websites w
        LEFT JOIN domains d ON w.domain_id = d.domain_id
        LEFT JOIN providers p ON w.hosting_provider_id = p.provider_id
        WHERE w.website_id = ?
      `, [req.params.id]);
      
      if (website.length === 0) {
        return res.status(404).json({ error: 'Website not found' });
      }
      
      res.json(website[0]);
    } catch (error) {
      console.error('Error fetching website:', error);
      res.status(500).json({ error: 'Failed to fetch website' });
    }
  });