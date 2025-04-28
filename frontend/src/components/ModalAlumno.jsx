import React, { useState, useEffect } from 'react';
import '../styles/ModalAlumno.css';
import Swal from 'sweetalert2';
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:4000',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
});

const ModalAlumno = ({ show, onClose, onRegister, feedback, type = 'alumno' }) => {
  const [form, setForm] = useState({ email: '', username: '', password: '' });
  const [alumnos, setAlumnos] = useState([]); // Lista de alumnos
  const [materias, setMaterias] = useState([]); // Materias del maestro
  const [search, setSearch] = useState('');
  const [selectedMateria, setSelectedMateria] = useState('Todas');
  const [filteredAlumnos, setFilteredAlumnos] = useState([]);
  const [selectedAlumno, setSelectedAlumno] = useState(null);
  const [mainFilter, setMainFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResultados, setShowResultados] = useState(false);

  // Cargar materias del maestro
  useEffect(() => {
    const fetchMaterias = async () => {
      try {
        const res = await axiosInstance.get('/api/subjects/teacher');
        if (res.data) {
          setMaterias([{ id: 'Todas', name: 'Todas' }, ...res.data]);
        }
      } catch (error) {
        console.error('Error al cargar materias:', error);
        Swal.fire({
          title: 'Error',
          text: 'Error al cargar las materias',
          icon: 'error',
          confirmButtonColor: '#e74c3c'
        });
      }
    };

    if (show) {
      fetchMaterias();
    }
  }, [show]);

  // Cargar alumnos desde el backend
  useEffect(() => {
    const fetchAlumnos = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/api/users/alumnos');
        if (res.data) {
          setAlumnos(res.data);
        }
      } catch (error) {
        console.error('Error al cargar alumnos:', error);
        Swal.fire({
          title: 'Error',
          text: 'Error al cargar los alumnos',
          icon: 'error',
          confirmButtonColor: '#e74c3c'
        });
      } finally {
        setLoading(false);
      }
    };

    if (show) {
      fetchAlumnos();
    }
  }, [show]);

  // Opciones principales de filtro
  const mainFilterOptions = [
    'Seleccione un filtro',
    'Aprobados',
    'Reprobados',
    'Sin calificación'
  ];

  // Filtrado en tiempo real
  useEffect(() => {
    let result = [];

    if ((mainFilter && mainFilter !== 'Seleccione un filtro') || search) {
      result = [...alumnos];

      if (search) {
        result = result.filter(a =>
          a.email.toLowerCase().includes(search.toLowerCase()) ||
          a.username.toLowerCase().includes(search.toLowerCase())
        );
      }

      switch(mainFilter) {
        case 'Seleccione un filtro':
          break;
        case 'Aprobados':
          result = result.filter(a => a.promedio !== null && a.promedio >= 60);
          break;
        case 'Reprobados':
          result = result.filter(a => a.promedio !== null && a.promedio < 60);
          break;
        case 'Sin calificación':
          result = result.filter(a => a.promedio === null);
          break;
        default:
          break;
      }
      
      // Mostrar la modal de resultados cuando hay filtros aplicados
      setShowResultados(true);
    } else {
      setShowResultados(false);
    }

    setFilteredAlumnos(result);
  }, [search, alumnos, mainFilter]);

  useEffect(() => {
    if (feedback) {
      if (feedback.includes('exitosamente')) {
        Swal.fire({
          title: '¡Éxito!',
          text: feedback,
          icon: 'success',
          confirmButtonColor: type === 'alumno' ? '#3498db' : 
                            type === 'tarea' ? '#2ecc71' : '#9b59b6',
          timer: 1500
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: feedback,
          icon: 'error',
          confirmButtonColor: '#e74c3c'
        });
      }
    }
  }, [feedback, type]);

  if (!show) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister({ ...form, role: 'alumno' });
  };

  const getTitle = () => {
    switch(type) {
      case 'tarea':
        return 'Asignar Tarea';
      case 'materia':
        return 'Agregar Materia';
      default:
        return 'Registrar Alumno';
    }
  };

  const handleSelectAlumno = (alumno) => {
    setSelectedAlumno(alumno);
    setForm({ email: alumno.email, username: alumno.username, password: '' });
    setShowResultados(false); // Cerrar la modal de resultados al seleccionar
  };

  const getFilterTitle = () => {
    if (search && mainFilter && mainFilter !== 'Seleccione un filtro') {
      return `Resultados para "${search}" - ${mainFilter}`;
    } else if (search) {
      return `Resultados para "${search}"`;
    } else if (mainFilter && mainFilter !== 'Seleccione un filtro') {
      return `Alumnos ${mainFilter.toLowerCase()}`;
    }
    return 'Resultados de la búsqueda';
  };

  return (
    <div className="modal-overlay">
      <div className={`modal-container modal-${type}`}>
        <div className="modal-header">
          <h2 className="modal-title">{getTitle()}</h2>
          <div className="modal-filter-container">
            <input
              type="text"
              className="alumno-search-bar"
              placeholder="Buscar alumno..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="alumno-filter-select"
              value={mainFilter}
              onChange={e => setMainFilter(e.target.value)}
            >
              <option value="">Seleccione un filtro</option>
              {mainFilterOptions.map(opt => 
                opt !== 'Seleccione un filtro' && <option key={opt}>{opt}</option>
              )}
            </select>
            <button className="modal-close-btn" onClick={onClose}>&times;</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required disabled={!!selectedAlumno} />
          <label>Usuario</label>
          <input type="text" name="username" value={form.username} onChange={handleChange} required disabled={!!selectedAlumno} />
          <label>Contraseña</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} required disabled={!!selectedAlumno} />
          {!selectedAlumno && <button type="submit">Registrar</button>}
        </form>

        {selectedAlumno && (
          <div className="materias-asignadas-alumno">
            <h4>Materias asignadas:</h4>
            <ul>
              {selectedAlumno.materias.map(m => <li key={m}>{m}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* Modal de resultados */}
      {showResultados && (
        <>
          <div className="modal-resultados-overlay" onClick={() => setShowResultados(false)} />
          <div className="modal-resultados">
            <div className="modal-resultados-header">
              <h3 className="modal-resultados-title">{getFilterTitle()}</h3>
              <button className="modal-resultados-close" onClick={() => setShowResultados(false)}>&times;</button>
            </div>
            
            {loading ? (
              <div className="no-resultados-mensaje">
                <p>Cargando alumnos...</p>
              </div>
            ) : filteredAlumnos.length > 0 ? (
              <div className="modal-resultados-lista">
                {filteredAlumnos.map(a => (
                  <div 
                    key={a.id} 
                    className="alumno-item-resultado" 
                    onClick={() => handleSelectAlumno(a)}
                  >
                    <div className="alumno-info">
                      <span className="alumno-nombre">{a.username}</span>
                      <span className="alumno-email">({a.email})</span>
                    </div>
                    <div className="alumno-stats">
                      <span className={`alumno-promedio ${
                        a.promedio === null ? 'sin-calificacion' : 
                        a.promedio >= 60 ? 'aprobado' : 'reprobado'
                      }`}>
                        Promedio: {a.promedio || 'Sin calificaciones'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-resultados-mensaje">
                <p>No se encontraron alumnos</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ModalAlumno; 