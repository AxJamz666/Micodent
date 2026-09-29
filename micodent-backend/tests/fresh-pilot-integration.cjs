const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const crypto = require('node:crypto');
const { spawn, execFileSync } = require('node:child_process');
const { once } = require('node:events');
const mysql = require('mysql2/promise');

async function main() {
  const bin = process.env.HOTFIX_MARIADB_BIN;
  const qaBase = process.env.HOTFIX_QA_BASE;
  assert(bin && qaBase && path.isAbsolute(qaBase), 'QA paths required');
  assert(fs.statSync(qaBase).isDirectory(), 'QA base missing');
  const root = fs.mkdtempSync(path.join(qaBase, 'fresh-pilot-'));
  const dataDir = path.join(root, 'database');
  const probe = net.createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  assert(![3306, 3307, 3308].includes(port));
  const rootPassword = crypto.randomBytes(24).toString('hex');
  const dbPassword = crypto.randomBytes(24).toString('hex');
  execFileSync(path.join(bin, 'mysql_install_db.exe'),
    [`--datadir=${dataDir}`, `--password=${rootPassword}`, `--port=${port}`, '--silent'],
    { windowsHide: true, stdio: 'pipe' });
  const child = spawn(path.join(bin, 'mysqld.exe'), ['--no-defaults',
    `--basedir=${path.dirname(bin)}`, `--datadir=${dataDir}`, `--port=${port}`,
    '--bind-address=127.0.0.1', '--innodb-buffer-pool-size=32M', '--max-connections=20', '--skip-log-bin'],
  { windowsHide: true, stdio: 'ignore' });
  let rootConn, appConn, server, pool;
  try {
    for (let i = 0; i < 120; i++) {
      try { rootConn = await mysql.createConnection({ host: '127.0.0.1', port, user: 'root', password: rootPassword }); break; }
      catch { if (child.exitCode != null) throw new Error('Disposable MariaDB exited'); await new Promise(r => setTimeout(r, 500)); }
    }
    assert(rootConn, 'Disposable MariaDB did not start');
    const [[instance]] = await rootConn.query('SELECT @@datadir AS dir, VERSION() AS version');
    assert.equal(path.resolve(instance.dir), dataDir);
    await rootConn.query('CREATE DATABASE micodent_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await rootConn.query("CREATE USER 'dev_micodent'@'127.0.0.1' IDENTIFIED BY ?", [dbPassword]);
    await rootConn.query("GRANT ALL PRIVILEGES ON micodent_dev.* TO 'dev_micodent'@'127.0.0.1'");
    Object.assign(process.env, { DB_HOST: '127.0.0.1', DB_PORT: String(port),
      DB_USER: 'dev_micodent', DB_PASSWORD: dbPassword, DB_NAME: 'micodent_dev',
      JWT_SECRET: crypto.randomBytes(40).toString('hex') });
    appConn = await mysql.createConnection(require('../src/config/environment').databaseOptions());
    const setup = require('../scripts/setup-fresh-pilot');
    const issued = await setup.install(appConn);
    assert.equal(issued.username, 'gabriela');
    assert(issued.password.length >= 24);
    await assert.rejects(setup.install(appConn), /DATABASE_NOT_EMPTY/);
    const [tables] = await appConn.query('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE=\'BASE TABLE\'');
    assert.equal(tables.length, 35);
    const [[counts]] = await appConn.query(`SELECT
      (SELECT COUNT(*) FROM pacientes) AS patients,
      (SELECT COUNT(*) FROM historias_clinicas) AS histories,
      (SELECT COUNT(*) FROM usuarios) AS users,
      (SELECT COUNT(*) FROM centros_referencia WHERE activo=1 AND mapa_imagen_url LIKE 'data:image/%') AS maps`);
    assert.deepEqual([counts.patients, counts.histories, counts.users, counts.maps].map(Number), [0, 0, 1, 2]);
    await require('../scripts/migrate-s1a').verifyApplied(appConn);
    await require('../scripts/migrate-clinical-files').verifyApplied(appConn);
    const app = require('../src/index');
    pool = require('../src/config/db');
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}`;
    const health = await fetch(base + '/api/health');
    assert.equal(health.status, 200);
    const response = await fetch(base + '/api/auth/login', { method: 'POST',
      headers: require('./helpers/cookie-client.cjs').headers(base),
      body: JSON.stringify({ id: 'gabriela', password: issued.password }) });
    assert.equal(response.status, 200);
    console.log(`PASS E13 instalacion nueva aislada en ${instance.version}: 35 tablas, 2 mapas, 0 pacientes, login y health`);
    console.log(`Evidencia sintetica: ${root}`);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (pool) await pool.end();
    if (appConn) await appConn.end();
    if (rootConn) { try { await rootConn.query('SHUTDOWN'); } catch { /* server stops */ } await rootConn.end(); }
    if (child.exitCode == null) { await Promise.race([once(child, 'exit'), new Promise(r => setTimeout(r, 10000))]); if (child.exitCode == null) child.kill(); }
  }
}

main().catch(error => {
  console.error(`${error.code || 'TEST_FAILED'}: ${error.message}`);
  if (error.actual !== undefined || error.expected !== undefined) {
    console.error(`Actual: ${JSON.stringify(error.actual)}; expected: ${JSON.stringify(error.expected)}`);
  }
  process.exitCode = 1;
});
