const { Server } = require('socket.io');

function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    path: '/socket.io/',
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.id);

    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`Usuario ${socket.id} se unió a la sala ${room}`);
    });

    socket.on('send_message', (data) => {
      console.log('Mensaje recibido:', data);
      io.to(data.room || 'general').emit('receive_message', data);
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });

  return io;
}

module.exports = initializeSocket;
