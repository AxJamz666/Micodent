const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const mysql = require('mysql2/promise');
const { databaseOptions } = require('../src/config/environment');

const migrationFile = path.resolve(__dirname, '../migrations/003_clinical_files.sql');
const sql = fs.readFileSync(migrationFile, 'utf8');
const checksum = crypto.createHash('sha256').update(sql.replaceAll('\r\n', '\n')).digest('hex');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const id = '003_clinical_files';

async function verifyApplied(conn) {
  const [rows] = await conn.execute('SELECT checksum FROM micodent_migrations WHERE id=?', [id]);
  if (rows.length !== 1 || rows[0].checksum !== checksum) throw Error('MIGRATION_CLINICAL_CHECKSUM_MISMATCH');
  const [table] = await conn.query("SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='radiografias_anulaciones'");
  if (table.length !== 1 || table[0].ENGINE !== 'InnoDB') throw Error('MIGRATION_CLINICAL_TABLE_MISSING');
  await conn.query('SELECT radiografia_id, anulada_por, anulada_en, restaurada_por, restaurada_en FROM radiografias_anulaciones LIMIT 0');
}

function verifiedBackup(folder, identity) {
  const index = JSON.parse(fs.readFileSync(path.join(folder, 'SHA256.json')));
  for (const name of ['micodent_dev.sql', 'estado_bd.json']) {
    if (!index[name]?.sha256 || path.basename(name) !== name) throw Error('BACKUP_INCOMPLETE');
  }
  for (const [name, record] of Object.entries(index)) {
    if (path.basename(name) !== name || digest(fs.readFileSync(path.join(folder, name))) !== record.sha256) throw Error('BACKUP_INTEGRITY_FAILED');
  }
  const baseline = JSON.parse(fs.readFileSync(path.join(folder, 'estado_bd.json')));
  if (baseline.identity.db !== 'micodent_dev' || baseline.identity.uuid !== identity.uuid
      || !baseline.tables.some(t => t.name === 'radiografias')) throw Error('BACKUP_WRONG_INSTANCE');
  return baseline;
}

async function compareBaseline(conn, baseline) {
  for (const table of baseline.tables) {
    if (!/^[a-zA-Z0-9_]+$/.test(table.name) || !table.columns.every(c => /^[a-zA-Z0-9_]+$/.test(c))) throw Error('BACKUP_INVALID_IDENTIFIER');
    const [rows] = await conn.query('SELECT ' + table.columns.map(c => '`' + c + '`').join(',') + ' FROM `' + table.name + '`');
    const actual = digest(JSON.stringify(rows.map(row => JSON.stringify(row)).sort()));
    if (rows.length !== table.rows || actual !== table.sha256) throw Error('BACKUP_DATA_MISMATCH_' + table.name.toUpperCase());
  }
}

async function run() {
  const args = process.argv.slice(2);
  const flag = name => args[args.indexOf(name) + 1];
  if (!['--check', '--apply'].includes(args[0]) || !args.includes('--server-uuid')) throw Error('EXPLICIT_MODE_AND_SERVER_REQUIRED');
  const conn = await mysql.createConnection({ ...databaseOptions(), supportBigNumbers: true, bigNumberStrings: true });
  let ddlStarted = false;
  try {
    const [[identity]] = await conn.query('SELECT DATABASE() AS db, CURRENT_USER() AS account, @@server_uuid AS uuid');
    if (identity.db !== 'micodent_dev' || identity.uuid !== flag('--server-uuid')
        || !identity.account.startsWith('dev_micodent@')) throw Error('MIGRATION_DESTINATION_REJECTED');
    const [[lock]] = await conn.query("SELECT GET_LOCK('micodent_dev_migration_m03b',0) AS acquired");
    if (Number(lock.acquired) !== 1) throw Error('MIGRATION_ALREADY_RUNNING');
    await require('./migrate-s1a').verifyApplied(conn);
    const [table] = await conn.query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='radiografias_anulaciones'");
    const [marker] = await conn.execute('SELECT checksum FROM micodent_migrations WHERE id=?', [id]);
    if (table.length || marker.length) {
      await verifyApplied(conn);
      console.log(JSON.stringify({ status: 'already_applied', id, checksum })); return;
    }
    if (args[0] === '--check') {
      console.log(JSON.stringify({ status: 'ready_not_applied', id, checksum, database: identity.db })); return;
    }
    if (!args.includes('--backup')) throw Error('VERIFIED_BACKUP_REQUIRED');
    const baseline = verifiedBackup(path.resolve(flag('--backup')), identity);
    const [names] = await conn.query('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()');
    if (names.map(t => t.TABLE_NAME).sort().join('|') !== baseline.tables.map(t => t.name).sort().join('|')) throw Error('BACKUP_SCHEMA_MISMATCH');
    await compareBaseline(conn, baseline);
    ddlStarted = true;
    await conn.query(sql);
    await conn.execute('INSERT INTO micodent_migrations(id,checksum) VALUES(?,?)', [id, checksum]);
    await verifyApplied(conn);
    await compareBaseline(conn, { tables: baseline.tables.filter(t => t.name !== 'micodent_migrations') });
    console.log(JSON.stringify({ status: 'applied', id, checksum, database: identity.db }));
  } catch (error) {
    console.error(JSON.stringify({ status: 'stopped', ddlMayBePartial: ddlStarted,
      code: /^[A-Z0-9_]+$/.test(error.message) ? error.message : error.code || 'MIGRATION_FAILED' }));
    process.exitCode = 1;
  } finally {
    try { await conn.query("SELECT RELEASE_LOCK('micodent_dev_migration_m03b')"); } catch { /* Disconnected. */ }
    await conn.end();
  }
}

if (require.main === module) run().catch(() => { console.error('MIGRATION_CONFIGURATION_REJECTED'); process.exitCode = 1; });
module.exports = { verifyApplied, checksum, id };
