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
    const [rows] = await db.query('SELECT activo, rol, nivel, is_admin FROM usuarios WHERE id = ?', [decoded.id]);
    if (rows.length === 0 || !rows[0].activo) {
      return res.status(401).json({ ok: false, mensaje: 'Tu acceso ha sido revocado. Contacta al administrador.' });
    }

    req.usuario = { ...decoded, rol: rows[0].rol, nivel: rows[0].nivel, isAdmin: Number(rows[0].is_admin) === 1 };
    next();
  } catch (err) {
    const invalid = ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(err.name);
    return res.status(invalid ? 401 : 503).json({ ok: false, mensaje: invalid ? 'Sesión inválida o expirada.' : 'No se pudo verificar la sesión. Intenta nuevamente.' });
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
