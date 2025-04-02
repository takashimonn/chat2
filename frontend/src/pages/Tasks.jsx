import React, { useState, useEffect } from 'react';
import '../styles/Tasks.css';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:4000'
});

// Interceptor para agregar el token a todas las peticiones
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.clear();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

const TeacherView = ({ initialTasks = [] }) => {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    subject: ''
  });
  const [newSubject, setNewSubject] = useState({
    name: '',
    description: ''
  });

  const fetchSubmissions = async (taskId) => {
    try {
      const response = await axiosInstance.get(`/api/submissions/task/${taskId}`);
      const data = response.data;
      console.log('Submissions actualizados para tarea', taskId, ':', data);
      setSubmissions(prev => ({
        ...prev,
        [taskId]: data
      }));
    } catch (error) {
      console.error('Error al obtener entregas:', error);
    }
  };

  useEffect(() => {
    if (Array.isArray(tasks)) {
      tasks.forEach(task => fetchSubmissions(task._id));
    }
  }, [tasks]);

  const handleGradeSubmission = async (submissionId, grade, feedback) => {
    try {
      const response = await axiosInstance.post(`/api/submissions/${submissionId}/grade`, {
        grade,
        feedback
      });

      if (response.data) {
        // Actualizar las entregas después de calificar
        await Promise.all(tasks.map(task => fetchSubmissions(task._id)));
        await fetchTasks();

        await Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Calificación guardada correctamente',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar la calificación'
      });
    }
  };

  const handleViewSubmissions = async (task, taskSubmissions) => {
    const submissionsHtml = taskSubmissions.length > 0 
      ? taskSubmissions.map(submission => `
          <div class="submission-card">
            <div class="submission-header">
              <div class="student-info">
                <i class="fas fa-user"></i>
                <span>${submission.student?.username}</span>
              </div>
              <div class="submission-status">
                ${submission.grade 
                  ? `<span class="grade-badge">${submission.grade}/100</span>`
                  : '<span class="pending-badge">Sin calificar</span>'
                }
              </div>
            </div>
            <div class="submission-actions">
              <button 
                onclick="window.handleViewDetails('${submission._id}')"
                class="details-button"
              >
                <i class="fas fa-info-circle"></i> Ver detalles
              </button>
              ${!submission.grade ? `
                <button 
                  onclick="window.handleGradeSubmission('${submission._id}')"
                  class="grade-button"
                >
                  <i class="fas fa-check-circle"></i> Calificar
                </button>
              ` : ''}
            </div>
          </div>
        `).join('')
      : '<p class="no-submissions">No hay entregas para esta tarea</p>';

    // Función para ver detalles de una entrega
    window.handleViewDetails = async (submissionId) => {
      const submission = taskSubmissions.find(s => s._id === submissionId);
      if (!submission) return;

      // Definir la función de actualización antes de mostrar el modal
      const handleUpdateGrade = async () => {
        const gradeInput = document.getElementById('grade');
        const feedbackInput = document.getElementById('feedback');
        
        if (!gradeInput.value) {
          Swal.showValidationMessage('Por favor ingrese una calificación');
          return;
        }

        await handleGradeSubmission(submissionId, gradeInput.value, feedbackInput.value);
        // Cerrar el modal actual después de calificar
        Swal.close();
      };

      await Swal.fire({
        title: 'Detalles de la Entrega',
        html: `
          <div class="submission-detail-container">
            <div class="submission-info">
              <div class="student-header">
                <div class="student-name">
                <div class="student-avatar">
                  <i class="fas fa-user-graduate"></i>
                </div>
                  <h3>${submission.student?.username}</h3>
                  <span class="submission-date">
                    <i class="fas fa-clock"></i>
                    ${new Date(submission.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div class="submission-content">
                <div class="detail-section">
                  <h4>Información de la Entrega</h4>
                  <div class="detail-grid">
                    <div class="detail-item">
                      <span class="label">Estado</span>
                      <span class="value ${submission.grade ? 'status-graded' : 'status-pending'}">
                        ${submission.grade ? 'Calificado' : 'Sin calificar'}
                      </span>
                    </div>
                    <div class="detail-item">
                      <span class="label">Archivo</span>
                      <a href="http://localhost:4000${submission.fileUrl}" target="_blank" class="file-link">
                        <i class="fas fa-eye"></i> Ver entrega
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="grading-section">
              <h4>Calificación</h4>
              <div class="grade-input-group">
                <label for="grade">Calificación (0-100)</label>
                <input 
                  type="number" 
                  id="grade" 
                  class="grade-input" 
                  min="0" 
                  max="100" 
                  value="${submission.grade || ''}"
                  placeholder="Ingrese calificación"
                />
              </div>
              
              <div class="feedback-input-group">
                <label for="feedback">Retroalimentación</label>
                <textarea 
                  id="feedback" 
                  class="feedback-input"
                  placeholder="Escriba su retroalimentación aquí..."
                >${submission.feedback || ''}</textarea>
              </div>

              <div class="grading-actions">
                <button 
                  id="updateGradeButton"
                  class="grade-update-button"
                >
                  ${submission.grade ? 'Actualizar Calificación' : 'Calificar Entrega'}
                </button>
              </div>

              ${submission.grade ? `
                <div class="current-grade-info">
                  <div class="current-grade-header">
                    <span class="grade-label">Calificación Actual</span>
                    <span class="grade-value">${submission.grade}/100</span>
                  </div>
                  <div class="current-feedback">
                    <span class="feedback-label">Retroalimentación Actual</span>
                    <p class="feedback-value">${submission.feedback || 'Sin retroalimentación'}</p>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        `,
        showCloseButton: true,
        showConfirmButton: false,
        width: '800px',
        customClass: {
          container: 'submission-details-modal',
          popup: 'submission-details-popup',
          closeButton: 'modal-close-button'
        },
        didOpen: () => {
          // Agregar el event listener al botón después de que el modal se abra
          document.getElementById('updateGradeButton').addEventListener('click', handleUpdateGrade);
        }
      });
    };

    // Función para calificar una entrega
    window.handleGradeSubmission = async (submissionId) => {
      const submission = taskSubmissions.find(s => s._id === submissionId);
      if (!submission) return;

      const { value: formValues } = await Swal.fire({
        title: 'Calificar Entrega',
        html: `
          <div class="grade-form">
            <div class="form-group">
              <label for="grade">Calificación (0-100)</label>
              <input 
                type="number" 
                id="grade" 
                min="0" 
                max="100" 
                placeholder="Ingrese la calificación"
                required
              >
            </div>
            <div class="form-group">
              <label for="feedback">Retroalimentación</label>
              <textarea 
                id="feedback" 
                placeholder="Escriba su retroalimentación aquí..."
              ></textarea>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Calificar',
        cancelButtonText: 'Cancelar',
        customClass: {
          popup: 'swal2-modal',
          confirmButton: 'swal2-confirm',
          cancelButton: 'swal2-cancel'
        },
        preConfirm: () => {
          const grade = document.getElementById('grade').value;
          const feedback = document.getElementById('feedback').value;
          if (!grade) {
            Swal.showValidationMessage('Por favor ingresa una calificación');
            return false;
          }
          return { grade, feedback };
        }
      });

      if (formValues) {
        await handleGradeSubmission(submissionId, formValues.grade, formValues.feedback);
        // Actualizar la vista de entregas
        handleViewSubmissions(task, await (await axiosInstance.get(`/api/submissions/task/${task._id}`)).data);
      }
    };

    await Swal.fire({
      title: `Entregas para: ${task.title}`,
      html: `
        <div class="submissions-container">
          <div class="task-summary">
            <div class="summary-item">
              <i class="fas fa-book"></i>
              <span>${task.subject?.name}</span>
            </div>
            <div class="summary-item">
              <i class="fas fa-calendar"></i>
              <span>${new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
            <div class="summary-item">
              <i class="fas fa-users"></i>
              <span>${taskSubmissions.length} entrega(s)</span>
            </div>
          </div>
          <div class="submissions-list">
            ${submissionsHtml}
          </div>
        </div>
      `,
      width: '800px',
      showCloseButton: true,
      showConfirmButton: false,
      customClass: {
        container: 'submissions-modal',
        popup: 'submissions-popup'
      }
    });
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', newTask.title);
      formData.append('description', newTask.description);
      formData.append('dueDate', newTask.dueDate);
      formData.append('subject', newTask.subject);
      
      // Agregar el archivo si existe
      const fileInput = document.getElementById('taskFile');
      if (fileInput && fileInput.files[0]) {
        formData.append('file', fileInput.files[0]);
      } else {
        throw new Error('Por favor selecciona un archivo para la tarea');
      }

      const response = await axiosInstance.post('/api/tasks', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Cerrar el modal y limpiar el formulario antes de actualizar las tareas
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', dueDate: '', subject: '' });
      
      // Actualizar las tareas con la nueva tarea
      await fetchTasks();

      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Tarea creada correctamente'
      });
    } catch (error) {
      console.error('Error al crear la tarea:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al crear la tarea'
      });
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/api/subjects', newSubject);
      setSubjects(prev => [...prev, response.data]);
      setShowSubjectModal(false);
      setNewSubject({ name: '', description: '' });
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Materia creada correctamente'
      });
      fetchSubjects();
    } catch (error) {
      console.error('Error al crear la materia:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al crear la materia'
      });
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axiosInstance.get('/api/tasks/teacher');
      const data = response.data;
      
      // Eliminar duplicados basados en _id
      const uniqueTasks = Array.from(new Map(data.map(task => [task._id, task])).values());
      setTasks(uniqueTasks);
      
      // Obtener las entregas para cada tarea
      await Promise.all(uniqueTasks.map(task => fetchSubmissions(task._id)));
    } catch (error) {
      console.error('Error al obtener tareas:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar las tareas'
      });
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token usado en fetchSubjects:', token);

      const response = await axios.get('http://localhost:4000/api/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Respuesta de materias:', response.data);
      setSubjects(response.data);
    } catch (error) {
      console.error('Error completo en fetchSubjects:', error.response || error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar las materias'
      });
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await fetchSubjects();
      // Eliminar duplicados de las tareas iniciales
      const uniqueInitialTasks = Array.from(new Map(initialTasks.map(task => [task._id, task])).values());
      setTasks(uniqueInitialTasks);
      // Solo cargar las entregas si hay tareas iniciales
      if (uniqueInitialTasks.length > 0) {
        await Promise.all(uniqueInitialTasks.map(task => fetchSubmissions(task._id)));
      }
      setIsLoading(false);
    };
    
    initializeData();
  }, [initialTasks]);

  const handleViewSubmission = (task, submission) => {
    const baseUrl = 'http://localhost:4000'; // URL base del backend
    const fileUrl = submission.fileUrl ? `${baseUrl}${submission.fileUrl}` : null;
    
    console.log('URL del archivo:', fileUrl); // Para debugging

    Swal.fire({
      title: 'Detalles de la Entrega',
      html: `
        <div class="submission-details">
          <div class="detail-row"><strong>Tarea:</strong> <span>${task.title}</span></div>
          <div class="detail-row"><strong>Estudiante:</strong> <span>${submission.student?.username || 'No disponible'}</span></div>
          <div class="detail-row"><strong>Estado:</strong> <span>${submission.status || 'Pendiente'}</span></div>
          <div class="detail-row"><strong>Fecha de entrega:</strong> <span>${new Date(submission.createdAt).toLocaleString()}</span></div>
          <div class="detail-row"><strong>Calificación:</strong> <span>${submission.grade ? `${submission.grade}/100` : 'Sin calificar'}</span></div>
          <div class="detail-row"><strong>Retroalimentación:</strong> <span>${submission.feedback || 'Sin retroalimentación'}</span></div>
          ${fileUrl ? `
            <div class="detail-row">
              <strong>Archivo:</strong> 
              <span>
                <a href="${fileUrl}" 
                   target="_blank" 
                   class="file-link"
                   onclick="window.open('${fileUrl}', '_blank'); return false;">
                  Descargar entrega
                </a>
              </span>
            </div>` : ''
          }
        </div>
      `,
      width: '600px',
      confirmButtonText: 'Cerrar',
      customClass: {
        container: 'submission-modal'
      }
    });
  };

  const handleGradeTask = (task, student) => {
    // Primero encontramos la entrega correspondiente
    const submission = submissions[task._id]?.find(sub => 
      sub.student?._id === student._id
    );

    if (!submission) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se encontró la entrega para este estudiante'
      });
      return;
    }

    Swal.fire({
      title: 'Calificar Tarea',
      html: `
        <div class="grade-form">
          <p><strong>Tarea:</strong> ${task.title}</p>
          <p><strong>Estudiante:</strong> ${student.username}</p>
          <div class="form-group">
            <label>Calificación (0-100):</label>
            <input 
              type="number" 
              id="grade" 
              min="0" 
              max="100" 
              class="swal2-input" 
              value="${submission.grade || ''}"
              placeholder="Ingrese la calificación"
            >
          </div>
          <div class="form-group">
            <label>Retroalimentación:</label>
            <textarea 
              id="feedback" 
              class="swal2-textarea" 
              placeholder="Ingrese la retroalimentación"
            >${submission.feedback || ''}</textarea>
          </div>
          ${submission.grade ? 
            `<div class="current-grade">
              <p><strong>Calificación actual:</strong> ${submission.grade}/100</p>
              <p><strong>Retroalimentación actual:</strong> ${submission.feedback || 'Sin retroalimentación'}</p>
            </div>` 
            : ''
          }
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const grade = document.getElementById('grade').value;
        const feedback = document.getElementById('feedback').value;
        if (!grade) {
          Swal.showValidationMessage('Por favor ingresa una calificación');
          return false;
        }
        return { grade, feedback };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        handleSubmitGrade(submission._id, result.value.grade, result.value.feedback);
      }
    });
  };

  const handleSubmitGrade = async (submissionId, grade, feedback) => {
    try {
      const response = await axiosInstance.post(`/api/submissions/${submissionId}/grade`, {
        grade,
        feedback
      });

      if (response.data) {
        // Actualizar solo las entregas de la tarea específica
        const taskId = response.data.task;
        await fetchSubmissions(taskId);
        
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Calificación guardada correctamente'
        });
      }
    } catch (error) {
      console.error('Error al calificar:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'No se pudo guardar la calificación'
      });
    }
  };

  const renderTaskTable = () => {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return (
        <div className="no-tasks-message">
          <p>No hay tareas disponibles</p>
        </div>
      );
    }

    // Filtrar las tareas según el estado seleccionado
    const filteredTasks = tasks.filter(task => {
      const taskSubmissions = submissions[task._id] || [];
      switch (filterStatus) {
        case 'pending':
          return taskSubmissions.length === 0;
        case 'submitted':
          return taskSubmissions.length > 0;
        default: // 'all'
          return true;
      }
    });

    const handleViewFile = (fileUrl) => {
      if (fileUrl) {
        const fullUrl = `http://localhost:4000${fileUrl}`;
        window.open(fullUrl, '_blank');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No hay archivo disponible para esta tarea'
        });
      }
    };

    if (filteredTasks.length === 0) {
      return (
        <div className="no-tasks-message">
          <p>No hay tareas que coincidan con el filtro seleccionado</p>
        </div>
      );
    }

    return (
      <table className="tasks-table">
        <thead>
          <tr>
            <th>Título de la Tarea</th>
            <th>Materia</th>
            <th>Fecha de Entrega</th>
            <th>Estado</th>
            <th>Entregas</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.map(task => (
            <tr key={task._id}>
              <td>{task.title}</td>
              <td>{task.subject?.name || 'No especificado'}</td>
              <td>{new Date(task.dueDate).toLocaleString()}</td>
              <td>
                {submissions[task._id]?.length > 0 ? 
                  `${submissions[task._id].length} entrega(s)` : 
                  'Sin entregas'}
              </td>
              <td>
                <button
                  className="action-button view-button"
                  onClick={() => handleViewSubmissions(task, submissions[task._id] || [])}
                >
                  <i className="fas fa-eye"></i> Ver Entregas
                </button>
              </td>
              <td>
                <button 
                  onClick={() => handleViewFile(task.fileUrl)}
                  className="action-button view-button"
                >
                  <i className="fas fa-eye"></i> Ver Archivo
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="tasks-container">
      <div className="buttons-container">
        <button 
          className="create-button"
          onClick={() => setShowTaskModal(true)}
        >
          <i className="fas fa-plus"></i> Asignar Nueva Tarea
        </button>
        <button 
          className="create-button"
          onClick={() => setShowSubjectModal(true)}
        >
          <i className="fas fa-book"></i> Crear Nueva Materia
        </button>
      </div>

      {/* Modal para crear tarea */}
      {showTaskModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Crear Nueva Tarea</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Título:</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción:</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Fecha de entrega:</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Materia:</label>
                <select
                  value={newTask.subject}
                  onChange={(e) => setNewTask({...newTask, subject: e.target.value})}
                  required
                >
                  <option value="">Selecciona una materia</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Archivo de la tarea:</label>
                <input
                  type="file"
                  id="taskFile"
                  required
                  className="file-input"
                />
              </div>
              <div className="modal-buttons">
                <button type="submit">Crear</button>
                <button type="button" onClick={() => setShowTaskModal(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para crear materia */}
      {showSubjectModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Crear Nueva Materia</h2>
            <form onSubmit={handleCreateSubject}>
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción:</label>
                <textarea
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({...newSubject, description: e.target.value})}
                  required
                />
              </div>
              <div className="modal-buttons">
                <button type="submit">Crear</button>
                <button type="button" onClick={() => setShowSubjectModal(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="filter-container">
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="status-filter"
        >
          <option value="all">Todas las tareas</option>
          <option value="pending">Sin entregas</option>
          <option value="submitted">Con entregas</option>
        </select>
      </div>

      <div className="tasks-table-container">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          renderTaskTable()
        )}
      </div>
    </div>
  );
};

const StudentView = ({ tasks }) => {
  const [selectedFiles, setSelectedFiles] = useState({});
  const userId = localStorage.getItem('userId');

  // Verificar si el estudiante ya entregó una tarea específica
  const checkIfSubmitted = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/submissions/student/task/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      return data.submitted;
    } catch (error) {
      console.error('Error al verificar entrega:', error);
      return false;
    }
  };

  const handleFileSelect = (taskId, file) => {
    setSelectedFiles(prev => ({
      ...prev,
      [taskId]: file
    }));
  };

  const handleSubmitTask = async (taskId) => {
    try {
      const selectedFile = selectedFiles[taskId];
      if (!selectedFile) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Por favor selecciona un archivo'
        });
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`http://localhost:4000/api/submissions/task/${taskId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al entregar la tarea');
      }

      await Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Tarea entregada correctamente',
        timer: 1500,
        showConfirmButton: false
      });

      // Limpiar el archivo seleccionado para esta tarea
      setSelectedFiles(prev => ({
        ...prev,
        [taskId]: null
      }));
      
      // Recargar las entregas del estudiante
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo entregar la tarea'
      });
    }
  };

  return (
    <div className="tasks-table-container">
      <table className="tasks-table">
        <thead>
          <tr>
            <th>Estado</th>
            <th>Título</th>
            <th>Materia</th>
            <th>Fecha de entrega</th>
            <th>Entrega</th>
            <th>Calificación</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task._id}>
              <td>
                <div className="status-indicator">
                  <span className={`status-dot status-${task.submitted ? 'completed' : 'pending'}`}></span>
                  {task.submitted ? 'Entregada' : 'Pendiente'}
                </div>
              </td>
              <td>{task.title}</td>
              <td>{task.subject?.name}</td>
              <td>{new Date(task.dueDate).toLocaleString()}</td>
              <td>
                {!task.submitted ? (
                  <div className="submit-task-container">
                    <input
                      type="file"
                      id={`file-${task._id}`}
                      onChange={(e) => handleFileSelect(task._id, e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                    <label 
                      htmlFor={`file-${task._id}`} 
                      className="file-upload-button"
                    >
                      <i className="fas fa-upload"></i> Seleccionar archivo
                    </label>
                    <button
                      className="submit-task-button"
                      onClick={() => handleSubmitTask(task._id)}
                      disabled={!selectedFiles[task._id]}
                    >
                      Entregar
                    </button>
                  </div>
                ) : (
                  <span className="task-submitted">
                    <i className="fas fa-check"></i> Entregada
                  </span>
                )}
              </td>
              <td>
                {task.submission?.grade ? `${task.submission.grade}/100` : 'Sin calificar'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUserRole = localStorage.getItem('userRole');

    if (!token) {
      navigate('/login');
      return;
    }

    setUserRole(storedUserRole || '');
    
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const endpoint = storedUserRole === 'maestro' 
          ? '/api/tasks/teacher' 
          : '/api/tasks/student';
        
        console.log('Realizando petición con:', {
          endpoint,
          token: token.substring(0, 20) + '...',
          role: storedUserRole
        });

        const response = await fetch(`http://localhost:4000${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 401) {
          // Token inválido o expirado
          localStorage.clear();
          navigate('/login');
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al cargar tareas');
        }

        const data = await response.json();
        setTasks(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error completo:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="tasks-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="tasks-container">
      {userRole === 'maestro' ? (
        <TeacherView initialTasks={tasks} />
      ) : (
        <StudentView tasks={tasks} />
      )}
    </div>
  );
};

export default Tasks;



