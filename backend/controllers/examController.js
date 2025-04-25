const Exam = require('../models/Exam');
const ExamQuestion = require('../models/ExamQuestion');

exports.createExam = async (req, res) => {
  try {
    const { studentId, subjectId, timeLimit } = req.body;
    console.log('Datos recibidos:', { studentId, subjectId, timeLimit });

    if (!studentId || !subjectId) {
      return res.status(400).json({ message: 'Se requiere ID de estudiante y materia' });
    }

    const newExam = new Exam({
      student: studentId,
      subject: subjectId,
      timeLimit: timeLimit || null,
      correctAnswers: null,
      incorrectAnswers: null,
      score: null,
      status: 'pending'
    });

    const savedExam = await newExam.save();
    console.log('Examen creado:', savedExam);
    res.status(201).json(savedExam);
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

    // Buscar las preguntas del examen en ExamQuestion
    const examQuestions = await ExamQuestion.find({ exam: examId })
      .populate('question');

    if (!examQuestions) {
      console.log('No se encontraron preguntas para el examen');
      return res.status(404).json({ message: 'No se encontraron preguntas para este examen' });
    }

    // Obtener el examen para el timeLimit
    const exam = await Exam.findById(examId);
    
    console.log('Preguntas encontradas:', examQuestions);

    // Modificar la estructura de la respuesta para incluir el _id correcto
    const response = {
      questions: examQuestions.map(eq => ({
        question: {
          _id: eq.question._id,
          question: eq.question.question
        }
      })),
      timeLimit: exam.timeLimit
    };

    console.log('Respuesta a enviar:', response);
    res.status(200).json(response);

  } catch (error) {
    console.error('Error completo al obtener preguntas:', error);
    res.status(500).json({ 
      message: 'Error al obtener preguntas del examen',
      error: error.message 
    });
  }
};

exports.getTeacherExams = async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate({
        path: 'student',
        select: 'name email'
      })
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
        eq => eq.question._id.toString() === answer.questionId.toString()
      );

      console.log('Comparando respuesta:', {
        preguntaID: answer.questionId,
        respuestaAlumno: answer.answer,
        respuestaCorrecta: questionData?.question.correctAnswer
      });

      // Comparamos la respuesta del alumno con la respuesta correcta
      if (questionData && answer.answer.trim() === questionData.question.correctAnswer.trim()) {
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

exports.getExamById = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId)
      .populate('student')
      .populate('subject')
      .populate('questions.question');

    if (!exam) {
      return res.status(404).json({ message: 'Examen no encontrado' });
    }

    res.status(200).json({
      ...exam.toObject(),
      timeLimit: exam.timeLimit
    });
  } catch (error) {
    console.error('Error al obtener examen:', error);
    res.status(500).json({ message: 'Error al obtener el examen' });
  }
};

exports.getExamAnswers = async (req, res) => {
  try {
    const { examId } = req.params;
    const examQuestions = await ExamQuestion.find({ exam: examId })
      .populate('question');

    if (!examQuestions) {
      return res.status(404).json({ message: 'No se encontraron respuestas' });
    }

    res.json({ answers: examQuestions });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error al obtener respuestas' });
  }
};

exports.updateAnswer = async (req, res) => {
  try {
    const { examId, answerId } = req.params;
    const { isCorrect } = req.body;

    console.log('Actualizando respuesta:', { examId, answerId, isCorrect });

    // Actualizar el estado de la respuesta
    await ExamQuestion.findByIdAndUpdate(
      answerId,
      { isCorrect: isCorrect },
      { new: true }
    );

    // Obtener todas las respuestas del examen
    const allAnswers = await ExamQuestion.find({ exam: examId });
    
    // Contar respuestas correctas e incorrectas
    const correctAnswers = allAnswers.filter(answer => answer.isCorrect === true).length;
    const incorrectAnswers = allAnswers.length - correctAnswers;
    
    // Calcular la nueva calificación
    const calification = Math.round((correctAnswers / allAnswers.length) * 100);

    console.log('Nuevas estadísticas:', {
      total: allAnswers.length,
      correctAnswers,
      incorrectAnswers,
      calification
    });

    // Actualizar el examen con los nuevos totales
    const updatedExam = await Exam.findByIdAndUpdate(
      examId,
      {
        correctAnswers,
        incorrectAnswers,
        calification
      },
      { new: true }
    );

    console.log('Examen actualizado:', updatedExam);

    res.json({
      message: 'Respuesta actualizada correctamente',
      stats: {
        correctAnswers,
        incorrectAnswers,
        calification
      }
    });

  } catch (error) {
    console.error('Error completo:', error);
    res.status(500).json({ 
      message: 'Error al actualizar respuesta',
      error: error.message 
    });
  }
}; 