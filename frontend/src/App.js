import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginForm from './components/LoginFrom';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Calificaciones from './pages/Calificaciones';
import Chat from './pages/Chat';
import Tasks from './pages/Tasks';
import Exams from './pages/Exams';
import StudentExams from './pages/StudentExams';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Alumnos from './pages/Alumnos';
import { useEffect, useState } from 'react';
import axiosInstance from './utils/axiosConfig';

// Componente para proteger rutas
const ProtectedRoute = ({ children, withSidebar = true }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) { 
    return <Navigate to="/" replace />;
  }
  return withSidebar ? (
    <Layout>{children}</Layout>
  ) : (
    <div className="full-width">{children}</div>
  );
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await axiosInstance.get('/auth/verify');
        } catch (error) {
          localStorage.clear();
        }
      }
      setIsLoading(false);
    };

    verifyToken();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter future={{ 
      v7_relativeSplatPath: true,
      v7_startTransition: true 
    }}>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
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
        <Route 
          path="/tareas" 
          element={
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/examenes" 
          element={
            <ProtectedRoute>
              {localStorage.getItem('userRole') === 'maestro' ? <Exams /> : <StudentExams />}
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/alumnos" 
          element={
            <ProtectedRoute>
              <Alumnos />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

