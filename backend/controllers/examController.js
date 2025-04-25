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

    // Obtener todas las preguntas del examen con sus respuestas correctas
    const examQuestions = await ExamQuestion.find({ exam: examId })
      .populate('question')
      .lean();

    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let totalScore = 0;
    let obtainedScore = 0;

    // Actualizar cada respuesta y marcar si es correcta o no
    for (const examQuestion of examQuestions) {
      const studentAnswer = answers.find(a => a.questionId === examQuestion.question._id.toString());
      const isCorrect = studentAnswer?.answer.trim().toLowerCase() === 
                       examQuestion.question.correctAnswer.trim().toLowerCase();

      // Actualizar la respuesta con el campo isCorrect inicializado
      await ExamQuestion.findByIdAndUpdate(
        examQuestion._id,
        {
          answer: studentAnswer?.answer || '',
          isCorrect: isCorrect // Inicializamos explícitamente isCorrect
        }
      );

      // Actualizar contadores
      if (isCorrect) {
        correctAnswers++;
        obtainedScore += (examQuestion.question.score || 10);
      } else {
        incorrectAnswers++;
      }
      totalScore += (examQuestion.question.score || 10);
    }

    // Calcular calificación
    const calification = Math.round((obtainedScore / totalScore) * 100);

    // Actualizar el examen
    await Exam.findByIdAndUpdate(examId, {
      status: 'completed',
      correctAnswers,
      incorrectAnswers,
      calification
    });

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
    res.status(500).json({ message: 'Error al enviar el examen' });
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
    
    const examWithAnswers = await ExamQuestion.find({ exam: examId })
      .populate('question')
      .lean();

    if (!examWithAnswers) {
      return res.status(404).json({ message: 'No se encontraron respuestas para este examen' });
    }

    // Asegurarnos de que los datos están en el formato correcto
    const answers = examWithAnswers.map(item => ({
      _id: item._id,
      question: item.question.question,
      studentAnswer: item.answer || 'Sin respuesta',
      correctAnswer: item.question.correctAnswer,
      isCorrect: item.isCorrect || false
    }));

    console.log('Respuestas formateadas:', answers);
    res.json({ answers });

  } catch (error) {
    console.error('Error al obtener respuestas:', error);
    res.status(500).json({ message: 'Error al obtener respuestas del examen' });
  }
};

exports.updateAnswer = async (req, res) => {
  try {
    const { examId, answerId } = req.params;
    const { isCorrect } = req.body;

    console.log('Actualizando respuesta:', { examId, answerId, isCorrect });

    // Actualizar la respuesta específica
    await ExamQuestion.findByIdAndUpdate(
      answerId,
      { isCorrect },
      { new: true }
    );

    // Obtener todas las respuestas del examen con sus preguntas y puntajes
    const allAnswers = await ExamQuestion.find({ exam: examId })
      .populate('question', 'score')
      .lean();
    
    // Calcular puntajes
    let totalScore = 0;
    let obtainedScore = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;

    // Asegurarnos de que cada respuesta tenga un valor isCorrect definido
    allAnswers.forEach(answer => {
      const questionScore = answer.question.score || 10;
      totalScore += questionScore;

      // Usar el valor explícito de isCorrect
      if (answer.isCorrect === true) {
        obtainedScore += questionScore;
        correctAnswers++;
      } else {
        incorrectAnswers++;
      }
    });

    // Calcular la calificación
    const calification = Math.round((obtainedScore / totalScore) * 100);

    console.log('Cálculo de calificación:', {
      totalScore,
      obtainedScore,
      correctAnswers,
      incorrectAnswers,
      calification
    });

    // Actualizar el examen
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

    res.json({
      message: 'Respuesta actualizada correctamente',
      stats: {
        correctAnswers,
        incorrectAnswers,
        calification,
        totalScore,
        obtainedScore
      }
    });

  } catch (error) {
    console.error('Error al actualizar:', error);
    res.status(500).json({ 
      message: 'Error al actualizar respuesta',
      error: error.message 
    });
  }
}; 