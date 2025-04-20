const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decodificado en middleware:', decoded);

    // Asignar la información del token
    req.user = {
      _id: decoded.id,        // Asegúrate que sea 'id' y no '_id'
      role: decoded.role,
      username: decoded.username
    };

    console.log('req.user establecido:', req.user);
    next();
  } catch (error) {
    console.error('Error en auth middleware:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware; 