const { createCookieApp } = require('./cookie-app.cjs');

// Replace only the SQL boundary; original controllers and utilities stay loaded.
const f = createCookieApp();
const db = require.cache[require.resolve('../../src/config/db')].exports;
const state = {};
function reset() {
  Object.assign(state, { calls: [], persisted: [], staged: [], acquired: 0, began: 0,
    committed: 0, rolledBack: 0, released: 0, destroyed: 0, failRollback: false,
    transaction: false, query: null });
}
async function query(sql, params = []) {
  const call = { sql: sql.replace(/\s+/g, ' ').trim(), params: [...params] };
  state.calls.push(call);
  if (!state.query) throw new Error('UNEXPECTED_ACADEMIC_QUERY');
  const result = await state.query(call.sql, call.params);
  if (/^(INSERT|UPDATE|DELETE) /i.test(call.sql)) {
    (state.transaction ? state.staged : state.persisted).push(call);
  }
  return result;
}
db.query = query;
db.getConnection = async () => {
  state.acquired++;
  return { query, execute: (...args) => db.execute(...args),
    async beginTransaction() { state.began++; state.transaction = true; },
    async commit() { state.committed++; state.persisted.push(...state.staged); state.staged = []; state.transaction = false; },
    async rollback() {
      state.rolledBack++;
      if (state.failRollback) throw new Error('SYNTHETIC_ROLLBACK_FAILURE');
      state.staged = []; state.transaction = false;
    },
    release() { state.released++; },
    destroy() { state.destroyed++; },
  };
};
function response() {
  return { code: 200, body: null, status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; } };
}
reset();
module.exports = { f, state, reset, response };
