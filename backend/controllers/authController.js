const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const Session = require('../models/Session');

// Controlador para el registro de usuarios
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar si el usuario ya existe
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ mensaje: 'El usuario ya existe' });
    }

    // Crear nuevo usuario
    user = new User({
      email,
      password
    });

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Guardar usuario
    await user.save();

    // Crear y devolver el token JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: '2h'
      },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};

// Controlador para el login de usuarios
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Primero verificar si ya existe una sesión activa
    const activeSession = await Session.findOne({ 
      email: email,
      isActive: true 
    });

    if (activeSession) {
      return res.status(400).json({
        message: 'Ya existe una sesión activa en otro navegador',
        hasActiveSession: true
      });
    }

    // Si no hay sesión activa, continuar con el login
    const user = await User.findOne({ email });
    if (!user || !await user.comparePassword(password)) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Crear nueva sesión
    await Session.create({
      userId: user._id,
      email: user.email,
      token: token,
      isActive: true
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener información del usuario autenticado
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};

exports.checkSession = async (req, res) => {
  try {
    const { email } = req.body;
    const existingSession = await Session.findOne({ 
      email: email,
      isActive: true 
    });
    
    res.json({ hasActiveSession: !!existingSession });
  } catch (error) {
    console.error('Error al verificar sesión:', error);
    res.status(500).json({ message: 'Error al verificar sesión' });
  }
};

exports.logout = async (req, res) => {
  try {
    const { email } = req.body;
    
    await Session.findOneAndUpdate(
      { email: email, isActive: true },
      { isActive: false }
    );

    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ message: 'Error al cerrar sesión' });
  }
};
