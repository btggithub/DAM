// backend/routes/auth.routes.js
const express = require('express');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken'); // Add this line
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware'); 
const router = express.Router();

// Get JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Get authentication middleware from server.js
const { authenticate } = authMiddleware;
// const authenticate = (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;
    
//     if (!authHeader) {
//       return res.status(401).json({ error: 'No authorization token provided' });
//     }
    
//     const parts = authHeader.split(' ');
//     if (parts.length !== 2 || parts[0] !== 'Bearer') {
//       return res.status(401).json({ error: 'Token format is invalid' });
//     }
    
//     const token = parts[1];
    
//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
//     // Set user info in request
//     req.user = decoded;
//     next();
//   } catch (error) {
//     if (error.name === 'TokenExpiredError') {
//       return res.status(401).json({ error: 'Token has expired' });
//     }
    
//     console.error('Authentication error:', error);
//     return res.status(401).json({ error: 'Invalid token' });
//   }
// };

// Validation rules
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('password').exists().withMessage('Password is required')
];

const passwordChangeValidation = [
  body('currentPassword').exists().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const profileUpdateValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
];

// Public routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/forgot-password', 
  [body('email').isEmail().withMessage('Please provide a valid email address')],
  authController.forgotPassword
);
router.post('/reset-password/:token', 
  [body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
  ],
  authController.resetPassword
);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/update-profile', 
  authenticate, 
  profileUpdateValidation, 
  authController.updateProfile
);
router.post('/change-password', 
  authenticate, 
  passwordChangeValidation, 
  authController.changePassword
);

// Admin routes
router.get('/users', 
  authenticate, 
  authController.getAllUsers
);
router.put('/users/role', 
  authenticate, 
  authController.updateUserRole
);

module.exports = router;