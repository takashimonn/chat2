const Question = require('../models/Question');

const getQuestionsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const questions = await Question.find({ subject: subjectId });
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener preguntas' });
  }
};

const createQuestion = async (req, res) => {
  try {
    const question = new Question(req.body);
    await question.save();
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear pregunta' });
  }
};

module.exports = {
  getQuestionsBySubject,
  createQuestion  // Asegúrate de exportar todos los métodos
}; 