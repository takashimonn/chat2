const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

console.log('Configurando ruta de registro...');

// Ruta para registro de usuarios
router.post('/register', userController.register);

// Ruta para obtener todos los alumnos con materias y promedio
router.get('/alumnos', userController.getAlumnos);

//console.log('Rutas configuradas:', router.stack.map(r => r.route?.path).filter(Boolean));

module.exports = router;
