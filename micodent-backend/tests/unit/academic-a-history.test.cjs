const test = require('node:test');
const assert = require('node:assert/strict');
const { state, reset, response } = require('../helpers/academic-db.cjs');
const { guardarAntecedentes, editarConsulta, agregarAdendaConsulta } = require('../../src/controllers/historias.controller');
const request = (body, params = { historiaId: '7' }) => ({ body, params, usuario: { id: 'one' } });
test.beforeEach(t => { reset(); t.mock.method(console, 'error', () => {}); });

test('ACA-A-B12 retroactive: antecedents and conditional triage audited in transaction; error/invalid ID rollback', async () => {
  const body = { motivo_consulta: 'Control sintetico', antecedentes_medicos: 'Ninguno',
    antecedentes_quirurgicos: 'Ninguno', antecedentes_odontologicos: 'Control previo',
    diagnostico: 'Diagnostico ficticio', plan_tratamiento: 'Plan ficticio', examen_clinico: 'Examen ficticio',
    presion: '120/80', pulso: '70', temperatura: '36.5', fc: '70', fr: '18' };
  for (const triage of [true, false]) {
    reset(); state.query = sql => {
      assert.match(sql, /^(UPDATE antecedentes_medicos|INSERT INTO (triaje|auditoria_historias))/);
      return [{ affectedRows: 1 }];
    };
    const payload = { ...body, ...(triage ? {} : { presion: '', pulso: '', temperatura: '', fc: '', fr: '' }) };
    const res = response(); await guardarAntecedentes(request(payload), res);
    assert.equal(res.code, 200); assert.equal(res.body.ok, true);
    assert.deepEqual(state.persisted[0].params, Object.values(body).slice(0, 7).concat('7'));
    assert.equal(state.persisted.some(x => x.sql.startsWith('INSERT INTO triaje')), triage);
    if (triage) assert.deepEqual(state.persisted[1].params.slice(0, 6), ['7', '120/80', '70', '36.5', '70', '18']);
    assert.match(state.persisted.at(-1).sql, /auditoria_historias/);
    assert.deepEqual(state.persisted.at(-1).params.slice(0, 2), ['7', 'one']);
    assert.equal(state.committed, 1); assert.equal(state.released, 1);
  }
  reset(); state.query = sql => {
    if (sql.includes('auditoria_historias')) throw new Error('SYNTHETIC_AUDIT_FAILURE');
    return [{ affectedRows: 1 }];
  };
  const failure = response(); await guardarAntecedentes(request(body), failure);
  assert.equal(failure.code, 500); assert.equal(failure.body.mensaje, 'Error al guardar antecedentes.');
  assert.equal(state.rolledBack, 1); assert.equal(state.released, 1); assert.equal(state.committed, 0);
  assert.deepEqual(state.persisted, []);
  reset(); const invalid = response(); await guardarAntecedentes(request(body, { historiaId: 'invalid' }), invalid);
  assert.equal(invalid.code, 400); assert.equal(state.calls.length, 0); assert.equal(state.released, 1);
});

test('ACA-A-B13 retroactive: signed evolution immutable; correction appends and audits, rejects missing/unlocked/incomplete', async () => {
  state.query = sql => {
    if (sql.startsWith('SELECT historia_id')) return [[{ historia_id: 7, bloqueada: 1 }]];
    if (sql.startsWith('INSERT INTO consultas_adendas') || sql.startsWith('INSERT INTO auditoria_historias')) return [{ insertId: 91 }];
    throw new Error('UNEXPECTED_EVOLUTION_WRITE');
  };
  const body = { descripcion: 'No debe reemplazar', costo_total: 999, fecha_consulta: '2026-10-03' };
  const locked = response(); await editarConsulta(request(body, { id: '71' }), locked);
  assert.equal(locked.code, 409); assert.equal(state.persisted.length, 0);
  const correction = { motivo: 'Precision sintetica', contenido: 'Contenido corregido' };
  const res = response(); await agregarAdendaConsulta(request(correction, { id: '71' }), res);
  assert.equal(res.code, 201);
  assert.deepEqual(state.persisted[0].params, ['71', 'one', correction.motivo, correction.contenido]);
  assert.match(state.persisted[1].sql, /auditoria_historias/);
  assert.ok(state.calls.every(x => !x.sql.startsWith('UPDATE consultas')));
  for (const [rows, payload, status] of [[[], correction, 404],
    [[{ historia_id: 7, bloqueada: 0 }], correction, 400],
    [[{ historia_id: 7, bloqueada: 1 }], { motivo: '', contenido: 'Correccion' }, 400]]) {
    reset(); state.query = sql => { assert.match(sql, /^SELECT historia_id/); return [rows]; };
    const invalid = response(); await agregarAdendaConsulta(request(payload, { id: '71' }), invalid);
    assert.equal(invalid.code, status); assert.equal(state.persisted.length, 0);
    assert.equal(state.calls.length, payload.motivo ? 1 : 0);
  }
});
