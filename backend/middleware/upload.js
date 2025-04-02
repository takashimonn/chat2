const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurarse de que los directorios existan
const createUploadDirs = () => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const submissionsDir = path.join(uploadsDir, 'submissions');
  const tasksDir = path.join(uploadsDir, 'tasks');

  [uploadsDir, submissionsDir, tasksDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Directorio creado: ${dir}`);
    }
  });
};

// Crear los directorios al iniciar
createUploadDirs();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const baseDir = path.join(__dirname, '..');
    const isSubmission = req.originalUrl.includes('submissions');
    const uploadPath = isSubmission ? 
      path.join(baseDir, 'uploads', 'submissions') : 
      path.join(baseDir, 'uploads', 'tasks');
    
    console.log('Guardando archivo en:', uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + path.extname(file.originalname);
    console.log('Nombre del archivo:', filename);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    console.log('Archivo recibido:', file);
    cb(null, true);
  }
});

module.exports = upload; 