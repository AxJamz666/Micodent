const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const mysql = require('mysql2/promise');
const { databaseOptions } = require('../src/config/environment');
const { verifyApplied, checksum } = require('./migrate-s1a');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const backup = process.argv[2];
const report = process.argv[3];
const expectedUuid = process.argv[4];
const workspace = path.resolve(__dirname, '../..');
function json(name) { return JSON.parse(fs.readFileSync(path.join(backup, name))); }
function inventory(folder) {
  const result = {};
  function walk(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, item.name);
      if (item.isSymbolicLink()) throw new Error('REPARSE_POINT_REQUIRES_REVIEW');
      if (item.isDirectory()) walk(full);
      else if (item.isFile()) result[path.relative(folder, full).replaceAll('\\', '/')] = {
        bytes: fs.statSync(full).size, sha256: digest(fs.readFileSync(full)) };
    }
  }
  walk(folder); return result;
}
async function main() {
  if (!backup || !report || !expectedUuid || fs.existsSync(report)) throw new Error('EXPLICIT_UNIQUE_REPORT_REQUIRED');
  for (const [name, record] of Object.entries(json('SHA256.json'))) {
    if (path.basename(name) !== name || digest(fs.readFileSync(path.join(backup, name))) !== record.sha256) throw new Error('BACKUP_HASH_MISMATCH');
  }
  const conn = await mysql.createConnection({ ...databaseOptions(), supportBigNumbers: true, bigNumberStrings: true });
  try {
    const [[identity]] = await conn.query('SELECT DATABASE() AS db,@@server_uuid AS uuid,VERSION() AS version');
    if (identity.db !== 'micodent_dev' || identity.uuid !== expectedUuid) throw new Error('DESTINATION_REJECTED');
    await verifyApplied(conn);
    const baseline = json('estado_bd.json');
    const tables = [];
    const quote = name => {
      if (!/^[a-zA-Z0-9_]+$/.test(name)) throw new Error('INVALID_IDENTIFIER');
      return '`' + name + '`';
    };
    for (const table of baseline.tables) {
      const [rows] = await conn.query('SELECT ' + table.columns.map(quote).join(',') + ' FROM ' + quote(table.name));
      tables.push({ name: table.name, rows: rows.length,
        unchanged: rows.length === table.rows && digest(JSON.stringify(rows.map(row => JSON.stringify(row)).sort())) === table.sha256 });
    }
    if (tables.some(t => !t.unchanged)) throw new Error('ORIGINAL_DEV_DATA_CHANGED');
    const [[count]] = await conn.query('SELECT COUNT(*) AS total FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()');
    const snapshot = json('inventario_archivos.json').workspace;
    const protectedFiles = Object.entries(snapshot).filter(([name]) => /(^|\/)\.env($|\.)/.test(name) || name.includes('/src/uploads/'));
    for (const [name, entry] of protectedFiles) {
      if (digest(fs.readFileSync(path.join(workspace, name))) !== entry.sha256) throw new Error('DEV_PROTECTED_FILE_CHANGED');
    }
    const pilot = [];
    for (const [name, previous] of Object.entries(json('referencia_piloto_solo_archivos.json'))) {
      const now = inventory(path.join(path.dirname(workspace), name));
      const changes = [...new Set([...Object.keys(previous), ...Object.keys(now)])]
        .filter(file => previous[file]?.sha256 !== now[file]?.sha256 || previous[file]?.bytes !== now[file]?.bytes);
      pilot.push({ component: name, files: Object.keys(now).length, unchanged: changes.length === 0, differences: changes.length });
    }
    const result = { date: new Date().toISOString(), identity, checksum, backupHashesVerified: true,
      tableCount: Number(count.total), originalTables: tables, protectedDevFilesVerified: protectedFiles.length,
      pilotFileComparison: pilot, originalDatabaseQueried: false,
      note: 'Read-only verification. No clinical rows, credentials, hashes of passwords or tokens are included.' };
    fs.writeFileSync(report, JSON.stringify(result, null, 2), { flag: 'wx' });
    console.log(JSON.stringify({ tableCount: result.tableCount, originalTablesUnchanged: tables.length,
      protectedDevFilesVerified: result.protectedDevFilesVerified, pilotFileComparison: pilot, report }));
    if (pilot.some(p => !p.unchanged)) process.exitCode = 2;
  } finally { await conn.end(); }
}
main().catch(() => { console.error('PRESERVATION_VERIFICATION_FAILED; no confidential details printed'); process.exitCode = 1; });
