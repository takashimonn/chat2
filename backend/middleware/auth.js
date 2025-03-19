const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Log para debugging
    console.log('Headers:', req.headers);
    
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'No autorizado - Token no proporcionado' });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decodificado:', decoded);
      
      // Obtener el usuario completo de la base de datos
      const user = await User.findById(decoded.id);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      
      req.user = user;
      console.log('Usuario autenticado:', user);
      next();
    } catch (error) {
      console.log('Token inválido:', error.message);
      return res.status(401).json({ message: 'No autorizado - Token inválido' });
    }
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = auth;
