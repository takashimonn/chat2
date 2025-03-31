const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Agregar log para debugging
    console.log('JWT_SECRET:', !!process.env.JWT_SECRET);
    console.log('Headers:', req.headers);

    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    try {
      // Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decodificado:', decoded);

      // Buscar el usuario
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({ message: 'Usuario no encontrado' });
      }

      // Verificar el rol si es necesario
      if (req.baseUrl.includes('/api/tasks/teacher') && user.role !== 'maestro') {
        return res.status(403).json({ message: 'Acceso no autorizado' });
      }

      // Asegurarnos que el rol esté incluido en el token
      if (!decoded.role) {
        return res.status(403).json({ message: 'No role specified' });
      }

      // Agregar el usuario a la request
      req.user = user;
      next();
    } catch (error) {
      console.error('Error al verificar token:', error);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expirado' });
      }
      res.status(401).json({ message: 'Token inválido' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = auth;
