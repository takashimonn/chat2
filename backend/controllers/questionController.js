const mongoose = require('mongoose');
const Question = require('../models/Question');
const TeacherSubject = require('../models/TeacherSubject');
const ExamQuestion = require('../models/ExamQuestion');

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

const updateQuestion = async (req, res) => {
  try {
    console.log('Iniciando actualización de pregunta');
    console.log('ID recibido:', req.params.id);
    console.log('Datos recibidos:', req.body);

    const { question, correctAnswer, score } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('ID inválido:', req.params.id);
      return res.status(400).json({ 
        message: 'ID de pregunta inválido',
        receivedId: req.params.id
      });
    }

    if (!question || !correctAnswer || !score) {
      console.log('Datos incompletos:', { question, correctAnswer, score });
      return res.status(400).json({ 
        message: 'Todos los campos son requeridos',
        receivedData: { question, correctAnswer, score }
      });
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      { 
        question,
        correctAnswer,
        score: parseInt(score)
      },
      { new: true }
    );
    
    if (!updatedQuestion) {
      console.log('Pregunta no encontrada con ID:', req.params.id);
      return res.status(404).json({ message: 'Pregunta no encontrada' });
    }

    console.log('Pregunta actualizada exitosamente:', updatedQuestion);
    res.json(updatedQuestion);
  } catch (error) {
    console.error('Error detallado al actualizar pregunta:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
      questionId: req.params.id
    });
    res.status(500).json({ 
      message: 'Error al actualizar la pregunta',
      error: error.message 
    });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const questionId = req.params.id;
    console.log('Intentando eliminar pregunta con ID:', questionId);

    // Primero verificamos si la pregunta existe
    const question = await Question.findById(questionId);
    if (!question) {
      console.log('Pregunta no encontrada');
      return res.status(404).json({ message: 'Pregunta no encontrada' });
    }

    // Verificar si la pregunta está siendo usada en algún examen
    const examQuestions = await ExamQuestion.find({ question: questionId });
    if (examQuestions.length > 0) {
      console.log('La pregunta está siendo usada en exámenes:', examQuestions.length);
      return res.status(400).json({ 
        message: 'No se puede eliminar la pregunta porque está siendo usada en uno o más exámenes',
        examCount: examQuestions.length
      });
    }

    // Si no está siendo usada, procedemos a eliminarla
    console.log('Procediendo a eliminar la pregunta');
    const deletedQuestion = await Question.findByIdAndDelete(questionId);

    if (deletedQuestion) {
      console.log('Pregunta eliminada exitosamente');
      res.json({ 
        message: 'Pregunta eliminada correctamente',
        deletedQuestion 
      });
    } else {
      console.log('Error: La pregunta no pudo ser eliminada');
      res.status(500).json({ 
        message: 'No se pudo eliminar la pregunta' 
      });
    }
  } catch (error) {
    console.error('Error detallado al eliminar pregunta:', {
      message: error.message,
      stack: error.stack,
      questionId: req.params.id
    });
    
    // Verificar si es un error de ID inválido
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ 
        message: 'ID de pregunta inválido',
        error: error.message 
      });
    }

    res.status(500).json({ 
      message: 'Error al eliminar la pregunta',
      error: error.message 
    });
  }
};

module.exports = {
  getQuestionsBySubject,
  createQuestion,
  getQuestionsByTeacher,
  updateQuestion,
  deleteQuestion
}; 