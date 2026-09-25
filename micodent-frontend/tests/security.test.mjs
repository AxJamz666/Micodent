import test from 'node:test';
import assert from 'node:assert/strict';
import { clearSession, clearMatchingSession, shouldClearSession } from '../src/services/session.js';
import { passwordPolicyError } from '../src/utils/passwordPolicy.js';

test('a 403, network error or 503 never clears a valid session', () => {
  for (const status of [undefined, 403, 503]) assert.equal(shouldClearSession({ response: { status } }, 'current'), false);
});
test('login errors and old responses cannot erase a newer session', () => {
  const error = { response: { status: 401 }, config: { url: '/auth/me', headers: { Authorization: 'Bearer old' } } };
  assert.equal(shouldClearSession(error, 'new'), false);
  assert.equal(shouldClearSession(error, 'old'), true);
  error.config.url = '/auth/login';
  assert.equal(shouldClearSession(error, 'old'), false);
});
test('logout removes only MICODENT authentication keys', () => {
  const store = new Map([['token', 'session'], ['userId', 'user'], ['unrelated', 'keep']]);
  clearSession({ removeItem: key => store.delete(key) });
  assert.deepEqual([...store], [['unrelated', 'keep']]);
});
test('frontend password policy matches server boundaries', () => {
  for (const value of ['', {}, 'short', ' '.repeat(20), 'a'.repeat(73), '\u00e9'.repeat(37)]) assert.ok(passwordPolicyError(value));
  for (const value of ['  Clave de prueba 2026  ', 'a'.repeat(72), '\u00e9'.repeat(36)]) assert.equal(passwordPolicyError(value), null);
});

test('late logout or password response cannot clear a newer login', () => {
  const store = new Map([['token', 'new'], ['userId', 'new-user'], ['unrelated', 'keep']]);
  const storage = { getItem: key => store.get(key) || null, removeItem: key => store.delete(key) };
  assert.equal(clearMatchingSession('old', storage), false);
  assert.equal(store.get('userId'), 'new-user');
  assert.equal(clearMatchingSession('new', storage), true);
  assert.deepEqual([...store], [['unrelated', 'keep']]);
  assert.equal(clearMatchingSession('new', storage), true);
});
