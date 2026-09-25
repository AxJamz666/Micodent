const crypto = require('node:crypto');
const { RateLimiterMySQL, RateLimiterRes } = require('rate-limiter-flexible');
const db = require('../config/db');
const { normalizeUserId } = require('../services/password.service');
const { sendSecurityError } = require('../utils/securityError');
const { auditSecurity } = require('../utils/auditoriaSeguridad');

function limiter(prefix, points) {
  return new RateLimiterMySQL({ storeClient: db.pool, storeType: 'pool',
    dbName: 'micodent_dev', tableName: 'seguridad_intentos', tableCreated: true,
    clearExpiredByTimeout: false, keyPrefix: prefix, points, duration: 900, blockDuration: 900 });
}

const ipLimiter = limiter('auth-ip', 100);
const accountLimiter = limiter('auth-account', 20);
const reauthLimiter = limiter('auth-reauth', 10);
const hashKey = value => crypto.createHash('sha256').update(value).digest('hex');

function limitAuthentication(kind) {
  return async (req, res, next) => {
    try {
      await ipLimiter.consume(hashKey(req.ip));
      const id = kind === 'login' ? normalizeUserId(req.body?.id) : req.usuario.id;
      await (kind === 'login' ? accountLimiter : reauthLimiter).consume(hashKey(id));
      next();
    } catch (err) {
      if (err instanceof RateLimiterRes) {
        // Record only the first rejected request per window; floods must not create unbounded audit rows.
        if ([11, 21, 101].includes(err.consumedPoints)) {
          try { await auditSecurity(db, 'RATE_LIMITED', req.usuario?.id || null); }
          catch (auditError) { return sendSecurityError(res, auditError); }
        }
        res.set('Retry-After', String(Math.max(1, Math.ceil(err.msBeforeNext / 1000))));
        return res.status(429).json({ ok: false, codigo: 'AUTH_RATE_LIMIT',
          mensaje: 'Demasiados intentos. Espera antes de volver a intentarlo.' });
      }
      return sendSecurityError(res, err);
    }
  };
}

module.exports = { limitAuthentication };
