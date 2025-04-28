import React, { useState, useEffect } from 'react';
import '../styles/ModalAlumno.css';
import Swal from 'sweetalert2';

const ModalAlumno = ({ show, onClose, onRegister, feedback, type = 'alumno' }) => {
  const [form, setForm] = useState({ email: '', username: '', password: '' });
  const [alumnos, setAlumnos] = useState([]); // Lista de alumnos
  const [materias, setMaterias] = useState([]); // Materias dinámicas
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState('Todas');
  const [selectedCalificacion, setSelectedCalificacion] = useState('Todos');
  const [selectedActivo, setSelectedActivo] = useState('Todos');
  const [filteredAlumnos, setFilteredAlumnos] = useState([]);
  const [selectedAlumno, setSelectedAlumno] = useState(null);
  const [mainFilter, setMainFilter] = useState('Todos');
  const [loading, setLoading] = useState(false);

  // Cargar alumnos desde el backend
  useEffect(() => {
    const fetchAlumnos = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:4000/api/users/alumnos', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();
        if (res.ok) {
          setAlumnos(data);
          // Extraer materias únicas de todos los alumnos
          const materiasUnicas = ['Todas', ...new Set(data.flatMap(a => a.materias))];
          setMaterias(materiasUnicas);
        } else {
          Swal.fire({
            title: 'Error',
            text: 'Error al cargar los alumnos',
            icon: 'error',
            confirmButtonColor: '#e74c3c'
          });
        }
      } catch (error) {
        console.error('Error al cargar alumnos:', error);
        Swal.fire({
          title: 'Error',
          text: 'Error de conexión al cargar los alumnos',
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
    'Todos',
    'Aprobados',
    'Reprobados',
    'Por materias'
  ];

  // Filtrado en tiempo real
  useEffect(() => {
    let result = [];
    
    // Solo aplicar filtros si se ha seleccionado alguno o hay búsqueda
    if (mainFilter !== '' || search) {
      result = alumnos;

      // Si hay texto en el buscador, filtrar por búsqueda
      if (search) {
        result = result.filter(a =>
          a.email.toLowerCase().includes(search.toLowerCase()) ||
          a.username.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Aplicar filtros según la selección
      switch(mainFilter) {
        case 'Todos':
          // No aplicar ningún filtro adicional
          break;
        case 'Aprobados':
          result = result.filter(a => a.promedio !== null && a.promedio >= 60);
          break;
        case 'Reprobados':
          result = result.filter(a => a.promedio !== null && a.promedio < 60);
          break;
        case 'Por materias':
          if (selectedMateria !== 'Todas') {
            result = result.filter(a => a.materias.includes(selectedMateria));
          }
          break;
      }
    }

    setFilteredAlumnos(result);
  }, [search, alumnos, mainFilter, selectedMateria]);

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
  };

  return (
    <div className="modal-overlay">
      <div className={`modal-container modal-${type}`}>
        <div className="modal-header" style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <h2 className="modal-title">{getTitle()}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <input
              type="text"
              className="alumno-search-bar"
              placeholder="Buscar alumno..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 180, marginRight: 4 }}
            />
            <select
              className="alumno-filter-select"
              value={mainFilter}
              onChange={e => setMainFilter(e.target.value)}
              style={{ height: 32, borderRadius: 6, border: '1px solid #b1b0b0', padding: '0 8px', minWidth: 140 }}
            >
              <option value="">Seleccionar filtro...</option>
              {mainFilterOptions.map(opt => <option key={opt}>{opt}</option>)}
            </select>
            {mainFilter === 'Por materias' && (
              <select
                className="alumno-filter-select"
                value={selectedMateria}
                onChange={e => setSelectedMateria(e.target.value)}
                style={{ height: 32, borderRadius: 6, border: '1px solid #b1b0b0', padding: '0 8px' }}
              >
                {materias.map(m => <option key={m}>{m}</option>)}
              </select>
            )}
            <button className="modal-close-btn" onClick={onClose}>&times;</button>
          </div>
        </div>
        {/* Lista de alumnos filtrados */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Cargando alumnos...</p>
          </div>
        ) : filteredAlumnos.length > 0 ? (
          <div className="alumnos-lista-filtrada">
            {filteredAlumnos.map(a => (
              <div 
                key={a.id} 
                className="alumno-item-filtrado" 
                onClick={() => handleSelectAlumno(a)}
              >
                <div className="alumno-info">
                  <span className="alumno-nombre">{a.username}</span>
                  <span className="alumno-email">({a.email})</span>
                </div>
                <div className="alumno-stats">
                  <span className={`alumno-promedio ${a.promedio >= 60 ? 'aprobado' : 'reprobado'}`}>
                    Promedio: {a.promedio || 'Sin calificaciones'}
                  </span>
                  {a.materias.length > 0 && (
                    <span className="alumno-materias">
                      Materias: {a.materias.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : mainFilter || search ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>No se encontraron alumnos</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Selecciona un filtro o busca un alumno</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="modal-form">
          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required disabled={!!selectedAlumno} />
          <label>Usuario</label>
          <input type="text" name="username" value={form.username} onChange={handleChange} required disabled={!!selectedAlumno} />
          <label>Contraseña</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} required disabled={!!selectedAlumno} />
          {!selectedAlumno && <button type="submit">Registrar</button>}
        </form>
        {/* Materias asignadas al alumno seleccionado */}
        {selectedAlumno && (
          <div className="materias-asignadas-alumno">
            <h4>Materias asignadas:</h4>
            <ul>
              {selectedAlumno.materias.map(m => <li key={m}>{m}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalAlumno; 