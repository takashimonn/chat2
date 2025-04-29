import { Link, useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';
import Swal from 'sweetalert2';
import axiosInstance from '../utils/axiosConfig';
import { jwtDecode } from 'jwt-decode';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¿Deseas cerrar la sesión?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const email = localStorage.getItem('email');
        axiosInstance.post('/auth/logout', { email })
          .then(() => {
            localStorage.clear();
            navigate('/');
            Swal.fire(
              '¡Sesión cerrada!',
              'Has cerrado sesión exitosamente',
              'success'
            );
          })
          .catch(error => {
            console.error('Error al cerrar sesión:', error);
            Swal.fire(
              'Error',
              'No se pudo cerrar la sesión',
              'error'
            );
          });
      }
    });
  };

  // Obtener el rol desde el token
  let userRole = '';
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const decoded = jwtDecode(token);
      userRole = decoded.rol || decoded.role || ''; // Ajusta según el nombre de tu campo
    } catch (error) {
      console.error('Error al decodificar el token:', error);
    }
  }

  const cards = [
    {
      title: "Chat Académico",
      description: "Comunícate en tiempo real con la comunidad académica y resuelve dudas al instante.",
      image: "/images/chat.png",
      path: "/chat",
      color: "#CCEEBC"
    },
    {
      title: "Tareas",
      description: "Gestiona las tareas del curso, califica entregas y realiza seguimiento del progreso de los alumnos.",
      image: "/images/calificaciones.png",
      path: "/tareas",
      color: "#CCEEBC"
    },
    {
      title: "Examenes",
      description: "Crea y administra exámenes, establece fechas límite y visualiza resultados de manera eficiente.",
      image: "/images/prox.png",
      path: "/examenes",
      color: "#CCEEBC"
    },
    {
      title: "Alumnos",
      description: "Gestiona y visualiza la información de los alumnos del sistema y su rendimiento académico.",
      image: "/images/alumnos.png",
      path: "/alumnos",
      color: "#CCEEBC"
    }
  ];

  // Filtra la tarjeta de "Alumnos" si el rol es alumno
  const filteredCards = userRole === 'alumno'
    ? cards.filter(card => card.title !== "Alumnos")
    : cards;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Sistema de Control Escolar</h1>
        <p>Selecciona una opción para comenzar</p>
      </div>

      <button onClick={handleLogout} className="logout-button-dash">
        <i className="fas fa-sign-out-alt"></i>
        Cerrar Sesión
      </button>

      <div className="cards-container">
        {filteredCards.map((card, index) => (
          <Link 
            to={card.path} 
            className="card" 
            key={index}
            style={{ backgroundColor: card.color }}
          >
            <img 
              src={card.image} 
              alt={card.title}
              className="card-image"
            />
            <h2 className="card-title">{card.title}</h2>
            <p className="card-description">{card.description}</p>
            <span className="card-button">
              {card.path === "#" ? "Próximamente" : "Acceder"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
