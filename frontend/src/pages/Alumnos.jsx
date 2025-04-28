import React, { useEffect, useState } from 'react';
import '../styles/Alumnos.css';
import Modal from '../components/ModalAlumno';

const colores = [
  '#FF6F61', // rojo
  '#6B5B95', // morado
  '#88B04B', // verde
  '#F7CAC9', // rosa
  '#92A8D1', // azul
  '#955251', // marrón
  '#B565A7', // violeta
  '#009B77', // verde fuerte
  '#DD4124', // naranja
];

const getRandomColors = (n) => {
  const shuffled = colores.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
};

const Alumnos = () => {
  const [userType, setUserType] = useState('');
  const [cardColors, setCardColors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    // Simulación: obtener el tipo de usuario desde localStorage o API
    const tipo = localStorage.getItem('role') || 'maestro';
    setUserType(tipo);
    setCardColors(getRandomColors(3));
  }, []);

  const handleCardClick = (idx) => {
    if (idx === 0) setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFeedback('');
  };

  const handleRegisterAlumno = async (formData) => {
    try {
      setFeedback('');
      const res = await fetch('http://localhost:4000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback('Alumno registrado exitosamente');
        setTimeout(() => setShowModal(false), 1200);
      } else {
        setFeedback(data.message || 'Error al registrar alumno');
      }
    } catch (err) {
      setFeedback('Error de red');
    }
  };

  if (userType !== 'maestro') {
    return <div className="alumnos-container"><h2>No tienes acceso a esta sección.</h2></div>;
  }

  return (
    <div className="alumnos-container">
      <h1>Alumnos</h1>
      <div className="alumnos-cards">
        {cardColors.map((color, idx) => (
          <div
            className="alumno-card"
            style={{ background: color }}
            key={idx}
            onClick={() => handleCardClick(idx)}
          >
            <h2>{idx === 0 ? 'Registro de Alumnos' : `Tarjeta ${idx + 1}`}</h2>
            <p>{idx === 0 ? 'Aquí puedes registrar nuevos alumnos en el sistema.' : `Contenido de ejemplo para la tarjeta ${idx + 1}.`}</p>
          </div>
        ))}
      </div>
      <Modal
        show={showModal}
        onClose={handleCloseModal}
        onRegister={handleRegisterAlumno}
        feedback={feedback}
      />
    </div>
  );
};

export default Alumnos; 