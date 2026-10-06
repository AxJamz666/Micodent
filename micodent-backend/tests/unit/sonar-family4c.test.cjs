const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function controller(file, overrides = {}) {
  const logs = [];
  const module = { exports: {} };
  const defaults = {
    '../utils/fecha': { fechaLima: () => '2026-10-03', horaLimaCorta: () => '10:00' },
    '../config/multer': { uploadDir: 'C:/isolated/uploads' },
    '../services/clinicalUpload': { validStagedFile: async () => true },
    '../services/clinicalFiles': { storedName: () => 'synthetic.png' },
    '../services/accessPolicy': { CAPABILITY: {}, hasCapability: () => true },
    'node:path': path,
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../src/controllers', file), 'utf8'), {
    module, exports: module.exports,
    require: (id) => overrides[id] ?? defaults[id] ?? {},
    console: { error: (...args) => logs.push(args) },
  }, { filename: file });
  return { handlers: module.exports, logs };
}

function response() {
  return {
    code: 200, sent: 0,
    status(code) { this.code = code; return this; },
    json(body) { this.sent++; this.body = JSON.parse(JSON.stringify(body)); return this; },
  };
}

function clinicalFixture(operation, failure) {
  const events = [];
  const connection = {
    async beginTransaction() { events.push('begin'); },
    async execute(sql) {
      events.push(sql.split(' ')[0]);
      if (sql.startsWith('SELECT')) {
        if (sql.includes('radiografias_anulaciones')) {
          return [operation === 'restaurarRadiografia' ? [{ restaurada_en: null }] : []];
        }
        return [[{ id: 1, historia_id: 1, descripcion: 'synthetic', url_archivo: '/uploads/synthetic.png' }]];
      }
      return [{ insertId: 37 }];
    },
    async commit() { events.push('commit'); if (failure) throw failure; },
    async rollback() { events.push('rollback'); },
    release() { events.push('release'); },
  };
  const fixture = controller('historias.controller.js', {
    '../config/db': {
      async query() { if (failure) throw failure; return [[{ id: 1 }]]; },
      async getConnection() { return connection; },
    },
    'node:fs/promises': {
      async link() { events.push('link'); },
      async unlink(value) { events.push(['unlink', value]); },
      async lstat() { return { isDirectory: () => true, isSymbolicLink: () => false, isFile: () => true, size: 8 }; },
    },
  });
  return { ...fixture, events };
}

const clinicalCases = [
  ['subirRadiografia', 'CLINICAL_UPLOAD_FAILED', 'Error al subir imagen.', 201],
  ['getRadiografias', 'CLINICAL_IMAGES_READ_FAILED', 'Error al obtener imágenes.', 200],
  ['eliminarRadiografia', 'CLINICAL_IMAGE_ARCHIVE_FAILED', 'Error al eliminar imagen.', 200],
  ['restaurarRadiografia', 'CLINICAL_IMAGE_RESTORE_FAILED', 'Error al restaurar anexo.', 200],
  ['getCentrosReferencia', 'CLINICAL_REFERENCE_CENTERS_READ_FAILED', 'Error al obtener centros de referencia.', 200],
];

const patientCases = [
  ['getPacienteById', 'PATIENT_READ_FAILED', 'Error al obtener paciente.'],
  ['editarPaciente', 'PATIENT_UPDATE_FAILED', 'Error al editar paciente.'],
  ['getAuditoriaPaciente', 'PATIENT_AUDIT_READ_FAILED', 'Error al obtener auditoría.'],
];

for (const [operation, event, message] of [
  ['getUsuarios', 'USERS_READ_FAILED', 'Error al obtener usuarios.'],
  ['getDoctores', 'DOCTORS_READ_FAILED', 'Error al obtener doctores.'],
]) {
  test(`4C ${operation}: success and safe diagnostics without changing API`, async () => {
    for (const code of [null, 'PRIVATE_TOKEN', 'ECONNREFUSED']) {
      const fixture = controller('usuarios.controller.js', {
        '../config/db': {
          async query() {
            if (code) throw Object.assign(new Error('PRIVATE_PATIENT_SQL_PASSWORD'), { code });
            return [[{ id: 'synthetic' }]];
          },
        },
      });
      const res = response();
      await fixture.handlers[operation]({}, res);
      assert.equal(res.sent, 1);
      assert.equal(res.code, code ? 500 : 200);
      assert.deepEqual(res.body, code ? { ok: false, mensaje: message } : { ok: true, data: [{ id: 'synthetic' }] });
      assert.deepEqual(fixture.logs, code ? [[event, code === 'ECONNREFUSED' ? 'CONNECTION_REFUSED' : 'OPERATION_FAILED']] : []);
      assert(!JSON.stringify([res.body, fixture.logs]).includes('PRIVATE'));
    }
  });
}

for (const [operation, event, message] of patientCases) {
  test(`4C ${operation}: success, controlled failure and rollback/release`, async () => {
    for (const code of [null, 'PRIVATE_TOKEN', 'ECONNREFUSED']) {
      const failure = code && Object.assign(new Error('PRIVATE_PATIENT_SQL_PASSWORD'), { code });
      const events = [];
      const query = async (sql) => {
        if (failure) throw failure;
        return [sql.startsWith('SELECT') ? [{ id: 1 }] : { affectedRows: 1 }];
      };
      const connection = {
        query,
        async beginTransaction() { events.push('begin'); },
        async commit() { events.push('commit'); },
        async rollback() { events.push('rollback'); },
        release() { events.push('release'); },
      };
      const fixture = controller('pacientes.controller.js', {
        '../config/db': { query, async getConnection() { return connection; } },
      });
      const res = response();
      await fixture.handlers[operation]({
        params: { id: '1' }, body: { fecha_nacimiento: '2000-01-01' }, usuario: { id: 'synthetic' },
      }, res);
      assert.equal(res.sent, 1);
      assert.equal(res.code, failure ? 500 : 200);
      if (failure) {
        assert.deepEqual(res.body, { ok: false, mensaje: message });
        assert.deepEqual(fixture.logs, [[event, code === 'ECONNREFUSED' ? 'CONNECTION_REFUSED' : 'OPERATION_FAILED']]);
        assert(!JSON.stringify([res.body, fixture.logs]).includes('PRIVATE'));
      } else {
        assert.equal(res.body.ok, true);
        assert.deepEqual(fixture.logs, []);
      }
      if (operation === 'editarPaciente') {
        assert.deepEqual(events, ['begin', failure ? 'rollback' : 'commit', 'release']);
      }
    }
  });
}

for (const [operation, event, message, successCode] of clinicalCases) {
  test(`4C ${operation}: success, private failure and transaction/file preservation`, async () => {
    for (const code of [null, 'PRIVATE_TOKEN', 'ECONNREFUSED']) {
      const failure = code && Object.assign(new Error('PRIVATE_PATIENT_SQL_PASSWORD'), { code });
      const fixture = clinicalFixture(operation, failure);
      const res = response();
      await fixture.handlers[operation]({
        params: { id: '1', historiaId: '1' }, query: {}, body: {}, usuario: { id: 'synthetic' },
        file: { path: 'stage/synthetic.png', filename: 'synthetic.png' },
      }, res);
      assert.equal(res.sent, 1);
      assert.equal(res.code, failure ? 500 : successCode);
      if (failure) {
        assert.deepEqual(res.body, { ok: false, mensaje: message });
        assert.deepEqual(fixture.logs, [[event, code === 'ECONNREFUSED' ? 'CONNECTION_REFUSED' : 'OPERATION_FAILED']]);
        assert(!JSON.stringify([res.body, fixture.logs]).includes('PRIVATE'));
      } else {
        assert.equal(res.body.ok, true);
        assert.deepEqual(fixture.logs, []);
      }
      if (!['getRadiografias', 'getCentrosReferencia'].includes(operation)) {
        assert.equal(fixture.events.filter((x) => x === 'release').length, 1);
        if (failure) assert(fixture.events.includes('rollback'));
      }
      if (operation === 'subirRadiografia') {
        assert(fixture.events.includes('link'));
        assert.deepEqual(fixture.events.filter(Array.isArray), failure ? [] : [['unlink', 'stage/synthetic.png']]);
        if (!failure) assert.equal(res.body.radiografiaId, 37);
      } else {
        assert.deepEqual(fixture.events.filter(Array.isArray), []);
      }
    }
  });
}
