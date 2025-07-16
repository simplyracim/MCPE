const mysql = require('mysql2/promise');
const { faker } = require('@faker-js/faker');
const moment = require('moment');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'rootroot',
  database: 'mcpe_db',
  multipleStatements: true
};

async function runSeed() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // Reset auto increment for products
    console.log('Clearing existing data...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE product_orders');
    await connection.query('TRUNCATE TABLE orders');
    await connection.query('TRUNCATE TABLE product_components');
    await connection.query('TRUNCATE TABLE products');
    await connection.query('TRUNCATE TABLE employees');
    await connection.query('TRUNCATE TABLE roles');
    await connection.query('ALTER TABLE products AUTO_INCREMENT = 100');
    await connection.query('ALTER TABLE employees AUTO_INCREMENT = 100');
    await connection.query('ALTER TABLE roles AUTO_INCREMENT = 1');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Inserting roles...');
    
    // Insert roles
    const roles = [
      { title: 'Manager' },
      { title: 'Sales Associate' },
      { title: 'Warehouse Staff' },
      { title: 'Accountant' },
      { title: 'Administrator' }
    ];

    for (const role of roles) {
      await connection.query('INSERT INTO roles (title) VALUES (?)', [role.title]);
    }

    console.log('Inserting employees...');
    
    // Insert employees with roles
    const employees = [
      { name: 'Sarah Johnson', role_id: 5, is_admin: 1 },  // Administrator
      { name: 'Michael Chen', role_id: 1, is_admin: 0 },   // Manager
      { name: 'Emily Rodriguez', role_id: 2, is_admin: 0 }, // Sales Associate
      { name: 'David Kim', role_id: 3, is_admin: 0 },      // Warehouse Staff
      { name: 'Lisa Wong', role_id: 4, is_admin: 0 }        // Accountant
    ];

    for (const employee of employees) {
      await connection.query(
        'INSERT INTO employees (name, role_id, is_admin) VALUES (?, ?, ?)',
        [employee.name, employee.role_id, employee.is_admin]
      );
    }

    console.log('Inserting products...');
    
    // Insert base products
    const products = [
      {
        name: 'Wooden Chair',
        description: 'Classic wooden dining chair',
        quantity: 50,
        buy_price: 25.99,
        sell_price: 59.99
      },
      {
        name: 'Wooden Table',
        description: 'Large wooden dining table',
        quantity: 20,
        buy_price: 89.99,
        sell_price: 199.99
      },
      {
        name: 'Wood Plank',
        description: 'Standard wooden plank (1m x 20cm x 2cm)',
        quantity: 500,
        buy_price: 2.99,
        sell_price: 4.99
      },
      {
        name: 'Wood Screws (100pcs)',
        description: 'Box of 100 wood screws',
        quantity: 100,
        buy_price: 3.49,
        sell_price: 5.99
      },
      {
        name: 'Wood Glue',
        description: 'High-strength wood adhesive',
        quantity: 75,
        buy_price: 4.99,
        sell_price: 8.99
      },
      {
        name: 'Varnish',
        description: 'Clear wood finish (500ml)',
        quantity: 40,
        buy_price: 7.99,
        sell_price: 14.99
      }
    ];

    // Insert products
    for (const product of products) {
      await connection.query(
        'INSERT INTO products (name, description, quantity, buy_price, sell_price) VALUES (?, ?, ?, ?, ?)',
        [product.name, product.description, product.quantity, product.buy_price, product.sell_price]
      );
    }

    console.log('Setting up product components...');
    
    // First, let's get the inserted product IDs
    const [productsList] = await connection.query('SELECT id, name FROM products');
    
    // Create a map of product names to IDs
    const productMap = {};
    productsList.forEach(product => {
      productMap[product.name] = product.id;
    });
    
    // Set up product components (relationships)
    // Wooden Chair (100) is made of:
    // - 0.25 Wood Plank per chair (4 planks per 16 chairs)
    // - 0.0625 Wood Screws per chair (16 screws per 256 chairs)
    // - 0.01 Wood Glue per chair (1 glue per 100 chairs)
    await connection.query(
      'INSERT INTO product_components (initial_product_id, final_product_id, rate) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)',
      [
        productMap['Wooden Chair'], productMap['Wood Plank'], 0.25,
        productMap['Wooden Chair'], productMap['Wood Screws (100pcs)'], 0.0625,
        productMap['Wooden Chair'], productMap['Wood Glue'], 0.01
      ]
    );
    
    // Wooden Table (101) is made of:
    // - 0.1 Wood Plank per table (10 planks per 100 tables)
    // - 0.03125 Wood Screws per table (32 screws per 1024 tables)
    // - 0.005 Wood Glue per table (1 glue per 200 tables)
    await connection.query(
      'INSERT INTO product_components (initial_product_id, final_product_id, rate) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)',
      [
        productMap['Wooden Table'], productMap['Wood Plank'], 0.1,
        productMap['Wooden Table'], productMap['Wood Screws (100pcs)'], 0.03125,
        productMap['Wooden Table'], productMap['Wood Glue'], 0.005
      ]
    );

    console.log('Seed data inserted successfully!');

    // Show the inserted products
    const [allProducts] = await connection.query('SELECT * FROM products');
    console.log('Products:');
    console.table(allProducts);
    
    // Show the product components
    const [components] = await connection.query(`
      SELECT 
        p1.name as product_name,
        p2.name as component_name,
        pc.rate
      FROM product_components pc
      JOIN products p1 ON p1.id = pc.initial_product_id
      JOIN products p2 ON p2.id = pc.final_product_id
    `);
    
    console.log('\nProduct Components:');
    console.table(components);

    // Show employees with their roles
    const [employeesList] = await connection.query(`
      SELECT e.id, e.name, e.is_admin, r.title as role_title
      FROM employees e
      LEFT JOIN roles r ON e.role_id = r.id
      ORDER BY e.is_admin DESC, e.name
    `);
    
    console.log('\nEmployees:');
    console.table(employeesList);

    console.log('\nInserting sample orders...');

    // Insert sample orders
    const orders = [
      {
        customer_name: 'John Doe',
        order_date: moment().subtract(2, 'days').format('YYYY-MM-DD'),
        status: 'delivered',
        products: [
          { product_id: 100, quantity: 2 }, // 2 Wooden Chairs
          { product_id: 101, quantity: 1 }  // 1 Wooden Table
        ]
      },
      {
        customer_name: 'Jane Smith',
        order_date: moment().subtract(1, 'day').format('YYYY-MM-DD'),
        status: 'processing',
        products: [
          { product_id: 100, quantity: 4 },  // 4 Wooden Chairs
          { product_id: 105, quantity: 2 }   // 2 Varnishes
        ]
      },
      {
        customer_name: 'Acme Corp',
        order_date: moment().format('YYYY-MM-DD'),
        status: 'pending',
        products: [
          { product_id: 101, quantity: 3 },  // 3 Wooden Tables
          { product_id: 104, quantity: 3 },  // 3 Wood Glues
          { product_id: 105, quantity: 3 }   // 3 Varnishes
        ]
      }
    ];

    // Insert orders and their products
    for (const order of orders) {
      const [result] = await connection.query(
        'INSERT INTO orders (customer_name, order_date, status) VALUES (?, ?, ?)',
        [order.customer_name, order.order_date, order.status]
      );
      
      const orderId = result.insertId;
      
      // Insert products for this order
      for (const product of order.products) {
        await connection.query(
          'INSERT INTO product_orders (order_id, product_id, quantity) VALUES (?, ?, ?)',
          [orderId, product.product_id, product.quantity]
        );
      }
    }

    // Show the inserted orders with their products
    const [ordersList] = await connection.query(`
      SELECT o.*, 
             GROUP_CONCAT(CONCAT(p.name, ' (', po.quantity, ')') SEPARATOR ', ') as products
      FROM orders o
      LEFT JOIN product_orders po ON o.id = po.order_id
      LEFT JOIN products p ON po.product_id = p.id
      GROUP BY o.id
    `);
    
    console.log('\nOrders:');
    console.table(ordersList);

  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await connection.end();
  }
}

// Run the seed function
runSeed().catch(console.error);
