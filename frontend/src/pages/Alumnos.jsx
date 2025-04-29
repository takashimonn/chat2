// Alumnos.jsx
import React, { useEffect, useState } from 'react';
import '../styles/Alumnos.css';
import Modal from '../components/ModalAlumno';
import GraficasCalificaciones from '../components/GraficasCalificaciones';
import axios from 'axios';
import Swal from 'sweetalert2';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:4000',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
});

const colores = [
  '#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9', '#92A8D1',
  '#955251', '#B565A7', '#009B77', '#DD4124',
];

const getRandomColors = (n) => {
  const shuffled = [...colores].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
};

const Alumnos = () => {
  const [userType, setUserType] = useState('');
  const [cardColors, setCardColors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showModalMaterias, setShowModalMaterias] = useState(false);
  const [showModalAsignacion, setShowModalAsignacion] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [newSubject, setNewSubject] = useState({ name: '', description: '' });
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState({ student: '', subject: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mainFilter, setMainFilter] = useState('todos');
  const [showFilterResults, setShowFilterResults] = useState(false);

  useEffect(() => {
    const tipo = localStorage.getItem('role') || 'maestro';
    setUserType(tipo);
    setCardColors(getRandomColors(3));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, subjectsRes] = await Promise.all([
          axiosInstance.get('/api/users/alumnos'),
          axiosInstance.get('/api/subjects/teacher/withId')
        ]);
        setStudents(studentsRes.data);
        setFilteredStudents(studentsRes.data);
        setSubjects(subjectsRes.data);
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar los datos'
        });
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const filterStudents = () => {
      let filtered = [...students];
      
      // Aplicar filtro de búsqueda por texto
      if (searchTerm) {
        filtered = filtered.filter(student =>
          student.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Aplicar filtros principales
      switch (mainFilter) {
        case 'evaluacion_pendiente':
          filtered = filtered.filter(student => 
            !student.calificaciones || student.calificaciones.length === 0
          );
          break;
        case 'mejor_desempeno':
          filtered = filtered
            .filter(student => student.promedio)
            .sort((a, b) => b.promedio - a.promedio)
            .slice(0, 10); // Top 10 estudiantes
          break;
        case 'bajo_desempeno':
          filtered = filtered
            .filter(student => student.promedio)
            .sort((a, b) => a.promedio - b.promedio)
            .slice(0, 10); // 10 estudiantes con menor desempeño
          break;
        default:
          // 'todos' - no aplicar filtro adicional
          break;
      }

      setFilteredStudents(filtered);
    };

    filterStudents();
  }, [searchTerm, mainFilter, students]);

  const handleCardClick = (idx) => {
    if (idx === 0) setShowModal(true);
    else if (idx === 1) setShowModalMaterias(true);
    else if (idx === 2) setShowModalAsignacion(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowModalMaterias(false);
    setShowModalAsignacion(false);
    setFeedback('');
    setNewSubject({ name: '', description: '' });
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/subjects', newSubject);
      setNewSubject({ name: '', description: '' });
      setShowModalMaterias(false);
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Materia creada correctamente'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al crear la materia'
      });
    }
  };

  const handleRegisterAlumno = async (formData) => {
    try {
      setFeedback('');
      const res = await fetch('http://localhost:4000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback('Alumno registrado exitosamente');
        setTimeout(() => setShowModal(false), 1200);
      } else {
        setFeedback(data.message || 'Error al registrar alumno');
      }
    } catch (err) {
      setFeedback('Error de red');
    }
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssignment.student || !selectedAssignment.subject) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos Incompletos',
        text: 'Por favor selecciona un alumno y una materia'
      });
      return;
    }

    try {
      const response = await axiosInstance.post('/api/student-subjects', {
        studentId: selectedAssignment.student,
        subjectId: selectedAssignment.subject
      });

      if (response.status === 201) {
        setShowModalAsignacion(false);
        setSelectedAssignment({ student: '', subject: '' });
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Materia asignada correctamente'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Error al asignar la materia'
      });
    }
  };

  const getFilterTitle = () => {
    switch (mainFilter) {
      case 'evaluacion_pendiente':
        return 'Alumnos con Evaluación Pendiente';
      case 'mejor_desempeno':
        return 'Alumnos con Mejor Desempeño';
      case 'bajo_desempeno':
        return 'Alumnos con Bajo Desempeño';
      default:
        return 'Todos los Alumnos';
    }
  };

  const handleFilterClick = (filter) => {
    setMainFilter(filter);
    setShowFilterResults(true);
  };

  if (userType !== 'maestro') {
    return <div className="alumnos-container"><h2>No tienes acceso a esta sección.</h2></div>;
  }

  return (
    <div className="contenedor-principal">
      <div className="contenedor"></div>
      <div className="alumnos-container">
        <h1>Alumnos</h1>

        <div className="search-filter-container">
          <div className="busqueda-alumnos">
            <input
              type="text"
              placeholder="Buscar alumno por nombre"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearchResults(!!e.target.value);
              }}
            />
          </div>

          <div className="filtros-container">
            <button
              className={`filter-button ${mainFilter === 'todos' ? 'active' : ''}`}
              onClick={() => handleFilterClick('todos')}
            >
              Todos los alumnos
            </button>
            <button
              className={`filter-button ${mainFilter === 'evaluacion_pendiente' ? 'active' : ''}`}
              onClick={() => handleFilterClick('evaluacion_pendiente')}
            >
              Evaluación pendiente
            </button>
            <button
              className={`filter-button ${mainFilter === 'mejor_desempeno' ? 'active' : ''}`}
              onClick={() => handleFilterClick('mejor_desempeno')}
            >
              Mejor desempeño
            </button>
            <button
              className={`filter-button ${mainFilter === 'bajo_desempeno' ? 'active' : ''}`}
              onClick={() => handleFilterClick('bajo_desempeno')}
            >
              Bajo desempeño
            </button>
          </div>
        </div>

        <div className="alumnos-content">
          <div className="alumnos-cards">
            {cardColors.map((color, idx) => (
              <div
                className="alumno-card"
                style={{ background: color }}
                key={idx}
                onClick={() => handleCardClick(idx)}
              >
                <h2>{idx === 0 ? 'Registro de Alumnos' :
                      idx === 1 ? 'Creación de Materias' :
                      'Asignación de Materias'}</h2>
              </div>
            ))}
          </div>

          <div className="alumnos-graficas">
            <GraficasCalificaciones axiosInstance={axiosInstance} />
          </div>
        </div>

        {showSearchResults && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h2>Resultados de búsqueda</h2>
                <button 
                  className="modal-close-btn" 
                  onClick={() => setShowSearchResults(false)}
                >
                  &times;
                </button>
              </div>
              <div className="modal-content">
                {filteredStudents.length > 0 ? (
                  <div className="resultados-busqueda">
                    {filteredStudents.map((student) => (
                      <div key={student.id} className="resultado-alumno">
                        <div className="info-alumno">
                          <h3>{student.username}</h3>
                          <p>{student.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-resultados">No se encontraron alumnos</p>
                )}
              </div>
            </div>
          </div>
        )}

        {showFilterResults && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h2>{getFilterTitle()}</h2>
                <button 
                  className="modal-close-btn" 
                  onClick={() => setShowFilterResults(false)}
                >
                  &times;
                </button>
              </div>
              <div className="modal-content">
                {filteredStudents.length > 0 ? (
                  <div className="resultados-busqueda">
                    {filteredStudents.map((student) => (
                      <div key={student.id} className="resultado-alumno">
                        <div className="info-alumno">
                          <h3>{student.username}</h3>
                          <p>{student.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-resultados">No se encontraron alumnos para este filtro</p>
                )}
              </div>
            </div>
          </div>
        )}

        <Modal
          show={showModal}
          onClose={handleCloseModal}
          onRegister={handleRegisterAlumno}
          feedback={feedback}
        />

        {showModalMaterias && (
          <div className="modal-overlay">
            <div className="modal-container modal-materia">
              <div className="modal-header">
                <h2>Creación de Materias</h2>
                <button className="modal-close-btn" onClick={handleCloseModal}>&times;</button>
              </div>
              <div className="modal-content">
                <form onSubmit={handleCreateSubject}>
                  <div className="form-group">
                    <label>Nombre:</label>
                    <input
                      type="text"
                      value={newSubject.name}
                      onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Descripción:</label>
                    <textarea
                      value={newSubject.description}
                      onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="modal-buttons">
                    <button type="submit">Crear</button>
                    <button type="button" onClick={handleCloseModal}>Cancelar</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showModalAsignacion && (
          <div className="modal-overlay">
            <div className="modal-container modal-asignacion">
              <div className="modal-header">
                <h2>Asignación de Materias</h2>
                <button className="modal-close-btn" onClick={handleCloseModal}>&times;</button>
              </div>
              <div className="modal-content">
                <form onSubmit={handleAssignmentSubmit}>
                  <div className="form-group">
                    <label>Alumno:</label>
                    <select
                      value={selectedAssignment.student}
                      onChange={(e) =>
                        setSelectedAssignment({ ...selectedAssignment, student: e.target.value })
                      }
                      required
                    >
                      <option value="">Selecciona un alumno</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.username}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Materia:</label>
                    <select
                      value={selectedAssignment.subject}
                      onChange={(e) =>
                        setSelectedAssignment({ ...selectedAssignment, subject: e.target.value })
                      }
                      required
                    >
                      <option value="">Selecciona una materia</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="modal-buttons">
                    <button type="submit">Asignar</button>
                    <button type="button" onClick={handleCloseModal}>Cancelar</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alumnos;
