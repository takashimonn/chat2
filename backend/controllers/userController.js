const User = require('../models/User');
const Messages = require('../models/Message');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Submission = require('../models/Submission');

const userController = {
  // Registrar un nuevo usuario
  register: async (req, res) => {
    try {
      const { email, password, username, role } = req.body;

      const userExists = await User.findOne({ email });

      if (userExists) {
        return res.status(400).json({
          message: 'El correo electrónico ya está registrado'
        });
      }

      // Validar rol
      if (role && !['alumno', 'maestro'].includes(role)) {
        return res.status(400).json({
          message: 'Rol no válido'
        });
      }

      // Crear nuevo usuario
      const user = new User({
        email,
        password,
        username,
        role: role || 'alumno' // Por defecto será alumno si no se especifica
      });

      // Encriptar contraseña
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const token = jwt.sign(
        { 
          id: user._id, 
          email: user.email,
          role: user.role // Incluir el rol en el token
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role
        },
        token
      });

    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({
        message: 'Error al registrar usuario',
        error: error.message
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      // Generar token JWT con la misma clave secreta que en el registro
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login exitoso',
        user: {
          id: user._id,
          email: user.email,
          username: user.username
        },
        token
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
  },

  allUsers: async (req, res) => {
    try {
      const users = await Messages.find({_id: "67d903ddcbe149736ee020bf"});
      res.json(users);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({ message: 'Error al obtener usuarios' });
    }
  },

  getAlumnos: async (req, res) => {
    try {
      // Obtener todos los alumnos
      const alumnos = await User.find({ role: 'alumno' })
        .populate('subjects', 'name');

      // Para cada alumno, calcular el promedio de calificaciones
      const alumnosConCalificaciones = await Promise.all(alumnos.map(async (alumno) => {
        // Buscar todas las entregas del alumno
        const entregas = await Submission.find({ student: alumno._id, grade: { $ne: null } });
        let promedio = null;
        if (entregas.length > 0) {
          const suma = entregas.reduce((acc, ent) => acc + (ent.grade || 0), 0);
          promedio = Math.round(suma / entregas.length);
        }
        return {
          id: alumno._id,
          email: alumno.email,
          username: alumno.username,
          materias: alumno.subjects.map(s => s.name),
          promedio
        };
      }));

      res.json(alumnosConCalificaciones);
    } catch (error) {
      console.error('Error al obtener alumnos:', error);
      res.status(500).json({ message: 'Error al obtener alumnos' });
    }
  }
};

module.exports = userController;
