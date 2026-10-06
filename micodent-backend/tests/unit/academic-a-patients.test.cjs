const test = require('node:test');
const assert = require('node:assert/strict');
const { state, reset, response } = require('../helpers/academic-db.cjs');
const { crearPaciente } = require('../../src/controllers/pacientes.controller');
const body = { dni: '00000001', nombres: 'Paciente', apellidos: 'Sintetico', sexo: 'F',
  fecha_nacimiento: '2015-01-01', domicilio: 'Direccion ficticia', celular: '900000001',
  apoderado_nombre: 'Tutor sintetico', parentesco: 'Madre', apoderado_celular: '900000002' };
const req = patch => ({ body: { ...body, ...patch }, usuario: { id: 'one' } });
function inserts(sql) {
  if (sql.startsWith('SELECT id FROM pacientes WHERE dni')) return [[]];
  if (sql.startsWith('INSERT INTO pacientes ')) return [{ insertId: 41 }];
  if (sql.startsWith('INSERT INTO historias_clinicas ')) return [{ insertId: 7 }];
  if (/^(INSERT|UPDATE) /.test(sql)) return [{ affectedRows: 1 }];
  throw new Error('UNEXPECTED_PATIENT_QUERY');
}
test.beforeEach(t => { reset(); t.mock.method(console, 'error', () => {}); });

test('ACA-A-B08 retroactive: coordinated patient/history/guardian/audits commit and intermediate failure rollback', async () => {
  state.query = inserts;
  const res = response();
  await crearPaciente(req(), res);
  assert.equal(res.code, 201);
  assert.deepEqual({ id: res.body.id, historiaId: res.body.historiaId, nroHistoria: res.body.nroHistoria },
    { id: 41, historiaId: 7, nroHistoria: 'HC-0007' });
  assert.equal(state.committed, 1); assert.equal(state.rolledBack, 0); assert.equal(state.released, 1);
  const tables = state.persisted.filter(x => x.sql.startsWith('INSERT')).map(x => x.sql.split(' ')[2]);
  assert.deepEqual(tables, ['pacientes', 'historias_clinicas', 'antecedentes_medicos',
    'auditoria_historias', 'apoderados', 'auditoria_pacientes']);
  assert.deepEqual(state.persisted.find(x => x.sql.startsWith('UPDATE historias')).params, ['HC-0007', 7]);
  assert.deepEqual(state.persisted.find(x => x.sql.startsWith('INSERT INTO apoderados')).params,
    [41, body.apoderado_nombre, 'Madre', body.apoderado_celular]);
  assert.ok(state.persisted.filter(x => x.sql.includes('auditoria_')).every(x => x.params[1] === 'one'));
  reset();
  state.query = (sql, params) => {
    if (sql.startsWith('INSERT INTO antecedentes')) throw new Error('SYNTHETIC_STORAGE_FAILURE');
    return inserts(sql, params);
  };
  const failure = response(); await crearPaciente(req(), failure);
  assert.equal(failure.code, 500); assert.equal(failure.body.mensaje, 'Error al crear paciente.');
  assert.equal(state.committed, 0); assert.equal(state.rolledBack, 1); assert.equal(state.released, 1);
  assert.deepEqual(state.persisted, []); assert.deepEqual(state.staged, []);
});

test('ACA-A-B09 retroactive: duplicate DNI and invalid birth years return 400 before inserts', async () => {
  for (const [patch, duplicate] of [[{}, true], [{ fecha_nacimiento: '' }, false],
    [{ fecha_nacimiento: 'invalid' }, false], [{ fecha_nacimiento: '1899-01-01' }, false],
    [{ fecha_nacimiento: `${new Date().getFullYear() + 1}-06-15` }, false]]) {
    reset(); state.query = sql => {
      assert.ok(sql.startsWith('SELECT id FROM pacientes WHERE dni'));
      return [duplicate ? [{ id: 99 }] : []];
    };
    const res = response(); await crearPaciente(req(patch), res);
    assert.equal(res.code, 400, JSON.stringify({ patch, duplicate, calls: state.calls })); assert.equal(res.body.ok, false);
    assert.match(res.body.mensaje, duplicate ? /DNI.*registrado/ : /fecha de nacimiento/);
    assert.equal(state.calls.length, 1); assert.equal(state.rolledBack, 1);
    assert.equal(state.committed, 0); assert.equal(state.released, 1);
    assert.deepEqual(state.persisted, []);
  }
});
