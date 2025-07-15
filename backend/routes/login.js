const express = require('express');
const router = express.Router();
const db = require('../config/dbConfig');

// GET /routes/login
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      employees.id AS employee_id,
      employees.name,
      login_info.email,
      login_info.password_hash,
      login_info.created_at
    FROM 
      employees
    JOIN 
      login_info ON employees.id = login_info.employee_id;
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching employees:', err);
      return res.status(500).send('Server error');
    }
    res.json(results);
  });
});

// POST /routes/login
router.post('/', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM login_info WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = results[0];

    if (password === user.password_hash) {
      return res.json({ token: 'mock-token' });
    } else {
      return res.status(401).json({ message: 'Password is incorrect' });
    }
  });
});

module.exports = router;