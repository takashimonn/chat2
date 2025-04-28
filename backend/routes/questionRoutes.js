const express = require('express');
const router = express.Router();
const { getQuestionsBySubject, createQuestion } = require('../controllers/questionController');
const authMiddleware = require('../middleware/authMiddleware');
const { getQuestionsByTeacher } = require('../controllers/questionController');


router.get('/teacher', authMiddleware, getQuestionsByTeacher);
router.get('/subject/:subjectId', authMiddleware, getQuestionsBySubject);
router.post('/create', authMiddleware, createQuestion);
router.post('/', authMiddleware, createQuestion);

module.exports = router; 