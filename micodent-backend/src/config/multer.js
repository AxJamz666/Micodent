const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Crear carpeta uploads si no existe
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext       = path.extname(file.originalname);
    const timestamp = Date.now();
    const nombre    = `rad_${timestamp}${ext}`;
    cb(null, nombre);
  },
});

const fileFilter = (req, file, cb) => {
  const tiposPermitidos = /jpeg|jpg|png|gif|webp|pdf/;
  const esValido = tiposPermitidos.test(
    path.extname(file.originalname).toLowerCase()
  );
  if (esValido) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpg, png, gif, webp) y PDF.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB máximo
});

module.exports = upload;