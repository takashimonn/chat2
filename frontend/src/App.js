import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginForm from './components/LoginFrom';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Calificaciones from './pages/Calificaciones';
import Chat from './pages/Chat';
import { useEffect } from 'react';
import { logout } from './utils/auth';

// Componente para proteger rutas
const ProtectedRoute = ({ children, withSidebar = true }) => {
  const token = localStorage.getItem('token');
  if (!token) { 
    return <Navigate to="/" replace />;
  }
  return withSidebar ? <Layout>{children}</Layout> : children;
};

function App() {
  console.log("App renderizada");

  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (localStorage.getItem('token')) {
        await logout();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute withSidebar={false}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/calificaciones" 
          element={
            <ProtectedRoute>
              <Calificaciones />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

