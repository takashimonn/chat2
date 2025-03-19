import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import io from "socket.io-client";
import "../styles/Chat.css";
import axiosInstance from '../utils/axiosConfig';

const Chat = () => {
  const [subjects, setSubjects] = useState([
    { id: 1, name: "Matemáticas", teacher: "Dr. García" },
    { id: 2, name: "Física", teacher: "Dra. Rodríguez" },
    { id: 3, name: "Química", teacher: "Dr. Martínez" },
    { id: 4, name: "Programación", teacher: "Ing. López" },
  ]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showSubjects, setShowSubjects] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const currentUserId = localStorage.getItem("userId");

  // Verificar autenticación al montar el componente
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/", { replace: true });
    }
  }, []);

  // Función para hacer scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    // Configuración del socket
    socketRef.current = io("http://localhost:4000", {
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    // Escuchar actualizaciones de estado de mensajes
    socketRef.current.on("message_status_updated", (updatedMessage) => {
      console.log("Estado actualizado recibido:", updatedMessage);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        )
      );
    });

    // Escuchar nuevos mensajes
    socketRef.current.on("new_message", (newMessage) => {
      console.log("Nuevo mensaje recibido:", newMessage);
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [navigate]);

  // Cargar mensajes cuando se selecciona una materia
  useEffect(() => {
    if (selectedSubject) {
      loadMessages();
      // Unirse a la sala de la materia
      socketRef.current?.emit("join_subject", selectedSubject.id);
    }
  }, [selectedSubject]);

  const loadMessages = async () => {
    if (!selectedSubject) return;

    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/messages/subject/${selectedSubject.id}`);
      const data = response.data;
      
      setMessages(data.filter((msg, index, self) => 
        index === self.findIndex(m => m._id === msg._id)
      ));
      
      // Marcar mensajes como leídos
      await markMessagesAsRead(selectedSubject.id);
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedSubject) return;

    try {
      const response = await axiosInstance.post('/messages', {
        content: newMessage.trim(),
        subject: selectedSubject.id
      });

      setMessages(prev => [...prev, response.data]);
      setNewMessage('');

    } catch (error) {
      console.error('Error completo:', error);
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate('/');
      }
      Swal.fire({
        icon: 'error',
        title: 'Error al enviar mensaje',
        text: error.response?.data?.message || 'Error al enviar mensaje'
      });
    }
  };

  // Renderizar el estado del mensaje
  const renderMessageStatus = (message) => {
    const getStatusIcon = (status) => {
      switch (status) {
        case "no_leido":
          return "○";
        case "visto":
          return "👁️";
        case "respondido":
          return "↩️";
        case "en_espera":
          return "⏳";
        default:
          return "○";
      }
    };

    return (
      <span className={`message-status ${message.status}`}>
        {getStatusIcon(message.status)}
        {message.readBy?.length > 0 &&
          message.status === "visto" &&
          ` (${message.readBy.length})`}
      </span>
    );
  };

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
  };

  // Función para marcar mensajes como leídos
  const markMessagesAsRead = async (subjectId) => {
    try {
      const response = await axiosInstance.post(`/messages/subject/${subjectId}/read`);
      const updatedMessages = response.data;
      console.log('Mensajes actualizados:', updatedMessages);

      // Actualizar estados localmente
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          const updatedMsg = updatedMessages.find((m) => m._id === msg._id);
          return updatedMsg || msg;
        })
      );
    } catch (error) {
      console.error('Error:', error);
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate('/');
      }
    }
  };

  // Componente de mensaje individual
  const MessageItem = ({ message }) => {
    const isOwnMessage = message.sender._id === currentUserId;

    return (
      <div className={`message ${isOwnMessage ? "sent" : "received"}`}>
        <div className="message-content">
          {!isOwnMessage && (
            <div className="message-sender">{message.sender.username}</div>
          )}
          <p>{message.content}</p>
          <div className="message-footer">
            <span className="message-time">
              {new Date(message.createdAt).toLocaleTimeString()}
            </span>
            <span className={`message-status ${message.status}`}>
              {message.status === "visto"
                ? `Visto (${message.readBy?.length || 0})`
                : message.status === "respondido"
                ? "Respondido"
                : "No leído"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const handleLogout = () => {
    Swal.fire({
      title: "¿Cerrar sesión?",
      text: "¿Estás seguro que deseas salir?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        // Desconectar socket
        if (socketRef.current) {
          socketRef.current.disconnect();
        }

        // Limpiar localStorage
        localStorage.clear();

        // Redireccionar al LoginForm
        navigate("/", { replace: true });

        Swal.fire({
          icon: "success",
          title: "¡Sesión cerrada!",
          text: "Has cerrado sesión exitosamente",
        });
      }
    });
  };

  return (
    <div className="chat-container">
      {/* Panel de Materias */}
      <div className={`subjects-panel ${!showSubjects ? 'subjects-panel-collapsed' : ''}`}>
        <div className="subjects-header">
          <h2>Materias</h2>
          <button onClick={handleLogout} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
        <div className="subjects-list">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className={`subject-card ${
                selectedSubject?.id === subject.id ? "selected" : ""
              }`}
              onClick={() => handleSubjectSelect(subject)}
            >
              <div className="subject-avatar">{subject.name.charAt(0)}</div>
              <div className="subject-info">
                <h3>{subject.name}</h3>
                <p>{subject.teacher}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel de Chat */}
      <div className="chat-panel">
        <div className="chat-header">
          <button 
            className="toggle-subjects" 
            onClick={() => setShowSubjects(!showSubjects)}
          >
            ☰
          </button>
          {selectedSubject ? (
            <div className="chat-header-info">
              <h2>{selectedSubject.name}</h2>
              <p>{selectedSubject.teacher}</p>
            </div>
          ) : (
            <h2>Selecciona una materia para comenzar</h2>
          )}
        </div>

        {selectedSubject ? (
          <>
            <div className="messages-container">
              {isLoading ? (
                <div className="loading-container">
                  <span className="material-icons-round loading-icon">sync</span>
                  <p>Cargando mensajes...</p>
                </div>
              ) : (
                messages.map((message) => (
                  <MessageItem key={message._id} message={message} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="message-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
              />
              <button type="submit">Enviar</button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="empty-state">
              <span className="material-icons-round message-icon">mail_outline</span>
              <p>Selecciona una conversación</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
