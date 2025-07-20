const jwt = require('jsonwebtoken');
const db = require('../config/dbConfig');
const { secret: JWT_SECRET } = require('../config/jwt');

// Middleware to verify JWT token
exports.authenticate = (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    db.query('SELECT * FROM employees WHERE id = ?', [decoded.id], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      
      if (results.length === 0) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Attach user to request object
      req.user = results[0];
      next();
    });
  } catch (err) {
    console.error('Token verification failed:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (!req.user.is_admin) {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  
  next();
};
