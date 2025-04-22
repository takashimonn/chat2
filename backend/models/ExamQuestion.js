const mongoose = require('mongoose');

const examQuestionSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  }
});

const ExamQuestion = mongoose.model('ExamQuestion', examQuestionSchema);

module.exports = ExamQuestion; 