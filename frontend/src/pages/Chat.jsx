import { useState, useEffect, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import io from "socket.io-client";
import "../styles/Chat.css";
import axiosInstance from '../utils/axiosConfig';
import React from "react";
import { logout } from '../utils/auth';

// Componente de mensaje individual memo-izado
const MessageItem = memo(({ message: initialMessage, currentUserId, currentUsername, socketRef, onReply }) => {
  const isOwnMessage = initialMessage.sender.username === currentUsername;
  const [message, setMessage] = useState(initialMessage);

  useEffect(() => {
    setMessage(initialMessage);
  }, [initialMessage]);

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "baja":
        return "low_priority";
      case "media":
        return "drag_handle";
      case "urgente":
        return "priority_high";
      default:
        return "drag_handle";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "baja":
        return "#4CAF50";
      case "media":
        return "#2196F3";
      case "urgente":
        return "#f44336";
      default:
        return "#2196F3";
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case "baja":
        return "Baja";
      case "media":
        return "Media";
      case "urgente":
        return "Urgente";
      default:
        return "Media";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "visto":
        return "visibility";
      case "no_leido":
        return "mark_email_unread";
      case "respondido":
        return "reply";
      case "en_espera":
        return "schedule";
      default:
        return "mark_email_unread";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "visto":
        return "#1976d2";
      case "no_leido":
        return "#666";
      case "respondido":
        return "#2e7d32";
      case "en_espera":
        return "#ed6c02";
      default:
        return "#666";
    }
  };

  return (
    <div className={`message ${isOwnMessage ? "sent" : "received"}`}>
      <div className="message-content">
        {message.replyTo && (
          <div className="reply-preview">
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <div className="reply-preview-sender">
                {message.replyTo.sender.username === currentUsername ? "Tú" : message.replyTo.sender.username}
              </div>
              <div className="reply-preview-content">{message.replyTo.content}</div>
            </div>
          </div>
        )}
        {!isOwnMessage && (
          <div className="message-sender">{message.sender.username}</div>
        )}
        <p>{message.content}</p>
        <button 
          className="reply-button"
          onClick={() => onReply(message)}
          title="Responder"
        >
          <span className="material-icons-round">reply</span>
        </button>
        <div className="message-footer">
          {!isOwnMessage && (
            <div className="message-priority" style={{ color: getPriorityColor(message.priority) }}>
              <span className="material-icons-round">{getPriorityIcon(message.priority)}</span>
              <span className="priority-text">{getPriorityText(message.priority)}</span>
            </div>
          )}
          <span className="message-time">
            {new Date(message.createdAt).toLocaleTimeString()}
          </span>
          {isOwnMessage && (
            <div className="message-priority" style={{ color: getPriorityColor(message.priority) }}>
              <span className="material-icons-round">{getPriorityIcon(message.priority)}</span>
              <span className="priority-text">{getPriorityText(message.priority)}</span>
            </div>
          )}
          {isOwnMessage && (
            <div className="message-status-container">
              <div
                className={`message-status ${message.status}`}
                style={{ color: getStatusColor(message.status), cursor: 'default' }}
              >
                <span className="material-icons-round" style={{ fontSize: '16px', marginRight: '4px' }}>
                  {getStatusIcon(message.status)}
                </span>
                {message.status === "visto"
                  ? `Visto (${message.readBy?.filter(username => username !== message.sender.username).length || 0})`
                  : message.status === "respondido"
                  ? "Respondido"
                  : message.status === "en_espera"
                  ? "En espera"
                  : "No leído"}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Componente de formulario de mensajes memo-izado
const MessageForm = memo(({ onSendMessage, replyingTo, onCancelReply }) => {
  const [newMessage, setNewMessage] = useState("");
  const [priority, setPriority] = useState("media");
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    onSendMessage(newMessage.trim(), priority, replyingTo);
    setNewMessage("");
    if (onCancelReply) onCancelReply();
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "baja":
        return "low_priority";
      case "media":
        return "drag_handle";
      case "urgente":
        return "priority_high";
      default:
        return "drag_handle";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "baja":
        return "#4CAF50";
      case "media":
        return "#2196F3";
      case "urgente":
        return "#f44336";
      default:
        return "#2196F3";
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`message-form ${replyingTo ? 'replying' : ''}`}>
      {replyingTo && (
        <div className="reply-preview">
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            <div className="reply-preview-sender">
              Respondiendo a {replyingTo.sender.username}
            </div>
            <div className="reply-preview-content">
              {replyingTo.content}
            </div>
          </div>
          <button
            type="button"
            className="cancel-reply"
            onClick={onCancelReply}
          >
            <span className="material-icons-round">close</span>
          </button>
        </div>
      )}
      <div className="form-controls">
        <div className="priority-selector">
          <button
            type="button"
            className="priority-button"
            onClick={() => setShowPriorityMenu(!showPriorityMenu)}
            style={{ color: getPriorityColor(priority) }}
            title="Prioridad"
          >
            <span className="material-icons-round">
              {getPriorityIcon(priority)}
            </span>
          </button>
          {showPriorityMenu && (
            <div className="priority-menu">
              <div
                className="priority-option"
                onClick={() => {
                  setPriority("baja");
                  setShowPriorityMenu(false);
                }}
              >
                <span className="material-icons-round" style={{ color: "#4CAF50" }}>
                  low_priority
                </span>
                <span>Baja</span>
              </div>
              <div
                className="priority-option"
                onClick={() => {
                  setPriority("media");
                  setShowPriorityMenu(false);
                }}
              >
                <span className="material-icons-round" style={{ color: "#2196F3" }}>
                  drag_handle
                </span>
                <span>Media</span>
              </div>
              <div
                className="priority-option"
                onClick={() => {
                  setPriority("urgente");
                  setShowPriorityMenu(false);
                }}
              >
                <span className="material-icons-round" style={{ color: "#f44336" }}>
                  priority_high
                </span>
                <span>Urgente</span>
              </div>
            </div>
          )}
        </div>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
        />
        <button type="submit" title="Enviar mensaje">
          <span className="material-icons-round">send</span>
        </button>
      </div>
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
  const [priorityFilter, setPriorityFilter] = useState("todos");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const currentUserId = localStorage.getItem("userId");
  const currentUsername = localStorage.getItem("username");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
    const socket = io("http://localhost:4000", {
      auth: {
        token: localStorage.getItem("token"),
      },
    });
    socketRef.current = socket;

    if (selectedSubject) {
      socket.emit('join_subject', selectedSubject.id);
    }

    socket.on('new_message', (newMessage) => {
      if (newMessage.subject === selectedSubject?.id) {
        setMessages(prevMessages => [...prevMessages, newMessage]);
      }
    });

    socket.on('message_status_updated', ({ messageId, newStatus, readBy }) => {
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg._id === messageId 
            ? { ...msg, status: newStatus, readBy: readBy }
            : msg
        )
      );
    });

    return () => {
      if (selectedSubject) {
        socket.emit('leave_subject', selectedSubject.id);
      }
      socket.off('new_message');
      socket.off('message_status_updated');
      socket.disconnect();
    };
  }, [selectedSubject]);

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
    
    try {
      const messagesResponse = await axiosInstance.get(`/messages/subject/${selectedSubject.id}`);
      
      // Filtrar duplicados (esto evita el problema de mensajes duplicados)
      const uniqueMessages = Array.from(
        new Map(messagesResponse.data.map(msg => [msg._id, msg])).values()
      );
      
      // Marcar como leídos inmediatamente
      const messagesToMarkAsRead = uniqueMessages.filter(
        msg => msg.sender.username !== currentUsername && msg.status === 'no_leido'
      );
      
      if (messagesToMarkAsRead.length > 0) {
        // Actualizar en el backend
        await axiosInstance.post(`/messages/subject/${selectedSubject.id}/read`);
        
        // Actualizar en el frontend inmediatamente
        setMessages(uniqueMessages.map(msg => 
          messagesToMarkAsRead.some(m => m._id === msg._id)
            ? { ...msg, status: 'visto' }
            : msg
        ));
      } else {
        setMessages(uniqueMessages);
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content, priority = 'normal') => {
    try {
      const response = await fetch('http://localhost:4000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content,
          subject: selectedSubject.id,
          priority,
          replyTo: replyingTo?._id
        })
      });

      if (!response.ok) {
        throw new Error('Error al enviar mensaje');
      }

      // No necesitas actualizar los mensajes aquí porque Socket.IO lo hará
      setReplyingTo(null);
      
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo enviar el mensaje'
      });
    }
  };

  const handleReply = (message) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
  };

  const getFilterIcon = (filter) => {
    switch (filter) {
      case "todos":
        return "filter_list";
      case "baja":
        return "low_priority";
      case "media":
        return "drag_handle";
      case "urgente":
        return "priority_high";
      default:
        return "filter_list";
    }
  };

  const getFilterColor = (filter) => {
    switch (filter) {
      case "baja":
        return "#4CAF50";
      case "media":
        return "#2196F3";
      case "urgente":
        return "#f44336";
      default:
        return "#757575";
    }
  };

  // Optimizar el filtrado de mensajes usando useMemo
  const filteredMessages = React.useMemo(() => {
    return messages.filter(message => {
      let matchesPriority = priorityFilter === "todos" || message.priority === priorityFilter;
      let matchesSearch = !searchQuery || 
        message.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPriority && matchesSearch;
    });
  }, [messages, priorityFilter, searchQuery]);

  const handleMessageStatusChange = (updatedMessage) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg._id === updatedMessage._id ? updatedMessage : msg
      )
    );
  };

  // Agregar este useEffect después de tus otros useEffects
  useEffect(() => {
    if (selectedSubject && messages.length > 0) {
      // Marcar todos los mensajes como vistos cuando entras a la conversación
      const markMessagesAsRead = async () => {
        try {
          await axiosInstance.post(`/messages/subject/${selectedSubject.id}/read`);
          
          // Actualizar el estado local inmediatamente
          setMessages(prevMessages => 
            prevMessages.map(msg => ({
              ...msg,
              status: msg.sender.username !== currentUsername ? 'visto' : msg.status
            }))
          );
        } catch (error) {
          console.error('Error al marcar mensajes como leídos:', error);
        }
      };

      markMessagesAsRead();
    }
  }, [selectedSubject, messages.length]);

  return (
    <div className="chat-container">
      <div className={`subjects-panel ${!showSubjects ? 'subjects-panel-collapsed' : ''}`}>
        <div className="subjects-header">
          <h2>Materias</h2>

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
            <>
              <div className="chat-header-info">
                <h2>{selectedSubject.name}</h2>
                <p>{selectedSubject.teacher}</p>
              </div>
              <div className="header-actions">
                <div className="search-container">
                  <button
                    className="search-button"
                    onClick={() => setShowSearch(!showSearch)}
                    title="Buscar mensajes"
                  >
                    <span className="material-icons-round">search</span>
                  </button>
                  <div className={`search-input-container ${showSearch ? 'show' : ''}`}>
                    <input
                      type="text"
                      placeholder="Buscar mensajes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                    {searchQuery && (
                      <button
                        className="clear-search"
                        onClick={() => setSearchQuery("")}
                      >
                        <span className="material-icons-round">close</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="filter-selector">
                  <button
                    type="button"
                    className="filter-button"
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    title="Filtrar por prioridad"
                  >
                    <span className="material-icons-round">
                      {getFilterIcon(priorityFilter)}
                    </span>
                    <span className="filter-text">Filtrar</span>
                  </button>
                  {showFilterMenu && (
                    <div className="filter-menu">
                      <div
                        className="filter-option"
                        onClick={() => {
                          setPriorityFilter("todos");
                          setShowFilterMenu(false);
                        }}
                      >
                        <span className="material-icons-round" style={{ color: "#757575" }}>
                          filter_list
                        </span>
                        <span>Todos</span>
                      </div>
                      <div
                        className="filter-option"
                        onClick={() => {
                          setPriorityFilter("baja");
                          setShowFilterMenu(false);
                        }}
                      >
                        <span className="material-icons-round" style={{ color: "#4CAF50" }}>
                          low_priority
                        </span>
                        <span>Baja</span>
                      </div>
                      <div
                        className="filter-option"
                        onClick={() => {
                          setPriorityFilter("media");
                          setShowFilterMenu(false);
                        }}
                      >
                        <span className="material-icons-round" style={{ color: "#2196F3" }}>
                          drag_handle
                        </span>
                        <span>Media</span>
                      </div>
                      <div
                        className="filter-option"
                        onClick={() => {
                          setPriorityFilter("urgente");
                          setShowFilterMenu(false);
                        }}
                      >
                        <span className="material-icons-round" style={{ color: "#f44336" }}>
                          priority_high
                        </span>
                        <span>Urgente</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
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
              ) : filteredMessages.length > 0 ? (
                <>
                  <div style={{ flex: 1 }} />
                  {filteredMessages.map((message) => (
                    <MessageItem 
                      key={message._id} 
                      message={message} 
                      currentUserId={currentUserId}
                      currentUsername={currentUsername}
                      socketRef={socketRef}
                      onReply={handleReply}
                    />
                  ))}
                </>
              ) : (
                <div className="no-results">
                  <div className="empty-state">
                    <span className="material-icons-round message-icon">search_off</span>
                    <p>
                      {searchQuery && priorityFilter !== "todos"
                        ? `No hay mensajes con prioridad "${priorityFilter}" que contengan "${searchQuery}"`
                        : searchQuery
                        ? `No hay mensajes que contengan "${searchQuery}"`
                        : `No hay mensajes con prioridad "${priorityFilter}"`}
                    </p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <MessageForm 
              onSendMessage={handleSendMessage} 
              replyingTo={replyingTo}
              onCancelReply={handleCancelReply}
            />
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
