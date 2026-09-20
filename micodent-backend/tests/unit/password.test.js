const test = require('node:test');
const assert = require('node:assert/strict');
const { validateCurrentPassword, validateNewPassword, normalizeUserId, hashPassword, verifyPassword } = require('../../src/services/password.service');

test('new passwords reject empty, wrong types, short and whitespace-only values', () => {
  for (const value of [undefined, null, {}, [], 123, '', 'short', ' '.repeat(20)]) assert.throws(() => validateNewPassword(value));
});
test('policy uses Unicode code points and the UTF-8 bcrypt boundary', () => {
  assert.doesNotThrow(() => validateNewPassword('a'.repeat(72)));
  assert.throws(() => validateNewPassword('a'.repeat(73)));
  assert.doesNotThrow(() => validateNewPassword('\u00e9'.repeat(36)));
  assert.throws(() => validateNewPassword('\u00e9'.repeat(37)));
  assert.throws(() => validateNewPassword('\u{1f600}'.repeat(14)));
  assert.doesNotThrow(() => validateNewPassword('\u{1f600}'.repeat(15)));
});
test('existing passwords keep compatibility without imposing the new minimum', () => {
  assert.doesNotThrow(() => validateCurrentPassword('old'));
  assert.throws(() => validateCurrentPassword('x'.repeat(1025)));
  assert.equal(normalizeUserId('  USER_1  '), 'user_1');
  for (const value of [{}, null, 'x'.repeat(51), "x' OR 1=1"]) assert.throws(() => normalizeUserId(value));
});
test('passwords preserve spaces; plaintext and malformed hashes never authenticate', async () => {
  const value = '  Clave de prueba 2026  ';
  const hash = await hashPassword(value);
  assert.ok(await verifyPassword(value, hash));
  assert.equal(await verifyPassword(value.trim(), hash), false);
  assert.equal(await verifyPassword(value, value), false);
  assert.equal(await verifyPassword(value, '$2-invalid'), false);
});
