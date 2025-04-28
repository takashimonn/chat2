const mongoose = require('mongoose');
const Question = require('../models/Question');
const TeacherSubject = require('../models/TeacherSubject');

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
    const { questions } = req.body;
    console.log('Datos recibidos en el backend:', req.body); // Para debug

    // Si recibimos un array de preguntas
    if (Array.isArray(questions)) {
      console.log('Procesando array de preguntas:', questions); // Para debug

      // Validamos cada pregunta
      for (const question of questions) {
        if (!question.subject || !question.question || !question.correctAnswer || !question.score) {
          return res.status(400).json({
            message: 'Todos los campos son requeridos para cada pregunta',
            invalidQuestion: question
          });
        }

        if (!mongoose.Types.ObjectId.isValid(question.subject)) {
          return res.status(400).json({
            message: 'ID de materia inválido',
            receivedSubject: question.subject
          });
        }
      }

      // Creamos todas las preguntas
      const savedQuestions = await Question.insertMany(questions.map(q => ({
        subject: q.subject,
        question: q.question,
        correctAnswer: q.correctAnswer,
        score: parseInt(q.score) || 10
      })));

      console.log('Preguntas guardadas:', savedQuestions); // Para debug
      return res.status(201).json({
        message: `${savedQuestions.length} preguntas creadas exitosamente`,
        questions: savedQuestions
      });
    } 
    // Si recibimos una sola pregunta
    else {
      const { subject, question, correctAnswer, score } = req.body;
      console.log('Procesando pregunta individual:', { subject, question, correctAnswer, score }); // Para debug

      // Validación de campos requeridos
      if (!subject || !question || !correctAnswer) {
        return res.status(400).json({
          message: 'Todos los campos son requeridos',
          receivedData: { subject, question, correctAnswer, score }
        });
      }

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
      console.log('Pregunta guardada:', savedQuestion); // Para debug
      return res.status(201).json(savedQuestion);
    }
  } catch (error) {
    console.error('Error detallado:', error);
    res.status(500).json({ 
      message: 'Error al crear la(s) pregunta(s)',
      error: error.message
    });
  }
};

// Obtener todas las preguntas de las materias que imparte el maestro autenticado
const getQuestionsByTeacher = async (req, res) => {
  try {
    const teacherId = req.user._id;
    // Buscar todas las asignaciones de materias del maestro
    const teacherSubjects = await TeacherSubject.find({ teacher: teacherId });
    const subjectIds = teacherSubjects.map(ts => ts.subject);
    if (!subjectIds.length) {
      return res.status(200).json([]);
    }
    // Buscar todas las preguntas de esas materias
    const questions = await Question.find({ subject: { $in: subjectIds } }).populate('subject');
    res.status(200).json(questions);
  } catch (error) {
    console.error('Error al obtener preguntas del maestro:', error);
    res.status(500).json({ message: 'Error al obtener preguntas del maestro' });
  }
};

module.exports = {
  getQuestionsBySubject,
  createQuestion,
  getQuestionsByTeacher
}; 