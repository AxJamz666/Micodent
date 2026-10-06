const test = require('node:test');
const assert = require('node:assert/strict');
const { state, reset, response } = require('../helpers/academic-db.cjs');
const { crearTrabajo, registrarPagoLaboratorio } = require('../../src/controllers/laboratorio.controller');

test('ACA-B-B28 laboratory payments enforce balance, audit and idempotent confirmations', async () => {
  reset();
  const receipts = new Map(), payments = [], jobs = [];
  let paid = '0.00', missing = false;
  state.query = async (sql, params) => {
    if (sql.startsWith('INSERT IGNORE INTO finanzas_peticiones')) {
      if (!receipts.has(params[1])) receipts.set(params[1], { huella: params[2], respuesta: null });
      return [{ affectedRows: 1 }];
    }
    if (sql.startsWith('SELECT huella')) return [[receipts.get(params[1])]];
    if (sql.startsWith('UPDATE finanzas_peticiones')) {
      receipts.get(params[2]).respuesta = params[0]; return [{ affectedRows: 1 }];
    }
    if (sql.startsWith('SELECT monto_total')) return [missing ? [] : [{ monto_total: '80.00', nombre_laboratorio: 'Lab sintetico' }]];
    if (sql.startsWith('SELECT COALESCE(SUM(monto)')) return [[{ pagado: paid }]];
    if (sql.startsWith('INSERT INTO pagos_laboratorio')) { payments.push(params); return [{ insertId: 91 }]; }
    if (sql.startsWith('SELECT id FROM consultas')) return [missing ? [] : [{ id: 71 }]];
    if (sql.startsWith('INSERT INTO trabajos_laboratorio')) { jobs.push(params); return [{ insertId: 81 }]; }
    if (sql.startsWith('INSERT INTO auditoria_financiera')) return [{ insertId: 101 }];
    throw new Error('UNEXPECTED_LAB_SQL');
  };
  let sequence = 0;
  const request = (body, key = `academic-lab-${String(++sequence).padStart(5, '0')}`) => ({
    usuario: { id: 'one' }, params: { trabajoId: '81' }, body,
    get: name => name === 'Idempotency-Key' ? key : undefined,
  });
  const first = request({ monto: '30.00', fecha_pago: '2026-10-03' });
  let res = response();
  await registrarPagoLaboratorio(first, res);
  assert.equal(res.code, 201);
  assert.deepEqual(payments[0], ['81', '30.00', '2026-10-03', 'one']);
  paid = '30.00';
  const audits = state.persisted.filter(x => x.sql.startsWith('INSERT INTO auditoria_financiera')).length;
  res = response(); await registrarPagoLaboratorio(first, res);
  assert.equal(res.code, 200);
  assert.equal(payments.length, 1);
  assert.equal(state.persisted.filter(x => x.sql.startsWith('INSERT INTO auditoria_financiera')).length, audits);
  res = response(); await registrarPagoLaboratorio({ ...first, body: { ...first.body, monto: '31.00' } }, res);
  assert.equal(res.code, 409);
  res = response(); await registrarPagoLaboratorio(request({ monto: '50.00', fecha_pago: '2026-10-03' }), res);
  assert.equal(res.code, 201);
  assert.deepEqual(payments[1], ['81', '50.00', '2026-10-03', 'one']);
  paid = '80.00';
  for (const [body, expected] of [[{ monto: '1.00' }, 409], [{ monto: '0' }, 400],
    [{ monto: '-1' }, 400], [{ monto: '1e2' }, 400], [{ monto: '1', fecha_pago: '2026-02-30' }, 400]]) {
    res = response(); await registrarPagoLaboratorio(request(body), res); assert.equal(res.code, expected);
  }
  missing = true;
  res = response(); await registrarPagoLaboratorio(request({ monto: '1' }), res); assert.equal(res.code, 404);
  missing = false;
  res = response(); await registrarPagoLaboratorio(request({ monto: '1' }, ''), res); assert.equal(res.code, 400);
  res = response();
  await crearTrabajo({ ...request({ nombre_laboratorio: ' Lab sintetico ', monto_total: '80.00' }), params: { consultaId: '71' } }, res);
  assert.equal(res.code, 201);
  assert.equal(res.body.trabajoId, 81);
  assert.deepEqual(jobs[0], ['71', 'Lab sintetico', '80.00', null, 'one']);
  for (const body of [{ nombre_laboratorio: ' ', monto_total: '80' }, { nombre_laboratorio: 'Lab', monto_total: '0' }]) {
    res = response(); await crearTrabajo({ ...request(body), params: { consultaId: '71' } }, res); assert.equal(res.code, 400);
  }
  missing = true;
  res = response(); await crearTrabajo({ ...request({ nombre_laboratorio: 'Lab', monto_total: '80' }), params: { consultaId: '99' } }, res);
  assert.equal(res.code, 404);
  assert.equal(jobs.length, 1);
  assert.equal(payments.length, 2);
  assert.equal(state.persisted.filter(x => x.sql.startsWith('INSERT INTO auditoria_financiera')).length, 3);
  assert.equal(state.released, state.acquired);
  assert.equal(state.committed, 4);
  assert.ok(!state.calls.some(x => /^DELETE /.test(x.sql)));
});
