const Submission = require('../models/Submission');
const Task = require('../models/Task');
const path = require('path');
const fs = require('fs');

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

      console.log('Archivo recibido:', file);

      // Verificar si ya existe una entrega
      const existingSubmission = await Submission.findOne({
        task: taskId,
        student: studentId
      });

      if (existingSubmission) {
        // Si existe una entrega previa, eliminar el archivo anterior si existe
        if (existingSubmission.fileUrl) {
          const oldFilePath = path.join(__dirname, '..', existingSubmission.fileUrl.replace(/^\/uploads/, 'uploads'));
          console.log('Intentando eliminar archivo anterior:', oldFilePath);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log('Archivo anterior eliminado');
          }
        }
        return res.status(400).json({ 
          message: 'Ya has entregado esta tarea' 
        });
      }

      // Construir la URL del archivo
      const fileUrl = `/uploads/submissions/${file.filename}`;
      console.log('URL del archivo guardada:', fileUrl);
      console.log('Ruta física del archivo:', file.path);

      // Verificar que el archivo existe
      if (!fs.existsSync(file.path)) {
        return res.status(500).json({ 
          message: 'Error: El archivo no se guardó correctamente' 
        });
      }

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