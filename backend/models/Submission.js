const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  grade: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: String,
  status: {
    type: String,
    enum: ['pendiente', 'calificada'],
    default: 'pendiente'
  }
}, {
  timestamps: true
});

// Índice compuesto para evitar entregas duplicadas
submissionSchema.index({ task: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema); 