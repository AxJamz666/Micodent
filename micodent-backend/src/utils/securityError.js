class SecurityError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const unavailableCodes = new Set(['ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET', 'EPIPE',
  'PROTOCOL_CONNECTION_LOST', 'ER_CON_COUNT_ERROR', 'ER_TOO_MANY_USER_CONNECTIONS',
  'ER_NO_SUCH_TABLE', 'ER_BAD_FIELD_ERROR', 'POOL_CLOSED']);

function sendSecurityError(res, err) {
  if (err instanceof SecurityError) {
    return res.status(err.status).json({ ok: false, codigo: err.code, mensaje: err.message });
  }
  if (unavailableCodes.has(err?.code) || /(?:pool is closed|queue limit reached)/i.test(err?.message || '')) {
    return res.status(503).json({ ok: false, codigo: 'AUTH_UNAVAILABLE',
      mensaje: 'El servicio de acceso no esta disponible. Intenta nuevamente.' });
  }
  if (['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'].includes(err?.code)) {
    return res.status(409).json({ ok: false, codigo: 'AUTH_CONFLICT',
      mensaje: 'La operacion coincide con otro cambio. Intenta nuevamente.' });
  }
  // Never serialize a database error: it can contain SQL parameters and credentials.
  console.error('S1A_SECURITY_OPERATION_FAILED');
  return res.status(500).json({ ok: false, codigo: 'AUTH_INTERNAL_ERROR', mensaje: 'No se pudo completar la operacion.' });
}

module.exports = { SecurityError, sendSecurityError };
