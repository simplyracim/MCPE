const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/dbConfig');
const { body, validationResult } = require('express-validator');

// JWT Secret Key (should be in environment variables in production)
const JWT_SECRET = 'your_jwt_secret_key';
const JWT_EXPIRES_IN = '24h';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Register a new user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, name, role_id = 2 } = req.body; // Default to employee role

  try {
    // Check if user already exists
    const [existingUser] = await db.promise().query('SELECT id FROM login_info WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Start transaction
    await db.promise().beginTransaction();

    try {
      // Insert into employees table
      const [employeeResult] = await db.promise().query(
        'INSERT INTO employees (name, role_id) VALUES (?, ?)',
        [name, role_id]
      );

      const employeeId = employeeResult.insertId;

      // Insert into login_info table
      await db.promise().query(
        'INSERT INTO login_info (employee_id, email, password_hash) VALUES (?, ?, ?)',
        [employeeId, email, hashedPassword]
      );

      // Commit transaction
      await db.promise().commit();

      // Generate JWT token
      const token = jwt.sign(
        { id: employeeId, email, role_id },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.status(201).json({ token });
    } catch (error) {
      await db.promise().rollback();
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Get user with role information
    const [users] = await db.promise().query(
      `SELECT l.*, e.role_id, r.name as role_name 
       FROM login_info l
       JOIN employees e ON l.employee_id = e.id
       JOIN roles r ON e.role_id = r.id
       WHERE l.email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.employee_id, 
        email: user.email, 
        role_id: user.role_id,
        role: user.role_name
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user data (excluding password)
    const { password_hash, ...userData } = user;
    res.json({ token, user: userData });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.promise().query(
      `SELECT e.id, e.name, e.role_id, l.email, r.name as role_name
       FROM employees e
       JOIN login_info l ON e.id = l.employee_id
       JOIN roles r ON e.role_id = r.id
       WHERE e.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password_hash, ...userData } = users[0];
    res.json(userData);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('currentPassword').optional(),
  body('newPassword').optional().isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    // Start transaction
    await db.promise().beginTransaction();

    try {
      // Update name if provided
      if (name) {
        await db.promise().query(
          'UPDATE employees SET name = ? WHERE id = ?',
          [name, userId]
        );
      }

      // Handle email update if provided
      if (email) {
        // Check if email is already taken
        const [existing] = await db.promise().query(
          'SELECT id FROM login_info WHERE email = ? AND employee_id != ?',
          [email, userId]
        );

        if (existing.length > 0) {
          await db.promise().rollback();
          return res.status(400).json({ message: 'Email already in use' });
        }

        await db.promise().query(
          'UPDATE login_info SET email = ? WHERE employee_id = ?',
          [email, userId]
        );
      }

      // Handle password change if current and new passwords are provided
      if (currentPassword && newPassword) {
        // Get current password hash
        const [users] = await db.promise().query(
          'SELECT password_hash FROM login_info WHERE employee_id = ?',
          [userId]
        );

        if (users.length === 0) {
          await db.promise().rollback();
          return res.status(404).json({ message: 'User not found' });
        }

        const currentHashedPassword = users[0].password_hash;
        const isMatch = await bcrypt.compare(currentPassword, currentHashedPassword);

        if (!isMatch) {
          await db.promise().rollback();
          return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newHashedPassword = await bcrypt.hash(newPassword, salt);

        await db.promise().query(
          'UPDATE login_info SET password_hash = ? WHERE employee_id = ?',
          [newHashedPassword, userId]
        );
      }

      // Commit transaction
      await db.promise().commit();

      // Get updated user data
      const [updatedUser] = await db.promise().query(
        `SELECT e.id, e.name, e.role_id, l.email, r.name as role_name
         FROM employees e
         JOIN login_info l ON e.id = l.employee_id
         JOIN roles r ON e.role_id = r.id
         WHERE e.id = ?`,
        [userId]
      );

      res.json(updatedUser[0]);
    } catch (error) {
      await db.promise().rollback();
      throw error;
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// Forgot password - Initiate password reset
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;

  try {
    // In a real application, you would:
    // 1. Generate a password reset token
    // 2. Save it to the database with an expiration
    // 3. Send an email with a reset link
    
    // For now, we'll just return a success message
    res.json({ 
      message: 'If an account with that email exists, a password reset link has been sent',
      // In production, don't return the token to the client
      // This is just for demonstration
      token: 'reset-token-here'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

// Reset password with token
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { token, password } = req.body;

  try {
    // In a real application, you would:
    // 1. Verify the reset token
    // 2. Check if it's expired
    // 3. Update the password if valid
    
    // For now, we'll just return a success message
    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

// Refresh token
router.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token is required' });
  }

  // In a real application, you would:
  // 1. Verify the refresh token
  // 2. Check if it's in the database and not expired
  // 3. Issue a new access token if valid
  
  // For now, we'll just return a new token
  const token = jwt.sign(
    { id: 'user-id', email: 'user@example.com' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  
  res.json({ token });
});

module.exports = router;
