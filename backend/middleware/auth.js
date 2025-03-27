const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Verificar que JWT_SECRET existe
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no está definido');
      return res.status(500).json({ message: 'Error de configuración del servidor' });
    }

    // Obtener el token del header
    const authHeader = req.header('Authorization');
    console.log('Auth Header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token no proporcionado o formato inválido' });
    }

    const token = authHeader.replace('Bearer ', '');

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

      // Agregar el usuario a la request
      req.user = user;
      next();
    } catch (error) {
      console.error('Error al verificar token:', error);
      return res.status(401).json({ message: 'Token inválido' });
    }
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = auth;
