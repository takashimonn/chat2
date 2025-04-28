import React, { useEffect, useState } from 'react';
import '../styles/Alumnos.css';

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

  useEffect(() => {
    // Simulación: obtener el tipo de usuario desde localStorage o API
    const tipo = localStorage.getItem('role') || 'maestro';
    setUserType(tipo);
    setCardColors(getRandomColors(3));
  }, []);

  if (userType !== 'maestro') {
    return <div className="alumnos-container"><h2>No tienes acceso a esta sección.</h2></div>;
  }

  return (
    <div className="alumnos-container">
      <h1>Alumnos</h1>
      <div className="alumnos-cards">
        {cardColors.map((color, idx) => (
          <div className="alumno-card" style={{ background: color }} key={idx}>
            <h2>{idx === 0 ? 'Registro de Alumnos' : `Tarjeta ${idx + 1}`}</h2>
            <p>{idx === 0 ? 'Aquí puedes registrar nuevos alumnos en el sistema.' : `Contenido de ejemplo para la tarjeta ${idx + 1}.`}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Alumnos; 