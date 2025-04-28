const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decodificado en middleware:', decoded);

    // Buscar el usuario completo en la base de datos
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }
    req.user = user; // Aquí sí tendrá el campo subjects

    console.log('req.user establecido:', req.user);
    next();
  } catch (error) {
    console.error('Error en auth middleware:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware; 