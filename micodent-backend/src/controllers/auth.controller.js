const db = require('../config/db');
const security = require('../services/security');
const browserTransport = require('../config/browserTransport');
const { sendSecurityError } = require('../utils/securityError');

const login = async (req, res) => {
  try {
    const result = await security.login(req.body?.id, req.body?.password);
    const sesion = browserTransport.issue(res, result.token);
    res.json({ ok: true, usuario: result.usuario, sesion });
  } catch (err) { return sendSecurityError(res, err); }
};

const getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, nombre, nombre_completo, rol, prefix, gender,
       is_admin, nivel, especialidad, cop, dni, telefono, email, direccion,
       firma_digital, sello_digital, comision_porcentaje
       FROM usuarios WHERE id = ?`, [req.usuario.id]);
    if (!rows.length) return res.status(401).json({ ok: false, codigo: 'AUTH_SESSION_INVALID', mensaje: 'Inicia sesion nuevamente.' });
    res.json({ ok: true, usuario: rows[0], sesion: req.browserSession });
  } catch (err) { return sendSecurityError(res, err); }
};

const logout = async (req, res) => {
  try {
    await security.logout(req.auth);
    // Revocation is authoritative. A delayed Set-Cookie deletion could erase
    // a newer login in another tab; leave the now-unusable cookie to expire.
    res.json({ ok: true, mensaje: 'Sesion cerrada.' });
  } catch (err) { return sendSecurityError(res, err); }
};

const logoutAll = async (req, res) => {
  try {
    await security.logout(req.auth, true);
    res.json({ ok: true, mensaje: 'Todas tus sesiones fueron cerradas.' });
  } catch (err) { return sendSecurityError(res, err); }
};

module.exports = { login, getMe, logout, logoutAll };
