import React, { useState, useEffect } from 'react';
import '../styles/Tasks.css';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:4000',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

const TeacherView = () => {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
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
      const response = await fetch(`http://localhost:4000/api/submissions/task/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
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
      const response = await fetch(`http://localhost:4000/api/submissions/${submissionId}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ grade, feedback })
      });

      if (!response.ok) throw new Error('Error al calificar la entrega');

      // Actualizar las entregas después de calificar
      tasks.forEach(task => fetchSubmissions(task._id));

      await Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Calificación guardada correctamente',
        timer: 1500,
        showConfirmButton: false
      });
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
          <div class="submission-item">
            <h3>Entrega de ${submission.student?.username}</h3>
            <p><strong>Fecha de entrega:</strong> ${new Date(submission.createdAt).toLocaleString()}</p>
            <p><strong>Archivo:</strong> <a href="${submission.fileUrl}" target="_blank">Ver entrega</a></p>
            ${submission.grade 
              ? `
                <div class="grade-info">
                  <p><strong>Calificación:</strong> ${submission.grade}/100</p>
                  <p><strong>Retroalimentación:</strong> ${submission.feedback || 'Sin retroalimentación'}</p>
                </div>
              ` 
              : `
                <div class="grade-form">
                  <input type="number" id="grade-${submission._id}" placeholder="Calificación (0-100)" min="0" max="100" class="grade-input"/>
                  <textarea id="feedback-${submission._id}" placeholder="Retroalimentación" class="feedback-input"></textarea>
                  <button onclick="window.handleGradeSubmission('${submission._id}')" class="grade-button">
                    Calificar
                  </button>
                </div>
              `
            }
          </div>
        `).join('')
      : '<p>No hay entregas para esta tarea</p>';

    // Agregar la función de calificación al objeto window
    window.handleGradeSubmission = async (submissionId) => {
      const gradeInput = document.getElementById(`grade-${submissionId}`);
      const feedbackInput = document.getElementById(`feedback-${submissionId}`);
      
      const grade = gradeInput.value;
      const feedback = feedbackInput.value;

      if (!grade) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Por favor ingresa una calificación'
        });
        return;
      }

      await handleGradeSubmission(submissionId, grade, feedback);
      Swal.close(); // Cerrar el modal actual
    };

    await Swal.fire({
      title: `Entregas para: ${task.title}`,
      html: `
        <div class="submissions-container">
          <div class="task-info">
            <p><strong>Materia:</strong> ${task.subject?.name}</p>
            <p><strong>Fecha límite:</strong> ${new Date(task.dueDate).toLocaleString()}</p>
            <p><strong>Total de entregas:</strong> ${taskSubmissions.length}</p>
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
        container: 'submissions-modal'
      }
    });
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/api/tasks', newTask);
      setTasks(prev => [...prev, response.data]);
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', dueDate: '', subject: '' });
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Tarea creada correctamente'
      });
      fetchTasks();
    } catch (error) {
      console.error('Error al crear la tarea:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al crear la tarea'
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
      setTasks(response.data);
    } catch (error) {
      console.error('Error al obtener las tareas:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar las tareas'
      });
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axiosInstance.get('/api/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error al obtener las materias:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar las materias'
      });
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchSubjects();
  }, []);

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
          <option value="pending">Pendientes</option>
          <option value="submitted">Entregadas</option>
          <option value="graded">Calificadas</option>
        </select>
      </div>

      <div className="tasks-table-container">
        <table className="tasks-table">
          <thead>
            <tr>
              <th>Estado</th>
              <th>Título</th>
              <th>Materia</th>
              <th>Estudiantes que entregaron</th>
              <th>Fecha límite</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => {
              const taskSubmissions = submissions[task._id] || [];
              return (
                <tr key={task._id}>
                  <td>
                    <div className="status-indicator">
                      <span className={`status-dot status-${taskSubmissions.length > 0 ? 'submitted' : 'pending'}`}></span>
                      {taskSubmissions.length > 0 ? `${taskSubmissions.length} entregas` : 'Sin entregas'}
                    </div>
                  </td>
                  <td>{task.title}</td>
                  <td>{task.subject?.name}</td>
                  <td>
                    {taskSubmissions.map(sub => sub.student?.username).join(', ') || 'Ninguno'}
                  </td>
                  <td>{new Date(task.dueDate).toLocaleString()}</td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className="action-button"
                        onClick={() => handleViewSubmissions(task, taskSubmissions)}
                        title="Ver entregas"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StudentView = ({ tasks }) => {
  const [selectedFile, setSelectedFile] = useState(null);
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

  const handleSubmitTask = async (taskId) => {
    try {
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

      setSelectedFile(null);
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
                      onChange={(e) => setSelectedFile(e.target.files[0])}
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
                      disabled={!selectedFile}
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
                {task.grade ? `${task.grade}/100` : 'Sin calificar'}
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
      }
    };

    fetchTasks();
  }, [navigate]);

  return (
    <div className="tasks-container">
      {userRole === 'maestro' ? (
        <TeacherView />
      ) : (
        <StudentView tasks={tasks} />
      )}
    </div>
  );
};

export default Tasks;

