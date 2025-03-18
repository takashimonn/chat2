import { useState } from 'react';
import './MessageItem.css';

const MessageItem = ({ message, onStatusChange }) => {
  const [showOptions, setShowOptions] = useState(false);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'visto':
        return '👁️'; // Icono de visto
      case 'no_leido':
        return '○'; // Círculo vacío
      case 'respondido':
        return '↩️'; // Icono de respuesta
      case 'en_espera':
        return '⏳'; // Icono de espera
      default:
        return '○';
    }
  };

  const getStatusClass = (status) => {
    return `message-status ${status}`;
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await fetch(`http://localhost:4000/api/messages/${message._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        onStatusChange(message._id, newStatus);
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  return (
    <div className={`message ${message.sender === localStorage.getItem('userId') ? 'sent' : 'received'}`}>
      <div className="message-content">
        <p>{message.content}</p>
        <div className="message-footer">
          <span className="message-time">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          <div 
            className="message-status-container"
            onMouseEnter={() => setShowOptions(true)}
            onMouseLeave={() => setShowOptions(false)}
          >
            <span className={getStatusClass(message.status)}>
              {getStatusIcon(message.status)}
            </span>
            
            {showOptions && (
              <div className="status-options">
                <button onClick={() => handleStatusChange('no_leido')}>
                  ○ No leído
                </button>
                <button onClick={() => handleStatusChange('visto')}>
                  👁️ Visto
                </button>
                <button onClick={() => handleStatusChange('respondido')}>
                  ↩️ Respondido
                </button>
                <button onClick={() => handleStatusChange('en_espera')}>
                  ⏳ En espera
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem; 