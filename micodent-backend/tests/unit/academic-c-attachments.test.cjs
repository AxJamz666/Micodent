const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'micodent-academic-c-'));
// Keep all storage operations in a disposable directory, never the clinical root.
const config = require.resolve('../../src/config/multer');
require.cache[config] = { id: config, filename: config, loaded: true,
  exports: { uploadDir: root, upload: { single: () => (_req, _res, next) => next() } } };
const { state, reset, response } = require('../helpers/academic-db.cjs');
const db = require.cache[require.resolve('../../src/config/db')].exports;
db.execute = (...args) => db.query(...args);
const h = require('../../src/controllers/historias.controller');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9yQAAAAASUVORK5CYII=', 'base64');
const actor = { id: 'one', nivel: 3, isAdmin: true, rol: 'Doctor' };
test.beforeEach(t => { reset(); t.mock.method(console, 'error', () => {}); });
test.after(() => {
  const target = fs.realpathSync(root), parent = fs.realpathSync(os.tmpdir());
  if (path.dirname(target) !== parent || !path.basename(target).startsWith('micodent-academic-c-')) throw new Error('UNSAFE_TEST_CLEANUP');
  fs.rmSync(target, { recursive: true });
});

test('ACA-C-B15 attachment archive preserves bytes; restoration requires available regular files', async () => {
  const file = path.join(root, 'existing.png'); fs.writeFileSync(file, png);
  let archived = false, missing = false, fail = false;
  state.query = async (sql, params) => {
    if (fail) throw new Error('Synthetic private SQL error');
    if (sql.startsWith('SELECT r.*')) return [archived === sql.includes('a.radiografia_id IS NOT NULL') ? [{ id: 81, descripcion: 'Anexo sintetico' }] : []];
    if (sql.startsWith('SELECT historia_id')) return [missing ? [] : [{ historia_id: 7, descripcion: 'Anexo sintetico', url_archivo: '/uploads/existing.png' }]];
    if (sql.startsWith('SELECT restaurada_en')) return [archived ? [{ restaurada_en: null }] : []];
    if (sql.startsWith('INSERT INTO radiografias_anulaciones')) { archived = true; return [{ affectedRows: 1 }]; }
    if (sql.startsWith('UPDATE radiografias_anulaciones')) { archived = false; return [{ affectedRows: 1 }]; }
    if (sql.startsWith('INSERT INTO auditoria_historias')) { assert.equal(params[0], 7); return [{ insertId: 91 }]; }
    throw new Error('UNEXPECTED_ATTACHMENT_SQL');
  };
  const req = { usuario: actor, params: { id: '81', historiaId: '7' }, query: {} };
  let res = response(); await h.getRadiografias(req, res); assert.equal(res.body.data.length, 1);
  res = response(); await h.eliminarRadiografia(req, res); assert.equal(res.code, 200);
  assert.deepEqual(fs.readFileSync(file), png);
  res = response(); await h.getRadiografias(req, res); assert.deepEqual(res.body.data, []);
  res = response(); await h.getRadiografias({ ...req, query: { archivadas: '1' } }, res); assert.equal(res.body.data[0].id, 81);
  res = response(); await h.getRadiografias({ ...req, usuario: { ...actor, isAdmin: false, nivel: 1 }, query: { archivadas: '1' } }, res); assert.equal(res.code, 403);
  res = response(); await h.eliminarRadiografia(req, res); assert.equal(res.code, 409);
  fs.renameSync(file, path.join(root, 'recoverable.png'));
  const before = state.persisted.length; res = response();
  await h.restaurarRadiografia(req, res); assert.equal(res.code, 409);
  assert.equal(archived, true); assert.equal(state.persisted.length, before);
  fs.renameSync(path.join(root, 'recoverable.png'), file);
  res = response(); await h.restaurarRadiografia(req, res); assert.equal(res.code, 200); assert.equal(archived, false);
  assert.deepEqual(fs.readFileSync(file), png);
  res = response(); await h.restaurarRadiografia(req, res); assert.equal(res.code, 409);
  missing = true; res = response(); await h.eliminarRadiografia(req, res); assert.equal(res.code, 404);
  fail = true; res = response(); await h.getRadiografias(req, res); assert.equal(res.code, 500);
  assert.equal(res.body.mensaje, 'Error al obtener im\u00e1genes.');
  assert.equal(state.persisted.filter(x => x.sql.startsWith('INSERT INTO auditoria_historias')).length, 2);
  assert.ok(!state.calls.some(x => /^DELETE /.test(x.sql)));
  assert.equal(state.released, state.acquired);
});

test('ACA-C-B17 real staging cleanup rejects invalid content and retains bytes on uncertain commit', async t => {
  let sequence = 0, failInsert = false;
  const staged = (bytes = png) => {
    const filename = 'staged-' + ++sequence + '.png', p = path.join(root, 'temporary-' + sequence);
    fs.writeFileSync(p, bytes); return { filename, path: p, size: bytes.length };
  };
  const req = file => ({ params: { historiaId: '7' }, body: { descripcion: 'Anexo sintetico' }, usuario: actor, file });
  state.query = async sql => {
    if (sql.startsWith('SELECT id FROM historias')) return [[{ id: 7 }]];
    if (sql.startsWith('INSERT INTO radiografias') && failInsert) throw new Error('Synthetic insert failure');
    if (sql.startsWith('INSERT INTO')) return [{ insertId: 81 }];
    throw new Error('UNEXPECTED_UPLOAD_SQL');
  };
  let file = staged(Buffer.from('not a png')), res = response();
  await h.subirRadiografia(req(file), res); assert.equal(res.code, 400); assert.equal(fs.existsSync(file.path), false);
  assert.equal(state.acquired, 0);
  file = staged(); res = response();
  await h.subirRadiografia({ ...req(file), params: { historiaId: 'invalid' } }, res);
  assert.equal(res.code, 400); assert.equal(fs.existsSync(file.path), false);
  file = staged(); res = response(); await h.subirRadiografia(req(file), res);
  assert.equal(res.code, 201); assert.equal(res.body.radiografiaId, 81);
  assert.equal(fs.existsSync(file.path), false);
  assert.deepEqual(fs.readFileSync(path.join(root, file.filename)), png);
  const before = state.persisted.length;
  file = staged(); failInsert = true; res = response();
  await h.subirRadiografia(req(file), res); assert.equal(res.code, 500); assert.equal(fs.existsSync(file.path), false);
  // The current controller retains the already-linked orphan for reconciliation.
  assert.deepEqual(fs.readFileSync(path.join(root, file.filename)), png);
  assert.equal(state.persisted.length, before);
  failInsert = false;
  const acquire = db.getConnection;
  t.mock.method(db, 'getConnection', async () => {
    const conn = await acquire();
    conn.commit = async () => { throw new Error('Synthetic uncertain commit'); };
    return conn;
  });
  file = staged(); res = response(); await h.subirRadiografia(req(file), res);
  assert.equal(res.code, 500);
  assert.deepEqual(fs.readFileSync(file.path), png);
  assert.deepEqual(fs.readFileSync(path.join(root, file.filename)), png);
  assert.equal(state.persisted.length, before); assert.equal(state.released, state.acquired);
});
