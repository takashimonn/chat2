const express = require('express');
const router = express.Router();
const { 
  getQuestionsBySubject, 
  createQuestion, 
  getQuestionsByTeacher,
  updateQuestion,
  deleteQuestion
} = require('../controllers/questionController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/teacher', authMiddleware, getQuestionsByTeacher);
router.get('/subject/:subjectId', authMiddleware, getQuestionsBySubject);
router.post('/create', authMiddleware, createQuestion);
router.post('/', authMiddleware, createQuestion);
router.put('/:id', authMiddleware, updateQuestion);
router.delete('/:id', authMiddleware, deleteQuestion);

module.exports = router; 