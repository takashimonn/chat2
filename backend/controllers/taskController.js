const Task = require('../models/Task');
const fs = require('fs').promises;
const path = require('path');

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
        createdBy: req.user._id
      });

      console.log('Tarea creada:', newTask);

      const populatedTask = await Task.findById(newTask._id)
        .populate('createdBy', 'username')
        .populate('subject', 'name');

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
      const tasks = await Task.find()
        .populate('createdBy', 'username')
        .populate('subject', 'name')
        .sort({ createdAt: -1 });

      console.log('Tareas encontradas:', tasks);
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
      const { score, feedback } = req.body;
      
      const task = await Task.findByIdAndUpdate(
        req.params.id,
        {
          status: 'graded',
          grade: {
            score,
            feedback,
            gradedAt: Date.now(),
            gradedBy: req.user._id
          }
        },
        { new: true }
      ).populate('createdBy', 'username');

      res.json(task);
    } catch (error) {
      console.error('Error al calificar tarea:', error);
      res.status(500).json({ message: 'Error al calificar la tarea' });
    }
  },

  // Manejar la entrega de tarea
  submitTask: async (req, res) => {
    try {
      console.log('Recibiendo entrega de tarea:', req.params.taskId); // Para debugging
      console.log('Archivo recibido:', req.file); // Para debugging
      
      const { taskId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: 'Se requiere un archivo' });
      }

      const fileUrl = `/uploads/submissions/${file.filename}`;

      // Verificar si la tarea existe
      const taskExists = await Task.findById(taskId);
      if (!taskExists) {
        return res.status(404).json({ message: 'Tarea no encontrada' });
      }

      // Actualizar la tarea con la información de entrega
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
          submitted: true,
          submissionUrl: fileUrl,
          submittedBy: req.user._id,
          submittedAt: Date.now()
        },
        { new: true }
      ).populate('createdBy', 'username')
        .populate('subject', 'name');

      console.log('Tarea actualizada:', updatedTask); // Para debugging

      res.json(updatedTask);
    } catch (error) {
      console.error('Error detallado al entregar tarea:', error);
      res.status(500).json({ 
        message: 'Error al entregar la tarea',
        error: error.message 
      });
    }
  }
};

module.exports = taskController; 