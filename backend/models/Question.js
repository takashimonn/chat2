const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  correctAnswer: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  }
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question; 