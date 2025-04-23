import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import '../styles/StudentExams.css';

const StudentExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

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
                <button className="start-exam-button">
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
    </div>
  );
};

export default StudentExams;