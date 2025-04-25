import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import Swal from 'sweetalert2';
import '../styles/StudentExams.css';

// Definimos los estilos fuera del componente
const swalStyles = `
  .swal2-popup {
    font-size: 1rem;
  }

  .swal2-title {
    font-size: 1.5rem;
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

  .swal2-toast {
    background: #4CAF50 !important;
    color: white !important;
  }

  .swal2-toast .swal2-title {
    color: white !important;
  }

  .swal2-toast .swal2-html-container {
    color: white !important;
  }
`;

const StudentExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentExam, setCurrentExam] = useState(null);
  const [examQuestions, setExamQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  // Agregamos el useEffect para los estilos dentro del componente
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = swalStyles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const studentId = localStorage.getItem('userId');
        console.log('ID del estudiante:', studentId);
        
        const response = await axiosInstance.get(`/exams/student/${studentId}`);
        console.log('Respuesta:', response.data);
        setExams(response.data);
      } catch (error) {
        console.error('Error completo:', error);
        console.error('Detalles del error:', error.response?.data);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const handleStartExam = async (examId) => {
    try {
      const response = await axiosInstance.get(`/exams/${examId}/questions`);
      const questions = response.data.map(eq => eq.question);
      setExamQuestions(questions);
      setCurrentExam(examId);
      setShowModal(true);

      // Toast de inicio de examen
      await Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: '¡Examen iniciado!',
        text: 'Buena suerte',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#3498db',
        color: '#fff'
      });
    } catch (error) {
      console.error('Error al cargar preguntas:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las preguntas del examen',
        confirmButtonColor: '#d33'
      });
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitExam = async () => {
    try {
      // Confirmación antes de enviar
      const confirmResult = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'Una vez enviado el examen no podrás modificar tus respuestas',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, enviar examen',
        cancelButtonText: 'Cancelar'
      });

      if (!confirmResult.isConfirmed) return;

      // Mostrar loading
      Swal.fire({
        title: 'Enviando examen',
        text: 'Por favor espere...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer
      }));

      const response = await axiosInstance.post(
        `/exams/${currentExam}/submit`, 
        { answers: formattedAnswers }
      );

      const { results } = response.data;

      // Mostrar resultados con un diseño más atractivo
      await Swal.fire({
        title: '¡Examen Completado!',
        icon: 'success',
        html: `
          <div style="text-align: left; padding: 20px;">
            <div style="margin-bottom: 20px;">
              <h4 style="color: #4CAF50; margin-bottom: 15px;">Resultados:</h4>
              <p><b>✅ Respuestas correctas:</b> ${results.correctAnswers}</p>
              <p><b>❌ Respuestas incorrectas:</b> ${results.incorrectAnswers}</p>
              <p><b>📊 Calificación:</b> ${results.calification}</p>
            </div>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
              <p style="color: #666; margin: 0;">
                <i>¡Gracias por completar tu examen!</i>
              </p>
            </div>
          </div>
        `,
        confirmButtonColor: '#4CAF50',
        confirmButtonText: 'Entendido'
      });

      setShowModal(false);
      setCurrentExam(null);
      setAnswers({});
      
      // Recargar la lista de exámenes
      const studentId = localStorage.getItem('userId');
      const examsResponse = await axiosInstance.get(`/exams/student/${studentId}`);
      setExams(examsResponse.data);

    } catch (error) {
      console.error('Error al enviar examen:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo enviar el examen. Por favor intenta de nuevo.',
        confirmButtonColor: '#d33'
      });
    }
  };

  // Modificar el botón de cerrar en el modal
  const handleCloseExam = async () => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Se perderán todas tus respuestas',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'No, continuar'
    });

    if (result.isConfirmed) {
      setShowModal(false);
      setCurrentExam(null);
      setAnswers({});
    }
  };

  if (loading) {
    return <div>Cargando exámenes...</div>;
  }

  return (
    <div className="student-exams-container">
      <h1>Mis Exámenes</h1>
      {exams.length === 0 ? (
        <p>No tienes exámenes asignados</p>
      ) : (
        <div className="exams-list">
          {exams.map((exam) => (
            <div key={exam._id} className="exam-card">
              <h3>Examen de {exam.subject?.name}</h3>
              <p>Estado: {exam.status === 'completed' ? 'Completado' : 'Pendiente'}</p>
              {exam.status !== 'completed' && (
                <button 
                  className="start-exam-button"
                  onClick={() => handleStartExam(exam._id)}
                >
                  Comenzar Examen
                </button>
              )}
              {exam.status === 'completed' && (
                <p className="exam-score">Calificación: {exam.calification}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="exam-modal-overlay">
          <div className="exam-modal">
            <div className="exam-modal-header">
              <h2>Examen en Curso</h2>
              <button 
                className="close-button"
                onClick={handleCloseExam}
              >
                ×
              </button>
            </div>
            <div className="exam-modal-content">
              {examQuestions.map((question, index) => (
                <div key={question._id} className="question-container">
                  <p className="question-number">Pregunta {index + 1}</p>
                  <p className="question-text">{question.question}</p>
                  <textarea
                    value={answers[question._id] || ''}
                    onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                    placeholder="Escribe tu respuesta aquí..."
                    className="answer-input"
                  />
                </div>
              ))}
            </div>
            <div className="exam-modal-footer">
              <button 
                className="submit-exam-button"
                onClick={handleSubmitExam}
                disabled={Object.keys(answers).length !== examQuestions.length}
              >
                Entregar Examen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentExams;