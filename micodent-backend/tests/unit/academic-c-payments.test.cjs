const test = require('node:test');
const assert = require('node:assert/strict');
const { state, reset, response } = require('../helpers/academic-db.cjs');
const c = require('../../src/controllers/cobros.controller');

function fixture() {
  reset();
  const receipts = new Map();
  const values = { previous: { paid: '0.00', used: '0.00' }, external: '80.00', extra: '20.00',
    origin: 'costo_primero_v1', missing: false, failAudit: false, annulled: 0, lastId: 81 };
  let keyNumber = 0;
  state.query = async (sql, p) => {
    if (sql.startsWith('INSERT IGNORE INTO finanzas_peticiones')) {
      if (!receipts.has(p[1])) receipts.set(p[1], { huella: p[2], respuesta: null });
      return [{ affectedRows: 1 }];
    }
    if (sql.startsWith('SELECT huella')) return [[receipts.get(p[1])]];
    if (sql.startsWith('UPDATE finanzas_peticiones')) { receipts.get(p[2]).respuesta = p[0]; return [{ affectedRows: 1 }]; }
    if (sql.startsWith('SELECT id FROM historias')) return [values.missing ? [] : [{ id: 7 }]];
    if (sql.startsWith('SELECT * FROM consultas')) return [values.missing ? [] : [{ id: 71, historia_id: 7,
      costo_total: '380.00', doctor_id: 'one', tipo_comision: 'rehabilitacion' }]];
    if (sql.startsWith('SELECT consulta_id FROM pagos')) return [values.missing ? [] : [{ consulta_id: 71 }]];
    if (sql.startsWith('SELECT p.* FROM pagos')) return [[]];
    if (sql.startsWith('SELECT origen')) return [[{ origen: values.origin }]];
    if (sql.includes('AS paid')) return [[{ ...values.previous }]];
    if (sql.startsWith('SELECT comision_porcentaje')) return [[{ comision_porcentaje: '30.00' }]];
    if (sql.includes('SUM(monto_total)')) return [[{ total: values.external }]];
    if (sql.startsWith('SELECT otros_costos')) return [[{ otros_costos: values.extra }]];
    if (sql.startsWith('SELECT recargo_pos')) return [[{ recargo_pos_porcentaje: '3.00', revision: 3 }]];
    if (sql.startsWith('SELECT anulado')) return [[{ anulado: values.annulled }]];
    if (sql.startsWith('SELECT id FROM pagos_vigentes')) return [[{ id: values.lastId }]];
    if (sql.startsWith('INSERT INTO auditoria_historias') && values.failAudit) throw new Error('Synthetic audit failure');
    if (sql.startsWith('INSERT INTO consultas')) return [{ insertId: 71 }];
    if (sql.startsWith('INSERT INTO pagos(')) return [{ insertId: 81 }];
    if (/^(INSERT|UPDATE) /.test(sql)) return [{ insertId: 91, affectedRows: 1 }];
    throw new Error('UNEXPECTED_PAYMENT_QUERY');
  };
  return { values, request(body, params, key = 'academic-pay-' + String(++keyNumber).padStart(5, '0')) {
    return { body, params, usuario: { id: 'one' }, get: name => name === 'Idempotency-Key' ? key : undefined };
  } };
}
const writes = prefix => state.persisted.filter(x => x.sql.startsWith(prefix));
test.beforeEach(t => t.mock.method(console, 'error', () => {}));

test('ACA-C-B22 signed treatment, costs, laboratory and initial payment share transaction and rollback', async () => {
  const f = fixture();
  const body = { descripcion: ' Tratamiento sintetico ', costo_total: '380.00', abono_inicial: '120.00',
    fecha_consulta: '2026-10-03', tipo_comision: 'rehabilitacion', costo_externo: '20.00', metodo_pago: 'Efectivo',
    laboratorio: { nombre_laboratorio: 'Lab sintetico', monto_total: '80.00' } };
  let res = response(); await c.agregarConsulta(f.request(body, { historiaId: '7' }), res);
  assert.equal(res.code, 201); assert.equal(res.body.consultaId, 71);
  assert.deepEqual(writes('INSERT INTO consultas')[0].params,
    [7, 'Tratamiento sintetico', '380.00', '120.00', '2026-10-03', 'one', null, 'rehabilitacion', 0, '30.00', 'one']);
  assert.match(writes('INSERT INTO consultas')[0].sql, /NOW\(\),1/);
  assert.deepEqual(writes('INSERT INTO finanzas_costos')[0].params, [71, '20.00', 'costo_primero_v1']);
  assert.deepEqual(writes('INSERT INTO trabajos_laboratorio')[0].params, [71, 'Lab sintetico', '80.00', 'one']);
  assert.deepEqual(writes('INSERT INTO pagos(')[0].params.slice(0, 5), [71, '120.00', 'Efectivo', '0.00', '6.00']);
  assert.deepEqual(writes('INSERT INTO finanzas_pagos(')[0].params, [81, 'one', '30.00', '100.00', '20.00', '14.00']);
  assert.equal(writes('INSERT INTO auditoria_historias').length, 2);
  assert.equal(state.committed, 1);
  for (const patch of [{ abono_inicial: '381' }, { tipo_comision: 'invalid' }, { descripcion: ' ' },
    { fecha_consulta: '2026-02-30' }, { laboratorio: { nombre_laboratorio: '', monto_total: '80' } },
    { cantidad_radiografias: 101 }, { tipo_comision: 'endodoncia', costo_externo: undefined }]) {
    const before = state.persisted.length; res = response();
    await c.agregarConsulta(f.request({ ...body, ...patch }, { historiaId: '7' }), res);
    assert.equal(res.code, 400); assert.equal(state.persisted.length, before);
  }
  f.values.missing = true; res = response(); await c.agregarConsulta(f.request(body, { historiaId: '99' }), res); assert.equal(res.code, 404);
  f.values.missing = false; f.values.failAudit = true;
  const before = state.persisted.length; res = response();
  await c.agregarConsulta(f.request(body, { historiaId: '7' }), res);
  assert.equal(res.code, 500); assert.equal(state.persisted.length, before); assert.deepEqual(state.staged, []);
  assert.equal(state.released, state.acquired);
});

test('ACA-C-B23 payment confirmation replays once; POS revision and principal/recargo history stay distinct', async () => {
  const f = fixture();
  f.values.previous = { paid: '80.00', used: '80.00' };
  const body = { monto: '60.00', metodo_pago: 'Tarjeta', pos_revision: 3 };
  const first = f.request(body, { consultaId: '71' });
  let res = response(); await c.registrarPago(first, res); assert.equal(res.code, 201);
  assert.equal(res.body.comision, '12.00'); assert.equal(res.body.costo, '20.00'); assert.equal(res.body.margen, '28.00');
  assert.deepEqual(writes('INSERT INTO pagos(')[0].params.slice(0, 5), [71, '60.00', 'Tarjeta', '1.80', '12.00']);
  assert.deepEqual(writes('INSERT INTO finanzas_pago_pos')[0].params, [81, '3.00', 3]);
  const firstBody = structuredClone(res.body), count = writes('INSERT INTO pagos(').length;
  res = response(); await c.registrarPago(first, res);
  assert.equal(res.code, 200); assert.deepEqual(res.body, firstBody); assert.equal(writes('INSERT INTO pagos(').length, count);
  res = response(); await c.registrarPago({ ...first, body: { ...body, monto: '61.00' } }, res); assert.equal(res.code, 409);
  for (const patch of [{ pos_revision: 2 }, { pos_revision: undefined }, { monto: '301.00' }]) {
    res = response(); await c.registrarPago(f.request({ ...body, ...patch }, { consultaId: '71' }), res);
    assert.equal(res.code, 409); assert.equal(writes('INSERT INTO pagos(').length, 1);
  }
  res = response(); await c.registrarPago(f.request({ ...body, monto: '1e2' }, { consultaId: '71' }), res); assert.equal(res.code, 400);
  f.values.missing = true; res = response(); await c.registrarPago(f.request(body, { consultaId: '99' }), res); assert.equal(res.code, 404);
  assert.equal(writes('INSERT INTO auditoria_financiera').length, 1);
  assert.equal(state.released, state.acquired);
});

test('ACA-C-B24 only latest current payment can be voided with reason and dual audit, never physical deletion', async () => {
  const f = fixture(), body = { motivo: 'Correccion de registro sintetico' };
  const req = () => f.request(body, { pagoId: '81' });
  let res = response(); await c.anularPago(req(), res); assert.equal(res.code, 201);
  assert.deepEqual(writes('UPDATE finanzas_pagos')[0].params, ['one', body.motivo, '81']);
  assert.equal(writes('INSERT INTO auditoria_financiera').length, 1);
  assert.ok(writes('INSERT INTO auditoria_historias')[0].params[2].includes(body.motivo));
  assert.ok(!state.calls.some(x => /^DELETE |^UPDATE pagos |^UPDATE consultas /.test(x.sql)));
  f.values.lastId = 82; const before = state.persisted.length;
  res = response(); await c.anularPago(req(), res); assert.equal(res.code, 409);
  assert.equal(state.persisted.length, before);
  f.values.lastId = 81; f.values.origin = 'legacy_pendiente';
  res = response(); await c.anularPago(req(), res); assert.equal(res.code, 409); assert.equal(state.persisted.length, before);
  f.values.origin = 'costo_primero_v1'; f.values.annulled = 1;
  res = response(); await c.anularPago(req(), res); assert.equal(res.code, 201);
  assert.equal(writes('UPDATE finanzas_pagos').length, 1);
  f.values.annulled = 0; f.values.missing = true;
  res = response(); await c.anularPago(req(), res); assert.equal(res.code, 404);
  res = response(); await c.anularPago(f.request({ motivo: 'bad' }, { pagoId: '81' }), res); assert.equal(res.code, 400);
  f.values.missing = false; f.values.failAudit = true; const prior = state.persisted.length;
  res = response(); await c.anularPago(req(), res); assert.equal(res.code, 500);
  assert.equal(state.persisted.length, prior); assert.deepEqual(state.staged, []);
  assert.equal(state.released, state.acquired);
});
