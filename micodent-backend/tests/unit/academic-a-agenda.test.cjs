const test = require('node:test');
const assert = require('node:assert/strict');
const { state, reset, response } = require('../helpers/academic-db.cjs');
const { crearCita, editarCita } = require('../../src/controllers/citas.controller');
const body = { paciente_id: 41, nombre_contacto: ' Contacto sintetico ', celular_contacto: '900000001',
  motivo_consulta: 'Control ficticio', doctor_id: 'one', fecha: '2026-10-03', hora_inicio: '09:00', duracion_minutos: 60 };
const request = patch => ({ body: { ...body, ...patch }, params: { id: '72' }, usuario: { id: 'one' } });
function schedule(options = {}) {
  state.query = sql => {
    if (sql.includes('GET_LOCK(')) return [[{ acquired: options.acquired ?? 1 }]];
    if (sql.includes('RELEASE_LOCK(')) return [[{ released: options.released ?? 1 }]];
    if (sql.startsWith('SELECT id FROM usuarios')) return [options.doctor === false ? [] : [{ id: 'one' }]];
    if (sql.startsWith('SELECT id FROM pacientes')) return [options.patient === false ? [] : [{ id: 41 }]];
    if (sql.startsWith('SELECT id,hora_inicio')) return [options.rows || []];
    if (sql.startsWith('SELECT * FROM citas')) return [[{ ...body, id: 72, hora_inicio: '11:00', estado: 'agendada' }]];
    if (sql.startsWith('INSERT INTO citas') || sql.startsWith('UPDATE citas')) {
      if (options.failInsert) throw Object.assign(new Error('SYNTHETIC_SQL_FAILURE'), { code: 'ER_TEST_FAILURE' });
      return [{ insertId: 72, affectedRows: 1 }];
    }
    throw new Error('UNEXPECTED_AGENDA_QUERY');
  };
}
test.beforeEach(t => { reset(); t.mock.method(console, 'error', () => {}); });

test('ACA-A-B18 retroactive: create/edit and contiguous appointments allowed; overlap/inactive references rejected', async () => {
  schedule({ rows: [{ id: 70, hora_inicio: '08:00:00', duracion_minutos: 60 }] });
  const created = response(); await crearCita(request(), created);
  assert.equal(created.code, 201); assert.equal(created.body.citaId, 72);
  assert.deepEqual(state.persisted[0].params, [41, 'Contacto sintetico', '900000001', 'Control ficticio',
    'one', '2026-10-03', '09:00', 60, 'one']);
  assert.equal(state.committed, 1); assert.equal(state.released, 1);
  reset(); schedule({ rows: [{ id: 72, hora_inicio: '09:00:00', duracion_minutos: 60 }] });
  const edited = response(); await editarCita(request(), edited);
  assert.equal(edited.code, 200); assert.match(state.persisted[0].sql, /^UPDATE citas/);
  assert.equal(state.persisted[0].params.at(-1), '72');
  for (const [options, status] of [[{ rows: [{ id: 70, hora_inicio: '09:30:00', duracion_minutos: 30 }] }, 409],
    [{ doctor: false }, 400], [{ patient: false }, 400]]) {
    reset(); schedule(options); const res = response(); await crearCita(request(), res);
    assert.equal(res.code, status); assert.equal(state.committed, 0); assert.equal(state.rolledBack, 1);
    assert.equal(state.released, 1); assert.deepEqual(state.persisted, []);
    assert.ok(!state.calls.some(x => x.sql.startsWith('INSERT')));
  }
});

test('ACA-A-B19 retroactive: impossible dates, time/duration/cell/patient shapes rejected before DB acquisition', async () => {
  for (const patch of [{ fecha: '2026-02-30' }, { fecha: '2026-2-03' }, { hora_inicio: '24:00' },
    { hora_inicio: '09:60' }, { hora_inicio: '23:30', duracion_minutos: 60 },
    { duracion_minutos: 45 }, { duracion_minutos: '6e1' }, { paciente_id: -1 },
    { celular_contacto: 'abc' }, { nombre_contacto: ' ' }]) {
    reset(); schedule(); const res = response(); await crearCita(request(patch), res);
    assert.equal(res.code, 400, JSON.stringify(patch)); assert.equal(res.body.ok, false);
    assert.equal(state.acquired, 0); assert.deepEqual(state.calls, []);
  }
  reset(); schedule(); const valid = response();
  await crearCita(request({ fecha: '2028-02-29', hora_inicio: '23:30:00', duracion_minutos: '30', paciente_id: '' }), valid);
  assert.equal(valid.code, 201);
  assert.equal(state.persisted[0].params[0], null);
  assert.deepEqual(state.persisted[0].params.slice(5, 8), ['2028-02-29', '23:30', 30]);
});

test('ACA-A-B20 retroactive: lock busy 503; storage failure rollback; uncertain lock/rollback destroys connection', async () => {
  schedule({ acquired: 0 }); const busy = response(); await crearCita(request(), busy);
  assert.equal(busy.code, 503); assert.equal(state.began, 0); assert.equal(state.released, 1);
  assert.equal(state.calls.length, 1); assert.deepEqual(state.persisted, []);
  for (const [released, failRollback] of [[1, false], [0, false], [1, true]]) {
    reset(); schedule({ failInsert: true, released }); state.failRollback = failRollback;
    const res = response(); await crearCita(request(), res);
    assert.equal(res.code, 500); assert.equal(res.body.mensaje, 'Error al agendar la cita.');
    assert.equal(state.committed, 0); assert.equal(state.rolledBack, 1); assert.deepEqual(state.persisted, []);
    const unsafe = released === 0 || failRollback;
    assert.equal(state.released, unsafe ? 0 : 1); assert.equal(state.destroyed, unsafe ? 1 : 0);
    assert.ok(state.calls.at(-1).sql.includes('RELEASE_LOCK'));
    assert.deepEqual(state.calls.at(-1).params, ['_agenda_writes_v1']);
  }
});
