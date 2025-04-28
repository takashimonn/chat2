import React, { useState, useEffect } from 'react';
import '../styles/ModalAlumno.css';
import Swal from 'sweetalert2';

// Icono de filtro simple (puedes reemplazarlo por uno de librería si tienes)
const FilterIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="2" y2="2"/><line x1="2" y1="2" x2="10" y2="12"/><line x1="10" y1="12" x2="10" y2="19"/><line x1="14" y1="19" x2="14" y2="12"/><line x1="14" y1="12" x2="22" y2="2"/></svg>
);

const mockAlumnos = [
  { id: 1, email: 'juan@mail.com', username: 'juanito', calificacion: 85, materias: ['Matemáticas', 'Historia'] },
  { id: 2, email: 'ana@mail.com', username: 'anita', calificacion: 78, materias: ['Español', 'Historia'] },
  { id: 3, email: 'luis@mail.com', username: 'lucho', calificacion: 92, materias: ['Matemáticas', 'Ciencias'] },
];
const mockMaterias = ['Todas', 'Matemáticas', 'Historia', 'Español', 'Ciencias'];

const ModalAlumno = ({ show, onClose, onRegister, feedback, type = 'alumno' }) => {
  const [form, setForm] = useState({ email: '', username: '', password: '' });
  const [alumnos, setAlumnos] = useState([]); // Lista de alumnos
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState('Todas');
  const [selectedCalificacion, setSelectedCalificacion] = useState('Todos');
  const [filteredAlumnos, setFilteredAlumnos] = useState([]);
  const [selectedAlumno, setSelectedAlumno] = useState(null);

  // Simulación: cargar alumnos (reemplaza por fetch real)
  useEffect(() => {
    setAlumnos(mockAlumnos);
  }, []);

  // Filtrado en tiempo real
  useEffect(() => {
    let result = alumnos.filter(a =>
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.username.toLowerCase().includes(search.toLowerCase())
    );
    if (selectedMateria !== 'Todas') {
      result = result.filter(a => a.materias.includes(selectedMateria));
    }
    if (selectedCalificacion === 'Aprobados') {
      result = result.filter(a => a.calificacion >= 60);
    } else if (selectedCalificacion === 'Mayor80') {
      result = result.filter(a => a.calificacion > 80);
    }
    setFilteredAlumnos(result);
  }, [search, alumnos, selectedMateria, selectedCalificacion]);

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
            <div className="filter-dropdown-container">
              <button type="button" className="filter-btn" onClick={() => setShowFilters(f => !f)}>
                <FilterIcon />
              </button>
              {showFilters && (
                <div className="filter-dropdown">
                  <div>
                    <label>Materia:</label>
                    <select value={selectedMateria} onChange={e => setSelectedMateria(e.target.value)}>
                      {mockMaterias.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Calificación:</label>
                    <select value={selectedCalificacion} onChange={e => setSelectedCalificacion(e.target.value)}>
                      <option value="Todos">Todos</option>
                      <option value="Aprobados">Aprobados</option>
                      <option value="Mayor80">Mayor a 80</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            <button className="modal-close-btn" onClick={onClose}>&times;</button>
          </div>
        </div>
        {/* Lista de alumnos filtrados */}
        {search && filteredAlumnos.length > 0 && (
          <div className="alumnos-lista-filtrada">
            {filteredAlumnos.map(a => (
              <div key={a.id} className="alumno-item-filtrado" onClick={() => handleSelectAlumno(a)}>
                <span>{a.username} ({a.email})</span>
                <span style={{ fontSize: 12, color: '#888' }}>Calif: {a.calificacion}</span>
              </div>
            ))}
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