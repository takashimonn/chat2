import { Link, useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';
import Swal from 'sweetalert2';
import axios from 'axios';
import axiosInstance from '../utils/axiosConfig';

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

  const cards = [
    {
      title: "Chat Académico",
      description: "Comunícate con profesores y compañeros en tiempo real para resolver dudas y compartir información.",
      image: "/images/chat.png",
      path: "/chat",
      color: "#e3f2fd"
    },
    {
      title: "Tareas",
      description: "Gestiona las tareas del curso",
      image: "/images/calificaciones.png",
      path: "/tareas",
      color: "#f3e5f5"
    },
    {
      title: "Próximamente",
      description: "Nuevas funcionalidades en desarrollo para mejorar tu experiencia académica.",
      image: "/images/prox.png",
      path: "#",
      color: "#fff3e0"
    }
  ];

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
        {cards.map((card, index) => (
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