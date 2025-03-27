import React, { useState, useEffect } from 'react';
import '../styles/Tasks.css';
import Swal from 'sweetalert2';

const Tasks = () => {
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    file: null,
    subject: '65f7c3d8e71c1234567890'
  });

  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
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
        text: 'La tarea se ha subido correctamente',
        timer: 1500,
        showConfirmButton: false
      });

      setTaskForm({
        title: '',
        description: '',
        dueDate: '',
        file: null,
        subject: taskForm.subject
      });

      const fileInput = document.getElementById('file');
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (error) {
      console.error('Error al subir la tarea:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo subir la tarea. Por favor, intenta de nuevo.'
      });
    }
  };

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <h1>Tareas</h1>
      </div>
      
      <div className="task-form-container">
        <h2>Subir Nueva Tarea</h2>
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

          <button type="submit" className="submit-button">
            <i className="fas fa-upload"></i>
            Subir Tarea
          </button>
        </form>
      </div>
    </div>
  );
};

export default Tasks;

