const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const authMiddleware = require('../middleware/authMiddleware');

// Para debugging
console.log('Métodos disponibles en subjectController:', Object.keys(subjectController));

// Rutas para materias
router.post('/', authMiddleware, subjectController.createSubject);
router.get('/', subjectController.getSubjects);
router.get('/teacher', authMiddleware, subjectController.getTeacherSubjects);
router.get('/teacher/:teacherId', authMiddleware, subjectController.getTeacherSubjects);
// router.get('/user', subjectController.getSubjectsByUser);

// Agregar la nueva ruta para estudiantes
router.get('/student', authMiddleware, subjectController.getStudentSubjects);
router.get('/:subjectId/students', authMiddleware, subjectController.getSubjectStudents);

module.exports = router; 