const Exam = require('../models/Exam');
const ExamQuestion = require('../models/ExamQuestion');

exports.createExam = async (req, res) => {
  try {
    const { studentId, subjectId } = req.body;
    console.log('Datos recibidos:', { studentId, subjectId });

    const newExam = await Exam.create({
      student: studentId,
      subject: subjectId,
      correctAnswers: null,
      incorrectAnswers: null,
      score: null
    });

    console.log('Examen creado:', newExam);
    res.status(201).json(newExam);
  } catch (error) {
    console.error('Error al crear examen:', error);
    res.status(500).json({ message: 'Error al crear el examen' });
  }
};

exports.assignQuestions = async (req, res) => {
  try {
    const { examId, questionIds } = req.body;
    console.log('Asignando preguntas:', { examId, questionIds });

    // Crear los registros en la tabla pivote
    const examQuestions = questionIds.map(questionId => ({
      exam: examId,
      question: questionId
    }));

    const result = await ExamQuestion.insertMany(examQuestions);
    console.log('Preguntas asignadas:', result);

    res.status(200).json({ message: 'Preguntas asignadas correctamente' });
  } catch (error) {
    console.error('Error al asignar preguntas:', error);
    res.status(500).json({ message: 'Error al asignar preguntas al examen' });
  }
}; 