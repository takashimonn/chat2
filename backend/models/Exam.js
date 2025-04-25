const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  correctAnswers: {
    type: Number,
    required: false
  },
  incorrectAnswers: {
    type: Number,
    required: false
  },
  calification: {
    type: Number,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  timeLimit: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam; 