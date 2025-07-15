const express = require('express');
const router = express.Router();
const db = require('../config/dbConfig');

// ==================== GET ALL ORDERS ====================
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM orders ORDER BY order_date DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching orders:', err);
      return res.status(500).send('Server error');
    }
    res.json(results);
  });
});

// ==================== GET SINGLE ORDER BY ID ====================
router.get('/:id', (req, res) => {
  const sql = 'SELECT * FROM orders WHERE id = ?';
  db.query(sql, [req.params.id], (err, results) => {
    if (err) {
      console.error('Error fetching order:', err);
      return res.status(500).send('Server error');
    }
    if (results.length === 0) return res.status(404).send('Order not found');
    res.json(results[0]);
  });
});

// ==================== CREATE NEW ORDER ====================
router.post('/', (req, res) => {
  const { customer_name, order_date, status } = req.body;
  const sql = `
    INSERT INTO orders (customer_name, order_date, status)
    VALUES (?, ?, ?)
  `;
  db.query(sql, [customer_name, order_date || new Date(), status || 'pending'], (err, result) => {
    if (err) {
      console.error('Error creating order:', err);
      return res.status(500).send('Server error');
    }
    res.status(201).json({ id: result.insertId, customer_name, order_date, status });
  });
});

// ==================== UPDATE ORDER ====================
router.put('/:id', (req, res) => {
  const { customer_name, order_date, status } = req.body;
  const sql = `
    UPDATE orders
    SET customer_name = ?, order_date = ?, status = ?
    WHERE id = ?
  `;
  db.query(sql, [customer_name, order_date, status, req.params.id], (err, result) => {
    if (err) {
      console.error('Error updating order:', err);
      return res.status(500).send('Server error');
    }
    res.send('Order updated successfully');
  });
});

// ==================== DELETE ORDER ====================
router.delete('/:id', (req, res) => {
  const sql = 'DELETE FROM orders WHERE id = ?';
  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error('Error deleting order:', err);
      return res.status(500).send('Server error');
    }
    res.send('Order deleted successfully');
  });
});

// ==================== SET PRODUCT TO ORDER ====================
router.post('/:orderId/products/:productId', (req, res) => {
  const { orderId, productId } = req.params;
  const { quantity = 1 } = req.body;

  const sql = `
    INSERT INTO product_orders (order_id, product_id, quantity)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
  `;

  db.query(sql, [orderId, productId, quantity], (err, result) => {
    if (err) {
      console.error('Error setting product to order:', err);
      return res.status(500).send('Server error');
    }
    res.send('Product added to order successfully');
  });
});

// ==================== UNSET PRODUCT FROM ORDER ====================
router.delete('/:orderId/products/:productId', (req, res) => {
  const { orderId, productId } = req.params;

  const sql = `
    DELETE FROM product_orders
    WHERE order_id = ? AND product_id = ?
  `;

  db.query(sql, [orderId, productId], (err, result) => {
    if (err) {
      console.error('Error removing product from order:', err);
      return res.status(500).send('Server error');
    }
    res.send('Product removed from order successfully');
  });
});

module.exports = router;
