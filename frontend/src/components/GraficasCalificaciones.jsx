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
        display: true,
        text: 'Estadísticas de Calificaciones',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="text-xl mb-4">Cargando estadísticas...</div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        {error}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Dashboard de Calificaciones</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfica de Pastel - Distribución de Promedios de Tareas */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Distribución de Promedios de Tareas por Materia</h2>
          <div style={{ height: '300px' }}>
            <Pie data={dataPie} options={{ ...options, aspectRatio: 1 }} />
          </div>
        </div>

        {/* Gráfica de Barras - Promedios de Tareas por Materia */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Promedios de Tareas por Materia</h2>
          <div style={{ height: '300px' }}>
            <Bar options={options} data={dataBar} />
          </div>
        </div>

        {/* Gráfica de Barras - Promedios por Tipo de Evaluación */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Promedios por Tipo de Evaluación</h2>
          <div style={{ height: '300px' }}>
            <Bar options={options} data={dataBarTipo} />
          </div>
        </div>

        {/* Tabla de Mejores Promedios */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Top 5 Mejores Promedios en Tareas</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2">Estudiante</th>
                  <th className="px-4 py-2">Promedio</th>
                </tr>
              </thead>
              <tbody>
                {estadisticas.mejoresPromedios.map((estudiante, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="border px-4 py-2">{estudiante.estudiante}</td>
                    <td className="border px-4 py-2">{estudiante.promedio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraficasCalificaciones; 