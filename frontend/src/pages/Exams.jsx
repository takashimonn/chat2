import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';

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

  // Obtener las materias del profesor
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axiosInstance.get('/subjects/teacher');
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

  const handleCreateExam = async () => {
    try {
      console.log('Creando examen para:', {
        studentId: selectedStudent,
        subjectId: selectedSubject
      });

      const response = await axiosInstance.post('/exams/create', {
        studentId: selectedStudent,
        subjectId: selectedSubject
      });

      console.log('Examen creado:', response.data);
      setCurrentExam(response.data);
    } catch (error) {
      console.error('Error al crear examen:', error);
    }
  };

  const handleAssignQuestions = async () => {
    try {
      if (!selectedQuestions.length) {
        console.log('No hay preguntas seleccionadas');
        return;
      }

      console.log('Enviando preguntas:', selectedQuestions);
      
      await axiosInstance.post('/exams/assign-questions', {
        examId: currentExam._id,
        questionIds: selectedQuestions
      });

      // Solo limpiar las preguntas seleccionadas, pero mantener el currentExam
      setSelectedQuestions([]);
      
      // Opcional: Mostrar algún mensaje de éxito
      console.log('Preguntas asignadas correctamente');
    } catch (error) {
      console.error('Error al asignar preguntas:', error);
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
                </tr>
              ))}
            </tbody>
          </table>
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
            <button onClick={handleCreateExam}>Crear Examen</button>
          )}
        </div>
      )}

      {renderQuestionSelection()}

      {/* Agregamos la tabla de exámenes entregados */}
      <TeacherExamList />
    </div>
  );
};

// Agregamos los estilos necesarios
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
`;

// Agregamos los estilos al documento
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default Exams; 