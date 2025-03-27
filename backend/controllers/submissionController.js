const Submission = require('../models/Submission');
const Task = require('../models/Task');

const submissionController = {
  // Crear una nueva entrega
  createSubmission: async (req, res) => {
    try {
      const { taskId } = req.params;
      const file = req.file;
      const studentId = req.user._id;

      if (!file) {
        return res.status(400).json({ message: 'Se requiere un archivo' });
      }

      // Verificar si ya existe una entrega
      const existingSubmission = await Submission.findOne({
        task: taskId,
        student: studentId
      });

      if (existingSubmission) {
        return res.status(400).json({ 
          message: 'Ya has entregado esta tarea' 
        });
      }

      const fileUrl = `/uploads/submissions/${file.filename}`;

      const submission = await Submission.create({
        task: taskId,
        student: studentId,
        fileUrl
      });

      const populatedSubmission = await Submission.findById(submission._id)
        .populate('student', 'username')
        .populate('task', 'title');

      res.status(201).json(populatedSubmission);
    } catch (error) {
      console.error('Error al crear entrega:', error);
      res.status(500).json({ 
        message: 'Error al crear la entrega',
        error: error.message 
      });
    }
  },

  // Obtener entregas por tarea (para maestros)
  getSubmissionsByTask: async (req, res) => {
    try {
      const { taskId } = req.params;
      
      const submissions = await Submission.find({ task: taskId })
        .populate('student', 'username')
        .populate('task', 'title')
        .sort({ createdAt: -1 });

      res.json(submissions);
    } catch (error) {
      console.error('Error al obtener entregas:', error);
      res.status(500).json({ message: 'Error al obtener las entregas' });
    }
  },

  // Obtener entregas de un estudiante
  getStudentSubmissions: async (req, res) => {
    try {
      const studentId = req.user._id;
      
      const submissions = await Submission.find({ student: studentId })
        .populate('task', 'title dueDate')
        .sort({ createdAt: -1 });

      res.json(submissions);
    } catch (error) {
      console.error('Error al obtener entregas:', error);
      res.status(500).json({ message: 'Error al obtener las entregas' });
    }
  },

  // Calificar una entrega
  gradeSubmission: async (req, res) => {
    try {
      const { submissionId } = req.params;
      const { grade, feedback } = req.body;

      if (req.user.role !== 'maestro') {
        return res.status(403).json({ 
          message: 'Solo los maestros pueden calificar entregas' 
        });
      }

      const submission = await Submission.findByIdAndUpdate(
        submissionId,
        {
          grade,
          feedback,
          status: 'calificada'
        },
        { new: true }
      ).populate('student', 'username')
       .populate('task', 'title');

      if (!submission) {
        return res.status(404).json({ message: 'Entrega no encontrada' });
      }

      res.json(submission);
    } catch (error) {
      console.error('Error al calificar entrega:', error);
      res.status(500).json({ message: 'Error al calificar la entrega' });
    }
  }
};

module.exports = submissionController; 