const mysql = require('mysql2');
const { faker } = require('@faker-js/faker');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'admin',
  database: 'mcpe_db'
});

db.connect();

function insertFakeEmployees(count = 10) {
  for (let i = 0; i < count; i++) {
    const name = faker.person.firstName();
    const role_id = faker.number.int({ min: 1, max: 3 });
    const is_admin = faker.datatype.boolean() ? 1 : 0; // 1 for admin, 0 otherwise

    db.query(
      'INSERT INTO employees (name, role_id, is_admin) VALUES (?, ?, ?)',
      [name, role_id, is_admin],
      (err) => {
        if (err) console.error(err);
      }
    );
  }

  console.log(`${count} fake employees added.`);

  // Optional: Show inserted records
  db.query('SELECT * FROM employees WHERE id >= 100', (err, results) => {
    if (err) {
      console.error('Error fetching employees:', err);
    } else {
      console.log(results);
    }

    db.end();
  });
}

// Set AUTO_INCREMENT to 100 to differentiate fake data
db.query('ALTER TABLE employees AUTO_INCREMENT = 100', (err) => {
  if (err) {
    console.error('Failed to set AUTO_INCREMENT:', err);
    db.end();
    return;
  }

  insertFakeEmployees(10);
});
