const assert = require('node:assert/strict');
const cookie = require('cookie');
const { COOKIE_NAME } = require('../../src/services/browserTransport');

// Node-only QA client; the browser never reads the HttpOnly cookie or secret.
function headers(base, token) {
  const result = { Origin: new URL(base).origin, 'X-Micodent-Client': 'web', 'Content-Type': 'application/json' };
  if (token) {
    const session = require('../../src/config/browserTransport').session(token);
    Object.assign(result, { Cookie: `${COOKIE_NAME}=${token}`, 'X-Micodent-Session': session.id, 'X-CSRF-Token': session.csrf });
  }
  return result;
}

async function response(result) {
  const body = await result.json();
  assert.equal(Object.hasOwn(body, 'token'), false, 'HTTP JSON must never contain the JWT');
  const token = cookie.parse(result.headers.get('set-cookie') || '')[COOKIE_NAME];
  return { status: result.status, headers: result.headers, body, token };
}
module.exports = { headers, response, COOKIE_NAME };
