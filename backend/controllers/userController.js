const User = require('../models/User');
const Messages = require('../models/Message');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userController = {
  // Registrar un nuevo usuario
  register: async (req, res) => {

    try {
      const { email, password, name } = req.body;

      const userExists = await User.findOne({ email });

      if (userExists) {
        return res.status(400).json({
          message: 'El correo electrónico ya está registrado'
        });
      }

      // Crear nuevo usuario
      const user = new User({
        email,
        password,
        name
      });

      await user.save();

      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Enviar respuesta
      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: {
          id: user._id,
          email: user.email,
          name: user.name
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

      // Token JWT sin clave secreta
      const token = jwt.sign(
        { id: user._id },
        '', // Sin clave secreta
        { algorithm: 'none' } // Especificamos que no use algoritmo de encriptación
      );

      res.json({
        message: 'Login exitoso',
        user: {
          id: user._id,
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
  }
};

module.exports = userController;
