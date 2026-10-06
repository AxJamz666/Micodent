const { createCookieApp } = require('./cookie-app.cjs');
const f = createCookieApp();
const db = require.cache[require.resolve('../../src/config/db')].exports;
const originalExecute = db.execute;
const initialUsers = structuredClone([...f.users]);
const state = { locks: [], writes: [], events: [], began: 0, committed: 0, rolledBack: 0,
  released: 0, query: null, failWrite: false };

db.execute = async (sql, params) => {
  if (sql.startsWith('SELECT ') && sql.endsWith(' FOR UPDATE') && sql.includes('FROM usuarios')) state.locks.push(params[0]);
  if (sql.startsWith('INSERT INTO seguridad_eventos')) {
    state.events.push(params.slice());
    return [{ affectedRows: 1 }];
  }
  if (sql.startsWith('SELECT firma_digital')) {
    const row = f.users.get(params[0]);
    return [[{ firma_digital: row.firma_digital ?? null, sello_digital: row.sello_digital ?? null }]];
  }
  if (sql.startsWith('UPDATE usuarios SET firma_digital')) {
    state.writes.push({ kind: 'assets', id: params[2] });
    Object.assign(f.users.get(params[2]), { firma_digital: params[0], sello_digital: params[1] });
    return [{ affectedRows: 1 }];
  }
  if (sql.startsWith('UPDATE usuarios SET activo')) {
    state.writes.push({ kind: 'deactivate', id: params[0] });
    f.users.get(params[0]).activo = 0;
    return [{ affectedRows: 1 }];
  }
  const result = await originalExecute(sql, params);
  if (sql.startsWith('UPDATE usuarios SET password_hash') && sql.includes('activo = 1')) f.users.get(params[1]).activo = 1;
  return result;
};
db.query = async (sql, params) => {
  if (sql.startsWith('UPDATE usuarios SET nombre')) {
    if (state.failWrite) throw Object.assign(new Error('SYNTHETIC_WRITE_FAILURE'), { code: 'ER_TEST_FAILURE' });
    state.writes.push({ kind: 'edit', id: params[14], rol: params[4], nivel: params[12] });
    Object.assign(f.users.get(params[14]), { rol: params[4], nivel: params[12], is_admin: params[13] });
    return [{ affectedRows: 1 }];
  }
  if (state.query) return state.query(sql, params);
  throw new Error('UNEXPECTED_COVERAGE_DB_QUERY');
};
db.getConnection = async () => {
  let users, sessions;
  return {
    execute: (...args) => db.execute(...args),
    query: (...args) => db.query(...args),
    async beginTransaction() { state.began++; users = structuredClone([...f.users]); sessions = structuredClone([...f.sessions]); },
    async commit() { state.committed++; },
    async rollback() {
      state.rolledBack++;
      f.users.clear(); for (const [key, value] of users) f.users.set(key, value);
      f.sessions.clear(); for (const [key, value] of sessions) f.sessions.set(key, value);
    },
    release() { state.released++; },
  };
};
function reset() {
  f.users.clear();
  for (const [key, value] of structuredClone(initialUsers)) f.users.set(key, value);
  f.sessions.clear();
  Object.assign(state, { locks: [], writes: [], events: [], began: 0, committed: 0, rolledBack: 0,
    released: 0, query: null, failWrite: false });
  f.flags.unavailable = false;
}
async function actor(id = 'one', level = 3) {
  Object.assign(f.users.get(id), { nivel: level, is_admin: level >= 2 });
  const login = await f.service.login(id, f.password);
  const { auth } = await f.service.authenticate(login.token);
  state.locks.length = 0;
  state.events.length = 0;
  return { usuario: { id }, auth };
}
function response() {
  return { code: 200, body: null, status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; } };
}
module.exports = { f, state, reset, actor, response };
