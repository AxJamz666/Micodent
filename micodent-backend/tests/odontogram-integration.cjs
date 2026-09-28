const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync, spawnSync } = require('node:child_process');

async function prepare({ conn, root, bin, mysql8, identity, check }) {
  const [legacy] = await conn.query(`INSERT INTO odontograma_items
    (historia_id,pieza,cara,estado_codigo,estado_nombre,color,registrado_por,firmado_en,bloqueada)
    VALUES (1,'13','Toda la pieza','qa_legacy','Original anterior a M07-D','blue','qaotro',NOW(),1)`);
  await conn.query(`INSERT INTO odontograma_adendas (odontograma_item_id,usuario_id,motivo,contenido)
    VALUES (?,'qaotro','Aclaracion anterior','Adenda anterior a la migracion')`, [legacy.insertId]);
  const migration = require('../scripts/migrate-odontogram');
  const sql = fs.readFileSync(path.resolve(__dirname, '../migrations/004_odontogram_annulments.sql'), 'utf8');
  if (!mysql8) {
    await conn.query(sql);
    await conn.execute('INSERT INTO micodent_migrations(id,checksum) VALUES(?,?)', [migration.id, migration.checksum]);
    await migration.verifyApplied(conn);
    return;
  }
  await check('M07-D: migracion aislada preserva datos, rechaza respaldos invalidos y se repite', async () => {
    const dev = await require('mysql2/promise').createConnection({
      ...require('../src/config/environment').databaseOptions(), supportBigNumbers: true, bigNumberStrings: true });
    try {
      const { snapshot } = require('./s1a-hotfix-integration.cjs');
      const before = await snapshot(dev);
      const backup = path.join(root, 'm07d-synthetic-backup'); fs.mkdirSync(backup);
      const dump = execFileSync(path.join(bin, 'mysqldump.exe'), [
        `--defaults-extra-file=${path.join(root, 'synthetic-client.cnf')}`,
        '--single-transaction', '--no-tablespaces', '--set-gtid-purged=OFF', '--hex-blob', 'micodent_dev'],
      { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 ** 2 });
      fs.writeFileSync(path.join(backup, 'micodent_dev.sql'), dump, { flag: 'wx' });
      fs.writeFileSync(path.join(backup, 'estado_bd.json'), JSON.stringify({ identity: { db: 'micodent_dev', uuid: identity.uuid }, tables: before }), { flag: 'wx' });
      const index = Object.fromEntries(['micodent_dev.sql', 'estado_bd.json'].map(name => [name,
        { sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(backup, name))).digest('hex') }]));
      fs.writeFileSync(path.join(backup, 'SHA256.json'), JSON.stringify(index), { flag: 'wx' });
      const invoke = (args, env = process.env) => spawnSync(process.execPath,
        [path.resolve(__dirname, '../scripts/migrate-odontogram.js'), ...args],
        { windowsHide: true, env, encoding: 'utf8', timeout: 30000 });
      assert.notEqual(invoke(['--check', '--server-uuid', 'incorrecto']).status, 0);
      assert.notEqual(invoke(['--check', '--server-uuid', identity.uuid], { ...process.env, DB_NAME: 'not_authorized' }).status, 0);
      assert.notEqual(invoke(['--apply', '--server-uuid', identity.uuid]).status, 0);
      assert.notEqual(invoke(['--apply', '--server-uuid', identity.uuid, '--backup', root]).status, 0);
      fs.appendFileSync(path.join(backup, 'micodent_dev.sql'), '\n-- QA integrity mismatch');
      assert.notEqual(invoke(['--apply', '--server-uuid', identity.uuid, '--backup', backup]).status, 0);
      fs.writeFileSync(path.join(backup, 'micodent_dev.sql'), dump);
      assert.deepEqual(await snapshot(dev), before);
      for (const args of [['--check', '--server-uuid', identity.uuid],
        ['--apply', '--server-uuid', identity.uuid, '--backup', backup],
        ['--apply', '--server-uuid', identity.uuid, '--backup', backup]]) {
        const result = invoke(args);
        assert.equal(result.status, 0, `M07-D migration: ${result.stderr || 'no detail'}`);
      }
      await migration.verifyApplied(conn);
      const after = await snapshot(dev);
      assert.equal(after.length, before.length + 1);
      for (const table of before.filter(t => t.name !== 'micodent_migrations')) {
        assert.deepEqual(after.find(t => t.name === table.name), table);
      }
      await conn.execute('DELETE FROM micodent_migrations WHERE id=?', [migration.id]);
      try {
        assert.notEqual(invoke(['--apply', '--server-uuid', identity.uuid, '--backup', backup]).status, 0,
          'A partial migration must not silently become accepted');
      } finally {
        await conn.execute('INSERT INTO micodent_migrations(id,checksum) VALUES(?,?)', [migration.id, migration.checksum]);
      }
    } finally { await dev.end(); }
  });
}

async function run({ conn, api, tokens, check }) {
  const create = async () => {
    const r = await api('POST', '/historias/1/odontograma-items', {
      pieza: '12', cara: 'Toda la pieza', estado_codigo: 'qa_anular', estado_nombre: 'Hallazgo para anular',
      color: 'red', notas: 'Notas originales sinteticas' }, tokens.qadoctor);
    assert.equal(r.status, 201);
    return r.body.itemId;
  };
  const annul = (id, token = tokens.qadoctor, motivo = 'Pieza registrada por error') =>
    api('DELETE', `/historias/odontograma-items/${id}`, { motivo }, token);
  const amend = id => api('POST', `/historias/odontograma-items/${id}/adendas`,
    { motivo: 'Aclaracion sintetica', contenido: 'Observacion adicional' }, tokens.qadoctor);
  const rows = async (table, id) => (await conn.query(`SELECT * FROM ${table} WHERE odontograma_item_id=?`, [id]))[0];

  await check('M07-D: permisos y validacion no alteran originales', async () => {
    const id = await create();
    for (const reason of ['', '   ', 12, {}, 'x'.repeat(4001)]) assert.equal((await annul(id, tokens.qadoctor, reason)).status, 400);
    assert.equal((await annul(id, tokens.qaotro)).status, 403);
    assert.equal((await annul(id, tokens.qaadmin)).status, 403);
    assert.equal((await annul(id, null)).status, 401);
    assert.equal((await annul('999999999')).status, 404);
    assert.equal((await annul('0')).status, 400);
    assert.equal((await rows('odontograma_anulaciones', id)).length, 0);
  });
  await check('M07-D: doble anulacion conserva original y actualiza historia y conteos', async () => {
    const id = await create();
    const [[before]] = await conn.query('SELECT * FROM odontograma_items WHERE id=?', [id]);
    const result = await Promise.all([annul(id), annul(id)]);
    assert.deepEqual(result.map(r => r.status).sort(), [200, 409]);
    const [[after]] = await conn.query('SELECT * FROM odontograma_items WHERE id=?', [id]);
    assert.deepEqual(after, before);
    const cancelled = await rows('odontograma_anulaciones', id);
    assert.equal(cancelled.length, 1); assert.equal(cancelled[0].anulada_por, 'qadoctor');
    assert.equal(cancelled[0].motivo, 'Pieza registrada por error');
    const [[audit]] = await conn.query('SELECT COUNT(*) AS total FROM auditoria_historias WHERE accion LIKE ?', [`Anuló el registro ${id} del odontograma.%`]);
    assert.equal(Number(audit.total), 1);
    const history = await api('GET', '/historias/paciente/1', null, tokens.qadoctor);
    assert.equal(history.status, 200);
    assert(!history.body.data.odontograma.some(item => String(item.id) === String(id)));
    const trace = history.body.data.odontograma_anulado.find(item => String(item.id) === String(id));
    assert.equal(trace.notas, before.notas); assert.equal(trace.registrado_por, 'qadoctor');
    assert.equal(trace.anulacion_motivo, cancelled[0].motivo);
    const patients = await api('GET', '/pacientes', null, tokens.qaadmin);
    assert.equal(patients.status, 200);
    const patient = patients.body.data.find(p => Number(p.id) === 1);
    assert.equal(Number(patient.total_odontograma), history.body.data.odontograma.length);
    assert.equal((await amend(id)).status, 409);
    await assert.rejects(conn.query('DELETE FROM odontograma_items WHERE id=?', [id]),
      error => error.code === 'ER_ROW_IS_REFERENCED_2');
  });
  await check('M07-D: adendas conservadas y carrera correccion/anulacion serializada', async () => {
    const id = await create(); assert.equal((await amend(id)).status, 201);
    const before = await rows('odontograma_adendas', id);
    assert.equal((await annul(id)).status, 409);
    assert.deepEqual(await rows('odontograma_adendas', id), before);
    for (let i = 0; i < 4; i++) {
      const concurrentId = await create();
      const result = await Promise.all(i % 2 ? [annul(concurrentId), amend(concurrentId)] : [amend(concurrentId), annul(concurrentId)]);
      assert.equal(result.filter(r => r.status === 409).length, 1);
      assert.equal(result.filter(r => [200, 201].includes(r.status)).length, 1);
      assert.equal((await rows('odontograma_anulaciones', concurrentId)).length
        + (await rows('odontograma_adendas', concurrentId)).length, 1);
    }
  });
  await check('M07-D: fallo de auditoria revierte anulacion y adenda', async () => {
    const id = await create();
    await conn.query("CREATE TRIGGER qa_block_m07d_audit BEFORE INSERT ON auditoria_historias FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='QA audit unavailable'");
    try {
      assert.equal((await annul(id)).status, 500);
      assert.equal((await amend(id)).status, 500);
    } finally { await conn.query('DROP TRIGGER qa_block_m07d_audit'); }
    assert.equal((await rows('odontograma_anulaciones', id)).length, 0);
    assert.equal((await rows('odontograma_adendas', id)).length, 0);
    assert.equal((await annul(id)).status, 200);
  });
}

module.exports = { prepare, run };
