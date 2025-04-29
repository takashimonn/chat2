const express = require('express');
const router = express.Router();
const calificacionesController = require('../controllers/calificacionesController');

// Ruta para obtener estadísticas
router.get('/estadisticas', calificacionesController.getEstadisticas);

// Ruta para agregar una calificación
router.post('/', calificacionesController.agregarCalificacion);

// Ruta para agregar datos de prueba
router.post('/datos-prueba', calificacionesController.agregarDatosPrueba);

module.exports = router; 