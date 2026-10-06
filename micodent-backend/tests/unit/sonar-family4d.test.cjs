const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const express = require('express');
const { once } = require('node:events');
const jsonFields = require('../../src/utils/jsonFields');
const { createBrowserTransport, COOKIE_NAME } = require('../../src/services/browserTransport');
const { createSessionService } = require('../../src/services/session.service');
const { validStagedFile } = require('../../src/services/clinicalUpload');
const { tmpdir } = require('node:os');

test('4D actual Multer accepts clinical images within 10 MiB and rejects oversize and mismatched uploads', async () => {
  const temporary = fs.mkdtempSync(path.join(tmpdir(), 'micodent-family4d-upload-'));
  assert.equal(path.dirname(path.resolve(temporary)), path.resolve(tmpdir()));
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../src/config/multer.js'), 'utf8'), {
    require, module, __dirname: path.join(temporary, 'config'),
  });
  const { upload, uploadDir } = module.exports;
  assert.equal(path.resolve(uploadDir), path.join(temporary, 'uploads'));
  const limit = 10 * 1024 * 1024;
  assert.equal(upload.limits.fileSize, limit);
  assert.equal(upload.limits.files, 1);
  assert.equal(upload.limits.fields, 2);
  assert.equal(upload.limits.parts, 3);
  assert.equal(upload.limits.fieldSize, 2048);
  const app = express();
  app.post('/upload', (req, res) => upload.single('imagen')(req, res, async error => {
    if (error) return res.status(400).json({ code: error.code || 'FORMAT_REJECTED' });
    const valid = await validStagedFile(req.file);
    const size = req.file.size;
    fs.unlinkSync(req.file.path);
    res.status(valid ? 200 : 400).json({ valid, size });
  }));
  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const url = 'http://127.0.0.1:' + server.address().port + '/upload';
    for (const [size, mime, expectedStatus, expectedCode] of [
      [9 * 1024 * 1024, 'image/jpeg', 200, null],
      [limit + 1, 'image/jpeg', 400, 'LIMIT_FILE_SIZE'],
      [32, 'image/png', 400, 'FORMAT_REJECTED'],
    ]) {
      const bytes = Buffer.alloc(size);
      bytes.set([0xff, 0xd8, 0xff], 0);
      bytes.set([0xff, 0xd9], size - 2);
      const form = new FormData();
      form.append('imagen', new Blob([bytes], { type: mime }), 'synthetic.jpg');
      const response = await fetch(url, { method: 'POST', body: form });
      assert.equal(response.status, expectedStatus);
      const result = await response.json();
      if (expectedCode) assert.equal(result.code, expectedCode);
      else assert.deepEqual(result, { valid: true, size });
      assert.deepEqual(fs.readdirSync(path.join(uploadDir, '.staging')), []);
    }
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    if (path.dirname(path.resolve(temporary)) !== path.resolve(tmpdir())) throw new Error('UNSAFE_TEST_CLEANUP');
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('4D extracted cookie reader is independent but session secrets remain instance-specific', () => {
  const first = createBrowserTransport({ secret: 'a'.repeat(32) });
  const second = createBrowserTransport({ secret: 'b'.repeat(32) });
  assert.equal(first.token, second.token);
  assert.equal(first.token({ headers: { cookie: COOKIE_NAME + '=synthetic' } }), 'synthetic');
  assert.notDeepEqual(first.session('synthetic'), second.session('synthetic'));
  for (const cookie of ['', COOKIE_NAME + '=', COOKIE_NAME + '=a; ' + COOKIE_NAME + '=b',
    COOKIE_NAME + '=' + 'x'.repeat(4097), 'x'.repeat(16385), ['ambiguous']]) {
    assert.throws(() => first.token({ headers: { cookie } }), error => error.code === 'AUTH_SESSION_INVALID');
  }
});

test('4D extracted user operations use only the supplied connection and preserve locking and revocation', async () => {
  const unused = { execute() { throw new Error('FACTORY_DB_MUST_NOT_BE_USED'); } };
  const first = createSessionService(unused, {});
  const second = createSessionService(unused, {});
  assert.equal(first.loadUser, second.loadUser);
  assert.equal(first.revokeUser, second.revokeUser);
  for (const lock of [false, true]) {
    const calls = [];
    const user = { id: 'synthetic' };
    const conn = { async execute(sql, parameters) { calls.push([sql, parameters]); return [[user]]; } };
    assert.equal(await first.loadUser(conn, user.id, lock), user);
    assert.equal(calls[0][0].endsWith(' FOR UPDATE'), lock);
    assert.deepEqual(calls[0][1], [user.id]);
    await second.revokeUser(conn, user.id);
    assert.deepEqual(calls.slice(1), [
      ['UPDATE usuarios SET auth_version = auth_version + 1 WHERE id = ?', [user.id]],
      ['UPDATE seguridad_sesiones SET revocada_en = CURRENT_TIMESTAMP(3) WHERE usuario_id = ? AND revocada_en IS NULL', [user.id]],
    ]);
  }
  assert.equal(await first.loadUser({ execute: async () => [[]] }, 'missing'), undefined);
  let calls = 0;
  await assert.rejects(first.revokeUser({ async execute() { calls++; throw new Error('synthetic-db-error'); } }, 'synthetic'), /synthetic-db-error/);
  assert.equal(calls, 1);
});

test('4D legacy JSON parsing preserves shapes, fallback identity and parse depth', () => {
  const previous = (value, fallback) => {
    for (let n = 0; typeof value === 'string' && n < 3; n++) {
      try { value = JSON.parse(value); } catch { return fallback; }
    }
    return Array.isArray(fallback) ? (Array.isArray(value) ? value : fallback)
      : (value && typeof value === 'object' && !Array.isArray(value) ? value : fallback);
  };
  for (const fallback of [[], {}, null, false]) for (const value of [
    null, undefined, false, 0, 7, [], {}, { opciones: [] }, '[1]', '{"a":1}', 'bad-json',
    JSON.stringify(JSON.stringify([1])), JSON.stringify(JSON.stringify(JSON.stringify({ a: 1 }))),
    JSON.stringify(JSON.stringify(JSON.stringify(JSON.stringify([1])))),
  ]) {
    assert.deepEqual(jsonFields.parse(value, fallback), previous(value, fallback));
    if (typeof value !== 'string') assert.equal(jsonFields.parse(value, fallback), previous(value, fallback));
  }
});

test('4D laboratory status preserves all payment branches including zero, excess and invalid legacy totals', async () => {
  for (const [total, paid] of [['100', 0], ['100', 20], ['100', 100], ['100', 110], ['0', 0], ['100', -1], ['bad', 1]]) {
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../src/controllers/laboratorio.controller.js'), 'utf8'), {
      module,
      require: id => {
        if (id === '../services/operacionFinanciera') return (_operation, handler) => handler;
        if (id === '../config/db') return { async query(sql) {
          return [sql.includes('SELECT t.*') ? [{ id: 1, monto_total: total }] : [{ monto: String(paid) }]];
        } };
        return {};
      },
    });
    let result;
    await module.exports.getTrabajosPorConsulta({ params: { consultaId: '1' } }, { json(value) { result = value; } });
    const state = paid >= Number.parseFloat(total) ? 'pagado' : (paid > 0 ? 'parcial' : 'pendiente');
    assert.equal(result.data[0].estado, state);
    assert.equal(result.data[0].total_pagado, paid);
    assert.equal(result.data[0].saldo_pendiente, Number.parseFloat(total) - paid);
  }
});

test('4D real Express responses never disclose X-Powered-By', async () => {
  const module = { exports: {} };
  const fakeRequire = id => {
    if (id === 'express') return express;
    if (id === 'cors') return require('cors');
    if (id === 'node:path') return path;
    if (id === './config/db') return { query() { throw new Error('NO_DATABASE_IN_TEST'); } };
    if (id === './config/browserTransport') return { origins: [], boundary: (_req, _res, next) => next() };
    if (id.startsWith('./routes/')) return express.Router();
    throw new Error('UNEXPECTED_IMPORT');
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../src/index.js'), 'utf8'), {
    require: fakeRequire, module, process: { env: {} }, __dirname: path.join(__dirname, '../../src'),
  });
  const app = module.exports;
  assert.equal(app.enabled('x-powered-by'), false);
  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const url = 'http://127.0.0.1:' + server.address().port;
    for (const [route, status] of [['/api/ping', 200], ['/api/missing', 404], ['/uploads/missing.png', 404]]) {
      const response = await fetch(url + route);
      assert.equal(response.status, status);
      assert.equal(response.headers.get('x-powered-by'), null);
      const body = await response.json();
      assert.equal(body.ok, status === 200);
    }
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
