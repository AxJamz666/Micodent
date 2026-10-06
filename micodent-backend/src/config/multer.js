const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const uploadDir = path.join(__dirname, '../uploads');

const allowed = new Map([
  ['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'], ['.png', 'image/png'],
  ['.gif', 'image/gif'], ['.webp', 'image/webp'], ['.pdf', 'application/pdf'],
]);

function createUpload(root) {
  const stagingDir = path.join(root, '.staging');
  fs.mkdirSync(root, { recursive: true });
  const rootStat = fs.lstatSync(root);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new Error('CLINICAL_STORAGE_INVALID');
  fs.mkdirSync(stagingDir, { recursive: true });
  const stagingStat = fs.lstatSync(stagingDir);
  if (!stagingStat.isDirectory() || stagingStat.isSymbolicLink()) throw new Error('CLINICAL_STORAGE_INVALID');
  const storage = {
    _handleFile(req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      const filename = `rad_${crypto.randomUUID()}${ext}`;
      const destination = path.join(stagingDir, filename);
      const output = fs.createWriteStream(destination, { flags: 'wx' });
      let size = 0;
      file.stream.on('data', chunk => { size += chunk.length; });
      require('node:stream').pipeline(file.stream, output, error => {
        if (error) fs.unlink(destination, () => cb(error));
        else cb(null, { destination: stagingDir, filename, path: destination, size });
      });
    },
    _removeFile(req, file, cb) {
      if (!file.path) return cb(null);
      fs.unlink(file.path, error => cb(error?.code === 'ENOENT' ? null : error));
    },
  };

  return multer({
    storage,
    fileFilter(req, file, cb) {
      const expected = allowed.get(path.extname(file.originalname).toLowerCase());
      const valid = Boolean(expected && file.mimetype.toLowerCase() === expected);
      cb(valid ? null : new Error('Formato de archivo no permitido.'), valid);
    },
    limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 2, parts: 3, fieldSize: 2048 },
  });
}

module.exports = { upload: createUpload(uploadDir), uploadDir, createUpload };
