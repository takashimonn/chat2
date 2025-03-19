import { useState, useEffect, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import io from "socket.io-client";
import "../styles/Chat.css";
import axiosInstance from '../utils/axiosConfig';

// Componente de mensaje individual memo-izado
const MessageItem = memo(({ message, currentUserId }) => {
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
});

// Componente de formulario de mensajes memo-izado
const MessageForm = memo(({ onSendMessage }) => {
  const [newMessage, setNewMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    onSendMessage(newMessage.trim());
    setNewMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="message-form">
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Escribe un mensaje..."
      />
      <button type="submit">Enviar</button>
    </form>
  );
});

const Chat = () => {
  const [subjects, setSubjects] = useState([
    { id: 1, name: "Matemáticas", teacher: "Dr. García" },
    { id: 2, name: "Física", teacher: "Dra. Rodríguez" },
    { id: 3, name: "Química", teacher: "Dr. Martínez" },
    { id: 4, name: "Programación", teacher: "Ing. López" },
  ]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showSubjects, setShowSubjects] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const currentUserId = localStorage.getItem("userId");

  // Verificar autenticación al montar el componente
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/", { replace: true });
    }
  }, []);

  // Función para hacer scroll al último mensaje
  const scrollToBottom = (smooth = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? "smooth" : "auto",
        block: "end"
      });
    }
  };

  // Efecto para hacer scroll cuando cambian los mensajes
  useEffect(() => {
    // Solo usar scroll suave cuando se envía un mensaje nuevo
    const smooth = messages.length > 0 && !isLoading;
    scrollToBottom(smooth);
  }, [messages, isLoading]);

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
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        )
      );
    });

    // Escuchar nuevos mensajes
    socketRef.current.on("new_message", (newMessage) => {
      // Solo agregar el mensaje si no existe ya
      setMessages((prev) => {
        const messageExists = prev.some(msg => msg._id === newMessage._id);
        if (messageExists) return prev;
        return [...prev, newMessage];
      });
      scrollToBottom(true);
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
      // Scroll inmediato al seleccionar materia
      scrollToBottom(false);
    }
  }, [selectedSubject]);

  const loadMessages = async () => {
    if (!selectedSubject) return;

    setIsLoading(true);
    scrollToBottom(false); // Scroll inmediato antes de cargar
    
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
      // Asegurar que estamos al final después de cargar
      setTimeout(() => scrollToBottom(false), 0);
    }
  };

  const handleSendMessage = async (messageContent) => {
    if (!selectedSubject) return;

    try {
      const response = await axiosInstance.post('/messages', {
        content: messageContent,
        subject: selectedSubject.id
      });

      setMessages(prev => {
        const messageExists = prev.some(msg => msg._id === response.data._id);
        if (messageExists) return prev;
        return [...prev, response.data];
      });
      // Usar scroll suave solo para mensajes nuevos
      scrollToBottom(true);
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

  const markMessagesAsRead = async (subjectId) => {
    try {
      const response = await axiosInstance.post(`/messages/subject/${subjectId}/read`);
      const updatedMessages = response.data;
      
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

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="chat-container">
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
                <>
                  <div style={{ flex: 1 }} />
                  {messages.map((message) => (
                    <MessageItem 
                      key={message._id} 
                      message={message} 
                      currentUserId={currentUserId}
                    />
                  ))}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
            <MessageForm onSendMessage={handleSendMessage} />
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
