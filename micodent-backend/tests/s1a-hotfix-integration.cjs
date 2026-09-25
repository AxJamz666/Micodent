const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const mysql = require('mysql2/promise');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const quote = name => {
  assert(/^[a-zA-Z0-9_]+$/.test(name));
  return '`' + name + '`';
};

async function snapshot(conn) {
  const [objects] = await conn.query('SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME');
  const tables = [];
  for (const { name } of objects) {
    const [fields] = await conn.query('SHOW COLUMNS FROM ' + quote(name));
    const columns = fields.map(f => f.Field);
    const [rows] = await conn.query('SELECT ' + columns.map(quote).join(',') + ' FROM ' + quote(name));
    tables.push({ name, columns, rows: rows.length, sha256: hash(JSON.stringify(rows.map(row => JSON.stringify(row)).sort())) });
  }
  return tables;
}

async function prepare({ conn, root, bin, port, dataDir, mysql8, password, check }) {
  const [[identity]] = await conn.query('SELECT @@datadir AS dir, @@port AS port, DATABASE() AS db');
  assert.equal(path.resolve(identity.dir), path.resolve(dataDir));
  assert.equal(Number(identity.port), port);
  assert(![3306, 3307, 3308].includes(port));
  assert.equal(identity.db, 'micodent_dev');
  await conn.query("CREATE USER 'dev_micodent'@'127.0.0.1' IDENTIFIED BY ?", [password]);
  await conn.query("GRANT ALL ON micodent_dev.* TO 'dev_micodent'@'127.0.0.1'");
  const isolated = await mysql.createConnection({ host: '127.0.0.1', port, user: 'dev_micodent',
    password, database: 'micodent_dev', supportBigNumbers: true, bigNumberStrings: true,
    dateStrings: true, timezone: '-05:00' });
  const migration = require('../migrations/001_s1a');
  const { checksum, verifyApplied } = require('../scripts/migrate-s1a');
  let uuid;
  try {
    const before = await snapshot(isolated);
    assert.equal(before.length, 31);
    if (mysql8) {
      const [[server]] = await conn.query('SELECT @@server_uuid AS uuid');
      uuid = server.uuid;
      const backup = path.join(root, 's1a-synthetic-backup');
      fs.mkdirSync(backup);
      const options = path.join(root, 'synthetic-client.cnf');
      fs.writeFileSync(options, `[client]\nhost=127.0.0.1\nport=${port}\nuser=dev_micodent\npassword=${password}\n`, { flag: 'wx' });
      const dump = cp.execFileSync(path.join(bin, 'mysqldump.exe'), [`--defaults-extra-file=${options}`,
        '--single-transaction', '--no-tablespaces', '--set-gtid-purged=OFF', '--hex-blob', 'micodent_dev'],
      { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 ** 2 });
      fs.writeFileSync(path.join(backup, 'micodent_dev.sql'), dump, { flag: 'wx' });
      fs.writeFileSync(path.join(backup, 'estado_bd.json'), JSON.stringify({ identity: { db: 'micodent_dev', uuid }, tables: before }), { flag: 'wx' });
      const index = Object.fromEntries(['micodent_dev.sql', 'estado_bd.json'].map(name => [name,
        { sha256: hash(fs.readFileSync(path.join(backup, name))) }]));
      fs.writeFileSync(path.join(backup, 'SHA256.json'), JSON.stringify(index), { flag: 'wx' });
      const runner = path.resolve(__dirname, '../scripts/migrate-s1a.js');
      const invoke = args => cp.spawnSync(process.execPath, [runner, ...args], {
        windowsHide: true, env: process.env, encoding: 'utf8', timeout: 30000 });
      await check('S1-A: identidad y respaldo incorrectos rechazan la migracion sin DDL', async () => {
        assert.notEqual(invoke(['--check', '--server-uuid', 'uuid-incorrecto']).status, 0);
        const invalid = path.join(root, 's1a-invalid-backup'); fs.mkdirSync(invalid);
        fs.writeFileSync(path.join(invalid, 'SHA256.json'), '{}');
        assert.notEqual(invoke(['--apply', '--server-uuid', uuid, '--backup', invalid]).status, 0);
        assert.deepEqual(await snapshot(isolated), before);
      });
      await check('S1-A: migracion RC4 con respaldo, datos preservados y segunda ejecucion', async () => {
        for (const args of [['--check', '--server-uuid', uuid],
          ['--apply', '--server-uuid', uuid, '--backup', backup],
          ['--apply', '--server-uuid', uuid, '--backup', backup]]) {
          const result = invoke(args);
          fs.appendFileSync(path.join(root, 's1a-migration.log'), (result.stdout || '') + (result.stderr || ''));
          assert.equal(result.status, 0, 'Revisar s1a-migration.log local');
        }
        await verifyApplied(isolated);
      });
    } else {
      await check('S1-A: estructuras y checksum compatibles con MariaDB aislado', async () => {
        for (const sql of migration.statements) await isolated.query(sql);
        await isolated.execute('INSERT INTO micodent_migrations(id,checksum) VALUES(?,?)', [migration.id, checksum]);
        await verifyApplied(isolated);
      });
    }
    await check('S1-A: conserva los 31 objetos previos de RC4', async () => {
      for (const table of before) {
        const [rows] = await isolated.query('SELECT ' + table.columns.map(quote).join(',') + ' FROM ' + quote(table.name));
        assert.equal(rows.length, table.rows);
        assert.equal(hash(JSON.stringify(rows.map(row => JSON.stringify(row)).sort())), table.sha256);
      }
      assert.equal((await snapshot(isolated)).length, 35);
    });
    return { uuid, dataDir, engine: mysql8 ? 'mysql8' : 'mariadb' };
  } finally { await isolated.end(); }
}

function regression({ root, identity }) {
  const backend = path.resolve(__dirname, '..');
  const result = cp.spawnSync(process.execPath, ['--test', '--test-concurrency=1', 'tests/integration/security.test.js'], {
    cwd: backend, windowsHide: true, encoding: 'utf8', timeout: 60000,
    env: { ...process.env, S1A_TEST_MODE: 'isolated', TEST_SERVER_UUID: identity.uuid || '',
      S1A_TEST_DATADIR: identity.dataDir, S1A_TEST_ENGINE: identity.engine }
  });
  fs.writeFileSync(path.join(root, 's1a-security-tests.log'), (result.stdout || '') + (result.stderr || ''));
  assert.equal(result.status, 0, 'Revisar s1a-security-tests.log local');
}

module.exports = { prepare, regression };
