const Question = require('../models/Question');

const getQuestionsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    console.log('Buscando preguntas para la materia:', subjectId);
    
    const questions = await Question.find({ subject: subjectId });
    console.log('Preguntas encontradas:', questions);
    
    res.status(200).json(questions);
  } catch (error) {
    console.error('Error al obtener preguntas:', error);
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