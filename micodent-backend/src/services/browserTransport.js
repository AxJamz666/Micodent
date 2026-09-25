const crypto = require('node:crypto');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const { SecurityError, sendSecurityError } = require('../utils/securityError');

const COOKIE_NAME = 'micodent_dev_session_v2';
const DEV_ORIGINS = [];
const unsafe = req => !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
const same = (a, b) => typeof a === 'string' && typeof b === 'string' && /^[a-f0-9]{64}$/.test(a) && /^[a-f0-9]{64}$/.test(b)
  && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

function createBrowserTransport({ secret, origins = DEV_ORIGINS }) {
  if (typeof secret !== 'string' || Buffer.byteLength(secret) < 32) throw Error('BROWSER_TRANSPORT_SECRET_REQUIRED');
  const allowed = new Set(origins);
  function session(token) {
    const tag = purpose => crypto.createHmac('sha256', secret).update(`micodent-dev-v2:${purpose}\0${token}`).digest('hex');
    return { id: tag('identity'), csrf: tag('csrf') };
  }
  function token(req) {
    const raw = req.headers.cookie || '';
    if (typeof raw !== 'string' || raw.length > 16384) throw new SecurityError(401, 'AUTH_SESSION_INVALID', 'Inicia sesion nuevamente.');
    // Reject ambiguous duplicates rather than letting cookie order select an account.
    const count = raw.split(';').filter(part => part.trim().split('=', 1)[0] === COOKIE_NAME).length;
    const value = cookie.parse(raw)[COOKIE_NAME];
    if (count !== 1 || !value || value.length > 4096) throw new SecurityError(401, 'AUTH_SESSION_INVALID', 'Inicia sesion nuevamente.');
    return value;
  }
  function boundary(req, res, next) {
    try {
      res.set('Cache-Control', 'no-store');
      const origin = req.headers.origin;
      const host = req.headers.host || '';
      // Same-origin also covers the Vite proxy; never trust forwarded host headers.
      const localHost = /^(localhost|127\.0\.0\.1)(?::([1-9][0-9]{0,4}))?$/.exec(host);
      const validHost = localHost && (!localHost[2] || Number(localHost[2]) <= 65535);
      const permittedOrigin = allowed.has(origin) || (validHost && origin === `http://${host}`);
      if (!validHost || !['localhost', '127.0.0.1'].includes(req.hostname)
          || (origin && !permittedOrigin) || req.headers['sec-fetch-site'] === 'cross-site'
          || (unsafe(req) && (!origin || !permittedOrigin || req.headers['x-micodent-client'] !== 'web'))) {
        throw new SecurityError(403, 'AUTH_ORIGIN_REJECTED', 'Origen de solicitud no permitido.');
      }
      if (req.headers.authorization) throw new SecurityError(401, 'AUTH_TRANSPORT_REQUIRED', 'Actualiza la pagina e inicia sesion nuevamente.');
      next();
    } catch (err) { return sendSecurityError(res, err); }
  }
  function bind(req, value) {
    const current = session(value);
    const initial = req.method === 'GET' && req.originalUrl?.split('?')[0] === '/api/auth/me'
      && req.headers['x-micodent-bootstrap'] === '1' && !req.headers['x-micodent-session'];
    if (req.headers['x-micodent-client'] !== 'web'
        || (!initial && !same(req.headers['x-micodent-session'], current.id))) {
      throw new SecurityError(409, 'AUTH_SESSION_CHANGED', 'La sesion cambio. Vuelve al acceso.');
    }
    if (unsafe(req) && !same(req.headers['x-csrf-token'], current.csrf)) {
      throw new SecurityError(403, 'AUTH_CSRF_INVALID', 'No se pudo verificar la solicitud. Vuelve al acceso.');
    }
    return current;
  }
  function issue(res, value) {
    const exp = jwt.decode(value)?.exp;
    if (!Number.isInteger(exp) || exp <= Date.now() / 1000) throw Error('INVALID_COOKIE_LIFETIME');
    // DEV is bound to loopback HTTP. Production HTTPS needs its own approved deployment policy.
    res.cookie(COOKIE_NAME, value, { httpOnly: true, sameSite: 'strict', secure: false,
      path: '/api', maxAge: Math.max(1, exp * 1000 - Date.now()) });
    return session(value);
  }
  return { boundary, token, bind, issue, session, origins: [...allowed] };
}

module.exports = { createBrowserTransport, COOKIE_NAME, DEV_ORIGINS };
