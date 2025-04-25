import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import Swal from 'sweetalert2';

// Definimos los estilos fuera del componente
const styles = `
.submitted-exams-section {
  margin-top: 2rem;
  padding: 1rem;
}

.exams-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.exams-table th,
.exams-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.exams-table th {
  background-color: #f4f4f4;
  font-weight: 600;
}

.exams-table tr:hover {
  background-color: #f5f5f5;
}

.exams-table td {
  color: #333;
}

.add-question-button {
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 20px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 5px;
}

.form-group textarea {
  min-height: 100px;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.modal-buttons button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.modal-buttons button[type="submit"] {
  background-color: #4CAF50;
  color: white;
}

.modal-buttons button[type="button"] {
  background-color: #f44336;
  color: white;
}

.questions-preview {
  margin-top: 20px;
  border-top: 1px solid #ddd;
  padding-top: 20px;
}

.questions-list {
  max-height: 300px;
  overflow-y: auto;
  margin: 10px 0;
}

.question-preview-item {
  display: flex;
  justify-content: space-between;
  align-items: start;
  padding: 10px;
  border: 1px solid #ddd;
  margin-bottom: 5px;
  border-radius: 4px;
}

.remove-question-btn {
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.save-all-btn {
  background: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  margin-top: 10px;
}
`;

const newStyles = `
  // ... nuevos estilos ...
`;

const swalStyles = `
.swal2-popup {
  font-size: 1rem;
}

.swal2-title {
  font-size: 1.5rem;
}

.swal2-confirm {
  background-color: #4CAF50 !important;
}

.swal2-cancel {
  background-color: #f44336 !important;
}

.swal2-toast {
  background-color: #4CAF50;
  color: white;
}

.swal2-html-container {
  margin: 1em 1.6em 0.3em;
}

.swal2-html-container h4 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.swal2-html-container p {
  margin: 0.5rem 0;
  font-size: 1rem;
}

.swal2-html-container div {
  text-align: left;
}

.swal2-html-container i {
  opacity: 0.8;
}

.swal2-toast.swal2-icon-success {
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
}

.swal2-toast .swal2-title {
  font-size: 1.1rem !important;
  margin: 0 !important;
}

.swal2-toast .swal2-html-container {
  margin: 5px 0 0 0 !important;
  font-size: 0.9rem !important;
}

.swal2-toast .swal2-timer-progress-bar {
  background: rgba(255,255,255,0.3) !important;
}

.swal2-toast.success-toast {
  background: #4CAF50 !important;
  color: white !important;
}
`;

const newTimeStyles = `
  .time-limit-section {
    margin: 20px 0;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .time-limit-controls {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-top: 10px;
  }

  .time-limit-switch {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  }

  .time-input {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .time-input input {
    width: 80px;
    padding: 5px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .switch-slider {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
    background-color: #ccc;
    border-radius: 12px;
    transition: .4s;
  }

  .switch-slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    border-radius: 50%;
    transition: .4s;
  }

  input:checked + .switch-slider {
    background-color: #4CAF50;
  }

  input:checked + .switch-slider:before {
    transform: translateX(26px);
  }
`;

const Exams = () => {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [currentExam, setCurrentExam] = useState(null);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [submittedExams, setSubmittedExams] = useState([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [newQuestion, setNewQuestion] = useState({
    subject: '',
    questionText: '',
    correctAnswer: '',
    score: 10
  });
  const [questionsList, setQuestionsList] = useState([]);
  const [examConfig, setExamConfig] = useState({
    timeLimit: 30,
    hasTimeLimit: false
  });
  const [showQuestionSelection, setShowQuestionSelection] = useState(false);
  const [examToReview, setExamToReview] = useState(null);
  const [examAnswers, setExamAnswers] = useState([]);

  // Agregamos un useEffect para manejar los estilos
  useEffect(() => {
    // Creamos el elemento style
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles + newStyles + swalStyles + newTimeStyles;
    document.head.appendChild(styleSheet);

    // Limpieza cuando el componente se desmonte
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []); // Se ejecuta solo una vez al montar el componente

  // Obtener las materias del profesor
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axiosInstance.get('/subjects/teacher');
        console.log('Materias cargadas:', response.data);
        setSubjects(response.data);
      } catch (error) {
        console.error('Error al obtener materias:', error);
      }
    };
    fetchSubjects();
  }, []);

  // Obtener los alumnos cuando se seleccione una materia
  useEffect(() => {
    const fetchStudents = async () => {
      if (selectedSubject) {
        try {
          console.log('Obteniendo estudiantes para la materia:', selectedSubject);
          const response = await axiosInstance.get(`subjects/${selectedSubject}/students`);
          console.log('Respuesta:', response.data);
          setStudents(response.data);
        } catch (error) {
          console.error('Error al obtener alumnos:', error);
        }
      }
    };
    fetchStudents();
  }, [selectedSubject]);

  // Añadir useEffect para cargar preguntas cuando se crea un examen
  useEffect(() => {
    const loadQuestions = async () => {
      if (selectedSubject) {
        try {
          const response = await axiosInstance.get(`/questions/subject/${selectedSubject}`);
          console.log('Preguntas disponibles:', response.data);
          setQuestions(response.data);
        } catch (error) {
          console.error('Error al cargar preguntas:', error);
        }
      }
    };

    loadQuestions();
  }, [selectedSubject]);

  useEffect(() => {
    const fetchSubmittedExams = async () => {
      try {
        const response = await axiosInstance.get('/exams/teacher/all');
        // Agregamos console.log para ver los datos
        console.log('Datos de exámenes recibidos:', response.data);
        const completedExams = response.data.filter(exam => exam.status === 'completed');
        console.log('Exámenes completados:', completedExams);
        setSubmittedExams(completedExams);
      } catch (error) {
        console.error('Error al obtener exámenes:', error);
      }
    };

    fetchSubmittedExams();
  }, []);

  // Función para obtener las materias del maestro
  useEffect(() => {
    const fetchTeacherSubjects = async () => {
      try {
        const response = await axiosInstance.get('/subjects/teacher');
        console.log('Materias del profesor:', response.data);
        setTeacherSubjects(response.data);
      } catch (error) {
        console.error('Error al obtener materias:', error);
      }
    };

    fetchTeacherSubjects();
  }, []);

  const handleCreateExam = async () => {
    try {
      // Mostrar loading mientras se crea el examen
      Swal.fire({
        title: 'Creando examen',
        text: 'Por favor espere...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await axiosInstance.post('/exams/create', {
        studentId: selectedStudent,
        subjectId: selectedSubject,
        timeLimit: examConfig.hasTimeLimit ? examConfig.timeLimit : null
      });

      // Obtenemos los datos del estudiante y la materia para mostrarlos
      const student = students.find(s => s._id === selectedStudent);
      const subject = subjects.find(s => s.id === selectedSubject);

      // Mostramos el mensaje de éxito con detalles
      await Swal.fire({
        title: '¡Examen Creado Exitosamente!',
        icon: 'success',
        html: `
          <div style="text-align: left; padding: 10px;">
            <div style="margin: 20px 0;">
              <h4 style="color: #4CAF50; margin-bottom: 15px;">Detalles del Examen:</h4>
              <p><b>📚 Materia:</b> ${subject?.name || 'No disponible'}</p>
              <p><b>👤 Estudiante:</b> ${student?.username || 'No disponible'}</p>
              <p><b>🆔 ID del Examen:</b> ${response.data._id}</p>
              ${examConfig.hasTimeLimit ? 
                `<p><b>⏱️ Tiempo límite:</b> ${examConfig.timeLimit} minutos</p>` 
                : '<p><b>⏱️ Tiempo:</b> Sin límite</p>'
              }
            </div>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
              <p style="color: #666; margin: 0;">
                <i>Ahora puedes proceder a asignar las preguntas al examen.</i>
              </p>
            </div>
          </div>
        `,
        confirmButtonColor: '#4CAF50',
        confirmButtonText: 'Continuar',
        showCancelButton: true,
        cancelButtonText: 'Cerrar',
        cancelButtonColor: '#d33',
        allowOutsideClick: false
      }).then((result) => {
        if (result.isConfirmed) {
          // Si el usuario hace clic en continuar, procedemos con el examen
          setCurrentExam(response.data);
        } else {
          // Si el usuario cancela, limpiamos la selección
          setSelectedStudent('');
          setSelectedSubject('');
          setExamConfig({ timeLimit: 30, hasTimeLimit: false });
        }
      });

    } catch (error) {
      console.error('Error al crear examen:', error);
      
      await Swal.fire({
        title: 'Error',
        text: 'No se pudo crear el examen. Por favor, intente nuevamente.',
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    }
  };

  const handleAssignQuestions = async () => {
    try {
      if (selectedQuestions.length < 3) {
        await Swal.fire({
          title: '¡Atención!',
          text: 'Debes seleccionar al menos 3 preguntas',
          icon: 'warning',
          confirmButtonColor: '#3085d6'
        });
        return;
      }

      // Mostrar loading
      Swal.fire({
        title: 'Creando examen',
        text: 'Por favor espere...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Primero crear el examen
      const examResponse = await axiosInstance.post('/exams/create', {
        studentId: selectedStudent,
        subjectId: selectedSubject,
        timeLimit: examConfig.hasTimeLimit ? examConfig.timeLimit : null
      });

      // Luego asignar las preguntas
      await axiosInstance.post('/exams/assign-questions', {
        examId: examResponse.data._id,
        questionIds: selectedQuestions
      });

      await Swal.fire({
        title: '¡Éxito!',
        text: 'Examen creado y preguntas asignadas correctamente',
        icon: 'success',
        confirmButtonColor: '#4CAF50'
      });

      // Limpiar estados
      setSelectedQuestions([]);
      setShowQuestionSelection(false);
      setSelectedStudent('');
      setSelectedSubject('');
      setExamConfig({ timeLimit: 30, hasTimeLimit: false });

    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo crear el examen',
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    }
  };

  // Función para manejar la creación de preguntas
  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    
    const newQuestionData = {
      subject: newQuestion.subject,
      question: newQuestion.questionText,
      correctAnswer: newQuestion.correctAnswer,
      score: parseInt(newQuestion.score) || 10
    };

    // Validación de campos
    if (!newQuestionData.subject || !newQuestionData.question || !newQuestionData.correctAnswer) {
      await Swal.fire({
        title: 'Campos incompletos',
        text: 'Por favor completa todos los campos requeridos',
        icon: 'warning',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    setQuestionsList([...questionsList, newQuestionData]);

    // Toast de confirmación
    await Swal.fire({
      position: 'top-end',
      icon: 'success',
      title: 'Pregunta agregada a la lista',
      showConfirmButton: false,
      timer: 1500,
      toast: true
    });

    // Limpiamos el formulario pero mantenemos la materia seleccionada
    setNewQuestion({
      subject: newQuestion.subject,
      questionText: '',
      correctAnswer: '',
      score: 10
    });
  };

  // Modificamos el handleSaveQuestions para asegurar el formato correcto
  const handleSaveQuestions = async () => {
    try {
      if (questionsList.length === 0) {
        await Swal.fire({
          title: '¡Atención!',
          text: 'Agregue al menos una pregunta',
          icon: 'warning',
          confirmButtonColor: '#3085d6'
        });
        return;
      }

      // Verificamos que todas las preguntas tengan los campos necesarios
      const hasInvalidQuestions = questionsList.some(q => 
        !q.subject || !q.question || !q.correctAnswer || !q.score
      );

      if (hasInvalidQuestions) {
        await Swal.fire({
          title: 'Error de validación',
          text: 'Todas las preguntas deben tener todos los campos completos',
          icon: 'error',
          confirmButtonColor: '#3085d6'
        });
        return;
      }

      // Mostrar loading mientras se guardan las preguntas
      Swal.fire({
        title: 'Guardando preguntas',
        text: 'Por favor espere...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await axiosInstance.post('/questions/create', {
        questions: questionsList.map(q => ({
          subject: q.subject,
          question: q.question,
          correctAnswer: q.correctAnswer,
          score: parseInt(q.score) || 10
        }))
      });

      await Swal.fire({
        title: '¡Éxito!',
        text: `${questionsList.length} pregunta(s) creada(s) exitosamente`,
        icon: 'success',
        confirmButtonColor: '#3085d6'
      });

      // Limpiar el formulario y la lista
      setQuestionsList([]);
      setShowQuestionModal(false);

      // Actualizar la lista de preguntas si hay una materia seleccionada
      if (selectedSubject) {
        try {
          const questionsResponse = await axiosInstance.get(`/questions/subject/${selectedSubject}`);
          console.log('Preguntas actualizadas:', questionsResponse.data);
          setQuestions(questionsResponse.data);
        } catch (error) {
          console.error('Error al actualizar preguntas:', error);
        }
      }

    } catch (error) {
      console.error('Error completo:', error);
      console.error('Datos del error:', error.response?.data);
      
      await Swal.fire({
        title: 'Error',
        text: 'Error al guardar las preguntas. Por favor verifica todos los campos.',
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
    }
  };

  // Función para eliminar una pregunta de la lista temporal
  const handleRemoveQuestion = async (index) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "¿Deseas eliminar esta pregunta de la lista?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setQuestionsList(questionsList.filter((_, i) => i !== index));
      await Swal.fire({
        title: '¡Eliminada!',
        text: 'La pregunta ha sido eliminada de la lista',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const handleCloseModal = async () => {
    if (questionsList.length > 0) {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Hay preguntas sin guardar. ¿Deseas cerrar de todos modos?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, cerrar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        setShowQuestionModal(false);
        setQuestionsList([]);
      }
    } else {
      setShowQuestionModal(false);
    }
  };

  const renderQuestionSelection = () => {
    if (!currentExam) return null;

    return (
      <div className="section">
        <h2>Seleccionar Preguntas</h2>
        <div className="questions-list">
          {questions.map((questionItem) => (
            <div key={questionItem._id} className="question-item">
              <input
                type="checkbox"
                id={questionItem._id}
                checked={selectedQuestions.includes(questionItem._id)}
                onChange={() => {
                  const newSelected = selectedQuestions.includes(questionItem._id)
                    ? selectedQuestions.filter(id => id !== questionItem._id)
                    : [...selectedQuestions, questionItem._id];
                  setSelectedQuestions(newSelected);
                }}
              />
              <label htmlFor={questionItem._id}>{questionItem.question}</label>
            </div>
          ))}
        </div>
        {questions.length > 0 && (
          <button 
            onClick={handleAssignQuestions}
            className="assign-button"
          >
            Asignar Preguntas
          </button>
        )}
      </div>
    );
  };

  const TeacherExamList = () => {
    const handleReviewExam = async (examId) => {
      try {
        const response = await axiosInstance.get(`/exams/${examId}/answers`);
        setExamAnswers(response.data.answers);
        setExamToReview(examId);
      } catch (error) {
        console.error('Error al obtener respuestas:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las respuestas del examen'
        });
      }
    };

    const handleUpdateAnswer = async (answerId, isCorrect) => {
      try {
        // Mostrar loading
        Swal.fire({
          title: 'Actualizando...',
          text: 'Por favor espere',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Actualizar la respuesta
        const response = await axiosInstance.patch(`/exams/${examToReview}/answers/${answerId}`, {
          isCorrect
        });

        console.log('Respuesta de actualización:', response.data);

        // Actualizar la lista de exámenes
        const updatedExamsResponse = await axiosInstance.get('/exams/teacher/all');
        setSubmittedExams(updatedExamsResponse.data);

        // Actualizar también las respuestas mostradas en el modal
        const updatedAnswersResponse = await axiosInstance.get(`/exams/${examToReview}/answers`);
        setExamAnswers(updatedAnswersResponse.data.answers);

        Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'La calificación se ha actualizado correctamente',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000
        });

      } catch (error) {
        console.error('Error al actualizar:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar la respuesta'
        });
      }
    };

    return (
      <div className="submitted-exams-section">
        <h2>Exámenes Entregados</h2>
        {submittedExams.length === 0 ? (
          <p>No hay exámenes entregados aún</p>
        ) : (
          <table className="exams-table">
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Materia</th>
                <th>Correctas</th>
                <th>Incorrectas</th>
                <th>Calificación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {submittedExams.map((exam) => (
                <tr key={exam._id}>
                  <td>{exam.student?.email?.split('@')[0] || 'No disponible'}</td>
                  <td>{exam.subject?.name || 'No disponible'}</td>
                  <td>{exam.correctAnswers}</td>
                  <td>{exam.incorrectAnswers}</td>
                  <td>{exam.calification}</td>
                  <td>
                    <button
                      onClick={() => handleReviewExam(exam._id)}
                      className="review-button"
                    >
                      Revisar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Modal de revisión */}
        {examToReview && (
          <div className="modal-overlay">
            <div className="modal-content review-modal">
              <h2>Revisión de Examen</h2>
              <div className="answers-list">
                {examAnswers.map((answer, index) => (
                  <div key={answer._id} className="answer-review-item">
                    <div className="question-section">
                      <h4>Pregunta {index + 1}</h4>
                      <p>{answer.question.question}</p>
                    </div>
                    <div className="answer-section">
                      <h4>Respuesta del alumno:</h4>
                      <p>{answer.answer}</p>
                      <h4>Respuesta correcta:</h4>
                      <p>{answer.question.correctAnswer}</p>
                    </div>
                    <div className="evaluation-section">
                      <button
                        className={`correct-button ${answer.isCorrect ? 'active' : ''}`}
                        onClick={() => handleUpdateAnswer(answer._id, true)}
                      >
                        Marcar como correcta
                      </button>
                      <button
                        className={`incorrect-button ${!answer.isCorrect ? 'active' : ''}`}
                        onClick={() => handleUpdateAnswer(answer._id, false)}
                      >
                        Marcar como incorrecta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="close-button"
                onClick={() => {
                  setExamToReview(null);
                  setExamAnswers([]);
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="exams-container">
      <h1>Asignar Examen</h1>
      
      {/* Selector de materia */}
      <div>
        <h2>Seleccionar Materia</h2>
        <select 
          value={selectedSubject} 
          onChange={(e) => {
            setSelectedSubject(e.target.value);
            setSelectedStudent(''); // Limpiar estudiante seleccionado
          }}
        >
          <option value="">Seleccione una materia</option>
          {subjects.map(subject => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      {/* Selector de estudiante (solo se muestra si hay una materia seleccionada) */}
      {selectedSubject && (
        <div>
          <h2>Seleccionar Estudiante</h2>
          <select 
            value={selectedStudent} 
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            <option value="">Seleccione un estudiante</option>
            {students.map(student => (
              <option key={student._id} value={student._id}>
                {student.username}
              </option>
            ))}
          </select>
          {selectedStudent && (
            <div className="time-limit-section">
              <h2>Configuración de Tiempo</h2>
              <div className="time-limit-controls">
                <label className="time-limit-switch">
                  <input
                    type="checkbox"
                    checked={examConfig.hasTimeLimit}
                    onChange={(e) => setExamConfig(prev => ({
                      ...prev,
                      hasTimeLimit: e.target.checked
                    }))}
                  />
                  <span className="switch-slider"></span>
                  Establecer límite de tiempo
                </label>
                
                {examConfig.hasTimeLimit && (
                  <div className="time-input">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={examConfig.timeLimit}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setExamConfig(prev => ({
                          ...prev,
                          timeLimit: Math.max(1, value)
                        }));
                      }}
                      onKeyDown={(e) => {
                        // Permitir solo números, backspace, delete, y teclas de navegación
                        if (!/[\d\b]/.test(e.key) && 
                            !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      style={{
                        width: '80px',
                        padding: '8px',
                        fontSize: '14px',
                        borderRadius: '4px',
                        border: '1px solid #ddd'
                      }}
                    />
                    <span>minutos</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {selectedStudent && (
            <div>
              <button 
                onClick={async () => {
                  // Verificar primero si hay suficientes preguntas disponibles
                  try {
                    const response = await axiosInstance.get(`/questions/subject/${selectedSubject}`);
                    const availableQuestions = response.data;

                    if (availableQuestions.length < 3) {
                      await Swal.fire({
                        title: 'No hay suficientes preguntas',
                        text: 'Debe haber al menos 3 preguntas disponibles para crear un examen',
                        icon: 'warning',
                        confirmButtonColor: '#3085d6'
                      });
                      return;
                    }

                    setQuestions(availableQuestions);
                    // En lugar de crear el examen, mostrar la selección de preguntas
                    setShowQuestionSelection(true);
                  } catch (error) {
                    console.error('Error al obtener preguntas:', error);
                    Swal.fire({
                      icon: 'error',
                      title: 'Error',
                      text: 'Error al cargar las preguntas disponibles'
                    });
                  }
                }}
                className="next-step-button"
              >
                Siguiente: Seleccionar Preguntas
              </button>
            </div>
          )}
        </div>
      )}

      {showQuestionSelection && (
        <div className="question-selection-section">
          <h2>Seleccionar Preguntas</h2>
          <p>Selecciona al menos 3 preguntas para el examen</p>
          <div className="questions-list">
            {questions.map((questionItem) => (
              <div key={questionItem._id} className="question-item">
                <input
                  type="checkbox"
                  id={questionItem._id}
                  checked={selectedQuestions.includes(questionItem._id)}
                  onChange={() => {
                    const newSelected = selectedQuestions.includes(questionItem._id)
                      ? selectedQuestions.filter(id => id !== questionItem._id)
                      : [...selectedQuestions, questionItem._id];
                    setSelectedQuestions(newSelected);
                  }}
                />
                <label htmlFor={questionItem._id}>{questionItem.question}</label>
              </div>
            ))}
          </div>
          <div className="buttons-container">
            <button 
              onClick={() => setShowQuestionSelection(false)}
              className="cancel-button"
            >
              Cancelar
            </button>
            <button 
              onClick={handleAssignQuestions}
              className="create-exam-button"
              disabled={selectedQuestions.length < 3}
            >
              Crear Examen
            </button>
          </div>
        </div>
      )}

      <button 
        className="add-question-button"
        onClick={() => setShowQuestionModal(true)}
      >
        Agregar Nueva Pregunta
      </button>

      {/* Modal para crear preguntas */}
      {showQuestionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Crear Nuevas Preguntas</h2>
            <form onSubmit={handleCreateQuestion}>
              <div className="form-group">
                <label>Materia:</label>
                <select
                  value={newQuestion.subject}
                  onChange={(e) => {
                    console.log('ID de materia seleccionada:', e.target.value);
                    setNewQuestion({
                      ...newQuestion,
                      subject: e.target.value
                    });
                  }}
                  required
                >
                  <option value="">Seleccione una materia</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Pregunta:</label>
                <textarea
                  value={newQuestion.questionText}
                  onChange={(e) => setNewQuestion({
                    ...newQuestion,
                    questionText: e.target.value
                  })}
                  required
                  placeholder="Escribe la pregunta aquí"
                />
              </div>

              <div className="form-group">
                <label>Respuesta Correcta:</label>
                <textarea
                  value={newQuestion.correctAnswer}
                  onChange={(e) => setNewQuestion({
                    ...newQuestion,
                    correctAnswer: e.target.value
                  })}
                  required
                  placeholder="Escribe la respuesta correcta aquí"
                />
              </div>

              <div className="form-group">
                <label>Puntaje:</label>
                <input
                  type="number"
                  value={newQuestion.score}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : parseInt(e.target.value);
                    setNewQuestion({
                      ...newQuestion,
                      score: value
                    });
                  }}
                  onBlur={(e) => {
                    // Aplicar valor mínimo de 1 cuando pierde el foco
                    const value = e.target.value === '' ? 1 : parseInt(e.target.value);
                    setNewQuestion({
                      ...newQuestion,
                      score: Math.max(1, value)
                    });
                  }}
                  style={{
                    width: '80px',
                    padding: '8px',
                    fontSize: '14px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                  required
                />
              </div>

              <div className="modal-buttons">
                <button type="submit">Agregar a la lista</button>
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                >
                  Cancelar
                </button>
              </div>
            </form>

            {/* Lista de preguntas agregadas */}
            {questionsList.length > 0 && (
              <div className="questions-preview">
                <h3>Preguntas por guardar ({questionsList.length})</h3>
                <div className="questions-list">
                  {questionsList.map((q, index) => (
                    <div key={index} className="question-preview-item">
                      <div>
                        <strong>Pregunta {index + 1}:</strong> {q.question}
                        <br />
                        <small>Respuesta: {q.correctAnswer} | Puntaje: {q.score}</small>
                      </div>
                      <button 
                        onClick={() => handleRemoveQuestion(index)}
                        className="remove-question-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={handleSaveQuestions}
                  className="save-all-btn"
                >
                  Guardar todas las preguntas
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agregamos la tabla de exámenes entregados */}
      <TeacherExamList />
    </div>
  );
};

export default Exams; 