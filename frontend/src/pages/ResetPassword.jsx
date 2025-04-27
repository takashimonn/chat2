import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axiosInstance from '../utils/axiosConfig';

const ResetPassword = () => {
  const [passwords, setPasswords] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (passwords.password !== passwords.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Las contraseñas no coinciden'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.post(`/auth/reset-password/${token}`, {
        password: passwords.password
      });

      await Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Tu contraseña ha sido actualizada correctamente'
      });

      navigate('/');
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Error al restablecer la contraseña'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-form-section">
          <div className="login-header">
            <h1>Restablecer Contraseña</h1>
            <p>Ingresa tu nueva contraseña</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="password">Nueva Contraseña</label>
              <div className="input-group">
                <span className="input-icon">
                  <i className="fas fa-lock"></i>
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={passwords.password}
                  onChange={handleChange}
                  placeholder="Ingresa tu nueva contraseña"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña</label>
              <div className="input-group">
                <span className="input-icon">
                  <i className="fas fa-lock"></i>
                </span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={passwords.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirma tu nueva contraseña"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Restablecer Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 