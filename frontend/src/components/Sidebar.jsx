import { Link, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Control Escolar</h2>
      </div>
      <nav className="sidebar-nav">
        <Link 
          to="/dashboard" 
          className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
        >
          <i className="fas fa-home"></i>
          <span>Inicio</span>
        </Link>
        <Link 
          to="/calificaciones" 
          className={`nav-item ${location.pathname === '/calificaciones' ? 'active' : ''}`}
        >
          <i className="fas fa-graduation-cap"></i>
          <span>Calificaciones</span>
        </Link>
        <Link 
          to="/chat" 
          className={`nav-item ${location.pathname === '/chat' ? 'active' : ''}`}
        >
          <i className="fas fa-comments"></i>
          <span>Chat</span>
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar; 