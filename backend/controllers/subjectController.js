const Subject = require('../models/Subject');
const TeacherSubject = require('../models/TeacherSubject');
const StudentSubject = require('../models/StudentSubject');

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

      // Crear la materia
      const newSubject = await Subject.create({
        name,
        description,
        teacher: req.user._id
      });

      // Crear la relación profesor-materia
      await TeacherSubject.create({
        teacher: req.user._id,
        subject: newSubject._id
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
  },

  getTeacherSubjects: async (req, res) => {
    try {
      if (!req.user || !req.user._id) {
        console.error('Usuario no encontrado en request');
        return res.status(401).json({ message: 'Usuario no autorizado' });
      }

      console.log('Buscando materias para profesor:', req.user._id);
      
      const teacherSubjects = await TeacherSubject.find({ 
        teacher: req.user._id 
      })
      .populate('subject')
      .lean();

      console.log('Materias encontradas:', teacherSubjects);

      if (!teacherSubjects.length) {
        console.log('No se encontraron materias para el profesor');
        return res.status(200).json([]); // Retornar array vacío en lugar de error
      }

      const subjects = teacherSubjects.map(ts => ({
        id: ts.subject._id,
        name: ts.subject.name,
        teacher: req.user.username
      }));

      console.log('Enviando subjects:', subjects);
      res.status(200).json(subjects);
    } catch (error) {
      console.error('Error al obtener materias del profesor:', error);
      res.status(500).json({ message: 'Error al obtener las materias' });
    }
  },

  getStudentSubjects: async (req, res) => {
    try {
      const studentId = req.user._id;
      console.log('Buscando materias para estudiante:', studentId);
      
      const studentSubjects = await StudentSubject.find({ student: studentId })
        .populate({
          path: 'subject',
          populate: {
            path: 'teacher',
            select: 'username'
          }
        })
        .lean();

      console.log('Materias encontradas:', studentSubjects);

      const subjects = studentSubjects.map(ss => ({
        id: ss.subject._id,
        name: ss.subject.name,
        teacher: ss.subject.teacher.username
      }));

      res.status(200).json(subjects);
    } catch (error) {
      console.error('Error al obtener materias del estudiante:', error);
      res.status(500).json({ message: 'Error al obtener las materias' });
    }
  },

  getSubjectStudents: async (req, res) => {
    try {
      const subjectId = req.params.subjectId;
      console.log('Buscando estudiantes para la materia:', subjectId);

      const studentSubjects = await StudentSubject.find({ subject: subjectId })
        .populate('student', 'username')
        .lean();

      console.log('StudentSubjects encontrados:', studentSubjects);

      const students = studentSubjects.map(ss => ({
        _id: ss.student._id,
        username: ss.student.username
      }));

      console.log('Estudiantes formateados:', students);
      res.status(200).json(students);
    } catch (error) {
      console.error('Error al obtener estudiantes de la materia:', error);
      res.status(500).json({ message: 'Error al obtener estudiantes' });
    }
  },

  // Nuevo método para obtener materias con ID
  getTeacherSubjectsWithId: async (req, res) => {
    try {
      const teacherId = req.user._id;
      const subjects = await Subject.find({ teacher: teacherId })
        .select('_id name description')
        .lean();

      console.log('Materias con ID encontradas:', subjects);
      res.json(subjects);
    } catch (error) {
      console.error('Error al obtener materias con ID:', error);
      res.status(500).json({ message: 'Error al obtener las materias' });
    }
  }
};

module.exports = subjectController; 