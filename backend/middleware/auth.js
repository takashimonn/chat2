const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');

const auth = async (req, res, next) => {
  try {
    // Obtener el header de autorización completo
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ msg: 'Formato de autorización inválido' });
    }

    // Extraer el token después de 'Bearer '
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ msg: 'No hay token, autorización denegada' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    try {
      // Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decodificado:', decoded);

      // Verificar si existe una sesión activa con este token
      const activeSession = await Session.findOne({
        token: token,
        isActive: true
      });

      if (!activeSession) {
        return res.status(401).json({ message: 'Sesión no válida o expirada' });
      }

      // Buscar el usuario usando el ID correcto del token
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({ message: 'Usuario no encontrado' });
      }

      // Verificar el rol usando el rol del token
      if (req.baseUrl.includes('/api/tasks/teacher') && decoded.role !== 'maestro') {
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
      res.status(401).json({ msg: 'Token no válido' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = auth;
