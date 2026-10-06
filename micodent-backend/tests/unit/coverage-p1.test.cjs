const test = require('node:test');
const assert = require('node:assert/strict');
const { f, state, reset, actor, response } = require('../helpers/coverage-p1-db.cjs');
const users = require('../../src/controllers/usuarios.controller');
const laboratory = require('../../src/controllers/laboratorio.controller');
const passwords = require('../../src/services/password.service');
test.beforeEach(reset);

// TEST CASE: BE-P1-01; ACADEMIC CASE: B04; TYPE: Automatizado retroactivo.
test('BE-P1-01 B04 real user editing/deactivation: stable locks, permissions and rollback', async () => {
  for (const id of ['one', 'two']) {
    reset();
    const request = await actor(id);
    const target = id === 'one' ? 'two' : 'one';
    Object.assign(request, { params: { id: target }, body: { rol: 'Doctor', nivel: 2, nombre: 'Sintetico' } });
    const out = response();
    await users.editarUsuario(request, out);
    assert.equal(out.code, 200);
    assert.deepEqual(state.locks, ['one', 'two']);
    assert.equal(f.users.get(target).nivel, 2);
    assert.ok(state.events.some(row => row[0] === 'USER_SECURITY_CHANGED'));
  }
  reset();
  const request = await actor();
  const out = response();
  await users.editarUsuario({ ...request, params: { id: 'one' }, body: { rol: 'Doctor', nivel: 1 } }, out);
  assert.equal(out.code, 200);
  assert.deepEqual(state.locks, ['one'], 'self locks deduplicated');
  assert.equal(f.users.get('one').nivel, 3);
  const denied = response();
  await users.editarUsuario({ ...request, params: { id: 'one' }, body: { rol: 'Asistente' } }, denied);
  assert.equal(denied.code, 403);
  const invalid = response();
  await users.editarUsuario({ ...request, params: { id: 'two' }, body: { rol: 'Doctor', password: 'synthetic' } }, invalid);
  assert.equal(invalid.code, 400);
  for (const level of [3, 4]) {
    f.users.get('two').nivel = level;
    const peer = response();
    await users.editarUsuario({ ...request, params: { id: 'two' }, body: { rol: 'Doctor' } }, peer);
    assert.equal(peer.code, 403);
  }
  f.users.get('two').nivel = 1;
  const missing = response();
  await users.editarUsuario({ ...request, params: { id: 'missingqa' }, body: { rol: 'Doctor' } }, missing);
  assert.equal(missing.code, 404);
  state.failWrite = true;
  const failed = response();
  await users.editarUsuario({ ...request, params: { id: 'two' }, body: { rol: 'Doctor' } }, failed);
  assert.equal(failed.code, 500);
  assert.equal(f.users.get('two').nivel, 1);
  assert.ok(state.rolledBack > 0);
  assert.equal(state.began, state.released);
  state.failWrite = false;
  const targetSession = await f.service.login('two', f.password);
  const deactivated = response();
  await users.eliminarUsuario({ ...request, params: { id: 'two' } }, deactivated);
  assert.equal(deactivated.code, 200);
  assert.equal(f.users.get('two').activo, 0);
  await assert.rejects(f.service.authenticate(targetSession.token), { status: 401 });
  const repeat = response();
  await users.eliminarUsuario({ ...request, params: { id: 'two' } }, repeat);
  assert.equal(repeat.code, 409);
  assert.equal(f.users.size, 2, 'no user history deletion');
});

// TEST CASE: BE-P1-02; ACADEMIC CASE: B03; TYPE: Automatizado retroactivo.
test('BE-P1-02 B03 real credential reset/reactivation: revocation and denied hierarchy', async () => {
  const request = await actor('two');
  const oldTarget = await f.service.login('one', f.password);
  const replacement = 'Synthetic replacement credential 2026';
  const body = { targetUserId: 'one', adminPassword: f.password, nuevaPassword: replacement };
  const out = response();
  await users.resetPassword({ ...request, body }, out);
  assert.equal(out.code, 200);
  assert.ok(await passwords.verifyPassword(replacement, f.users.get('one').password_hash));
  await assert.rejects(f.service.authenticate(oldTarget.token), { status: 401 });
  assert.deepEqual(state.locks.slice(-2), ['one', 'two']);
  f.users.get('one').activo = 0;
  const restored = response();
  await users.reactivarUsuario({ ...request, params: { id: 'one' }, body }, restored);
  assert.equal(restored.code, 200);
  assert.equal(f.users.get('one').activo, 1);
  const currentVersion = f.users.get('one').auth_version;
  const alreadyActive = response();
  await users.reactivarUsuario({ ...request, params: { id: 'one' }, body }, alreadyActive);
  assert.equal(alreadyActive.code, 409);
  assert.equal(f.users.get('one').auth_version, currentVersion);
  const wrong = response();
  await users.resetPassword({ ...request, body: { ...body, adminPassword: 'Synthetic wrong credential' } }, wrong);
  assert.equal(wrong.code, 400);
  f.users.get('one').nivel = 3;
  const denied = response();
  await users.resetPassword({ ...request, body }, denied);
  assert.equal(denied.code, 403);
  assert.equal(f.users.get('one').auth_version, currentVersion);
});

// TEST CASE: BE-P1-03; ACADEMIC CASE: B07; TYPE: Automatizado retroactivo.
test('BE-P1-03 B07 real user reads: selected columns, successful response and sanitized errors', async t => {
  const logs = [];
  t.mock.method(console, 'error', (...args) => logs.push(args));
  const selected = [{ id: 'one', nombre_completo: 'Persona sintetica', rol: 'Doctor' }];
  state.query = async sql => {
    assert.equal(sql.includes('password_hash'), false);
    if (sql.includes('WHERE rol')) assert.match(sql, /activo = 1/);
    return [selected];
  };
  for (const handler of [users.getUsuarios, users.getDoctores]) {
    const out = response();
    await handler({}, out);
    assert.equal(out.code, 200);
    assert.deepEqual(out.body.data, selected);
  }
  for (const code of ['ECONNREFUSED', 'ER_TEST']) {
    state.query = async () => { throw Object.assign(new Error('PRIVATE_SQL_SENTINEL'), { code }); };
    for (const handler of [users.getUsuarios, users.getDoctores]) {
      const out = response();
      await handler({}, out);
      assert.equal(out.code, 500);
      assert.equal(JSON.stringify(out.body).includes('PRIVATE_SQL_SENTINEL'), false);
    }
  }
  assert.deepEqual(logs.map(row => row[1]), ['CONNECTION_REFUSED', 'CONNECTION_REFUSED', 'OPERATION_FAILED', 'OPERATION_FAILED']);
  assert.equal(JSON.stringify(logs).includes('PRIVATE_SQL_SENTINEL'), false);
});

// TEST CASE: BE-P1-04; ACADEMIC CASE: B27; TYPE: Automatizado retroactivo.
test('BE-P1-04 B27 real laboratory reads: DECIMAL status and pending/paid filters', async () => {
  const jobs = [
    { id: 1, monto_total: '100.00' }, { id: 2, monto_total: '100.00' },
    { id: 3, monto_total: '100.00' }, { id: 4, monto_total: '100.00' },
  ];
  const payments = { 1: [], 2: [{ monto: '20.50' }], 3: [{ monto: '100.00' }], 4: [{ monto: '105.00' }] };
  state.query = async (sql, params) => sql.includes('FROM pagos_laboratorio') ? [payments[params[0]]] : [structuredClone(jobs)];
  const out = response();
  await laboratory.getTrabajosPorConsulta({ params: { consultaId: '10' } }, out);
  assert.deepEqual(out.body.data.map(row => row.estado), ['pendiente', 'parcial', 'pagado', 'pagado']);
  assert.deepEqual(out.body.data.map(row => row.saldo_pendiente), [100, 79.5, 0, -5]);
  for (const estado of ['pagado', 'pendiente', 'unknown']) {
    state.query = async sql => {
      assert.ok(sql.includes(estado === 'pagado' ? '<= 0' : '> 0'));
      assert.ok(sql.includes(estado === 'pagado' ? 'ultima_fecha_pago DESC' : 't.creado_en ASC'));
      return [[{ id: 2, monto_total: '100.00', total_pagado: '20.50' }]];
    };
    const list = response();
    await laboratory.getTrabajos({ query: { estado } }, list);
    assert.equal(list.body.data[0].saldo_pendiente, 79.5);
  }
});

// TEST CASE: BE-P1-05; ACADEMIC CASE: B27; TYPE: Automatizado retroactivo.
test('BE-P1-05 B27 real laboratory read errors and empty lists', async t => {
  t.mock.method(console, 'error', () => {});
  for (const handler of [laboratory.getTrabajosPorConsulta, laboratory.getTrabajos]) {
    state.query = async () => [[]];
    const empty = response();
    await handler({ params: { consultaId: '10' }, query: {} }, empty);
    assert.deepEqual(empty.body, { ok: true, data: [] });
    state.query = async () => { throw new Error('PRIVATE_DB_SENTINEL'); };
    const failed = response();
    await handler({ params: { consultaId: '10' }, query: {} }, failed);
    assert.equal(failed.code, 500);
    assert.equal(JSON.stringify(failed.body).includes('PRIVATE_DB_SENTINEL'), false);
    assert.match(failed.body.mensaje, /Error al obtener/);
  }
  state.query = async sql => {
    if (sql.includes('FROM pagos_laboratorio')) throw new Error('PRIVATE_PAYMENT_SENTINEL');
    return [[{ id: 1, monto_total: '100.00' }]];
  };
  const paymentFailure = response();
  await laboratory.getTrabajosPorConsulta({ params: { consultaId: '10' } }, paymentFailure);
  assert.equal(paymentFailure.code, 500);
  assert.equal(JSON.stringify(paymentFailure.body).includes('PRIVATE_PAYMENT_SENTINEL'), false);
});

// TEST CASE: BE-P1-06; ACADEMIC CASE: B06; TYPE: Automatizado retroactivo.
test('BE-P1-06 B06 actual signing assets: actor-only partial update, clear and no-op', async () => {
  const request = await actor();
  Object.assign(f.users.get('one'), { firma_digital: 'synthetic-old-signature', sello_digital: 'synthetic-stamp' });
  const out = response();
  await users.actualizarFirmaSello({ ...request, body: { id: 'two', firma_digital: 'synthetic-new-signature' } }, out);
  assert.equal(out.code, 200);
  assert.equal(f.users.get('one').sello_digital, 'synthetic-stamp');
  assert.equal(f.users.get('two').firma_digital, undefined);
  assert.deepEqual(state.writes, [{ kind: 'assets', id: 'one' }]);
  const writes = state.writes.length, audits = state.events.length;
  await users.actualizarFirmaSello({ ...request, body: {} }, response());
  assert.equal(state.writes.length, writes);
  assert.equal(state.events.length, audits);
  await users.actualizarFirmaSello({ ...request, body: { sello_digital: '' } }, response());
  assert.equal(f.users.get('one').sello_digital, null);
  assert.equal(f.users.get('one').firma_digital, 'synthetic-new-signature');
});
