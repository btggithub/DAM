// backend/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

// Environment variables should be set in .env file
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Authentication middleware to verify JWT token
exports.authenticate = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization;
  
  console.log('Auth header:', authHeader); // Debug log
  
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization token provided' });
  }

  // Check if token format is valid
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Token format is invalid' });
  }

  const token = parts[1];
  console.log('Token to verify:', token.substring(0, 20) + '...'); // Debug log

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token verified successfully:', decoded); // Debug log
    
    // Set user info in request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT verification error:', error.name, error.message); // Detailed error
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Role-based authorization middleware
exports.authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden - insufficient permissions' });
    }

    next();
  };
};