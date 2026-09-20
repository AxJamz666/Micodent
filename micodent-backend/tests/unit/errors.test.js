const test = require('node:test');
const assert = require('node:assert/strict');
const { SecurityError, sendSecurityError } = require('../../src/utils/securityError');

function response() { return { status(value) { this.code = value; return this; }, json(value) { this.body = value; return this; } }; }
test('authentication, authorization and unavailable database are different', () => {
  for (const [error, status] of [[new SecurityError(401, 'AUTH_SESSION_INVALID', 'Inicia sesion'), 401],
    [new SecurityError(403, 'AUTH_FORBIDDEN', 'Sin permiso'), 403], [{ code: 'ECONNREFUSED', message: 'confidential' }, 503]]) {
    const res = response(); sendSecurityError(res, error);
    assert.equal(res.code, status); assert.ok(!JSON.stringify(res.body).includes('confidential'));
  }
});
