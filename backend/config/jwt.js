// JWT Configuration
module.exports = {
  secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
  expiresIn: '24h'
};
