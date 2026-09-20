const security = require('../services/security');
const { SecurityError, sendSecurityError } = require('../utils/securityError');

const verificarToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    const match = typeof header === 'string' && /^Bearer ([^\s]+)$/i.exec(header);
    if (!match) throw new SecurityError(401, 'AUTH_SESSION_INVALID', 'Inicia sesion para continuar.');
    const { auth, user } = await security.authenticate(match[1]);
    req.usuario = user;
    req.auth = auth;
    next();
  } catch (err) { return sendSecurityError(res, err); }
};

const soloAdmin = (req, res, next) => {
  if (!req.usuario?.isAdmin) return res.status(403).json({ ok: false, codigo: 'AUTH_FORBIDDEN', mensaje: 'Se requieren permisos de administrador.' });
  next();
};

const soloDoctor = (req, res, next) => {
  if (req.usuario?.rol !== 'Doctor') return res.status(403).json({ ok: false, codigo: 'AUTH_FORBIDDEN', mensaje: 'Solo el medico tratante puede modificar datos clinicos.' });
  next();
};

module.exports = { verificarToken, soloAdmin, soloDoctor };
