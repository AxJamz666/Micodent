const db     = require('../config/db');
const validRate = value => value == null || value === '' || (/^\d{1,3}(\.\d{1,2})?$/.test(String(value)) && Number(value) <= 100);
const security = require('../services/security');
const passwords = require('../services/password.service');
const { auditSecurity } = require('../utils/auditoriaSeguridad');
const { SecurityError, sendSecurityError } = require('../utils/securityError');

function compareUserIds(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

// GET /api/usuarios
const getUsuarios = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, nombre, nombre_completo, prefix, gender, rol, is_admin,
      nivel, dni, telefono, email, especialidad, cop, direccion, activo, comision_porcentaje
      FROM usuarios ORDER BY nivel DESC, nombre_completo ASC`
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('USERS_READ_FAILED', err?.code === 'ECONNREFUSED' ? 'CONNECTION_REFUSED' : 'OPERATION_FAILED');
    res.status(500).json({ ok: false, mensaje: 'Error al obtener usuarios.' });
  }
};

// POST /api/usuarios
const crearUsuario = async (req, res) => {
  try {
    const { id, password, nombre, nombre_completo, prefix, gender,
      rol, dni, telefono, email, especialidad, cop, direccion, nivel, comision_porcentaje } = req.body || {};
    const normalizedId = passwords.normalizeUserId(id);
    passwords.validateNewPassword(password);
    if (!validRate(comision_porcentaje)) throw new SecurityError(400, 'INVALID_RATE', 'Porcentaje de comision invalido.');
    if (!nombre || !['Doctor', 'Administradora', 'Asistente'].includes(rol)) {
      throw new SecurityError(400, 'INVALID_USER_DATA', 'Faltan datos requeridos del usuario.');
    }
    const requestedLevel = nivel === undefined ? 1 : Number(nivel);
    if (![1, 2].includes(requestedLevel)) throw new SecurityError(400, 'INVALID_LEVEL', 'Nivel de acceso invalido.');
    const hash = await passwords.hashPassword(password);
    await security.transaction(async conn => {
      const actor = await security.loadUser(conn, req.usuario.id, true);
      await security.assertSession(conn, req.auth, actor);
      if (!actor.is_admin) throw new SecurityError(403, 'AUTH_FORBIDDEN', 'Se requieren permisos de administrador.');
      const finalLevel = actor.nivel >= 3 ? requestedLevel : 1;
      await conn.query(
        `INSERT INTO usuarios (id, password_hash, nombre, nombre_completo, prefix, gender,
          rol, is_admin, nivel, dni, telefono, email, especialidad, cop, direccion, comision_porcentaje)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [normalizedId, hash, nombre, nombre_completo, prefix, gender, rol, finalLevel >= 2,
          finalLevel, dni, telefono, email, especialidad, cop, direccion,
          comision_porcentaje === '' ? null : comision_porcentaje ?? null]);
      await auditSecurity(conn, 'USER_CREATED', actor.id, normalizedId);
    });
    res.status(201).json({ ok: true, mensaje: 'Personal registrado exitosamente.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ ok: false, mensaje: 'Este ID de acceso ya existe.' });
    return sendSecurityError(res, err);
  }
};

// PUT /api/usuarios/:id
const editarUsuario = async (req, res) => {
  try {
    const id = passwords.normalizeUserId(req.params.id);
    if (Object.hasOwn(req.body || {}, 'password')) {
      throw new SecurityError(400, 'PASSWORD_DEDICATED_FLOW', 'Utiliza el cambio personal o el restablecimiento protegido de contrasena.');
    }
    const { nombre, nombre_completo, prefix, gender, rol,
      dni, telefono, email, especialidad, cop, direccion, comision_porcentaje, nivel } = req.body || {};
    if (!['Doctor', 'Administradora', 'Asistente'].includes(rol)) {
      throw new SecurityError(400, 'INVALID_USER_DATA', 'Rol de usuario invalido.');
    }
    if (!validRate(comision_porcentaje)) throw new SecurityError(400, 'INVALID_RATE', 'Porcentaje de comision invalido.');
    await security.transaction(async conn => {
      const locked = new Map();
      for (const userId of [...new Set([req.usuario.id, id])].sort(compareUserIds)) {
        locked.set(userId, await security.loadUser(conn, userId, true));
      }
      const actor = await security.assertSession(conn, req.auth, locked.get(req.usuario.id));
      const target = locked.get(id);
      if (!target) throw new SecurityError(404, 'USER_NOT_FOUND', 'Usuario no encontrado.');
      const self = actor.id === target.id;
      if (!actor.is_admin || (!self && actor.nivel <= target.nivel)) {
        throw new SecurityError(403, 'AUTH_FORBIDDEN', 'No puedes editar a un usuario de igual o mayor nivel.');
      }
      if (self && rol !== target.rol) {
        throw new SecurityError(403, 'AUTH_FORBIDDEN', 'No puedes cambiar tu propio rol.');
      }
      const requestedLevel = nivel === undefined ? target.nivel : Number(nivel);
      if (!self && ![1, 2].includes(requestedLevel)) throw new SecurityError(400, 'INVALID_LEVEL', 'Nivel de acceso invalido.');
      const finalLevel = self || actor.nivel < 3 ? target.nivel : requestedLevel;
      const finalAdmin = self ? target.is_admin : finalLevel >= 2;
      await conn.query(
        `UPDATE usuarios SET nombre = ?, nombre_completo = ?, prefix = ?, gender = ?, rol = ?,
          dni = ?, telefono = ?, email = ?, especialidad = ?, cop = ?,
          direccion = ?, comision_porcentaje = ?, nivel = ?, is_admin = ? WHERE id = ?`,
        [nombre, nombre_completo, prefix, gender, rol, dni, telefono, email, especialidad, cop,
          direccion, comision_porcentaje === '' ? null : comision_porcentaje ?? null,
          finalLevel, finalAdmin, target.id]);
      if (target.rol !== rol || target.nivel !== finalLevel || Boolean(target.is_admin) !== Boolean(finalAdmin)) {
        await security.revokeUser(conn, target.id);
        await auditSecurity(conn, 'USER_SECURITY_CHANGED', actor.id, target.id);
      }
    });
    res.json({ ok: true, mensaje: 'Personal actualizado correctamente.' });
  } catch (err) { return sendSecurityError(res, err); }
};

// DELETE /api/usuarios/:id
const eliminarUsuario = async (req, res) => {
  try {
    const id = passwords.normalizeUserId(req.params.id);
    await security.transaction(async conn => {
      const locked = new Map();
      for (const userId of [...new Set([req.usuario.id, id])].sort(compareUserIds)) {
        locked.set(userId, await security.loadUser(conn, userId, true));
      }
      const actor = await security.assertSession(conn, req.auth, locked.get(req.usuario.id));
      const target = locked.get(id);
      if (!target) throw new SecurityError(404, 'USER_NOT_FOUND', 'Usuario no encontrado.');
      if (!actor.is_admin || actor.id === target.id || actor.nivel <= target.nivel) {
        throw new SecurityError(403, 'AUTH_FORBIDDEN', 'No puedes desactivar el acceso de este usuario.');
      }
      if (!target.activo) throw new SecurityError(409, 'USER_INACTIVE', 'El acceso ya esta desactivado.');
      await conn.execute('UPDATE usuarios SET activo = 0 WHERE id = ?', [target.id]);
      await security.revokeUser(conn, target.id);
      await auditSecurity(conn, 'USER_DEACTIVATED', actor.id, target.id);
    });
    res.json({ ok: true, mensaje: 'Acceso desactivado correctamente.' });
  } catch (err) { return sendSecurityError(res, err); }
};

// PUT /api/usuarios/cambiar-password
const cambiarPassword = async (req, res) => {
  try {
    await security.changePassword(req.auth, req.body?.passwordActual, req.body?.passwordNuevo);
    res.json({ ok: true, requiereLogin: true, mensaje: 'Contrasena actualizada. Inicia sesion nuevamente.' });
  } catch (err) { return sendSecurityError(res, err); }
};

// POST /api/usuarios/reset-password
const resetPassword = async (req, res) => {
  try {
    await security.resetPassword(req.auth, req.body?.targetUserId, req.body?.adminPassword, req.body?.nuevaPassword);
    res.json({ ok: true, mensaje: 'Contrasena restablecida. Las sesiones anteriores fueron revocadas.' });
  } catch (err) { return sendSecurityError(res, err); }
};

const reactivarUsuario = async (req, res) => {
  try {
    await security.reactivateUser(req.auth, req.params.id, req.body?.adminPassword, req.body?.nuevaPassword);
    res.json({ ok: true, mensaje: 'Acceso reactivado con una contrasena nueva.' });
  } catch (err) { return sendSecurityError(res, err); }
};

// PUT /api/usuarios/mi-firma-sello (autoservicio, cualquier usuario logueado edita SOLO su propia fila)
const actualizarFirmaSello = async (req, res) => {
  try {
    const body = req.body || {};
    await security.transaction(async conn => {
      const user = await security.loadUser(conn, req.usuario.id, true);
      await security.assertSession(conn, req.auth, user);
      const [[current]] = await conn.execute(
        'SELECT firma_digital, sello_digital FROM usuarios WHERE id = ?', [user.id]);
      const firma = Object.hasOwn(body, 'firma_digital') ? body.firma_digital || null : current.firma_digital;
      const sello = Object.hasOwn(body, 'sello_digital') ? body.sello_digital || null : current.sello_digital;
      if (firma === current.firma_digital && sello === current.sello_digital) return;
      await conn.execute('UPDATE usuarios SET firma_digital = ?, sello_digital = ? WHERE id = ?',
        [firma, sello, user.id]);
      await auditSecurity(conn, 'USER_SIGNING_ASSETS_CHANGED', user.id, user.id);
    });

    res.json({ ok: true, mensaje: 'Firma y sello actualizados correctamente.' });
  } catch (err) { return sendSecurityError(res, err); }
};

// GET /api/usuarios/doctores — lista simplificada de doctores activos, abierta a cualquier rol (para agendar citas)
const getDoctores = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, nombre_completo, prefix, especialidad FROM usuarios WHERE rol = 'Doctor' AND activo = 1 ORDER BY nombre_completo ASC`
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('DOCTORS_READ_FAILED', err?.code === 'ECONNREFUSED' ? 'CONNECTION_REFUSED' : 'OPERATION_FAILED');
    res.status(500).json({ ok: false, mensaje: 'Error al obtener doctores.' });
  }
};

module.exports = {
  getUsuarios, crearUsuario, editarUsuario, eliminarUsuario,
  cambiarPassword, resetPassword, reactivarUsuario, actualizarFirmaSello, getDoctores
};
