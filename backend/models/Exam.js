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
  }
});

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam; 