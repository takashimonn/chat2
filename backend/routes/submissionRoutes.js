const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(auth);

// Rutas para entregas
router.post('/task/:taskId', upload.single('file'), submissionController.createSubmission);
router.get('/task/:taskId', submissionController.getSubmissionsByTask);
router.get('/student', submissionController.getStudentSubmissions);
router.post('/:submissionId/grade', submissionController.gradeSubmission);

module.exports = router; 