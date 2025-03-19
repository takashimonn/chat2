import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import io from 'socket.io-client';
import '../styles/Chat.css';

const Chat = () => {
  const [subjects, setSubjects] = useState([
    { id: 1, name: 'Matemáticas', teacher: 'Dr. García' },
    { id: 2, name: 'Física', teacher: 'Dra. Rodríguez' },
    { id: 3, name: 'Química', teacher: 'Dr. Martínez' },
    { id: 4, name: 'Programación', teacher: 'Ing. López' },
  ]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showSubjects, setShowSubjects] = useState(true);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const currentUserId = localStorage.getItem('userId');

  // Verificar autenticación al montar el componente
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/', { replace: true });
    }
  }, []);

  // Función para hacer scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    // Configuración del socket
    socketRef.current = io('http://localhost:4000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    // Escuchar actualizaciones de estado de mensajes
    socketRef.current.on('message_status_updated', (updatedMessage) => {
      console.log('Estado actualizado recibido:', updatedMessage);
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === updatedMessage._id ? updatedMessage : msg
        )
      );
    });

    // Escuchar nuevos mensajes
    socketRef.current.on('new_message', (newMessage) => {
      console.log('Nuevo mensaje recibido:', newMessage);
      setMessages(prev => [...prev, newMessage]);
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
      socketRef.current?.emit('join_subject', selectedSubject.id);
    }
  }, [selectedSubject]);

  const loadMessages = async () => {
    if (!selectedSubject) return;

    try {
      const response = await fetch(`http://localhost:4000/api/messages/subject/${selectedSubject.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al cargar mensajes');

      const data = await response.json();
      setMessages(data.filter((msg, index, self) => 
        index === self.findIndex(m => m._id === msg._id)
      ));
      
      // Marcar mensajes como leídos
      await markMessagesAsRead(selectedSubject.id);
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    
    // Verificar si hay token
    if (!token) {
      Swal.fire('Error', 'No hay sesión activa. Por favor, inicia sesión nuevamente.', 'error');
      navigate('/login');
      return;
    }

    if (!newMessage.trim() || !selectedSubject) return;

    try {
      // Log para debugging
      console.log('Token:', token.substring(0, 20) + '...'); // Solo mostrar parte del token
      
      const response = await fetch('http://localhost:4000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          subject: selectedSubject.id
        })
      });

      // Log de la respuesta para debugging
      console.log('Status:', response.status);
      const data = await response.json();
      console.log('Respuesta:', data);

      if (!response.ok) {
        if (response.status === 401) {
          // Si no está autorizado, redirigir al login
          localStorage.clear();
          navigate('/login');
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        throw new Error(data.message || 'Error al enviar mensaje');
      }

      setMessages(prev => [...prev, data]);
      setNewMessage('');

    } catch (error) {
      console.error('Error completo:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al enviar mensaje',
        text: error.message
      });
    }
  };

  // Renderizar el estado del mensaje
  const renderMessageStatus = (message) => {
    const getStatusIcon = (status) => {
      switch (status) {
        case 'no_leido': return '○';
        case 'visto': return '👁️';
        case 'respondido': return '↩️';
        case 'en_espera': return '⏳';
        default: return '○';
      }
    };

    return (
      <span className={`message-status ${message.status}`}>
        {getStatusIcon(message.status)}
        {message.readBy?.length > 0 && message.status === 'visto' && 
          ` (${message.readBy.length})`}
      </span>
    );
  };

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    setShowSubjects(false);
  };

  // Función para marcar mensajes como leídos
  const markMessagesAsRead = async (subjectId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/messages/subject/${subjectId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al marcar mensajes como leídos');

      const updatedMessages = await response.json();
      console.log('Mensajes actualizados:', updatedMessages);

      // Actualizar estados localmente
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          const updatedMsg = updatedMessages.find(m => m._id === msg._id);
          return updatedMsg || msg;
        })
      );
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Llamar a markMessagesAsRead cuando se selecciona una materia
  useEffect(() => {
    if (selectedSubject) {
      markMessagesAsRead(selectedSubject.id);
    }
  }, [selectedSubject]);

  // Componente de mensaje individual
  const MessageItem = ({ message }) => {
    const isOwnMessage = message.sender._id === currentUserId;
    
    return (
      <div className={`message ${isOwnMessage ? 'sent' : 'received'}`}>
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
              {message.status === 'visto' 
                ? `Visto (${message.readBy?.length || 0})` 
                : message.status === 'respondido'
                ? 'Respondido'
                : 'No leído'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro que deseas salir?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Desconectar socket
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
        
        // Limpiar localStorage
        localStorage.clear();
        
        // Redireccionar al LoginForm
        navigate('/', { replace: true });
        
        Swal.fire({
          icon: 'success',
          title: '¡Sesión cerrada!',
          text: 'Has cerrado sesión exitosamente'
        });
      }
    });
  };

  return (
    <div className="chat-container">
      {/* Panel de Materias */}
      <div className={`subjects-panel ${!showSubjects && 'subjects-panel-collapsed'}`}>
        <div className="subjects-header">
          <h2>Materias</h2>
          <button onClick={handleLogout} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
        <div className="subjects-list">
          {subjects.map(subject => (
            <div
              key={subject.id}
              className={`subject-card ${selectedSubject?.id === subject.id ? 'selected' : ''}`}
              onClick={() => handleSubjectSelect(subject)}
            >
              <div className="subject-avatar">
                {subject.name.charAt(0)}
              </div>
              <div className="subject-info">
                <h3>{subject.name}</h3>
                <p>{subject.teacher}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel de Chat */}
      {selectedSubject ? (
        <div className="chat-panel">
          <div className="chat-header">
            <button 
              className="toggle-subjects"
              onClick={() => setShowSubjects(!showSubjects)}
            >
              ☰
            </button>
            <div className="subject-info">
              <h2>{selectedSubject.name}</h2>
              <p>{selectedSubject.teacher}</p>
            </div>
          </div>

          <div className="messages-container">
            {messages.map((message, index) => (
              <div 
                key={`${message._id}-${index}`}
                className={`message ${message.sender._id === currentUserId ? 'sent' : 'received'}`}
              >
                <div className="message-content">
                  {message.sender._id !== currentUserId && (
                    <div className="message-sender">
                      {message.sender.username}
                    </div>
                  )}
                  <p>{message.content}</p>
                  <div className="message-footer">
                    <span className="message-time">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </span>
                    <span className={`message-status ${message.status}`}>
                      {message.status === 'visto' 
                        ? `Visto (${message.readBy?.length || 0})` 
                        : message.status === 'respondido'
                        ? 'Respondido'
                        : 'No leído'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="message-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="message-input"
            />
            <button type="submit" className="send-button">
              Enviar
            </button>
          </form>
        </div>
      ) : (
        <div className="no-chat-selected">
          <h2>Selecciona una materia para comenzar a chatear</h2>
        </div>
      )}
    </div>
  );
};

export default Chat;
