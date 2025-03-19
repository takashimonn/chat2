import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
//import axios from 'axios';
import Swal from 'sweetalert2';
import '../styles/LoginForm.css';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();

  const { email, username, password, confirmPassword } = formData;

  const handleLoginClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Las contraseñas no coinciden'
      });
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: '¡Registro exitoso!',
          text: 'Tu cuenta ha sido creada correctamente',
          timer: 1500,
          showConfirmButton: false
        });
        navigate('/');
      } else {
        throw new Error(data.message || 'Error al registrar usuario');
      }
    } catch (error) {
      console.error('Error completo:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al registrar usuario'
      });
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h1>Sistema de Control Escolar</h1>
        <p>Portal de Comunicación</p>
      </div>

      <div className="login-card">
        <div className="card-header">
          <h2>Crear Nueva Cuenta</h2>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Correo Institucional</label>
              <div className="input-group">
                <span className="input-icon email-icon"></span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={handleChange}
                  placeholder="usuario@institucion.edu.mx"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="username">Nombre de Usuario</label>
              <div className="input-group">
                <span className="input-icon user-icon"></span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={handleChange}
                  placeholder="Nombre de usuario"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="input-group">
                <span className="input-icon password-icon"></span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña</label>
              <div className="input-group">
                <span className="input-icon password-icon"></span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" className="submit-button">
              Crear Cuenta
            </button>

            <div className="form-links">
              <a href="/" onClick={handleLoginClick} className="login-link">
                ¿Ya tienes una cuenta? Inicia sesión
              </a>
            </div>
          </form>
        </div>
      </div>

      <footer className="login-footer">
        <p>© 2024 Sistema de Control Escolar. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default Register;
