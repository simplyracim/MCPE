const express = require('express');
const router = express.Router();
const db = require('../config/dbConfig');

// ==================== GET ALL PRODUCTS ====================
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM products ORDER BY created_at DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).send('Server error');
    }
    res.json(results);
  });
});

// ==================== GET SINGLE PRODUCT ====================
// ==================== GET PRODUCT + COMPONENTS (recursive) ====================
router.get('/:id', async (req, res) => {
  const productId = parseInt(req.params.id);

  if (isNaN(productId)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  try {
    const product = await getProductById(productId);
    if (!product) return res.status(404).send('Product not found');

    const productWithComponents = await buildProductTree(product);
    res.json(productWithComponents);

  } catch (err) {
    console.error('Error fetching recursive product:', err);
    res.status(500).send('Server error');
  }
});


// -------------------- Helpers --------------------

function getProductById(id) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM products WHERE id = ?';
    db.query(sql, [id], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null);
    });
  });
}

function getComponents(initialProductId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT pc.rate, p.*
      FROM product_components pc
      JOIN products p ON p.id = pc.final_product_id
      WHERE pc.initial_product_id = ?
    `;
    db.query(sql, [initialProductId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

async function buildProductTree(product) {
  const components = await getComponents(product.id);

  const children = await Promise.all(
    components.map(async (comp) => {
      const fullComp = await buildProductTree(comp);
      fullComp.rate = comp.rate; // Attach rate from product_components
      return fullComp;
    })
  );

  return { ...product, components: children };
}

// ==================== CREATE PRODUCT ====================
router.post('/', (req, res) => {
  const { name, description, quantity, sell_price, buy_price } = req.body;
  const sql = `
    INSERT INTO products (name, description, quantity, sell_price, buy_price)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [name, description, quantity, sell_price, buy_price], (err, result) => {
    if (err) {
      console.error('Error creating product:', err);
      return res.status(500).send('Server error');
    }
    res.status(201).json({ id: result.insertId, name, description, quantity, sell_price, buy_price });
  });
});

// ==================== UPDATE PRODUCT ====================
router.put('/:id', (req, res) => {
  const { name, description, quantity, sell_price, buy_price } = req.body;
  const sql = `
    UPDATE products 
    SET name = ?, description = ?, quantity = ?, sell_price = ?, buy_price = ?
    WHERE id = ?
  `;
  db.query(sql, [name, description, quantity, sell_price, buy_price, req.params.id], (err, result) => {
    if (err) {
      console.error('Error updating product:', err);
      return res.status(500).send('Server error');
    }
    res.send('Product updated successfully');
  });
});

// ==================== DELETE PRODUCT ====================
router.delete('/:id', (req, res) => {
  const sql = 'DELETE FROM products WHERE id = ?';
  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error('Error deleting product:', err);
      return res.status(500).send('Server error');
    }
    res.send('Product deleted successfully');
  });
});

// ==================== SET COMPONENT ====================
// POST /api/product-components/set
router.post('/set', (req, res) => {
  const { initial_product_id, final_product_id, rate } = req.body;

  if (!initial_product_id || !final_product_id) {
    return res.status(400).json({ error: 'initial_product_id and final_product_id are required' });
  }

  const sql = `
    INSERT INTO product_components (initial_product_id, final_product_id, rate)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE rate = VALUES(rate)
  `;

  db.query(sql, [initial_product_id, final_product_id, rate || null], (err, result) => {
    if (err) {
      console.error('Error setting product component:', err);
      return res.status(500).send('Server error');
    }
    res.status(201).json({ message: 'Component set successfully', id: result.insertId });
  });
});

// ==================== UNSET COMPONENT ====================
// DELETE /api/product-components/unset
router.delete('/unset', (req, res) => {
  const { initial_product_id, final_product_id } = req.body;

  if (!initial_product_id || !final_product_id) {
    return res.status(400).json({ error: 'initial_product_id and final_product_id are required' });
  }

  const sql = `
    DELETE FROM product_components
    WHERE initial_product_id = ? AND final_product_id = ?
  `;

  db.query(sql, [initial_product_id, final_product_id], (err, result) => {
    if (err) {
      console.error('Error unsetting product component:', err);
      return res.status(500).send('Server error');
    }
    res.json({ message: 'Component unset successfully' });
  });
});

module.exports = router;
