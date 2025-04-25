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
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [newQuestion, setNewQuestion] = useState({
    subject: '',
    questionText: '',
    correctAnswer: '',
    score: 10
  });

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

  // Función para manejar la creación de preguntas
  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    
    // Para debug
    console.log('Estado actual de newQuestion:', newQuestion);
    
    const questionData = {
      subject: newQuestion.subject, // Esto ya debería ser el ID
      question: newQuestion.questionText,
      correctAnswer: newQuestion.correctAnswer,
      score: parseInt(newQuestion.score) || 10
    };

    console.log('Datos a enviar al backend:', questionData);

    try {
      const response = await axiosInstance.post('/questions/create', questionData);
      console.log('Respuesta:', response.data);

      // Limpiar el formulario y cerrar modal
      setShowQuestionModal(false);
      setNewQuestion({
        subject: '',
        questionText: '',
        correctAnswer: '',
        score: 10
      });

      alert('Pregunta creada exitosamente');
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Datos del error:', error.response?.data);
      alert('Error al crear la pregunta. Por favor verifica todos los campos.');
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
            <h2>Crear Nueva Pregunta</h2>
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
                  onChange={(e) => setNewQuestion({
                    ...newQuestion,
                    score: Number(e.target.value)
                  })}
                  required
                  min="1"
                />
              </div>

              <div className="modal-buttons">
                <button type="submit">Guardar Pregunta</button>
                <button 
                  type="button" 
                  onClick={() => setShowQuestionModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
`;

// Agregamos los estilos al documento
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default Exams; 