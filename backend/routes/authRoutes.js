const express = require('express');
const router = express.Router();
const { login, getUser } = require('../controllers/authController');
const auth = require('../middleware/auth');

// Ruta para iniciar sesión
router.post('/login', login);

// Ruta para obtener información del usuario autenticado
router.get('/user', auth, getUser);

module.exports = router;
