const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');

const auth = async (req, res, next) => {
  try {
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('Headers:', req.headers);
    
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided');
      
      return res.status(401).json({ message: 'No autorizado - Token no proporcionado' });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decodificado:', decoded);
      
      // Verificar si existe una sesión activa con este token
      const session = await Session.findOne({
        token,
        isActive: true
      });

      if (!session) {
        // Si no hay sesión activa, desactivar cualquier otra sesión del usuario
        await Session.updateMany(
          { userId: decoded.id },
          { isActive: false }
        );
        throw new Error('Sesión inválida');
      }

      // Obtener el usuario completo de la base de datos
      const user = await User.findById(decoded.id);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      
      req.user = user;
      req.session = session;
      console.log('Usuario autenticado:', user);
      next();
    } catch (error) {
      console.log('Error al verificar token:', error.message);
      return res.status(401).json({ message: 'Token inválido' });
    }
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = auth;
