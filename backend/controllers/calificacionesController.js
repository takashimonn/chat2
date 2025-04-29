const Calificacion = require('../models/Calificacion');
const StudentSubject = require('../models/StudentSubject');
const Subject = require('../models/Subject');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const calificacionesController = {
  getEstadisticas: async (req, res) => {
    try {
      // Obtener todas las calificaciones con población completa
      const calificaciones = await Calificacion.find()
        .populate('subject', 'name')
        .populate('student', 'username email')
        .lean();

      // Obtener todas las materias
      const materias = await Subject.find().lean();

      // Verificar inscripciones
      const inscripciones = await StudentSubject.find()
        .populate('student', 'username')
        .populate('subject', 'name')
        .lean();

      // Filtrar calificaciones solo de estudiantes inscritos
      const calificacionesValidas = calificaciones.filter(cal => 
        inscripciones.some(insc => 
          insc.student._id.toString() === cal.student._id.toString() && 
          insc.subject._id.toString() === cal.subject._id.toString()
        )
      );

      // 1. Datos para gráfica de pastel: Promedios de tareas por materia
      const promediosTareasPorMateria = materias.map(materia => {
        const calificacionesTareas = calificacionesValidas.filter(cal => 
          cal.subject._id.toString() === materia._id.toString() && 
          cal.tipo === 'tarea'
        );

        const promedio = calificacionesTareas.length > 0
          ? (calificacionesTareas.reduce((sum, cal) => sum + cal.calificacion, 0) / calificacionesTareas.length)
          : 0;

        return {
          materia: materia.name,
          promedio: Number(promedio.toFixed(2))
        };
      });

      // Preparar datos para el gráfico de pastel
      const distribucionGeneral = {
        excelente: 0,
        bueno: 0,
        regular: 0,
        deficiente: 0
      };

      // Contar la distribución basada en los promedios de tareas
      promediosTareasPorMateria.forEach(item => {
        if (item.promedio >= 90) distribucionGeneral.excelente++;
        else if (item.promedio >= 80) distribucionGeneral.bueno++;
        else if (item.promedio >= 70) distribucionGeneral.regular++;
        else distribucionGeneral.deficiente++;
      });

      // 2. Datos para gráfica de barras: Promedio por materia (todos los tipos)
      const promediosPorMateria = materias.map(materia => {
        const calificacionesMateria = calificacionesValidas.filter(
          cal => cal.subject._id.toString() === materia._id.toString()
        );

        const promedio = calificacionesMateria.length > 0
          ? (calificacionesMateria.reduce((sum, cal) => sum + cal.calificacion, 0) / calificacionesMateria.length).toFixed(2)
          : 0;

        return {
          materia: materia.name,
          promedio: Number(promedio)
        };
      });

      // 3. Datos para gráfica de barras: Promedio por tipo de evaluación
      const promediosPorTipo = {};
      ['examen', 'tarea', 'proyecto', 'otro'].forEach(tipo => {
        const calificacionesTipo = calificacionesValidas.filter(cal => cal.tipo === tipo);
        promediosPorTipo[tipo] = calificacionesTipo.length > 0
          ? (calificacionesTipo.reduce((sum, cal) => sum + cal.calificacion, 0) / calificacionesTipo.length).toFixed(2)
          : 0;
      });

      // 4. Datos para tabla: Mejores promedios en tareas
      const mejoresPromedios = [];
      inscripciones.forEach(inscripcion => {
        const calificacionesTareas = calificacionesValidas.filter(
          cal => cal.student._id.toString() === inscripcion.student._id.toString() &&
                cal.tipo === 'tarea'
        );

        if (calificacionesTareas.length > 0) {
          const promedio = (calificacionesTareas.reduce((sum, cal) => sum + cal.calificacion, 0) / calificacionesTareas.length).toFixed(2);
          mejoresPromedios.push({
            estudiante: inscripcion.student.username,
            promedio: Number(promedio)
          });
        }
      });

      // Ordenar mejores promedios de mayor a menor
      mejoresPromedios.sort((a, b) => b.promedio - a.promedio);

      // 5. Estadísticas detalladas por materia y tipo
      const estadisticasPorMateriaTipo = {};
      materias.forEach(materia => {
        const calificacionesMateria = calificacionesValidas.filter(
          cal => cal.subject._id.toString() === materia._id.toString()
        );

        estadisticasPorMateriaTipo[materia.name] = {
          examen: calcularPromedio(calificacionesMateria.filter(cal => cal.tipo === 'examen')),
          tarea: calcularPromedio(calificacionesMateria.filter(cal => cal.tipo === 'tarea')),
          proyecto: calcularPromedio(calificacionesMateria.filter(cal => cal.tipo === 'proyecto')),
          otro: calcularPromedio(calificacionesMateria.filter(cal => cal.tipo === 'otro'))
        };
      });

      res.json({
        distribucionGeneral,
        promediosPorMateria: promediosTareasPorMateria, // Ahora enviamos los promedios de tareas
        promediosPorTipo,
        mejoresPromedios: mejoresPromedios.slice(0, 5),
        estadisticasPorMateriaTipo,
        total: calificacionesValidas.length
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ 
        message: 'Error al obtener estadísticas',
        error: error.message 
      });
    }
  },

  // Agregar una nueva calificación
  agregarCalificacion: async (req, res) => {
    try {
      const { student, subject, calificacion, tipo, comentario } = req.body;

      // Verificar si el estudiante está inscrito en la materia
      const inscripcion = await StudentSubject.findOne({
        student,
        subject
      });

      if (!inscripcion) {
        return res.status(400).json({
          message: 'El estudiante no está inscrito en esta materia'
        });
      }

      // Crear la nueva calificación
      const nuevaCalificacion = new Calificacion({
        student,
        subject,
        calificacion,
        tipo,
        comentario
      });

      await nuevaCalificacion.save();

      res.status(201).json({
        message: 'Calificación agregada exitosamente',
        calificacion: nuevaCalificacion
      });
    } catch (error) {
      console.error('Error al agregar calificación:', error);
      res.status(500).json({ message: 'Error al agregar calificación' });
    }
  },

  // Agregar datos de prueba
  agregarDatosPrueba: async (req, res) => {
    try {
      // 1. Crear materias de prueba si no existen
      const materias = await Promise.all([
        Subject.findOneAndUpdate(
          { name: 'Matemáticas' },
          { name: 'Matemáticas' },
          { upsert: true, new: true }
        ),
        Subject.findOneAndUpdate(
          { name: 'Física' },
          { name: 'Física' },
          { upsert: true, new: true }
        ),
        Subject.findOneAndUpdate(
          { name: 'Programación' },
          { name: 'Programación' },
          { upsert: true, new: true }
        )
      ]);

      // 2. Crear estudiantes de prueba si no existen
      const hashedPassword = await bcrypt.hash('123456', 10);
      const estudiantes = await Promise.all([
        User.findOneAndUpdate(
          { email: 'estudiante1@test.com' },
          { 
            username: 'Estudiante 1',
            email: 'estudiante1@test.com',
            password: hashedPassword,
            role: 'alumno'
          },
          { upsert: true, new: true }
        ),
        User.findOneAndUpdate(
          { email: 'estudiante2@test.com' },
          {
            username: 'Estudiante 2',
            email: 'estudiante2@test.com',
            password: hashedPassword,
            role: 'alumno'
          },
          { upsert: true, new: true }
        )
      ]);

      // 3. Crear inscripciones si no existen
      for (const estudiante of estudiantes) {
        for (const materia of materias) {
          await StudentSubject.findOneAndUpdate(
            { student: estudiante._id, subject: materia._id },
            { student: estudiante._id, subject: materia._id },
            { upsert: true }
          );
        }
      }

      // 4. Crear calificaciones de prueba
      const tiposEvaluacion = ['examen', 'tarea', 'proyecto'];
      const calificacionesPrueba = [];

      for (const estudiante of estudiantes) {
        for (const materia of materias) {
          for (const tipo of tiposEvaluacion) {
            // Generar calificación aleatoria entre 60 y 100
            const calificacion = Math.floor(Math.random() * (100 - 60 + 1)) + 60;
            
            calificacionesPrueba.push({
              student: estudiante._id,
              subject: materia._id,
              calificacion,
              tipo,
              comentario: `Calificación de prueba para ${tipo}`
            });
          }
        }
      }

      // Eliminar calificaciones existentes y agregar nuevas
      await Calificacion.deleteMany({});
      await Calificacion.insertMany(calificacionesPrueba);

      res.json({
        message: 'Datos de prueba agregados exitosamente',
        materias: materias.length,
        estudiantes: estudiantes.length,
        calificaciones: calificacionesPrueba.length
      });
    } catch (error) {
      console.error('Error al agregar datos de prueba:', error);
      res.status(500).json({ 
        message: 'Error al agregar datos de prueba',
        error: error.message 
      });
    }
  }
};

// Función auxiliar para calcular promedios
function calcularPromedio(calificaciones) {
  if (calificaciones.length === 0) return 0;
  return Number((calificaciones.reduce((sum, cal) => sum + cal.calificacion, 0) / calificaciones.length).toFixed(2));
}

module.exports = calificacionesController; 