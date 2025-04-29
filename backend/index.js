require('dotenv').config();
require('./models/User');
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const morgan = require('morgan');
const initializeSocket = require('./socket');

const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const examRoutes = require('./routes/examRoutes');
const questionRoutes = require('./routes/questionRoutes');
const calificacionesRoutes = require('./routes/calificaciones');
const studentSubjectsRoutes = require('./routes/studentSubjectsRoutes');

// Verificar variables de entorno al inicio
console.log('Variables de entorno cargadas:', {
  jwtSecretExists: !!process.env.JWT_SECRET,
  mongoUriExists: !!process.env.MONGODB_URI
});

// Verificar que la variable existe
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middlewares
app.use(morgan('dev'));
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Crear directorios de uploads si no existen
const uploadsDir = path.join(__dirname, 'uploads');
const submissionsDir = path.join(uploadsDir, 'submissions');
const tasksDir = path.join(uploadsDir, 'tasks');

[uploadsDir, submissionsDir, tasksDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Directorio creado: ${dir}`);
  }
});

// Middleware para servir archivos estáticos
app.use('/uploads', (req, res, next) => {
  console.log('Solicitud de archivo:', req.url);
  next();
}, express.static(uploadsDir));

// Middleware para debugging de rutas de archivos
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(uploadsDir, req.path);
  console.log('Ruta de archivo solicitada:', req.path);
  console.log('Ruta completa:', filePath);
  
  // Verificar si el archivo existe
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.log('El archivo no existe');
      res.status(404).json({ 
        message: 'Archivo no encontrado',
        path: filePath
      });
    } else {
      console.log('El archivo existe');
      next();
    }
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  socket.on('join_subject', (subjectId) => {
    console.log(`Usuario ${socket.id} se unió a la materia ${subjectId}`);
    socket.join(`subject_${subjectId}`);
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

// Hacer io accesible para las rutas
app.set('io', io);

// Ruta de prueba para Socket.IO
app.get('/socket-test', (req, res) => {
  res.json({ status: 'Socket.IO server is running' });
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/calificaciones', calificacionesRoutes);
app.use('/api/student-subjects', studentSubjectsRoutes);

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Conexión a MongoDB con opciones adicionales
mongoose.connect('mongodb+srv://diana3041220286:4tAumjAYPOEPdOZH@cluster0.fodfu92.mongodb.net/chat?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout después de 5 segundos
  socketTimeoutMS: 45000, // Tiempo de espera del socket
})
.then(() => {
  console.log('Conectado a MongoDB');
})
.catch((err) => {
  console.error('Error conectando a MongoDB:', err);
});

// Verificar la conexión
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Error de conexión:'));
db.once('open', function() {
  console.log("MongoDB conectado exitosamente");
});

const PORT = process.env.PORT || 4000;

// Importante: usar server.listen en lugar de app.listen
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
