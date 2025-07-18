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

// Helper function to get product with components
async function getProductWithComponents(productId) {
  return new Promise((resolve, reject) => {
    // First, get the product details
    db.query('SELECT * FROM products WHERE id = ?', [productId], (err, products) => {
      if (err) return reject(err);
      if (products.length === 0) return resolve(null);
      
      const product = products[0];
      
      // Then get its components
      db.query(
        `SELECT pc.rate, p.* 
         FROM product_components pc
         JOIN products p ON pc.final_product_id = p.id
         WHERE pc.initial_product_id = ?`, 
        [productId], 
        (err, components) => {
          if (err) return reject(err);
          
          // Recursively get components of components
          Promise.all(components.map(comp => 
            getProductWithComponents(comp.id).then(compWithChildren => ({
              ...comp,
              components: compWithChildren ? compWithChildren.components : []
            }))
          )).then(componentsWithChildren => {
            resolve({
              ...product,
              components: componentsWithChildren
            });
          }).catch(reject);
        }
      );
    });
  });
}

// ==================== GET SINGLE ORDER BY ID ====================
router.get('/:id', async (req, res) => {
  try {
    // Get the order
    const [order] = await db.promise().query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order.length) return res.status(404).send('Order not found');
    
    // Get order items with product details
    const [items] = await db.promise().query(
      `SELECT po.*, p.name, p.description, p.sell_price, p.buy_price 
       FROM product_orders po 
       JOIN products p ON po.product_id = p.id 
       WHERE po.order_id = ?`,
      [req.params.id]
    );
    
    // Get components for each product
    const orderWithProducts = {
      ...order[0],
      products: await Promise.all(
        items.map(async item => {
          const productWithComponents = await getProductWithComponents(item.product_id);
          return {
            ...item,
            components: productWithComponents?.components || []
          };
        })
      )
    };
    
    res.json(orderWithProducts);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).send('Server error');
  }
});

// ==================== CREATE NEW ORDER ====================
router.post('/', (req, res) => {
  const { customer_name, order_date, status, items } = req.body;
  
  // First, create the order
  db.query(
    'INSERT INTO orders (customer_name, order_date, status) VALUES (?, ?, ?)',
    [customer_name, order_date || new Date(), status || 'pending'],
    (err, result) => {
      if (err) {
        console.error('Error creating order:', err);
        return res.status(500).send('Server error');
      }
      
      const orderId = result.insertId;
      
      // If no items, return the order
      if (!items || items.length === 0) {
        return res.status(201).json({
          id: orderId,
          customer_name,
          order_date: order_date || new Date(),
          status: status || 'pending',
          products: []
        });
      }
      
      // Add products to the order
      let completed = 0;
      let hadError = false;
      
      items.forEach((item, index) => {
        db.query(
          'INSERT INTO product_orders (order_id, product_id, quantity) VALUES (?, ?, ?)',
          [orderId, item.productId, item.quantity],
          (err) => {
            if (err && !hadError) {
              hadError = true;
              console.error('Error adding product to order:', err);
              return res.status(500).send('Error adding products to order');
            }
            
            completed++;
            
            // When all products are processed
            if (completed === items.length && !hadError) {
              res.status(201).json({
                id: orderId,
                customer_name,
                order_date: order_date || new Date(),
                status: status || 'pending',
                products: items
              });
            }
          }
        );
      });
    }
  );
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

// ==================== CLEAR ALL PRODUCTS FROM ORDER ====================
router.delete('/:orderId/products', (req, res) => {
  const { orderId } = req.params;

  const sql = 'DELETE FROM product_orders WHERE order_id = ?';

  db.query(sql, [orderId], (err, result) => {
    if (err) {
      console.error('Error clearing products from order:', err);
      return res.status(500).send('Server error');
    }
    res.send('All products removed from order successfully');
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
