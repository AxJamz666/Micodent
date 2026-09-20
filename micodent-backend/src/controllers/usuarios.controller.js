const db     = require('../config/db');
const security = require('../services/security');
const passwords = require('../services/password.service');
const { auditSecurity } = require('../utils/auditoriaSeguridad');
const { SecurityError, sendSecurityError } = require('../utils/securityError');

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
    res.status(500).json({ ok: false, mensaje: 'Error al obtener usuarios.' });
  }
};

// POST /api/usuarios
const crearUsuario = async (req, res) => {
  try {
    const { id, password, nombre, nombre_completo, prefix, gender,
      rol, dni, telefono, email, especialidad, cop, direccion, nivel } = req.body || {};
    const normalizedId = passwords.normalizeUserId(id);
    passwords.validateNewPassword(password);
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
          rol, is_admin, nivel, dni, telefono, email, especialidad, cop, direccion)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [normalizedId, hash, nombre, nombre_completo, prefix, gender, rol, finalLevel >= 2,
          finalLevel, dni, telefono, email, especialidad, cop, direccion]);
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
    await security.transaction(async conn => {
      const locked = new Map();
      for (const userId of [...new Set([req.usuario.id, id])].sort()) {
        locked.set(userId, await security.loadUser(conn, userId, true));
      }
      const actor = await security.assertSession(conn, req.auth, locked.get(req.usuario.id));
      const target = locked.get(id);
      if (!target) throw new SecurityError(404, 'USER_NOT_FOUND', 'Usuario no encontrado.');
      const self = actor.id === target.id;
      if (!actor.is_admin || (!self && actor.nivel <= target.nivel)) {
        throw new SecurityError(403, 'AUTH_FORBIDDEN', 'No puedes editar a un usuario de igual o mayor nivel.');
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
          direccion, comision_porcentaje || null, finalLevel, finalAdmin, target.id]);
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
    const { id }     = req.params;
    const adminNivel = req.usuario.nivel || 1;
    const adminId    = req.usuario.id;

    // No puede eliminarse a sí mismo
    if (id === adminId) {
      return res.status(403).json({ ok: false, mensaje: 'No puedes eliminar tu propio acceso.' });
    }

    // Obtener nivel del target
    const [targetRows] = await db.query('SELECT nivel, nombre_completo FROM usuarios WHERE id = ?', [id]);
    if (targetRows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    }

    const targetNivel = targetRows[0].nivel;

    // Solo puede eliminar usuarios de MENOR nivel
    if (adminNivel <= targetNivel) {
      return res.status(403).json({
        ok: false,
        mensaje: targetNivel >= 3
          ? 'No se puede eliminar a un Superadministrador del sistema.'
          : 'No puedes eliminar a un usuario de igual o mayor nivel que el tuyo.'
      });
    }

    await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
    res.json({ ok: true, mensaje: 'Usuario eliminado correctamente.' });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar usuario.' });
  }
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

// PUT /api/usuarios/mi-firma-sello (autoservicio, cualquier usuario logueado edita SOLO su propia fila)
const actualizarFirmaSello = async (req, res) => {
  try {
    const { firma_digital, sello_digital } = req.body;
    const userId = req.usuario.id;

    await db.query(
      'UPDATE usuarios SET firma_digital = COALESCE(?, firma_digital), sello_digital = COALESCE(?, sello_digital) WHERE id = ?',
      [firma_digital || null, sello_digital || null, userId]
    );

    res.json({ ok: true, mensaje: 'Firma y sello actualizados correctamente.' });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar firma y sello.' });
  }
};

// GET /api/usuarios/doctores — lista simplificada de doctores activos, abierta a cualquier rol (para agendar citas)
const getDoctores = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, nombre_completo, prefix, especialidad FROM usuarios WHERE rol = 'Doctor' AND activo = 1 ORDER BY nombre_completo ASC`
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener doctores.' });
  }
};

module.exports = {
  getUsuarios, crearUsuario, editarUsuario, eliminarUsuario,
  cambiarPassword, resetPassword, actualizarFirmaSello, getDoctores
};
