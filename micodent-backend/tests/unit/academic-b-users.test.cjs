const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { state, reset, actor, response } = require('../helpers/coverage-p1-db.cjs');
const { crearUsuario } = require('../../src/controllers/usuarios.controller');

test('ACA-B-B05 user creation hashes passwords and enforces actor access ceilings', async () => {
  reset();
  let inserted;
  state.query = async (sql, params) => {
    assert.ok(sql.includes('INSERT INTO usuarios'));
    inserted = params;
    return [{ affectedRows: 1 }];
  };
  const body = { id: ' NEW-DOCTOR ', nombre: 'Doctor sintetico', rol: 'Doctor',
    password: 'Academic synthetic password 2026!', nivel: 2, comision_porcentaje: '100.00' };
  for (const [level, expected] of [[3, 2], [2, 1]]) {
    const res = response();
    await crearUsuario({ ...await actor('one', level), body }, res);
    assert.equal(res.code, 201);
    assert.equal(inserted[0], 'new-doctor');
    assert.ok(inserted[1] !== body.password);
    assert.ok(await bcrypt.compare(body.password, inserted[1]));
    assert.equal(inserted[7], expected >= 2);
    assert.equal(inserted[8], expected);
    assert.equal(inserted[15], '100.00');
    assert.equal(state.events.at(-1)[0], 'USER_CREATED');
    assert.ok(!JSON.stringify(res.body).includes(body.password));
  }
  const denied = response();
  const nonAdmin = await actor('one', 1);
  const commits = state.committed;
  await crearUsuario({ ...nonAdmin, body }, denied);
  assert.equal(denied.code, 403);
  assert.equal(state.committed, commits);
  for (const patch of [{ password: 'short' }, { nivel: 3 }, { rol: 'Owner' },
    { comision_porcentaje: '-1' }, { comision_porcentaje: '100.01' }, { comision_porcentaje: '1e2' }]) {
    const admin = await actor();
    const begun = state.began, res = response();
    await crearUsuario({ ...admin, body: { ...body, ...patch } }, res);
    assert.equal(res.code, 400);
    assert.equal(state.began, begun);
  }
  for (const rate of ['0', '']) {
    const res = response();
    await crearUsuario({ ...await actor(), body: { ...body, comision_porcentaje: rate } }, res);
    assert.equal(res.code, 201);
    assert.equal(inserted[15], rate === '' ? null : '0');
  }
  state.query = async () => { throw Object.assign(new Error('Synthetic duplicate'), { code: 'ER_DUP_ENTRY' }); };
  const duplicate = response();
  await crearUsuario({ ...await actor(), body }, duplicate);
  assert.equal(duplicate.code, 409);
  assert.equal(state.rolledBack, 2);
  assert.equal(state.released, state.began);
});
