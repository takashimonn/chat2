import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import '../styles/StudentExams.css';

const StudentExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentExam, setCurrentExam] = useState(null);
  const [examQuestions, setExamQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

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
      console.log('Iniciando examen:', examId);
      const response = await axiosInstance.get(`/exams/${examId}/questions`);
      console.log('Preguntas obtenidas:', response.data);
      setExamQuestions(response.data);
      setCurrentExam(examId);
      setShowModal(true);
    } catch (error) {
      console.error('Error al cargar preguntas:', error);
      console.error('Detalles del error:', error.response?.data);
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
      await axiosInstance.post(`/exams/${currentExam}/submit`, { answers });
      setShowModal(false);
      setCurrentExam(null);
      setAnswers({});
      const studentId = localStorage.getItem('userId');
      const response = await axiosInstance.get(`/exams/student/${studentId}`);
      setExams(response.data);
    } catch (error) {
      console.error('Error al enviar examen:', error);
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
              <p>Estado: {exam.submitted ? 'Completado' : 'Pendiente'}</p>
              {!exam.submitted && (
                <button 
                  className="start-exam-button"
                  onClick={() => handleStartExam(exam._id)}
                >
                  Comenzar Examen
                </button>
              )}
              {exam.submitted && exam.score && (
                <p className="exam-score">Calificación: {exam.score}</p>
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
                onClick={() => {
                  if(window.confirm('¿Estás seguro de salir? Se perderán tus respuestas.')) {
                    setShowModal(false);
                    setCurrentExam(null);
                    setAnswers({});
                  }
                }}
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