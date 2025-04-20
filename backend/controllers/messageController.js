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
      const { content, subject, priority, replyTo } = req.body;
      
      // Agregar logs para depuración
      console.log('Datos recibidos:', {
        content,
        subject,
        priority,
        replyTo,
        user: req.user
      });

      const message = new Message({
        content,
        sender: req.user._id, // Cambiado de req.user.id a req.user._id
        subject,
        priority,
        replyTo,
        status: 'no_leido'
      });

      const savedMessage = await message.save();
      
      // Poblar los datos necesarios para la respuesta
      const populatedMessage = await Message.findById(savedMessage._id)
        .populate('sender', 'username')
        .populate('subject', 'name');

      // Emitir el mensaje a través de Socket.IO
      if (req.io) {
        req.io.to(`subject_${subject}`).emit('new_message', populatedMessage);
      }

      res.status(201).json(populatedMessage);
    } catch (error) {
      console.error('Error detallado al crear mensaje:', error);
      res.status(500).json({ 
        message: 'Error al crear el mensaje',
        error: error.message 
      });
    }
  },

  // Actualizar estado del mensaje
  updateMessageStatus: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { status } = req.body;
      const userId = req.user._id;

      const updatedMessage = await Message.findByIdAndUpdate(
        messageId,
        { 
          status,
          $addToSet: { readBy: userId }
        },
        { new: true }
      )
      .populate('sender', 'username')
      .populate('readBy', 'username');

      // Emitir la actualización INMEDIATAMENTE
      const io = req.app.get('io');
      if (io) {
        io.emit('message_status_updated', {
          messageId: updatedMessage._id,
          newStatus: status,
          readBy: updatedMessage.readBy
        });
      }

      res.json(updatedMessage);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      res.status(500).json({ message: 'Error al actualizar estado' });
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
      const mongoose = require('mongoose');
      
      // Convertir el string ID a ObjectId
      const objectId = new mongoose.Types.ObjectId(subjectId);

      const messages = await Message.find({ subject: objectId })
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

      // Encontrar y actualizar todos los mensajes no leídos de una vez
      const result = await Message.updateMany(
        {
          subject: subjectId,
          sender: { $ne: userId },
          readBy: { $ne: userId }
        },
        {
          $addToSet: { readBy: userId },
          $set: { status: 'visto' }
        }
      );

      // Obtener los mensajes actualizados
      const updatedMessages = await Message.find({
        subject: subjectId,
        readBy: userId
      })
      .populate('sender', 'username')
      .populate('readBy', 'username');

      // Emitir las actualizaciones
      const io = req.app.get('io');
      if (io) {
        updatedMessages.forEach(message => {
          io.to(`subject_${subjectId}`).emit('message_status_updated', {
            messageId: message._id,
            newStatus: 'visto',
            readBy: message.readBy
          });
        });
      }

      res.json(updatedMessages);
    } catch (error) {
      console.error('Error al marcar mensajes como leídos:', error);
      res.status(500).json({ message: 'Error al actualizar estados' });
    }
  },
};

module.exports = messageController;
