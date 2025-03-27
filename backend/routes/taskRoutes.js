const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Aplicar middleware de autenticación a todas las rutas
router.use(auth);

// Rutas específicas por rol
router.get('/teacher', taskController.getTeacherTasks);
router.get('/student', taskController.getStudentTasks);

// Rutas para tareas
router.post('/', upload.single('file'), taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.patch('/:id/grade', taskController.gradeTask);
router.post('/:taskId/submit', upload.single('file'), taskController.submitTask);
router.post('/:taskId/grade', taskController.gradeTask);

module.exports = router; 