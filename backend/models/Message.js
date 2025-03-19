const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  subject: {
    type: Number,
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
    enum: ['no_leido', 'visto', 'respondido'],
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

module.exports = mongoose.model('Message', messageSchema);
