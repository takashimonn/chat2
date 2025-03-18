import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../styles/LoginForm.css';


const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:4000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        await Swal.fire({
          icon: 'success',
          title: '¡Bienvenido!',
          text: 'Inicio de sesión exitoso',
          timer: 1500,
          showConfirmButton: false
        });
        
        navigate('/chat');
      } else {
        throw new Error(data.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al iniciar sesión'
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
          <h2>Inicio de Sesión</h2>
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
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="usuario@institucion.edu.mx"
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
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" className="submit-button">
              Ingresar al Sistema
            </button>

            <div className="form-links">
              <Link to="/register" className="register-link">
                Crear nueva cuenta
              </Link>
              <a href="#" className="forgot-password">
                ¿Olvidaste tu contraseña?
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

export default LoginForm;
