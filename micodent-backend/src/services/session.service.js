const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const { SecurityError } = require('../utils/securityError');
const passwords = require('./password.service');
const { auditSecurity } = require('../utils/auditoriaSeguridad');

const invalidSession = () => new SecurityError(401, 'AUTH_SESSION_INVALID', 'La sesion ya no es valida. Inicia sesion nuevamente.');
const digest = token => crypto.createHash('sha256').update(token).digest();
const USER_FIELDS = 'id, password_hash, auth_version, activo, nivel, is_admin, rol, nombre, nombre_completo, prefix, gender, especialidad, cop';

function publicUser(user) {
  return { id: user.id, nombre: user.nombre, fullName: user.nombre_completo, rol: user.rol,
    prefix: user.prefix, gender: user.gender, isAdmin: Boolean(user.is_admin), nivel: user.nivel,
    especialidad: user.especialidad || '', cop: user.cop || '' };
}

function createSessionService(db, options, audit = auditSecurity) {
  async function transaction(work) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const result = await work(conn);
      await conn.commit();
      return result;
    } catch (err) {
      try { await conn.rollback(); } catch { /* Preserve the original sanitized failure. */ }
      throw err;
    } finally { conn.release(); }
  }

  async function loadUser(conn, id, lock = false) {
    const [rows] = await conn.execute(`SELECT ${USER_FIELDS} FROM usuarios WHERE id = ?${lock ? ' FOR UPDATE' : ''}`, [id]);
    return rows[0];
  }

  function verifyToken(token) {
    try {
      if (typeof token !== 'string' || token.length > 4096) throw invalidSession();
      const claims = jwt.verify(token, options.secret, { algorithms: ['HS256'],
        issuer: options.issuer, audience: options.audience });
      if (typeof claims.sub !== 'string' || !Number.isInteger(claims.av) || claims.av < 0
          || typeof claims.jti !== 'string' || !/^[a-f0-9]{64}$/.test(claims.jti)
          || !Number.isInteger(claims.exp) || !Number.isInteger(claims.iat)) throw invalidSession();
      return { claims, tokenHash: digest(token) };
    } catch { throw invalidSession(); }
  }

  async function assertSession(conn, auth, lockedUser = null) {
    if (!auth || auth.claims.exp <= Math.floor(Date.now() / 1000)) throw invalidSession();
    const user = lockedUser || await loadUser(conn, auth.claims.sub);
    if (!user || !user.activo || user.auth_version !== auth.claims.av) throw invalidSession();
    const [rows] = await conn.execute(`SELECT usuario_id, auth_version, expira_epoch, revocada_en
      FROM seguridad_sesiones WHERE token_hash = ?`, [auth.tokenHash]);
    const session = rows[0];
    if (!session || session.usuario_id !== user.id || session.auth_version !== user.auth_version
        || session.revocada_en || Number(session.expira_epoch) <= Math.floor(Date.now() / 1000)) throw invalidSession();
    return user;
  }

  async function authenticate(token) {
    const auth = verifyToken(token);
    const user = await assertSession(db, auth);
    return { auth, user: publicUser(user) };
  }

  async function login(rawId, password) {
    const id = passwords.normalizeUserId(rawId);
    passwords.validateCurrentPassword(password);
    const original = await loadUser(db, id);
    const valid = await passwords.verifyPassword(password, original?.password_hash);
    if (!valid || !original?.activo) {
      await audit(db, 'LOGIN_FAILED', null, original?.id || null);
      throw new SecurityError(401, 'AUTH_CREDENTIALS_INVALID', 'ID de usuario o contrasena incorrectos.');
    }
    return transaction(async conn => {
      // Login and credential changes lock the same row so an old password cannot create a new session after a reset.
      const user = await loadUser(conn, original.id, true);
      if (!user?.activo || user.password_hash !== original.password_hash || user.auth_version !== original.auth_version) {
        throw invalidSession();
      }
      const token = jwt.sign({ av: user.auth_version }, options.secret, { algorithm: 'HS256',
        subject: user.id, jwtid: crypto.randomBytes(32).toString('hex'),
        issuer: options.issuer, audience: options.audience, expiresIn: options.expiresIn });
      const { exp } = jwt.decode(token);
      if (!Number.isInteger(exp) || exp <= Math.floor(Date.now() / 1000)) throw new Error('INVALID_TOKEN_LIFETIME');
      await conn.execute('INSERT INTO seguridad_sesiones (token_hash, usuario_id, auth_version, expira_epoch) VALUES (?, ?, ?, ?)',
        [digest(token), user.id, user.auth_version, exp]);
      await audit(conn, 'LOGIN_OK', user.id, user.id);
      return { token, usuario: publicUser(user) };
    });
  }

  async function revokeUser(conn, id) {
    await conn.execute('UPDATE usuarios SET auth_version = auth_version + 1 WHERE id = ?', [id]);
    await conn.execute('UPDATE seguridad_sesiones SET revocada_en = CURRENT_TIMESTAMP(3) WHERE usuario_id = ? AND revocada_en IS NULL', [id]);
  }

  async function logout(auth, all = false) {
    await transaction(async conn => {
      const user = await loadUser(conn, auth.claims.sub, true);
      await assertSession(conn, auth, user);
      if (all) await revokeUser(conn, user.id);
      else await conn.execute('UPDATE seguridad_sesiones SET revocada_en = CURRENT_TIMESTAMP(3) WHERE token_hash = ?', [auth.tokenHash]);
      await audit(conn, all ? 'LOGOUT_ALL' : 'LOGOUT', user.id, user.id);
    });
  }

  async function changePassword(auth, current, next) {
    passwords.validateCurrentPassword(current);
    passwords.validateNewPassword(next);
    const original = await loadUser(db, auth.claims.sub);
    if (!await passwords.verifyPassword(current, original?.password_hash)) {
      await audit(db, 'PASSWORD_CHECK_FAILED', original?.id || null, original?.id || null);
      throw new SecurityError(400, 'PASSWORD_CURRENT_INVALID', 'La contrasena actual es incorrecta.');
    }
    const hash = await passwords.hashPassword(next);
    await transaction(async conn => {
      const user = await loadUser(conn, auth.claims.sub, true);
      await assertSession(conn, auth, user);
      if (user.password_hash !== original.password_hash) throw invalidSession();
      await conn.execute('UPDATE usuarios SET password_hash = ? WHERE id = ?', [hash, user.id]);
      await revokeUser(conn, user.id);
      await audit(conn, 'PASSWORD_CHANGED', user.id, user.id);
    });
  }

  async function resetPassword(auth, rawId, adminPassword, next) {
    const targetId = passwords.normalizeUserId(rawId);
    passwords.validateCurrentPassword(adminPassword);
    passwords.validateNewPassword(next);
    const original = await loadUser(db, auth.claims.sub);
    if (!await passwords.verifyPassword(adminPassword, original?.password_hash)) {
      await audit(db, 'PASSWORD_CHECK_FAILED', original?.id || null, null);
      throw new SecurityError(400, 'PASSWORD_CURRENT_INVALID', 'La contrasena de administrador es incorrecta.');
    }
    const hash = await passwords.hashPassword(next);
    await transaction(async conn => {
      // A stable lock order prevents opposite admin/target operations from acquiring rows in opposite order.
      const ids = [...new Set([auth.claims.sub, targetId])].sort();
      const locked = new Map();
      for (const id of ids) locked.set(id, await loadUser(conn, id, true));
      const actor = await assertSession(conn, auth, locked.get(auth.claims.sub));
      const target = locked.get(targetId);
      if (actor.password_hash !== original.password_hash) throw invalidSession();
      if (!target) throw new SecurityError(404, 'USER_NOT_FOUND', 'Usuario no encontrado.');
      if (!actor.is_admin || actor.id === target.id || actor.nivel <= target.nivel) {
        throw new SecurityError(403, 'AUTH_FORBIDDEN', 'No puedes restablecer la contrasena de este usuario.');
      }
      await conn.execute('UPDATE usuarios SET password_hash = ? WHERE id = ?', [hash, target.id]);
      await revokeUser(conn, target.id);
      await audit(conn, 'PASSWORD_RESET', actor.id, target.id);
    });
  }

  return { login, authenticate, logout, changePassword, resetPassword, transaction, loadUser, assertSession, revokeUser };
}

module.exports = { createSessionService, publicUser };
