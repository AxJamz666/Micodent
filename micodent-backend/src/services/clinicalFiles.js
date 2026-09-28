const fs = require('node:fs');
const path = require('node:path');
const { pipeline } = require('node:stream');
const { SecurityError, sendSecurityError } = require('../utils/securityError');

const types = new Map([['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'], ['.png', 'image/png'],
  ['.gif', 'image/gif'], ['.webp', 'image/webp'], ['.pdf', 'application/pdf']]);
const missing = () => new SecurityError(404, 'CLINICAL_FILE_UNAVAILABLE', 'Archivo no disponible.');

function storedName(value) {
  const match = typeof value === 'string' && /^\/uploads\/([^/\\\x00-\x1f:%?#]+)$/.exec(value);
  const name = match?.[1];
  if (!name || /[. ]$/.test(name) || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(name)
      || !types.has(path.extname(name).toLowerCase())) throw missing();
  return name;
}

function clinicalFileHandler({ db, root }) {
  return async (req, res) => {
    res.set({ 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox", 'Cross-Origin-Resource-Policy': 'same-origin' });
    let file;
    try {
      if (!/^[1-9][0-9]*$/.test(req.params.id) || !Number.isSafeInteger(Number(req.params.id))) throw missing();
      const [rows] = await db.execute(`SELECT r.url_archivo FROM radiografias r
        INNER JOIN historias_clinicas h ON h.id=r.historia_id
        LEFT JOIN radiografias_anulaciones a ON a.radiografia_id=r.id AND a.restaurada_en IS NULL
        WHERE r.id=? AND a.radiografia_id IS NULL`, [req.params.id]);
      if (rows.length !== 1) throw missing();
      const name = storedName(rows[0].url_archivo);
      const directory = await fs.promises.lstat(root);
      if (!directory.isDirectory() || directory.isSymbolicLink()) throw missing();
      const canonicalRoot = await fs.promises.realpath(root);
      const target = path.join(canonicalRoot, name);
      const stat = await fs.promises.lstat(target);
      if (!stat.isFile() || stat.isSymbolicLink() || path.dirname(await fs.promises.realpath(target)) !== canonicalRoot) throw missing();
      file = await fs.promises.open(target, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
      const opened = await file.stat();
      if (!opened.isFile() || opened.ino !== stat.ino || opened.dev !== stat.dev) throw missing();
      const ext = path.extname(name).toLowerCase();
      res.set({ 'Content-Type': types.get(ext), 'Content-Length': String(opened.size),
        'Content-Disposition': `attachment; filename="anexo-${req.params.id}${ext}"` });
      const stream = file.createReadStream();
      file = null; // The stream owns and closes the already-verified descriptor.
      pipeline(stream, res, () => {});
    } catch (error) {
      if (file) await file.close().catch(() => {});
      if (res.headersSent) { res.destroy(); return; }
      if (['ENOENT', 'ENOTDIR', 'ELOOP', 'EACCES', 'EPERM'].includes(error.code)) error = missing();
      sendSecurityError(res, error);
    }
  };
}
module.exports = { clinicalFileHandler, storedName };
