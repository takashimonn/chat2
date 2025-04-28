import React, { useState, useEffect } from 'react';
import '../styles/ModalAlumno.css';
import Swal from 'sweetalert2';

const ModalAlumno = ({ show, onClose, onRegister, feedback, type = 'alumno' }) => {
  const [form, setForm] = useState({ email: '', username: '', password: '' });

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

  return (
    <div className="modal-overlay">
      <div className={`modal-container modal-${type}`}>
        <div className="modal-header">
          <h2 className="modal-title">{getTitle()}</h2>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
          <label>Usuario</label>
          <input type="text" name="username" value={form.username} onChange={handleChange} required />
          <label>Contraseña</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} required />
          <button type="submit">Registrar</button>
        </form>
      </div>
    </div>
  );
};

export default ModalAlumno; 