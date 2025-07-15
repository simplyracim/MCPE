const express = require('express');
const router = express.Router();
const db = require('../config/dbConfig');

// GET /api/employees
router.get('/', (req, res) => {
  const sql = `
  SELECT 
    employees.id,
    employees.name,
    employees.is_admin,
    roles.title AS role_title
  FROM employees
  LEFT JOIN roles ON employees.role_id = roles.id
  ORDER BY employees.is_admin DESC, employees.name ASC;
`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching employees:', err);
      return res.status(500).send('Server error');
    }
    res.json(results);
  });
});

module.exports = router;
