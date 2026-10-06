const security = require('../services/security');
const browserTransport = require('../config/browserTransport');
const { sendSecurityError } = require('../utils/securityError');
const { CAPABILITY, hasCapability } = require('../services/accessPolicy');

const verificarToken = async (req, res, next) => {
  try {
    const token = browserTransport.token(req);
    const { auth, user } = await security.authenticate(token);
    req.browserSession = browserTransport.bind(req, token);
    req.usuario = user;
    req.auth = auth;
    next();
  } catch (err) { return sendSecurityError(res, err); }
};

const soloAdmin = (req, res, next) => {
  if (!hasCapability(req.usuario, CAPABILITY.ADMIN)) return res.status(403).json({ ok: false, codigo: 'AUTH_FORBIDDEN', mensaje: 'Se requieren permisos de administrador.' });
  next();
};

const soloDoctor = (req, res, next) => {
  if (!hasCapability(req.usuario, CAPABILITY.CLINICAL_WRITE)) return res.status(403).json({ ok: false, codigo: 'AUTH_FORBIDDEN', mensaje: 'Solo el medico tratante puede modificar datos clinicos.' });
  next();
};

module.exports = { verificarToken, soloAdmin, soloDoctor };
