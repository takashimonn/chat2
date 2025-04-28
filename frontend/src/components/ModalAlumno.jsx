import React, { useState } from 'react';
import '../styles/ModalAlumno.css';

const ModalAlumno = ({ show, onClose, onRegister, feedback }) => {
  const [form, setForm] = useState({ email: '', username: '', password: '' });

  if (!show) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister({ ...form, role: 'alumno' });
  };

  return (
    <div className="modal-alumno-overlay">
      <div className="modal-alumno">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2>Registrar Alumno</h2>
        <form onSubmit={handleSubmit} className="modal-alumno-form">
          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
          <label>Usuario</label>
          <input type="text" name="username" value={form.username} onChange={handleChange} required />
          <label>Contraseña</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} required />
          <button type="submit">Registrar</button>
        </form>
        {feedback && <div className="modal-alumno-feedback">{feedback}</div>}
      </div>
    </div>
  );
};

export default ModalAlumno; 