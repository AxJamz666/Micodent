const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const mysql = require('mysql2/promise');
const { databaseOptions } = require('../src/config/environment');

const id = '004_odontogram_annulments';
const sql = fs.readFileSync(path.resolve(__dirname, '../migrations/004_odontogram_annulments.sql'), 'utf8');
const digest = data => crypto.createHash('sha256').update(data).digest('hex');
const checksum = digest(sql.replaceAll('\r\n', '\n'));

async function verifyApplied(conn) {
  const [marker] = await conn.execute('SELECT checksum FROM micodent_migrations WHERE id=?', [id]);
  if (marker.length !== 1 || marker[0].checksum !== checksum) throw Error('MIGRATION_ODONTOGRAM_CHECKSUM_MISMATCH');
  const [table] = await conn.query("SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='odontograma_anulaciones'");
  if (table.length !== 1 || table[0].ENGINE !== 'InnoDB') throw Error('MIGRATION_ODONTOGRAM_TABLE_MISSING');
  const [columns] = await conn.query(`SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_KEY FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='odontograma_anulaciones' ORDER BY ORDINAL_POSITION`);
  if (columns.map(c => c.COLUMN_NAME).join('|') !== 'odontograma_item_id|motivo|anulada_por|anulada_en'
      || columns.some(c => c.IS_NULLABLE !== 'NO') || columns[0].COLUMN_KEY !== 'PRI') {
    throw Error('MIGRATION_ODONTOGRAM_COLUMNS_MISMATCH');
  }
  const [keys] = await conn.query(`SELECT k.COLUMN_NAME, k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME, r.DELETE_RULE
    FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r
    ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME
    WHERE k.TABLE_SCHEMA=DATABASE() AND k.TABLE_NAME='odontograma_anulaciones'`);
  for (const [column, target] of [['odontograma_item_id', 'odontograma_items'], ['anulada_por', 'usuarios']]) {
    if (!keys.some(k => k.COLUMN_NAME === column && k.REFERENCED_TABLE_NAME === target
        && k.REFERENCED_COLUMN_NAME === 'id' && ['RESTRICT', 'NO ACTION'].includes(k.DELETE_RULE))) {
      throw Error('MIGRATION_ODONTOGRAM_FOREIGN_KEY_MISMATCH');
    }
  }
}

function verifiedBackup(folder, identity) {
  const index = JSON.parse(fs.readFileSync(path.join(folder, 'SHA256.json')));
  if (!index['micodent_dev.sql']?.sha256 || !index['estado_bd.json']?.sha256) throw Error('BACKUP_INCOMPLETE');
  for (const [name, record] of Object.entries(index)) {
    if (path.basename(name) !== name || !/^[a-f0-9]{64}$/i.test(record.sha256)
        || digest(fs.readFileSync(path.join(folder, name))) !== record.sha256) throw Error('BACKUP_INTEGRITY_FAILED');
  }
  const baseline = JSON.parse(fs.readFileSync(path.join(folder, 'estado_bd.json')));
  if (baseline.identity.db !== 'micodent_dev' || baseline.identity.uuid !== identity.uuid
      || !baseline.tables.some(t => t.name === 'odontograma_items')) throw Error('BACKUP_WRONG_INSTANCE');
  return baseline;
}

async function compareBaseline(conn, tables) {
  for (const table of tables) {
    if (!/^[a-zA-Z0-9_]+$/.test(table.name) || !table.columns.every(c => /^[a-zA-Z0-9_]+$/.test(c))) throw Error('BACKUP_INVALID_IDENTIFIER');
    const [rows] = await conn.query('SELECT ' + table.columns.map(c => '`' + c + '`').join(',') + ' FROM `' + table.name + '`');
    if (rows.length !== table.rows || digest(JSON.stringify(rows.map(row => JSON.stringify(row)).sort())) !== table.sha256) {
      throw Error('BACKUP_DATA_MISMATCH');
    }
  }
}

async function run() {
  const args = process.argv.slice(2);
  const flag = name => args[args.indexOf(name) + 1];
  if (!['--check', '--apply'].includes(args[0]) || !args.includes('--server-uuid')
      || !flag('--server-uuid') || flag('--server-uuid').startsWith('--')) throw Error('EXPLICIT_MODE_AND_SERVER_REQUIRED');
  const options = databaseOptions();
  if (options.database !== 'micodent_dev' || options.user !== 'dev_micodent'
      || !['127.0.0.1', 'localhost', '::1'].includes(options.host)) throw Error('MIGRATION_DESTINATION_REJECTED');
  const conn = await mysql.createConnection({ ...options, supportBigNumbers: true, bigNumberStrings: true });
  let ddlStarted = false;
  try {
    const [[identity]] = await conn.query('SELECT DATABASE() AS db, CURRENT_USER() AS account, @@server_uuid AS uuid');
    if (identity.db !== 'micodent_dev' || identity.uuid !== flag('--server-uuid')
        || !identity.account.startsWith('dev_micodent@')) throw Error('MIGRATION_DESTINATION_REJECTED');
    const [[lock]] = await conn.query("SELECT GET_LOCK('micodent_dev_migration_m07d',0) AS acquired");
    if (Number(lock.acquired) !== 1) throw Error('MIGRATION_ALREADY_RUNNING');
    await require('./migrate-s1a').verifyApplied(conn);
    await require('./migrate-clinical-files').verifyApplied(conn);
    const [table] = await conn.query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='odontograma_anulaciones'");
    const [marker] = await conn.execute('SELECT checksum FROM micodent_migrations WHERE id=?', [id]);
    if (table.length || marker.length) {
      await verifyApplied(conn);
      console.log(JSON.stringify({ status: 'already_applied', id, checksum })); return;
    }
    if (args[0] === '--check') {
      console.log(JSON.stringify({ status: 'ready_not_applied', id, checksum })); return;
    }
    if (!args.includes('--backup') || !flag('--backup') || flag('--backup').startsWith('--')) throw Error('VERIFIED_BACKUP_REQUIRED');
    const baseline = verifiedBackup(path.resolve(flag('--backup')), identity);
    const [names] = await conn.query('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()');
    if (names.map(t => t.TABLE_NAME).sort().join('|') !== baseline.tables.map(t => t.name).sort().join('|')) throw Error('BACKUP_SCHEMA_MISMATCH');
    await compareBaseline(conn, baseline.tables);
    ddlStarted = true;
    await conn.query(sql);
    // DDL is not transactional: an incomplete run must stop, never silently repair.
    await conn.execute('INSERT INTO micodent_migrations(id,checksum) VALUES(?,?)', [id, checksum]);
    await verifyApplied(conn);
    await compareBaseline(conn, baseline.tables.filter(t => t.name !== 'micodent_migrations'));
    console.log(JSON.stringify({ status: 'applied', id, checksum }));
  } catch (error) {
    console.error(JSON.stringify({ status: 'stopped', ddlMayBePartial: ddlStarted,
      code: /^[A-Z0-9_]+$/.test(error.message) ? error.message : error.code || 'MIGRATION_FAILED' }));
    process.exitCode = 1;
  } finally {
    try { await conn.query("SELECT RELEASE_LOCK('micodent_dev_migration_m07d')"); } catch { /* Disconnected. */ }
    await conn.end();
  }
}

if (require.main === module) run().catch(() => { console.error('MIGRATION_CONFIGURATION_REJECTED'); process.exitCode = 1; });
module.exports = { verifyApplied, checksum, id };
