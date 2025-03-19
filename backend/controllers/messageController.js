const Message = require("../models/Message");

const messageController = {
  // Obtener mensajes con filtros
  getMessages: async (req, res) => {
    try {
      const messages = await Message.find()
        .populate("sender", "username")
        .sort({ timestamp: 1 });

      // Agrupar mensajes por materia
      const messagesBySubject = messages.reduce((acc, message) => {
        if (!acc[message.subject]) {
          acc[message.subject] = [];
        }
        acc[message.subject].push(message);
        return acc;
      }, {});

      res.json(messagesBySubject);
    } catch (error) {
      console.error("Error al obtener mensajes:", error);
      res.status(500).json({ message: "Error al obtener mensajes" });
    }
  },

  // Crear nuevo mensaje
  createMessage: async (req, res) => {
    try {
      const { content, subject } = req.body;
      const sender = req.user._id;

      const newMessage = new Message({
        content,
        subject,
        sender,
        status: 'no_leido',
        readBy: [sender]
      });

      await newMessage.save();

      const populatedMessage = await Message.findById(newMessage._id)
        .populate('sender', 'username')
        .populate('readBy', 'username');

      // Emitir el nuevo mensaje
      const io = req.app.get('io');
      if (io) {
        io.emit('new_message', populatedMessage);
      }

      res.status(201).json(populatedMessage);
    } catch (error) {
      console.error('Error al crear mensaje:', error);
      res.status(500).json({ message: 'Error al crear mensaje' });
    }
  },

  // Actualizar estado del mensaje
  updateMessageStatus: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { status } = req.body;
      const userId = req.user._id;

      const message = await Message.findById(messageId);
      if (!message) {
        return res.status(404).json({ message: "Mensaje no encontrado" });
      }

      message.status = status;
      if (status === "visto" && !message.readBy.includes(userId)) {
        message.readBy.push(userId);
      }

      await message.save();

      const updatedMessage = await Message.findById(messageId)
        .populate("sender", "username")
        .populate("readBy", "username");

      // Emitir actualización
      const io = req.app.get("io");
      if (io) {
        io.emit("message_status_updated", updatedMessage);
      }

      res.json(updatedMessage);
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      res.status(500).json({ message: "Error al actualizar estado" });
    }
  },

  getUnreadCount: async (req, res) => {
    try {
      const unreadCounts = await Message.aggregate([
        {
          $match: {
            read: false,
            sender: { $ne: req.user._id },
          },
        },
        {
          $group: {
            _id: "$subject",
            count: { $sum: 1 },
          },
        },
      ]);

      res.json(unreadCounts);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener conteo de mensajes" });
    }
  },

  // Obtener mensajes por materia
  getMessagesBySubject: async (req, res) => {
    try {
      const { subjectId } = req.params;

      const messages = await Message.find({ subject: subjectId })
        .populate('sender', 'username')
        .populate('readBy', 'username')
        .sort({ createdAt: 1 });

      res.json(messages);
    } catch (error) {
      console.error('Error al obtener mensajes:', error);
      res.status(500).json({ message: 'Error al obtener mensajes' });
    }
  },

  // Marcar mensajes como leídos
  markAsRead: async (req, res) => {
    try {
      const { subjectId } = req.params;
      const userId = req.user._id;

      // Encontrar mensajes no leídos de la materia
      const unreadMessages = await Message.find({
        subject: subjectId,
        sender: { $ne: userId },
        readBy: { $ne: userId }
      });

      const updatedMessages = [];

      for (const message of unreadMessages) {
        // Actualizar estado del mensaje
        if (!message.readBy.includes(userId)) {
          message.readBy.push(userId);
          message.status = 'visto';
          await message.save();

          // Poblar el mensaje actualizado
          const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'username')
            .populate('readBy', 'username');

          updatedMessages.push(populatedMessage);

          // Emitir evento de actualización
          const io = req.app.get('io');
          if (io) {
            io.emit('message_status_updated', populatedMessage);
          }
        }
      }

      res.json(updatedMessages);
    } catch (error) {
      console.error('Error al marcar mensajes como leídos:', error);
      res.status(500).json({ message: 'Error al actualizar estados' });
    }
  },
};

module.exports = messageController;
