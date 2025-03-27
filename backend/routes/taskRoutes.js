const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Aplicar middleware de autenticación a todas las rutas
router.use(auth);

// Rutas para tareas
router.post('/', upload.single('file'), taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.patch('/:id/grade', taskController.gradeTask);
router.post('/:taskId/submit', upload.single('file'), taskController.submitTask);

module.exports = router; 