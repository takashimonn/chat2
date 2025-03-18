const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_temporal';

module.exports = {
  generateToken: (user) => {
    return jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  },
  verifyToken: (token) => {
    return jwt.verify(token, JWT_SECRET);
  }
};
