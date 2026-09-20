const actions = new Set(['LOGIN_OK', 'LOGIN_FAILED', 'LOGOUT', 'LOGOUT_ALL',
  'PASSWORD_CHANGED', 'PASSWORD_RESET', 'PASSWORD_CHECK_FAILED', 'RATE_LIMITED',
  'USER_CREATED', 'USER_SECURITY_CHANGED']);

async function auditSecurity(conn, action, actor = null, target = null) {
  if (!actions.has(action)) throw new Error('INVALID_SECURITY_EVENT');
  await conn.execute('INSERT INTO seguridad_eventos (accion, usuario_id, objetivo_id) VALUES (?, ?, ?)',
    [action, actor, target]);
}

module.exports = { auditSecurity };
