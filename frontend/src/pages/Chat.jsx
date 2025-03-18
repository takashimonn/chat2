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
      setMessages(prev => [...prev, newMessage]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [navigate]);

  // Cargar mensajes cuando se selecciona una materia
  useEffect(() => {
    if (selectedSubject) {
      loadMessagesForSubject(selectedSubject.id);
      // Unirse a la sala de la materia
      socketRef.current?.emit('join_subject', selectedSubject.id);
    }
  }, [selectedSubject]);

  const loadMessagesForSubject = async (subjectId) => {
    try {
      console.log('Cargando mensajes para materia:', subjectId);
      const response = await fetch(`http://localhost:4000/api/messages/subject/${subjectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Error al cargar mensajes');
      
      const data = await response.json();
      for (const message of data) {
        if (message.status === 'no_leido') {
          markMessagesAsRead(message._id);
        }
      }
      
      setMessages(data);
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedSubject) return;

    try {
      const response = await fetch('http://localhost:4000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: newMessage,
          subject: selectedSubject.id
        })
      });

      if (!response.ok) throw new Error('Error al enviar mensaje');
      setNewMessage('');
      
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo enviar el mensaje'
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

  // Función para marcar mensajes como leídos cuando se abre el chat
  useEffect(() => {
    if (selectedSubject) {
      console.log('AAAAAA', selectedSubject)
      //markMessagesAsRead(selectedSubject.id);
    }
  }, [selectedSubject]);

  const markMessagesAsRead = async (messageId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/messages/${messageId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al marcar mensajes como leídos');

      const updatedMessages = await response.json();
      console.log('Mensajes marcados como leídos:', updatedMessages);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const MessageItem = ({ message }) => {
    const isOwnMessage = message.sender._id === currentUserId;
    
    return (
      <div className={`message ${isOwnMessage ? 'sent' : 'received'}`}>
        <div className="message-content">
          {!isOwnMessage && (
            <div className="message-sender">
              {message.sender.username}
            </div>
          )}
          {message.replyTo && (
            <div className="reply-to">
              Respondiendo a: {message.replyTo.content}
            </div>
          )}
          <p>{message.content}</p>
          <div className="message-footer">
            <span className="message-time">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
            <span className={`message-status ${message.status}`}>
              {getMessageStatus(message)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const getMessageStatus = (message) => {
    switch (message.status) {
      case 'visto':
        return `Visto (${message.readBy?.length || 0})`;
      case 'respondido':
        return 'Respondido';
      case 'no_leido':
        return 'No leído';
      default:
        return message.status;
    }
  };

  return (
    <div className="chat-container">
      {/* Panel de Materias */}
      <div className={`subjects-panel ${!showSubjects && 'subjects-panel-collapsed'}`}>
        <div className="subjects-header">
          <h2>Materias</h2>
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
              <MessageItem key={message._id || index} message={message} />
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
