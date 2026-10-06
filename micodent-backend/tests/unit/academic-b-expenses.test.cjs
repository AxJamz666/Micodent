const test = require('node:test');
const assert = require('node:assert/strict');
const { state, reset, response } = require('../helpers/academic-db.cjs');
const { crearGasto, editarGasto, eliminarGasto, reactivarGasto } = require('../../src/controllers/gastos.controller');
const body = { categoria: 'luz', descripcion: 'Gasto ficticio', monto: '10.50', fecha_pago: '2026-10-03', mes_consumo: '2026-09' };
const request = patch => ({ body: { ...body, ...patch }, params: { id: '61' }, usuario: { id: 'one' } });
test.beforeEach(t => { reset(); t.mock.method(console, 'error', () => {}); });
const writing = sql => {
  assert.match(sql, /^INSERT INTO (gastos_clinica|auditoria_financiera)/);
  return [{ insertId: 61, affectedRows: 1 }];
};

test('ACA-B-B25 retroactive: allowed expense categories preserve conditional month; invalid money/date/category rollback', async () => {
  for (const categoria of ['luz', 'agua', 'internet', 'alquiler', 'materiales', 'sueldos', 'imprevistos']) {
    reset(); state.query = writing; const res = response(); await crearGasto(request({ categoria }), res);
    assert.equal(res.code, 201); assert.equal(res.body.gastoId, 61);
    const month = ['luz', 'agua', 'internet', 'alquiler'].includes(categoria) ? '2026-09' : null;
    assert.deepEqual(state.persisted[0].params, [categoria, 'Gasto ficticio', '10.50', '2026-10-03', month, 'one']);
    const audit = state.persisted[1]; assert.equal(audit.params[1], 'gastos');
    assert.equal(JSON.parse(audit.params[3]).mes_consumo, month);
    assert.equal(state.committed, 1); assert.equal(state.released, 1);
  }
  reset(); state.query = writing; const optional = response(); await crearGasto(request({ mes_consumo: '' }), optional);
  assert.equal(optional.code, 201); assert.equal(state.persisted[0].params[4], null);
  for (const patch of [{ categoria: 'inventada' }, { monto: '0' }, { monto: '-1' }, { monto: '1e2' },
    { monto: '1.001' }, { fecha_pago: '' }, { fecha_pago: '2026-02-30' }]) {
    reset(); state.query = writing; const res = response(); await crearGasto(request(patch), res);
    assert.equal(res.code, 400); assert.equal(state.calls.length, 0); assert.equal(state.committed, 0);
    assert.equal(state.rolledBack, 1); assert.equal(state.released, 1); assert.deepEqual(state.persisted, []);
  }
});

test('ACA-B-B26 retroactive: edit/void/reactivate audited without physical DELETE; guards and audit failure rollback', async () => {
  let row = { id: 61, ...body, estado: 'activo' }, failAudit = false;
  state.query = sql => {
    if (sql.startsWith('SELECT * FROM gastos_clinica')) return [row ? [{ ...row }] : []];
    if (sql.startsWith('UPDATE gastos_clinica')) return [{ affectedRows: 1 }];
    if (sql.startsWith('INSERT INTO auditoria_financiera')) {
      if (failAudit) throw new Error('SYNTHETIC_PRIVATE_DATABASE_FAILURE');
      return [{ insertId: 91 }];
    }
    throw new Error('UNEXPECTED_EXPENSE_QUERY');
  };
  const edited = response(); await editarGasto(request({ categoria: 'materiales', monto: '12.50' }), edited);
  assert.equal(edited.code, 200);
  assert.deepEqual(state.persisted[0].params, ['materiales', 'Gasto ficticio', '12.50', '2026-10-03', null, '61']);
  const detail = JSON.parse(state.persisted[1].params[3]);
  assert.equal(detail.antes.monto, 10.5); assert.equal(detail.despues.monto, 12.5);
  const voided = response(); await eliminarGasto(request(), voided);
  assert.equal(voided.code, 200); assert.match(state.persisted.at(-2).sql, /SET estado = 'anulado'/);
  row.estado = 'anulado'; const restored = response(); await reactivarGasto(request(), restored);
  assert.equal(restored.code, 200); assert.match(state.persisted.at(-2).sql, /SET estado = 'activo'/);
  assert.equal(state.persisted.filter(x => x.sql.includes('auditoria_financiera')).length, 3);
  assert.ok(state.persisted.every(x => !x.sql.startsWith('DELETE')));
  for (const [controller, existing, status] of [[editarGasto, { ...row, estado: 'anulado' }, 409],
    [eliminarGasto, { ...row, estado: 'anulado' }, 409], [reactivarGasto, { ...row, estado: 'activo' }, 409],
    [editarGasto, null, 404], [eliminarGasto, null, 404], [reactivarGasto, null, 404]]) {
    row = existing; const before = state.persisted.length;
    const res = response(); await controller(request(), res);
    assert.equal(res.code, status); assert.equal(state.persisted.length, before);
  }
  row = { id: 61, ...body, estado: 'activo' }; failAudit = true;
  const before = state.persisted.length, error = response();
  await editarGasto(request({ monto: '15.00' }), error);
  assert.equal(error.code, 500); assert.equal(error.body.mensaje, 'Error al editar el gasto.');
  assert.equal(state.persisted.length, before); assert.deepEqual(state.staged, []);
  assert.equal(state.committed, 3); assert.equal(state.rolledBack, 7); assert.equal(state.released, 10);
});
