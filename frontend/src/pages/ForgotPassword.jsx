import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import '../styles/ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:4000/api/auth/forgot-password', { email });
      
      Swal.fire({
        icon: 'success',
        title: '¡Correo enviado!',
        text: 'Se ha enviado un enlace de recuperación a tu correo electrónico',
        confirmButtonText: 'Aceptar'
      });

      setEmail('');
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Error al procesar la solicitud',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-image-section">
        <img src="/images/Forgot_password.png" alt="Recuperar contraseña" />
      </div>
      <div className="forgot-form-section">
        <div className="forgot-card">
          <div className="forgot-header">
            <h1>Recuperar contraseña</h1>
            <p>Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña</p>
          </div>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div className="forgot-form-group">
              <label htmlFor="email">Correo electrónico</label>
              <div className="forgot-input-group">
                <span className="forgot-input-icon">
                  <i className="fas fa-envelope"></i>
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo electrónico"
                />
              </div>
            </div>

            <button
              type="submit"
              className="forgot-button"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </form>

          <div className="forgot-link">
            <Link to="/">Volver al inicio de sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 