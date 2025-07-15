const express = require('express');
const router = express.Router();
const db = require('../config/dbConfig');

// GET /api/roles
router.get('/', (req, res) => {
  const sql = `
    SELECT * FROM roles
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching roles:', err);
      return res.status(500).send('Server error');
    }
    res.json(results);
  });
});

module.exports = router;
