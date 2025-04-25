const mongoose = require('mongoose');
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
    const { subject, question, correctAnswer, score } = req.body;
    console.log('Datos recibidos en el backend:', { subject, question, correctAnswer, score });

    // Validar que el subject sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(subject)) {
      return res.status(400).json({
        message: 'ID de materia inválido',
        receivedSubject: subject
      });
    }

    const newQuestion = new Question({
      subject,
      question,
      correctAnswer,
      score: parseInt(score) || 10
    });

    const savedQuestion = await newQuestion.save();
    console.log('Pregunta guardada:', savedQuestion);

    res.status(201).json(savedQuestion);
  } catch (error) {
    console.error('Error detallado:', error);
    res.status(500).json({ 
      message: 'Error al crear la pregunta',
      error: error.message
    });
  }
};

module.exports = {
  getQuestionsBySubject,
  createQuestion  // Asegúrate de exportar todos los métodos
}; 