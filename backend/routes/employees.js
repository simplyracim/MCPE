const express = require('express');
const router = express.Router();
const db = require('../config/dbConfig');
const { authenticate, isAdmin } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// ==================== GET ALL EMPLOYEES ====================
// Only admins can view all employees
router.get('/', isAdmin, (req, res) => {
  const sql = `
    SELECT 
      employees.id,
      employees.name,
      employees.is_admin,
      roles.title AS role_title
    FROM employees
    LEFT JOIN roles ON employees.role_id = roles.id
    ORDER BY employees.is_admin DESC, employees.name ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching employees:', err);
      return res.status(500).send('Server error');
    }
    res.json(results);
  });
});

// ==================== GET SINGLE EMPLOYEE ====================
// Users can view their own profile, admins can view any profile
router.get('/:id', (req, res) => {
  // Allow access if user is viewing their own profile or is an admin
  if (req.params.id != req.user.id && !req.user.is_admin) {
    return res.status(403).json({ message: 'Access denied. You can only view your own profile.' });
  }
  const sql = `
    SELECT 
      employees.id,
      employees.name,
      employees.is_admin,
      roles.title AS role_title
    FROM employees
    LEFT JOIN roles ON employees.role_id = roles.id
    WHERE employees.id = ?
  `;

  db.query(sql, [req.params.id], (err, results) => {
    if (err) {
      console.error('Error fetching employee:', err);
      return res.status(500).send('Server error');
    }
    if (results.length === 0) return res.status(404).send('Employee not found');
    res.json(results[0]);
  });
});

// ==================== CREATE NEW EMPLOYEE ====================
// Only admins can create new employees
router.post('/', isAdmin, (req, res) => {
  const { name, role_id, is_admin = 0 } = req.body;

  if (!name) {
    return res.status(400).send('Name is required');
  }

  const sql = `
    INSERT INTO employees (name, role_id, is_admin)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [name, role_id, is_admin], (err, result) => {
    if (err) {
      console.error('Error creating employee:', err);
      return res.status(500).send('Server error');
    }

    res.status(201).json({ id: result.insertId, name, role_id, is_admin });
  });
});

// ==================== UPDATE EMPLOYEE ====================
// Only admins can update employees
router.put('/:id', isAdmin, (req, res) => {
  const { name, role_id, is_admin } = req.body;

  const sql = `
    UPDATE employees
    SET name = ?, role_id = ?, is_admin = ?
    WHERE id = ?
  `;

  db.query(sql, [name, role_id, is_admin, req.params.id], (err, result) => {
    if (err) {
      console.error('Error updating employee:', err);
      return res.status(500).send('Server error');
    }

    if (result.affectedRows === 0) return res.status(404).send('Employee not found');

    res.send('Employee updated successfully');
  });
});

// ==================== DELETE EMPLOYEE ====================
// Only admins can delete employees
router.delete('/:id', isAdmin, (req, res) => {
  const sql = `DELETE FROM employees WHERE id = ?`;

  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error('Error deleting employee:', err);
      return res.status(500).send('Server error');
    }

    if (result.affectedRows === 0) return res.status(404).send('Employee not found');

    res.send('Employee deleted successfully');
  });
});

module.exports = router;
