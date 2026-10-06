const test = require('node:test');
const assert = require('node:assert/strict');
const { state, reset, response } = require('../helpers/academic-db.cjs');
const { getFinanciero, getDeudores } = require('../../src/controllers/dashboard.controller');
test.beforeEach(t => { reset(); t.mock.method(console, 'error', () => {}); });

test('ACA-B-B29 retroactive: cash includes POS/lab payouts, allocated margin differs; legacy/null, negative and failure cleanup', async () => {
  let pending = 0, expense = '10.00', fail = false;
  state.query = (sql, params) => {
    if (fail) throw new Error('SYNTHETIC_REPORT_FAILURE');
    if (sql === 'SET TRANSACTION READ ONLY') return [{}];
    assert.ok(params.every(date => date === '2026-10-03'));
    if (sql.includes('AS doctor_id')) return [[{ doctor_id: 'one', total_cobrado: '100.00', comision_bruta: '15.00', penalidades: '2.00' }]];
    if (sql.includes('AS costoLaboratorioPagado')) return [[{ costoLaboratorioPagado: '20.00' }]];
    if (sql.includes('FROM gastos_clinica')) { assert.match(sql, /estado = 'activo'/); return [[{ categoria: 'luz', total: expense }]]; }
    if (sql.includes('AS recargos')) return [[{ cobrado: '100.00', recargos: '3.00', comision: '15.00', costos: '30.00', pendientes: pending }]];
    if (sql.includes('FROM consultas WHERE')) return [[{ total: '380.00' }]];
    throw new Error('UNEXPECTED_SUMMARY_QUERY');
  };
  const request = { query: { desde: '2026-10-03', hasta: '2026-10-03' } };
  const res = response(); await getFinanciero(request, res);
  assert.equal(res.code, 200);
  assert.deepEqual(res.body.data.caja, { ingresos: 103, recargosTarjeta: 3, pagosLaboratorio: 20,
    gastosOperativos: 10, salidas: 30, flujoNeto: 73 });
  assert.equal(res.body.data.totales.gananciaClinicaAntesGastos, 55);
  assert.equal(res.body.data.totales.gananciaNetaReal, 45);
  assert.equal(res.body.data.totales.totalFacturado, 380);
  assert.equal(res.body.data.porDoctor[0].comision_neta, 13);
  pending = 1; const legacy = response(); await getFinanciero(request, legacy);
  for (const key of ['gananciaClinicaAntesGastos', 'gananciaNetaReal', 'costosExternosAplicados']) assert.equal(legacy.body.data.totales[key], null);
  assert.equal(legacy.body.data.caja.flujoNeto, 73);
  pending = 0; expense = '100.00'; const negative = response(); await getFinanciero(request, negative);
  assert.equal(negative.body.data.totales.gananciaNetaReal, -45); assert.equal(negative.body.data.caja.flujoNeto, -17);
  fail = true; const failure = response(); await getFinanciero(request, failure);
  assert.equal(failure.code, 500); assert.equal(failure.body.mensaje, 'Error al obtener el reporte financiero.');
  assert.equal(state.committed, 3); assert.equal(state.rolledBack, 1); assert.equal(state.released, 4);
  assert.deepEqual(state.persisted, []);
});

test('ACA-B-B30 retroactive: multiple debts grouped by patient with cents, all treatment IDs, empty and fixed error', async () => {
  let rows = [
    { id: 41, nombres: 'Paciente', apellidos: 'Sintetico', consulta_id: 71, descripcion: 'Tratamiento A', fecha_consulta: '2026-10-03', costo_total: '100.10', pagado: '100.00', pendiente: '0.10' },
    { id: 41, nombres: 'Paciente', apellidos: 'Sintetico', consulta_id: 72, descripcion: 'Tratamiento B', fecha_consulta: '2026-10-03', costo_total: '50.20', pagado: '50.00', pendiente: '0.20' },
    { id: 42, nombres: 'Segundo', apellidos: 'Sintetico', consulta_id: 73, descripcion: 'Tratamiento C', fecha_consulta: '2026-10-03', costo_total: '20.00', pagado: '5.00', pendiente: '15.00' },
  ];
  let fail = false;
  state.query = sql => { assert.match(sql, /FROM historias_clinicas h/); if (fail) throw new Error('SYNTHETIC_DEBT_FAILURE'); return [rows]; };
  const res = response(); await getDeudores({}, res);
  assert.equal(res.body.data.length, 2); assert.equal(res.body.data[0].deuda_total, 0.3);
  assert.deepEqual(res.body.data[0].tratamientos.map(row => row.id), [71, 72]);
  assert.deepEqual(res.body.data[0].tratamientos.map(row => row.pendiente), [0.1, 0.2]);
  assert.equal(res.body.data[1].deuda_total, 15); assert.equal(res.body.data[1].tratamientos[0].costo_total, 20);
  assert.ok(res.body.data.every(patient => !Object.hasOwn(patient, 'deuda_centimos')));
  rows = []; const empty = response(); await getDeudores({}, empty); assert.deepEqual(empty.body, { ok: true, data: [] });
  fail = true; const error = response(); await getDeudores({}, error);
  assert.equal(error.code, 500); assert.equal(error.body.mensaje, 'Error al obtener lista de deudores');
  assert.deepEqual(state.persisted, []);
});
