const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

console.log('Configurando ruta de registro...');

// Ruta para registro de usuarios
router.post('/register', userController.register);

//console.log('Rutas configuradas:', router.stack.map(r => r.route?.path).filter(Boolean));

module.exports = router;
