const { Server } = require('socket.io');
const Message = require('./models/Message');  // Asegúrate de importar tu modelo Message correctamente

function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",  // Frontend React en el puerto 3000
      methods: ["GET", "POST"],
      credentials: true
    },
    path: '/socket.io/',
    transports: ['websocket', 'polling']
  });

  const updateMessageStatus = async (req, res) => {
    try {
      const { messageId, status } = req.body;
      const message = await Message.findById(messageId);

      if (!message) {
        return res.status(404).json({ error: "Mensaje no encontrado" });
      }

      message.status = status;
      await message.save();

      // Obtener el mensaje actualizado después de guardarlo
      const updatedMessage = await Message.findById(messageId)
        .populate("sender", "username")
        .populate("readBy", "username");

    // Emisión del evento a todos los clientes conectados con el estado actualizado
    req.app.get("io").emit("message_status_updated", { 
      messageId: updatedMessage._id, 
      newStatus: updatedMessage.status 
    });

      res.status(200).json({ success: true, message: updatedMessage });
    } catch (error) {
      console.error("Error al actualizar estado del mensaje:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  };

  io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.id);

    socket.on('join_subject', (subjectId) => {
      // Primero salir de todas las salas anteriores
      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });
      // Unirse a la nueva sala
      socket.join(`subject_${subjectId}`);
      console.log(`Usuario ${socket.id} se unió a la materia ${subjectId}`);
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
