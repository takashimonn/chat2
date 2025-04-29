const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { 
  assignSubjectToStudent,
  getStudentSubjects
} = require('../controllers/studentSubjectsController');

// Rutas protegidas
router.post('/assign', authMiddleware, assignSubjectToStudent);
router.get('/:studentId', authMiddleware, getStudentSubjects);

module.exports = router; 