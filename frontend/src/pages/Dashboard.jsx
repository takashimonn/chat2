import { Link } from 'react-router-dom';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const cards = [
    {
      title: "Chat Académico",
      description: "Comunícate con profesores y compañeros en tiempo real para resolver dudas y compartir información.",
      icon: "fas fa-comments",
      path: "/chat",
      color: "#e3f2fd"
    },
    {
      title: "Calificaciones",
      description: "Consulta tus calificaciones, histórico académico y progreso en cada materia.",
      icon: "fas fa-graduation-cap",
      path: "/calificaciones",
      color: "#f3e5f5"
    },
    {
      title: "Próximamente",
      description: "Nuevas funcionalidades en desarrollo para mejorar tu experiencia académica.",
      icon: "fas fa-clock",
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

      <div className="cards-container">
        {cards.map((card, index) => (
          <Link 
            to={card.path} 
            className="card" 
            key={index}
            style={{ backgroundColor: card.color }}
          >
            <i className={`${card.icon} card-icon`} style={{ color: '#1a1a1a', fontSize: '3rem' }} />
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