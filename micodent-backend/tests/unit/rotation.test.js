const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createSessionService } = require('../../src/services/session.service');

// Only synthetic data and an in-memory database double; no environment or MySQL.
const password = 'Synthetic rotation fixture only 2026';
const hash = bcrypt.hashSync(password, 10);
const options = () => ({ secret: crypto.randomBytes(64).toString('hex'),
  issuer: 'rotation-test', audience: 'rotation-test-client', expiresIn: '8h' });

function fixture() {
  const user = { id: 'rotation_fixture', password_hash: hash, auth_version: 3,
    activo: 1, nivel: 2, is_admin: 1, rol: 'Administradora', nombre: 'Synthetic',
    nombre_completo: 'Synthetic Rotation Fixture', prefix: '', gender: 'o' };
  const sessions = new Map(), events = [];
  let reads = 0;
  const db = {
    async execute(sql, params) {
      if (sql.startsWith('SELECT ') && sql.includes('FROM usuarios WHERE id = ?')) {
        reads++;
        return [params[0] === user.id ? [{ ...user }] : []];
      }
      if (sql.startsWith('SELECT ') && sql.includes('FROM seguridad_sesiones WHERE token_hash = ?')) {
        reads++;
        const session = sessions.get(params[0].toString('hex'));
        return [session ? [{ ...session }] : []];
      }
      if (sql.startsWith('INSERT INTO seguridad_sesiones ')) {
        sessions.set(params[0].toString('hex'), { usuario_id: params[1],
          auth_version: params[2], expira_epoch: params[3], revocada_en: null });
        return [{ affectedRows: 1 }];
      }
      throw new Error('UNEXPECTED_SYNTHETIC_QUERY');
    },
    async getConnection() {
      return { execute: db.execute, async beginTransaction() {}, async commit() {},
        async rollback() {}, release() {} };
    },
  };
  return { user, sessions, events, reads: () => reads,
    service: config => createSessionService(db, config, async (_db, event) => events.push(event)) };
}

const invalid = { status: 401, code: 'AUTH_SESSION_INVALID' };

test('rotation rejects a previously registered token before querying user data', async () => {
  const f = fixture(), old = f.service(options());
  const { token } = await old.login(f.user.id, password);
  await old.authenticate(token);
  const readsBefore = f.reads();
  await assert.rejects(f.service(options()).authenticate(token), invalid);
  assert.equal(f.reads(), readsBefore);
  assert.equal(f.sessions.size, 1, 'Historical sessions are preserved, not deleted');
});

test('new-key login preserves password, permissions and version and survives service recreation', async () => {
  const f = fixture(), current = options(), before = { ...f.user };
  const { token } = await f.service(current).login(f.user.id, password);
  const session = await f.service({ ...current }).authenticate(token);
  assert.equal(session.user.rol, 'Administradora');
  assert.equal(session.user.isAdmin, true);
  assert.equal(session.user.nivel, 2);
  assert.deepEqual(f.user, before);
  assert.deepEqual(f.events, ['LOGIN_OK']);
});

test('an old running service retains its key until it is recreated', async () => {
  const f = fixture(), previous = options(), running = f.service(previous);
  const { token } = await running.login(f.user.id, password);
  const replacementConfig = options();
  assert.equal((await running.authenticate(token)).user.id, f.user.id);
  await assert.rejects(f.service(replacementConfig).authenticate(token), invalid);
});

test('restoring the compromised key would reactivate unexpired registered sessions', async () => {
  const f = fixture(), previous = options();
  const { token } = await f.service(previous).login(f.user.id, password);
  await assert.rejects(f.service(options()).authenticate(token), invalid);
  assert.equal((await f.service(previous).authenticate(token)).user.id, f.user.id);
});

test('recovery with a third fresh key rejects both prior generations and permits a fresh login', async () => {
  const f = fixture(), first = f.service(options()), second = f.service(options());
  const one = await first.login(f.user.id, password), two = await second.login(f.user.id, password);
  const recovery = f.service(options());
  await assert.rejects(recovery.authenticate(one.token), invalid);
  await assert.rejects(recovery.authenticate(two.token), invalid);
  const fresh = await recovery.login(f.user.id, password);
  assert.equal((await recovery.authenticate(fresh.token)).user.id, f.user.id);
  assert.equal(f.sessions.size, 3);
});

test('a correctly signed but unregistered new-key token still cannot authenticate', async () => {
  const f = fixture(), current = options();
  const token = jwt.sign({ av: f.user.auth_version, bt: 2 }, current.secret, {
    algorithm: 'HS256', subject: f.user.id, jwtid: crypto.randomBytes(32).toString('hex'),
    issuer: current.issuer, audience: current.audience, expiresIn: '8h' });
  await assert.rejects(f.service(current).authenticate(token), invalid);
});
