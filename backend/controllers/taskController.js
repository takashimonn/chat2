const Task = require('../models/Task');
const fs = require('fs').promises;
const path = require('path');
const Submission = require('../models/Submission');
const User = require('../models/User');

const taskController = {
  // Crear nueva tarea
  createTask: async (req, res) => {
    try {
      console.log('Body recibido:', req.body);
      console.log('Archivo recibido:', req.file);
      
      const { title, description, dueDate, subject } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: 'Se requiere un archivo' });
      }

      const fileUrl = `/uploads/tasks/${file.filename}`;

      const newTask = await Task.create({
        title,
        description,
        dueDate,
        fileUrl,
        subject,
        createdBy: req.user._id,
        assignedTo: req.user._id
      });

      console.log('Tarea creada:', newTask);

      const populatedTask = await Task.findById(newTask._id)
        .populate('createdBy', 'username')
        .populate('subject', 'name')
        .populate('assignedTo', 'username');

      res.status(201).json(populatedTask);
    } catch (error) {
      console.error('Error detallado al crear tarea:', error);
      res.status(500).json({ 
        message: 'Error al crear la tarea',
        error: error.message 
      });
    }
  },

  // Obtener todas las tareas
  getTasks: async (req, res) => {
    try {
      let tasks;
      
      if (req.user.role === 'maestro') {
        // Para maestros: obtener todas las tareas con sus entregas
        tasks = await Task.find()
          .populate('createdBy', 'username')
          .populate('submittedBy', 'username')
          .populate('subject', 'name')
          .sort({ createdAt: -1 });
      } else {
        // Para alumnos: obtener las tareas y marcar como entregadas solo las que el alumno entregó
        tasks = await Task.find()
          .populate('createdBy', 'username')
          .populate('submittedBy', 'username')
          .populate('subject', 'name')
          .sort({ createdAt: -1 });

        // Modificar el estado de entrega según el alumno actual
        tasks = tasks.map(task => {
          const taskObj = task.toObject();
          taskObj.submitted = task.submittedBy?._id.toString() === req.user._id.toString();
          return taskObj;
        });
      }

      res.json(tasks);
    } catch (error) {
      console.error('Error al obtener tareas:', error);
      res.status(500).json({ message: 'Error al obtener las tareas' });
    }
  },

  // Obtener tarea por ID
  getTaskById: async (req, res) => {
    try {
      const task = await Task.findById(req.params.id)
        .populate('createdBy', 'username')
        .populate('subject', 'name');

      if (!task) {
        return res.status(404).json({ message: 'Tarea no encontrada' });
      }

      res.json(task);
    } catch (error) {
      console.error('Error al obtener tarea:', error);
      res.status(500).json({ message: 'Error al obtener la tarea' });
    }
  },

  // Calificar tarea
  gradeTask: async (req, res) => {
    try {
      const { taskId } = req.params;
      const { grade, feedback } = req.body;

      // Verificar que el usuario sea maestro
      if (req.user.role !== 'maestro') {
        return res.status(403).json({ 
          message: 'Solo los maestros pueden calificar tareas' 
        });
      }

      const task = await Task.findByIdAndUpdate(
        taskId,
        {
          grade,
          feedback,
          gradedBy: req.user._id,
          gradedAt: Date.now()
        },
        { new: true }
      )
      .populate('submittedBy', 'username')
      .populate('subject', 'name');

      if (!task) {
        return res.status(404).json({ message: 'Tarea no encontrada' });
      }

      res.json(task);
    } catch (error) {
      console.error('Error al calificar tarea:', error);
      res.status(500).json({ 
        message: 'Error al calificar la tarea',
        error: error.message 
      });
    }
  },

  // Manejar la entrega de tarea
  submitTask: async (req, res) => {
    try {
      const { taskId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: 'Se requiere un archivo' });
      }

      // Verificar si el usuario ya entregó esta tarea
      const existingSubmission = await Task.findOne({
        _id: taskId,
        submittedBy: req.user._id
      });

      if (existingSubmission) {
        return res.status(400).json({ message: 'Ya has entregado esta tarea' });
      }

      const fileUrl = `/uploads/submissions/${file.filename}`;

      // Actualizar la tarea con la información de entrega
      const task = await Task.findByIdAndUpdate(
        taskId,
        {
          $push: {
            submissions: {
              studentId: req.user._id,
              fileUrl: fileUrl,
              submittedAt: Date.now()
            }
          },
          submittedBy: req.user._id,
          submissionUrl: fileUrl,
          submittedAt: Date.now()
        },
        { new: true }
      ).populate('submittedBy', 'username')
       .populate('subject', 'name');

      if (!task) {
        return res.status(404).json({ message: 'Tarea no encontrada' });
      }

      res.json(task);
    } catch (error) {
      console.error('Error al entregar tarea:', error);
      res.status(500).json({ 
        message: 'Error al entregar la tarea',
        error: error.message 
      });
    }
  },

  // Obtener tareas para maestros (con información de entregas)
  getTeacherTasks: async (req, res) => {
    try {
      if (req.user.role !== 'maestro') {
        return res.status(403).json({ message: 'Acceso no autorizado' });
      }

      // Obtener todas las tareas del profesor
      const tasks = await Task.find({ createdBy: req.user._id })
        .populate('subject', 'name')
        .populate('createdBy', 'username')
        .lean();

      // Obtener todos los usuarios con rol de alumno
      const students = await User.find({ role: 'alumno' }, 'username email').lean();

      // Crear un array con una entrada por cada combinación de tarea-estudiante
      const expandedTasks = [];

      tasks.forEach(task => {
        students.forEach(student => {
          expandedTasks.push({
            ...task,
            student: {
              _id: student._id,
              username: student.username,
              email: student.email
            },
            status: 'Pendiente' // Por defecto, se puede actualizar si hay submission
          });
        });
      });

      res.json(expandedTasks);
    } catch (error) {
      console.error('Error al obtener tareas:', error);
      res.status(500).json({ message: 'Error al obtener las tareas' });
    }
  },

  // Obtener tareas para estudiantes (con su estado de entrega)
  getStudentTasks: async (req, res) => {
    try {
      const studentId = req.user._id;

      const tasks = await Task.find()
        .populate('subject', 'name')
        .populate('createdBy', 'username')
        .sort({ createdAt: -1 });

      // Para cada tarea, verificar si el estudiante la entregó y obtener su calificación
      const tasksWithSubmissionStatus = await Promise.all(tasks.map(async (task) => {
        const submission = await Submission.findOne({
          task: task._id,
          student: studentId
        }).select('grade feedback submittedAt fileUrl');
        
        const taskObj = task.toObject();
        taskObj.submitted = !!submission;
        taskObj.submission = submission;
        return taskObj;
      }));

      res.json(tasksWithSubmissionStatus);
    } catch (error) {
      console.error('Error al obtener tareas del estudiante:', error);
      res.status(500).json({ message: 'Error al obtener las tareas' });
    }
  },
};

module.exports = taskController; 