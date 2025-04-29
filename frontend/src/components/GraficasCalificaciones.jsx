import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import './GraficasCalificaciones.css';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const estadisticasIniciales = {
  distribucionGeneral: {
    excelente: 0,
    bueno: 0,
    regular: 0,
    deficiente: 0
  },
  promediosPorMateria: [],
  promediosPorTipo: {
    examen: 0,
    tarea: 0,
    proyecto: 0,
    otro: 0
  },
  mejoresPromedios: [],
  estadisticasPorMateriaTipo: {},
  total: 0
};

const GraficasCalificaciones = () => {
  const [estadisticas, setEstadisticas] = useState(estadisticasIniciales);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const inicializarDatos = async () => {
    try {
      setLoading(true);
      // Primero intentamos obtener las estadísticas
      const responseEstadisticas = await axios.get('http://localhost:4000/api/calificaciones/estadisticas');
      
      // Si no hay datos, creamos los datos de prueba
      if (!responseEstadisticas.data || responseEstadisticas.data.total === 0) {
        await axios.post('http://localhost:4000/api/calificaciones/datos-prueba');
        // Volvemos a obtener las estadísticas después de crear los datos
        const newResponse = await axios.get('http://localhost:4000/api/calificaciones/estadisticas');
        setEstadisticas(newResponse.data);
      } else {
        setEstadisticas(responseEstadisticas.data);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error al inicializar datos:', error);
      setError('Error al cargar los datos');
      setLoading(false);
    }
  };

  useEffect(() => {
    inicializarDatos();
  }, []);

  // Datos para la gráfica de pastel
  const dataPie = {
    labels: ['Excelente (90-100)', 'Bueno (80-89)', 'Regular (70-79)', 'Deficiente (<70)'],
    datasets: [
      {
        data: [
          estadisticas.distribucionGeneral.excelente || 0,
          estadisticas.distribucionGeneral.bueno || 0,
          estadisticas.distribucionGeneral.regular || 0,
          estadisticas.distribucionGeneral.deficiente || 0,
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(255, 99, 132, 0.8)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Datos para la gráfica de barras de promedios por materia
  const dataBar = {
    labels: estadisticas.promediosPorMateria.map(item => item.materia),
    datasets: [
      {
        label: 'Promedio de Tareas por Materia',
        data: estadisticas.promediosPorMateria.map(item => item.promedio),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Datos para la gráfica de barras por tipo de evaluación
  const dataBarTipo = {
    labels: Object.keys(estadisticas.promediosPorTipo),
    datasets: [
      {
        label: 'Promedio por Tipo de Evaluación',
        data: Object.values(estadisticas.promediosPorTipo),
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  // Opciones específicas para la gráfica de pastel
  const pieOptions = {
    ...options,
    aspectRatio: 1,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'left',
        align: 'center',
        labels: {
          boxWidth: 15,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: false
      }
    },
    layout: {
      padding: {
        right: 10
      }
    },
    scales: {
      y: {
        display: false
      },
      x: {
        display: false
      }
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="text-xl mb-4 text-gray-700">Cargando estadísticas...</div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
        <p className="font-medium">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard de Calificaciones</h1>
      
      <div className="dashboard-grid">
        {/* Gráfica de Pastel */}
        <div className="card pie-chart-card">
          <h2 className="card-title">Distribución de Promedios</h2>
          <div className="chart-container pie-container">
            <Pie data={dataPie} options={pieOptions} />
          </div>
        </div>

        {/* Gráfica de Barras - Promedios por Materia */}
        <div className="card bar-chart-card">
          <h2 className="card-title">Promedios por Materia</h2>
          <div className="chart-container">
            <Bar options={options} data={dataBar} />
          </div>
        </div>

        {/* Gráfica de Barras - Promedios por Tipo */}
        <div className="card bar-chart-card-2">
          <h2 className="card-title">Promedios por Tipo</h2>
          <div className="chart-container">
            <Bar options={options} data={dataBarTipo} />
          </div>
        </div>

        {/* Tabla de Mejores Promedios */}
        <div className="card table-card">
          <h2 className="card-title">Top 5 Mejores Promedios</h2>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Promedio</th>
              </tr>
            </thead>
            <tbody>
              {estadisticas.mejoresPromedios.map((estudiante, index) => (
                <tr key={index}>
                  <td>{estudiante.estudiante}</td>
                  <td>
                    <span className={`grade-badge ${
                      estudiante.promedio >= 90 ? 'grade-excellent' :
                      estudiante.promedio >= 80 ? 'grade-good' :
                      estudiante.promedio >= 70 ? 'grade-regular' :
                      'grade-deficient'
                    }`}>
                      {estudiante.promedio}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GraficasCalificaciones;