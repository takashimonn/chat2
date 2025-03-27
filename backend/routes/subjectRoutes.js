const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const auth = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(auth);

// Rutas para materias
router.post('/', subjectController.createSubject);
router.get('/', subjectController.getSubjects);

module.exports = router; 