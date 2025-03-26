require('dotenv').config();
require('./models/User');
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const morgan = require('morgan');
const initializeSocket = require('./socket');

const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const authRoutes = require('./routes/authRoutes');

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
