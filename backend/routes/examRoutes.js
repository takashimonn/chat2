const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, examController.createExam);
router.post('/assign-questions', authMiddleware, examController.assignQuestions);

module.exports = router; 