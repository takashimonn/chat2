import React, { useEffect, useState } from 'react';
import '../styles/Alumnos.css';
import Modal from '../components/ModalAlumno';
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
  '#FF6F61', // rojo
  '#6B5B95', // morado
  '#88B04B', // verde
  '#F7CAC9', // rosa
  '#92A8D1', // azul
  '#955251', // marrón
  '#B565A7', // violeta
  '#009B77', // verde fuerte
  '#DD4124', // naranja
];

const getRandomColors = (n) => {
  const shuffled = colores.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
};

const Alumnos = () => {
  const [userType, setUserType] = useState('');
  const [cardColors, setCardColors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showModalMaterias, setShowModalMaterias] = useState(false);
  const [showModalAsignacion, setShowModalAsignacion] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [newSubject, setNewSubject] = useState({
    name: '',
    description: ''
  });
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState({
    student: '',
    subject: ''
  });

  useEffect(() => {
    // Simulación: obtener el tipo de usuario desde localStorage o API
    const tipo = localStorage.getItem('role') || 'maestro';
    setUserType(tipo);
    setCardColors(getRandomColors(3));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, subjectsRes] = await Promise.all([
          axiosInstance.get('/api/users/students'),
          axiosInstance.get('/api/subjects')
        ]);
        setStudents(studentsRes.data);
        setSubjects(subjectsRes.data);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };

    if (showModalAsignacion) {
      fetchData();
    }
  }, [showModalAsignacion]);

  const handleCardClick = (idx) => {
    if (idx === 0) {
      setShowModal(true);
    } else if (idx === 1) {
      setShowModalMaterias(true);
    } else if (idx === 2) {
      setShowModalAsignacion(true);
    }
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
      const response = await axiosInstance.post('/api/subjects', newSubject);
      setNewSubject({ name: '', description: '' });
      setShowModalMaterias(false);
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Materia creada correctamente'
      });
    } catch (error) {
      console.error('Error al crear la materia:', error);
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
    try {
      await axiosInstance.post('/api/student-subjects', selectedAssignment);
      setShowModalAsignacion(false);
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Materia asignada correctamente'
      });
    } catch (error) {
      console.error('Error al asignar materia:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al asignar la materia'
      });
    }
  };

  if (userType !== 'maestro') {
    return <div className="alumnos-container"><h2>No tienes acceso a esta sección.</h2></div>;
  }

  return (
    <div className="alumnos-container">
      <h1>Alumnos</h1>
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
                  <label className='modal-input'>Nombre:</label>
                  <input className='modal-input'
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
                    onChange={(e) => setSelectedAssignment({
                      ...selectedAssignment,
                      student: e.target.value
                    })}
                    required
                  >
                    <option value="">Selecciona un alumno</option>
                    {students.map(student => (
                      <option key={student._id} value={student._id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Materia:</label>
                  <select
                    value={selectedAssignment.subject}
                    onChange={(e) => setSelectedAssignment({
                      ...selectedAssignment,
                      subject: e.target.value
                    })}
                    required
                  >
                    <option value="">Selecciona una materia</option>
                    {subjects.map(subject => (
                      <option key={subject._id} value={subject._id}>
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
  );
};

export default Alumnos; 