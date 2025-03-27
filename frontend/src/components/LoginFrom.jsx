import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../styles/LoginForm.css';
import axiosInstance from '../utils/axiosConfig';
import ReCAPTCHA from "react-google-recaptcha";

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [captchaValue, setCaptchaValue] = useState(null);

  const navigate = useNavigate();

  // Verificar si existe la clave de reCAPTCHA
  const recaptchaSiteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

  if (!recaptchaSiteKey) {
    console.error('Error: REACT_APP_RECAPTCHA_SITE_KEY no está definida');
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!captchaValue) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor verifica que no eres un robot'
      });
      return;
    }
    
    try {
      // Verificar primero si hay una sesión activa
      const sessionCheck = await axiosInstance.post('/auth/check-session', {
        email: formData.email
      });

      console.log('Respuesta de check-session:', sessionCheck.data);

      if (sessionCheck.data.hasActiveSession) {
        Swal.fire({
          icon: 'warning',
          title: 'Sesión activa',
          text: 'Ya tienes una sesión activa en otro navegador',
          confirmButtonText: 'Entendido'
        });
        return;
      }

      // Continuar con el login normal
      const response = await axiosInstance.post('/auth/login', {
        ...formData,
        captchaToken: captchaValue
      });
      const data = response.data;

      if (response.status === 200) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.user._id);
        localStorage.setItem('username', data.user.username);
        
        await Swal.fire({
          icon: 'success',
          title: '¡Bienvenido!',
          text: 'Inicio de sesión exitoso',
          timer: 1500,
          showConfirmButton: false
        });
        
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Error al iniciar sesión'
      });
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-form-section">
          <div className="login-header">
            <h1>Control Escolar</h1>
            <p>Porfavor ingresa tus credenciales</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-group">
                <span className="input-icon">
                  <i className="fas fa-envelope"></i>
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-group">
                <span className="input-icon">
                  <i className="fas fa-lock"></i>
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="recaptcha-container">
              {recaptchaSiteKey ? (
                <ReCAPTCHA
                  sitekey={recaptchaSiteKey}
                  onChange={(value) => setCaptchaValue(value)}
                />
              ) : (
                <div className="recaptcha-error">
                  Error: reCAPTCHA no está configurado correctamente
                </div>
              )}
            </div>

            <button type="submit" className="login-button">
              Log in
            </button>

            <div className="form-links">
              <Link to="/register" className="register-link">
                ¿No tienes una cuenta? Regístrate
              </Link>
            </div>
          </form>
        </div>

        <div className="login-visual-section">
          {/* Removemos el div de wave-animation ya que no lo necesitamos */}
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
