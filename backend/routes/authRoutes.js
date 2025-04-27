const express = require('express');
const router = express.Router();
const { login, getUser, forgotPassword, resetPassword } = require('../controllers/authController');
const auth = require('../middleware/auth');
const Session = require('../models/Session');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Ruta para iniciar sesión
router.post('/login', login);

// Ruta para obtener información del usuario autenticado
router.get('/user', auth, getUser);

// Ruta para verificar el token
router.get('/verify', auth, (req, res) => {
  res.json({ valid: true });
});

router.post('/logout', auth, async (req, res) => {
  try {
    console.log('Cerrando sesión para usuario:', req.user._id);
    
    // Obtener todas las sesiones antes de la actualización
    const beforeSessions = await Session.find({ userId: req.user._id });
    console.log('Sesiones antes del logout:', beforeSessions);

    // Actualizar todas las sesiones activas del usuario
    const result = await Session.updateMany(
      { 
        userId: req.user._id,
        isActive: true 
      },
      { 
        isActive: false,
        lastActive: new Date()
      }
    );
    console.log('Resultado de actualización:', result);

    // Verificar las sesiones después de la actualización
    const afterSessions = await Session.find({ userId: req.user._id });
    console.log('Sesiones después del logout:', afterSessions);

    res.json({ message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    res.status(500).json({ message: 'Error al cerrar sesión' });
  }
});

// Agregar esta nueva ruta
router.post('/check-session', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Verificando sesión para email:', email);
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Usuario no encontrado');
      return res.json({ hasActiveSession: false });
    }
    console.log('Usuario encontrado:', user._id);

    // Buscar todas las sesiones del usuario
    const sessions = await Session.find({ userId: user._id });
    console.log('Todas las sesiones encontradas:', sessions);

    // Buscar sesión activa
    const activeSession = await Session.findOne({
      userId: user._id,
      isActive: true
    });
    console.log('Sesión activa encontrada:', activeSession);

    if (!activeSession) {
      console.log('No hay sesión activa');
      // Asegurarse de que todas las sesiones estén marcadas como inactivas
      await Session.updateMany(
        { userId: user._id },
        { isActive: false }
      );
      return res.json({ hasActiveSession: false });
    }

    // Verificar el token
    try {
      jwt.verify(activeSession.token, process.env.JWT_SECRET);
      console.log('Token válido, sesión activa');
      return res.json({ hasActiveSession: true });
    } catch (error) {
      console.log('Token expirado, marcando sesión como inactiva');
      await Session.findByIdAndUpdate(activeSession._id, {
        isActive: false,
        lastActive: new Date()
      });
      return res.json({ hasActiveSession: false });
    }
  } catch (error) {
    console.error('Error al verificar sesión:', error);
    res.status(500).json({ message: 'Error al verificar sesión' });
  }
});

// Rutas para recuperación de contraseña
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
