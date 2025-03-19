const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userController = {
  // Registrar un nuevo usuario
  register: async (req, res) => {
    console.log('Recibida solicitud de registro:', req.body);

    try {
      const { email, password, username } = req.body;

      // Verificar si el usuario ya existe
      const userExists = await User.findOne({ email });
      console.log('Usuario existe:', userExists);

      if (userExists) {
        return res.status(400).json({
          message: 'El correo electrónico ya está registrado'
        });
      }

      // Crear nuevo usuario
      const user = new User({
        email,
        password,
        username
      });

      console.log('Intentando guardar usuario:', user);
      await user.save();
      console.log('Usuario guardado exitosamente');

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
          username: user.username
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
  }
};

module.exports = userController;
