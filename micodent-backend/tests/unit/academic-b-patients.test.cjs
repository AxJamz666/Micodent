const test = require('node:test');
const assert = require('node:assert/strict');
const { f, state, reset } = require('../helpers/academic-db.cjs');
let server, base, session;
async function request(path, method = 'GET', body) {
  const res = await fetch(base + '/api' + path, { method, headers: {
    Origin: 'http://localhost:5173', 'X-Micodent-Client': 'web', 'Content-Type': 'application/json',
    ...(session ? { Cookie: session.cookie, 'X-Micodent-Session': session.id, 'X-CSRF-Token': session.csrf } : {}),
  }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, body: await res.json(), cookie: res.headers.get('set-cookie') };
}
test.before(async () => {
  server = await new Promise(resolve => { const app = f.app.listen(0, '127.0.0.1', () => resolve(app)); });
  base = 'http://127.0.0.1:' + server.address().port;
  const login = await request('/auth/login', 'POST', { id: 'one', password: f.password });
  assert.equal(login.status, 200);
  session = { ...login.body.sesion, cookie: login.cookie.split(';')[0] };
});
test.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
test.beforeEach(t => { reset(); t.mock.method(console, 'error', () => {}); });

test('ACA-B-B10 retroactive HTTP: archive/reactivate patient and HC, list projection and invalid IDs before SQL', async () => {
  let active = true, hcActive = true;
  state.query = (sql, params) => {
    if (sql.startsWith('SELECT id FROM pacientes')) return [params[0] === '41' ? [{ id: 41 }] : []];
    if (sql.startsWith('UPDATE pacientes SET activo')) { active = sql.includes('= 1'); return [{ affectedRows: 1 }]; }
    if (sql.startsWith('UPDATE historias_clinicas SET activa')) { hcActive = sql.includes('= 1'); return [{ affectedRows: 1 }]; }
    if (sql.startsWith('INSERT INTO auditoria_pacientes')) return [{ insertId: 91 }];
    if (sql.startsWith('SELECT p.*')) {
      assert.match(sql, /p.activo = 1/);
      return [active ? [{ id: 41, activo: 1, historia_id: 7, nro_historia: 'HC-0007',
        tiene_antecedentes: 1, total_odontograma: 1, total_evoluciones: 2 }] : []];
    }
    throw new Error('UNEXPECTED_PATIENT_HTTP_QUERY');
  };
  const archived = await request('/pacientes/41', 'DELETE');
  assert.equal(archived.status, 200); assert.equal(active, false); assert.equal(hcActive, false);
  assert.deepEqual((await request('/pacientes')).body.data, []);
  const restored = await request('/pacientes/41/reactivar', 'PUT', {});
  assert.equal(restored.status, 200); assert.equal(active, true); assert.equal(hcActive, true);
  const list = await request('/pacientes');
  assert.equal(list.body.data[0].historia_id, 7); assert.equal(list.body.data[0].estado_hc, 'completa');
  assert.equal(state.persisted.filter(x => x.sql.startsWith('INSERT INTO auditoria_pacientes')).length, 2);
  assert.ok(state.persisted.every(x => !x.sql.startsWith('DELETE')));
  const beforeWrites = state.persisted.length;
  assert.equal((await request('/pacientes/99', 'DELETE')).status, 404);
  assert.equal(state.persisted.length, beforeWrites);
  for (const id of ['0', '-1', '1.5', '9007199254740992', 'abc']) {
    const beforeQueries = state.calls.length;
    for (const [method, suffix] of [['GET', ''], ['DELETE', ''], ['PUT', '/reactivar']]) {
      const result = await request('/pacientes/' + id + suffix, method, method === 'PUT' ? {} : undefined);
      assert.equal(result.status, 400);
      assert.equal(result.body.mensaje, 'Identificador de paciente no valido.');
    }
    assert.equal(state.calls.length, beforeQueries);
  }
});

test('ACA-B-B11 retroactive HTTP: full history preserves DECIMAL/IDs, JSON object/text/malformed document shapes and 404/500', async () => {
  let representation = 'object', missing = false, fail = false;
  const json = value => representation === 'text' ? JSON.stringify(JSON.stringify(value))
    : representation === 'bad' ? '{invalid' : value;
  state.query = (sql, params) => {
    if (fail) throw new Error('SYNTHETIC_CLINICAL_READ_FAILURE');
    if (sql.startsWith('SELECT h.*')) return [missing ? [] : [{ id: 7, paciente_id: 41, nro_historia: 'HC-0007' }]];
    if (sql.includes('FROM antecedentes_medicos')) return [[{ historia_id: 7, motivo_consulta: 'Motivo ficticio' }]];
    if (sql.includes('FROM triaje')) return [[{ historia_id: 7, presion: '120/80' }]];
    if (sql.includes('FROM odontograma_items')) return [[{ id: 51, pieza: '11', historia_id: 7 }]];
    if (sql.includes('FROM odontograma_adendas')) { assert.equal(params[0], 51); return [[{ id: 52, contenido: 'Adenda diente' }]]; }
    if (sql.includes('FROM consultas c')) return [[{ id: 71, historia_id: 7, costo_total: '380.00', total_pagado: '80.00', bloqueada: 1 }]];
    if (sql.includes('FROM pagos_vigentes')) { assert.equal(params[0], 71); return [[{ id: 81, monto: '80.00', comision_generada: '12.00' }]]; }
    if (sql.includes('FROM consultas_adendas')) return [[{ id: 82, contenido: 'Adenda evolucion' }]];
    if (sql.includes('FROM firmas_consentimiento')) return [[{ id: 83, firma_paciente_data: 'Firma ficticia' }]];
    if (sql.includes('FROM radiografias r')) return [[{ id: 84, nombre_archivo: 'synthetic.png', descripcion: 'Anexo ficticio' }]];
    if (sql.includes('FROM recetas r')) return [[{ id: 85, rp: 'Rp ficticio', medicamentos: json(['Medicamento ficticio']) }]];
    if (sql.includes('FROM ordenes_radiografia o')) return [[{ id: 86, extraorales: json(['panoramica']),
      piezas_tomografia: json([11, 21]), periapicales_piezas: json([12]),
      tomografias: json({ formato_entrega: 'solo_dvd_usb', opciones: ['implantes'] }), intraorales: json({ periapicales: true }) }]];
    if (sql.includes('FROM auditoria_historias')) return [[{ id: 87, accion: 'Accion ficticia' }]];
    throw new Error('UNEXPECTED_HISTORY_HTTP_QUERY');
  };
  for (representation of ['object', 'text', 'bad']) {
    const res = await request('/historias/paciente/41'); assert.equal(res.status, 200);
    const history = res.body.data;
    assert.equal(history.id, 7); assert.equal(history.antecedentes.motivo_consulta, 'Motivo ficticio');
    assert.equal(history.triaje.presion, '120/80'); assert.equal(history.odontograma[0].adendas[0].id, 52);
    assert.equal(history.consultas[0].costo_total, '380.00'); assert.equal(history.consultas[0].pagos[0].monto, '80.00');
    assert.equal(history.consultas[0].adendas[0].id, 82); assert.equal(history.firma.id, 83);
    assert.equal(history.radiografias[0].id, 84); assert.equal(history.auditoria[0].id, 87);
    assert.deepEqual(history.recetas[0].medicamentos, representation === 'bad' ? [] : ['Medicamento ficticio']);
    assert.deepEqual(history.ordenes[0].piezas_tomografia, representation === 'bad' ? [] : [11, 21]);
    assert.deepEqual(history.ordenes[0].tomografias.opciones, representation === 'bad' ? [] : ['implantes']);
  }
  missing = true; assert.equal((await request('/historias/paciente/41')).status, 404);
  missing = false; fail = true; const error = await request('/historias/paciente/41');
  assert.equal(error.status, 500); assert.equal(error.body.mensaje, 'Error al obtener historia cl\u00ednica.');
  assert.equal(state.persisted.length, 0);
});
