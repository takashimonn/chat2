import { Link, useLocation } from "react-router-dom";
import "../styles/Sidebar.css";
import Swal from "sweetalert2";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosConfig";
import { jwtDecode } from "jwt-decode"; // 👈 Importación corregida

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('role');
    setUserRole(role);
  }, []);

  // Obtener y decodificar token
  let role = null;
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const decoded = jwtDecode(token);
      role = decoded?.role || null;
    } catch (error) {
      console.error("Token inválido:", error);
    }
  }

  const handleLogout = () => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "¿Deseas cerrar la sesión?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        const email = localStorage.getItem("email");
        axiosInstance
          .post("/auth/logout", { email })
          .then(() => {
            localStorage.clear();
            navigate("/");
            Swal.fire(
              "¡Sesión cerrada!",
              "Has cerrado sesión exitosamente",
              "success"
            );
          })
          .catch((error) => {
            console.error("Error al cerrar sesión:", error);
            Swal.fire("Error", "No se pudo cerrar la sesión", "error");
          });
      }
    });
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img src="/images/utd.webp" alt="Logo" className="sidebar-logo" />
        <span>Control Escolar</span>
      </div>

      <nav className="sidebar-nav">
        <Link
          to="/dashboard"
          className={`nav-item ${location.pathname === "/dashboard" ? "active" : ""}`}
        >
          <i className="fas fa-home"></i>
          <span>Inicio</span>
        </Link>
        <Link
          to="/tareas"
          className={`nav-item ${location.pathname === "/tareas" ? "active" : ""}`}
        >
          <i className="fas fa-tasks"></i>
          <span>Tareas</span>
        </Link>
        <Link
          to="/chat"
          className={`nav-item ${location.pathname === "/chat" ? "active" : ""}`}
        >
          <i className="fas fa-comments"></i>
          <span>Chat</span>
        </Link>
        <Link
          to="/examenes"
          className={`nav-item ${location.pathname === "/examenes" ? "active" : ""}`}
        >
          <i className="fas fa-file-alt"></i>
          <span>Examenes</span>
        </Link>
        {role !== "alumno" && (
          <Link
            to="/alumnos"
            className={`nav-item ${location.pathname === "/alumnos" ? "active" : ""}`}
          >
            <i className="fas fa-users"></i>
            <span>Alumnos</span>
          </Link>
        )}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="boton-logout">
          <i className="fas fa-sign-out-alt"></i>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
