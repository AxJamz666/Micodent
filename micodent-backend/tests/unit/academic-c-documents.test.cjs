const test = require('node:test');
const assert = require('node:assert/strict');
const { state, reset, response } = require('../helpers/academic-db.cjs');
const h = require('../../src/controllers/historias.controller');

test('ACA-C-B14 Rx and prescription issue/reissue retain content and replacement linkage', async t => {
  t.mock.method(console, 'error', () => {});
  reset();
  let missing = false, annulled = false, failAudit = false, nextId = 90;
  state.query = async sql => {
    if (sql.startsWith('SELECT historia_id')) return [missing ? [] : [{ historia_id: 7, anulada: annulled ? 1 : 0 }]];
    if (sql.startsWith('INSERT INTO auditoria_historias')) {
      if (failAudit) throw new Error('Synthetic audit failure');
      return [{ insertId: 101 }];
    }
    if (sql.startsWith('INSERT INTO')) return [{ insertId: ++nextId }];
    if (sql.startsWith('UPDATE')) return [{ affectedRows: 1 }];
    throw new Error('UNEXPECTED_DOCUMENT_QUERY');
  };
  const body = { tipo_solicitud: 'todo_virtual', motivo: 'Motivo RX sintetico', envio_virtual: 'correo',
    extraorales: ['panoramica'], tomografias: { formato_entrega: 'solo_dvd_usb', opciones: ['implantes'] },
    piezas_tomografia: [11, 21], fotografias: { intraoral: true }, intraorales: { periapicales: true },
    periapicales_piezas: [12], modelos_estudio: ['digital'] };
  const request = (body, params = { historiaId: '7' }) => ({ body, params, usuario: { id: 'one' } });
  let res = response();
  await h.agregarOrdenRadiografia(request(body), res);
  assert.equal(res.code, 201); assert.equal(res.body.ordenId, 91);
  const issued = state.persisted.find(x => x.sql.startsWith('INSERT INTO ordenes'));
  assert.match(issued.sql, /NOW\(\), 1/);
  assert.deepEqual(issued.params.slice(0, 2), ['7', 'one']);
  assert.deepEqual(issued.params.slice(3, 6), ['todo_virtual', body.motivo, 'correo']);
  for (const [index, field] of [[6, 'extraorales'], [7, 'tomografias'], [8, 'piezas_tomografia'],
    [9, 'fotografias'], [10, 'intraorales'], [11, 'periapicales_piezas'], [12, 'modelos_estudio']]) {
    assert.deepEqual(JSON.parse(issued.params[index]), body[field]);
  }
  const reissuedBody = { ...body, motivo: 'Correccion sintetica', motivo_radiografia: 'Nuevo motivo RX' };
  res = response(); await h.reemitirOrdenRadiografia(request(reissuedBody, { id: '81' }), res);
  assert.equal(res.code, 201);
  const replacement = state.persisted.filter(x => x.sql.startsWith('INSERT INTO ordenes')).at(-1);
  assert.equal(replacement.params[4], 'Nuevo motivo RX'); assert.equal(replacement.params.at(-1), '81');
  const oldUpdate = state.persisted.find(x => x.sql.startsWith('UPDATE ordenes'));
  assert.deepEqual(oldUpdate.params, ['Correccion sintetica', 'one', '81']);
  assert.ok(!oldUpdate.sql.includes('piezas_tomografia'));
  res = response(); await h.agregarReceta(request({ rp: 'Rp sintetico', indicaciones: 'Indicacion inicial' }), res);
  assert.equal(res.code, 201);
  res = response(); await h.reemitirReceta(request({ motivo: 'Correccion receta', rp: 'Rp corregido', indicaciones: 'Indicacion corregida' }, { id: '82' }), res);
  assert.equal(res.code, 201);
  const recipe = state.persisted.filter(x => x.sql.startsWith('INSERT INTO recetas')).at(-1);
  assert.deepEqual(recipe.params.slice(3), ['Rp corregido', 'Indicacion corregida', '82']);
  assert.equal(state.persisted.filter(x => x.sql.startsWith('INSERT INTO auditoria_historias')).length, 4);
  for (const controller of [h.reemitirOrdenRadiografia, h.reemitirReceta]) {
    for (const [isMissing, isAnnulled, expected] of [[true, false, 404], [false, true, 409]]) {
      missing = isMissing; annulled = isAnnulled;
      const before = state.persisted.length; res = response();
      await controller(request({ motivo: 'Correccion', rp: 'Rp' }, { id: '99' }), res);
      assert.equal(res.code, expected); assert.equal(state.persisted.length, before);
    }
    missing = false; annulled = false; res = response();
    await controller(request({}, { id: '81' }), res); assert.equal(res.code, 400);
  }
  res = response(); await h.agregarReceta(request({}), res); assert.equal(res.code, 400);
  failAudit = true; const before = state.persisted.length; res = response();
  await h.reemitirOrdenRadiografia(request(reissuedBody, { id: '81' }), res);
  assert.equal(res.code, 500); assert.equal(state.persisted.length, before); assert.deepEqual(state.staged, []);
  assert.ok(!state.calls.some(x => /^DELETE /.test(x.sql)));
  assert.equal(state.released, state.acquired);
});
