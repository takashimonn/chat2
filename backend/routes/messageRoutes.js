const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

// Aplicar el middleware de autenticación a todas las rutas
router.use(auth);

// Ruta de prueba para verificar que el router está funcionando
router.get('/test', (req, res) => {
  res.json({ message: 'Ruta de mensajes funcionando' });
});

// Rutas para mensajes
router.get('/', messageController.getMessages);
router.post('/', messageController.createMessage);
router.patch('/:messageId/status', messageController.updateMessageStatus);

// Ruta para obtener mensajes por materia
router.get('/subject/:subjectId', messageController.getMessagesBySubject);

// Ruta para marcar como leído
router.post('/subject/:subjectId/read', messageController.markAsRead);

module.exports = router; 