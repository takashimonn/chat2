const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const Session = require('../models/Session');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

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
      { 
        id: user._id, 
        role: user.role
      },
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

// Solicitar recuperación de contraseña
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        message: 'No existe una cuenta con ese correo electrónico' 
      });
    }

    // Generar token único
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Guardar token y fecha de expiración (2 horas)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 7200000; // 2 horas
    await user.save();

    // Configurar el transporter de nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // URL del frontend para resetear la contraseña
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    // Configurar el email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Recuperación de Contraseña - Control Escolar',
      html: `
        <h2>Recuperación de Contraseña</h2>
        <p>Has solicitado restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para continuar:</p>
        <a href="${resetUrl}">Restablecer Contraseña</a>
        <p>Este enlace expirará en 2 horas.</p>
        <p>Si no solicitaste esto, ignora este correo.</p>
      `
    };

    // Enviar el email
    await transporter.sendMail(mailOptions);

    res.json({ 
      message: 'Se ha enviado un enlace de recuperación a tu correo electrónico' 
    });

  } catch (error) {
    console.error('Error en recuperación:', error);
    res.status(500).json({ 
      message: 'Error al procesar la solicitud de recuperación' 
    });
  }
};

// Restablecer contraseña con token
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Buscar usuario con token válido y no expirado
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'El enlace de recuperación es inválido o ha expirado' 
      });
    }

    // Actualizar contraseña - NO hashear aquí, el middleware lo hará
    user.password = password;
    
    // Limpiar campos de recuperación
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    // Guardar cambios - el middleware hasheará la contraseña
    await user.save();

    res.json({ 
      message: 'Contraseña actualizada exitosamente' 
    });

  } catch (error) {
    console.error('Error al restablecer:', error);
    res.status(500).json({ 
      message: 'Error al restablecer la contraseña' 
    });
  }
};
