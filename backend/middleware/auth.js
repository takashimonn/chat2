const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    // Verificar token sin clave secreta
    const decoded = jwt.verify(token, '', { algorithms: ['none'] });
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'No autorizado' });
  }
};

module.exports = auth;
