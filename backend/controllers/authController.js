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
    const { email, password, captchaToken } = req.body;

    // Validar el captcha primero
    const captchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`
    });

    const captchaData = await captchaResponse.json();

    if (!captchaData.success) {
      return res.status(400).json({ 
        message: 'Por favor verifica que no eres un robot' 
      });
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ mensaje: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ mensaje: 'Credenciales inválidas' });
    }

    // Verificar si ya existe una sesión activa
    const existingSession = await Session.findOne({ 
      userId: user._id,
      isActive: true 
    });

    if (existingSession) {
      return res.status(400).json({ 
        message: 'Ya existe una sesión activa en otro navegador',
        hasActiveSession: true
      });
    }

    // Crear token JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Crear nueva sesión
    await Session.create({
      userId: user._id,
      token,
      isActive: true,
      lastActive: new Date()
    });

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
