const Subject = require('../models/Subject');

const subjectController = {
  // Crear nueva materia
  createSubject: async (req, res) => {
    try {
      const { name, description } = req.body;
      
      // Verificar si el usuario es maestro
      if (req.user.role !== 'maestro') {
        return res.status(403).json({ 
          message: 'Solo los maestros pueden crear materias' 
        });
      }

      const newSubject = await Subject.create({
        name,
        description,
        teacher: req.user._id
      });

      const populatedSubject = await Subject.findById(newSubject._id)
        .populate('teacher', 'username');

      res.status(201).json(populatedSubject);
    } catch (error) {
      console.error('Error al crear materia:', error);
      res.status(500).json({ 
        message: 'Error al crear la materia',
        error: error.message 
      });
    }
  },

  // Obtener todas las materias
  getSubjects: async (req, res) => {
    try {
      const subjects = await Subject.find()
        .populate('teacher', 'username')
        .sort({ createdAt: -1 });

      res.json(subjects);
    } catch (error) {
      console.error('Error al obtener materias:', error);
      res.status(500).json({ message: 'Error al obtener las materias' });
    }
  }
};

module.exports = subjectController; 