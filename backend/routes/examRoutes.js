const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const authMiddleware = require('../middleware/authMiddleware');

// Esta ruta debe estar ANTES de la ruta con parámetro examId
router.get('/student/:studentId', authMiddleware, examController.getStudentExams);

router.post('/create', authMiddleware, examController.createExam);
router.post('/assign-questions', authMiddleware, examController.assignQuestions);

module.exports = router; 