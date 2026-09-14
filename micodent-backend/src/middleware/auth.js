const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const verificarToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ ok: false, mensaje: 'Acceso denegado. Token no proporcionado.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validación en tiempo real: si un admin revoca el acceso, el bloqueo aplica
    // desde el siguiente clic, sin esperar a que expire el token (hasta 8h).
    const [rows] = await db.query('SELECT activo FROM usuarios WHERE id = ?', [decoded.id]);
    if (rows.length === 0 || !rows[0].activo) {
      return res.status(401).json({ ok: false, mensaje: 'Tu acceso ha sido revocado. Contacta al administrador.' });
    }

    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ ok: false, mensaje: 'Token inválido o expirado.' });
  }
};

const soloAdmin = (req, res, next) => {
  if (!req.usuario?.isAdmin) {
    return res.status(403).json({ ok: false, mensaje: 'Se requieren permisos de administrador.' });
  }
  next();
};

// ✅ NUEVO: Solo doctores pueden guardar datos clínicos
const soloDoctor = (req, res, next) => {
  if (req.usuario?.rol !== 'Doctor') {
    return res.status(403).json({
      ok: false,
      mensaje: 'Solo el médico tratante puede modificar datos clínicos.'
    });
  }
  next();
};

module.exports = { verificarToken, soloAdmin, soloDoctor };