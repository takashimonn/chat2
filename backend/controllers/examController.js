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

exports.getStudentExams = async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log('Buscando exámenes para estudiante:', studentId);

    const exams = await Exam.find({ student: studentId })
      .populate('subject')
      .sort({ createdAt: -1 });

    console.log('Exámenes encontrados:', exams);
    res.json(exams);
  } catch (error) {
    console.error('Error al obtener exámenes:', error);
    res.status(500).json({ message: 'Error al obtener exámenes' });
  }
};

exports.getExamQuestions = async (req, res) => {
  try {
    const { examId } = req.params;
    console.log('Buscando preguntas para el examen:', examId);

    const examQuestions = await ExamQuestion.find({ exam: examId })
      .populate('question');

    console.log('Preguntas encontradas:', examQuestions);
    res.json(examQuestions);
  } catch (error) {
    console.error('Error al obtener preguntas del examen:', error);
    res.status(500).json({ message: 'Error al obtener preguntas del examen' });
  }
};

exports.getTeacherExams = async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('student')
      .populate('subject')
      .sort({ createdAt: -1 });

    console.log('Exámenes encontrados para el maestro:', exams);
    res.json(exams);
  } catch (error) {
    console.error('Error al obtener exámenes:', error);
    res.status(500).json({ message: 'Error al obtener exámenes' });
  }
};

exports.submitExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { answers } = req.body;
    console.log('Recibiendo respuestas:', { examId, answers });

    // 1. Obtener todas las preguntas del examen
    const examQuestions = await ExamQuestion.find({ exam: examId })
      .populate('question');

    if (!examQuestions.length) {
      return res.status(404).json({ message: 'No se encontraron preguntas para este examen' });
    }

    // 2. Calcular respuestas correctas e incorrectas
    let correctAnswers = 0;
    let incorrectAnswers = 0;

    // Iteramos sobre cada respuesta recibida
    answers.forEach(answer => {
      // Buscamos la pregunta correspondiente
      const questionData = examQuestions.find(
        eq => eq.question._id.toString() === answer.questionId
      );

      // Comparamos la respuesta del alumno con la respuesta correcta
      if (questionData && answer.answer === questionData.question.correctAnswer) {
        correctAnswers++;
      } else {
        incorrectAnswers++;
      }
    });

    // 3. Calcular calificación (sobre 100)
    const totalQuestions = examQuestions.length;
    const calification = Math.round((correctAnswers / totalQuestions) * 100);

    // 4. Actualizar el examen con los resultados
    const updatedExam = await Exam.findByIdAndUpdate(
      examId,
      {
        correctAnswers,
        incorrectAnswers,
        calification,
        status: 'completed'
      },
      { new: true }
    );

    console.log('Examen actualizado:', updatedExam);

    res.json({
      message: 'Examen enviado correctamente',
      results: {
        correctAnswers,
        incorrectAnswers,
        calification
      }
    });

  } catch (error) {
    console.error('Error al enviar examen:', error);
    res.status(500).json({ message: 'Error al procesar el examen' });
  }
}; 