import React, { useState, useEffect } from 'react';
import '../styles/Tasks.css';
import Swal from 'sweetalert2';

const Tasks = () => {
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    file: null,
    subject: ''
  });
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    description: ''
  });

  // Mover fetchSubjects fuera del useEffect
  const fetchSubjects = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/subjects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setSubjects(data);
    } catch (error) {
      console.error('Error al cargar materias:', error);
    }
  };

  useEffect(() => {
    // Obtener el rol directamente del localStorage
    const userRole = localStorage.getItem('userRole');
    console.log('Role del usuario:', userRole);
    setUserRole(userRole || '');

    // Llamar a fetchSubjects
    fetchSubjects();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaskForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setTaskForm(prev => ({
      ...prev,
      file: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const formData = new FormData();
      formData.append('title', taskForm.title);
      formData.append('description', taskForm.description);
      formData.append('dueDate', taskForm.dueDate);
      formData.append('file', taskForm.file);
      formData.append('subject', taskForm.subject);

      const response = await fetch('http://localhost:4000/api/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir la tarea');
      }

      const data = await response.json();
      console.log('Tarea creada:', data);

      await Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'La tarea se ha creado correctamente',
        timer: 1500,
        showConfirmButton: false
      });

      setTaskForm({
        title: '',
        description: '',
        dueDate: '',
        file: null,
        subject: ''
      });

      setShowModal(false); // Cerrar el modal después de crear la tarea

      const fileInput = document.getElementById('file');
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (error) {
      console.error('Error al crear la tarea:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo crear la tarea. Por favor, intenta de nuevo.'
      });
    }
  };

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch('http://localhost:4000/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subjectForm)
      });

      // Primero obtenemos el texto de la respuesta
      const responseText = await response.text();
      let data;
      
      try {
        // Intentamos parsearlo como JSON
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Respuesta del servidor:', responseText);
        throw new Error('Error en la respuesta del servidor');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear la materia');
      }
      
      await Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'La materia se ha creado correctamente',
        timer: 1500,
        showConfirmButton: false
      });

      setSubjectForm({ name: '', description: '' });
      setShowSubjectModal(false);
      // Actualizar la lista de materias
      fetchSubjects();

    } catch (error) {
      console.error('Error al crear la materia:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo crear la materia'
      });
    }
  };

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <h1>Tareas</h1>
        {userRole === 'maestro' && (
          <div className="button-group">
            <button 
              className="create-task-button"
              onClick={() => setShowModal(true)}
            >
              <i className="fas fa-plus"></i> Crear Nueva Tarea
            </button>
            <button 
              className="create-subject-button"
              onClick={() => setShowSubjectModal(true)}
            >
              <i className="fas fa-book"></i> Crear Nueva Materia
            </button>
          </div>
        )}
      </div>

      {/* Lista de tareas aquí */}
      
      {/* Modal para crear tarea */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Crear Nueva Tarea</h2>
              <button 
                className="close-modal"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="task-form">
              <div className="form-group">
                <label htmlFor="title">Título de la Tarea</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={taskForm.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Descripción</label>
                <textarea
                  id="description"
                  name="description"
                  value={taskForm.description}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dueDate">Fecha de Entrega</label>
                <input
                  type="datetime-local"
                  id="dueDate"
                  name="dueDate"
                  value={taskForm.dueDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="file">Archivo</label>
                <input
                  type="file"
                  id="file"
                  name="file"
                  onChange={handleFileChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Materia</label>
                <select
                  id="subject"
                  name="subject"
                  value={taskForm.subject}
                  onChange={handleInputChange}
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

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit">
                  Crear Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para crear materia */}
      {showSubjectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Crear Nueva Materia</h2>
              <button 
                className="close-modal"
                onClick={() => setShowSubjectModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubjectSubmit} className="subject-form">
              <div className="form-group">
                <label htmlFor="name">Nombre de la Materia</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Descripción</label>
                <textarea
                  id="description"
                  name="description"
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowSubjectModal(false)}>
                  Cancelar
                </button>
                <button type="submit">
                  Crear Materia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;

