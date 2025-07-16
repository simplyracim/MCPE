// express and cors
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());
// routes
const employeeRoutes = require('./routes/employees');
const roleRoutes = require('./routes/roles');
const loginRoutes = require('./routes/login');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

// routes
app.use('/api/employees', employeeRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.get('/api', (req, res) => {
    res.send('Backend home page');
  });

// Start server
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
