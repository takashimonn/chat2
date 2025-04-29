const mongoose = require('mongoose');

const calificacionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  calificacion: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  tipo: {
    type: String,
    enum: ['examen', 'tarea', 'proyecto', 'otro'],
    required: true
  },
  comentario: {
    type: String
  }
});

module.exports = mongoose.model('Calificacion', calificacionSchema); 