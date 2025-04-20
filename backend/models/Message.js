const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['no_leido', 'visto', 'respondido', 'en_espera'],
    default: 'no_leido'
  },
  priority: {
    type: String,
    enum: ['baja', 'media', 'urgente'],
    default: 'media'
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  }
}, {
  timestamps: true
});

// Middleware para popular automáticamente el campo replyTo
messageSchema.pre('find', function() {
  this.populate({
    path: 'replyTo',
    populate: {
      path: 'sender',
      select: 'username'
    }
  });
});

messageSchema.pre('findOne', function() {
  this.populate({
    path: 'replyTo',
    populate: {
      path: 'sender',
      select: 'username'
    }
  });
});

module.exports = mongoose.model('Message', messageSchema);
