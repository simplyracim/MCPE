// express and cors
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
// routes
const employeeRoutes = require('./routes/employees');
const roleRoutes = require('./routes/roles');
const loginRoutes = require('./routes/login');

// routes
app.use('/routes/employees', employeeRoutes);
app.use('/routes/roles', roleRoutes);
app.use('/routes/login', loginRoutes);
app.get('/routes', (req, res) => {
    res.send('Backend home page');
  });

// Start server
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
