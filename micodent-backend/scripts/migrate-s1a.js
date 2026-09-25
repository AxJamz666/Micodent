const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const mysql = require('mysql2/promise');
const { databaseOptions } = require('../src/config/environment');
const migration = require('../migrations/001_s1a');
const migrationFile = path.resolve(__dirname, '../migrations/001_s1a.js');
const checksum = crypto.createHash('sha256').update(fs.readFileSync(migrationFile)).digest('hex');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const hotfixObjects = ['finanzas_version', 'finanzas_costos', 'finanzas_pagos',
  'finanzas_peticiones', 'finanzas_configuracion', 'finanzas_pago_pos', 'pagos_vigentes'];
const legacyObjects = ['antecedentes_medicos', 'apoderados', 'auditoria_financiera',
  'auditoria_historias', 'auditoria_pacientes', 'centros_referencia', 'citas', 'consultas',
  'consultas_adendas', 'firmas_consentimiento', 'gastos_clinica', 'historias_clinicas',
  'odontograma_adendas', 'odontograma_items', 'ordenes_radiografia', 'pacientes', 'pagos',
  'pagos_laboratorio', 'penalidades_doctor', 'radiografias', 'recetas', 'trabajos_laboratorio',
  'triaje', 'usuarios'];

function baselineKind(names) {
  const actual = [...names].sort().join('|');
  if (actual === [...legacyObjects].sort().join('|')) return 'legacy';
  if (actual === [...legacyObjects, ...hotfixObjects].sort().join('|')) return 'rc4';
  throw new Error('UNEXPECTED_OR_PARTIALLY_MIGRATED_SCHEMA');
}

function identifier(name) {
  if (!/^[a-zA-Z0-9_]+$/.test(name)) throw new Error('INVALID_BASELINE_IDENTIFIER');
  return '`' + name + '`';
}

async function compareBaseline(conn, baseline) {
  for (const table of baseline.tables) {
    const [rows] = await conn.query('SELECT ' + table.columns.map(identifier).join(',') + ' FROM ' + identifier(table.name));
    const digest = hash(JSON.stringify(rows.map(row => JSON.stringify(row)).sort()));
    if (rows.length !== table.rows || digest !== table.sha256) throw new Error('BASELINE_DATA_MISMATCH_' + table.name.toUpperCase());
  }
}

async function verifyApplied(conn) {
  const [rows] = await conn.execute('SELECT checksum FROM micodent_migrations WHERE id = ?', [migration.id]);
  if (rows.length !== 1 || rows[0].checksum !== checksum) throw new Error('MIGRATION_CHECKSUM_MISMATCH');
  const [tables] = await conn.query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('seguridad_sesiones','seguridad_eventos','seguridad_intentos','micodent_migrations') AND ENGINE='InnoDB'");
  if (tables.length !== 4) throw new Error('MIGRATION_INCOMPLETE');
  await conn.query('SELECT auth_version FROM usuarios LIMIT 0');
  await conn.query('SELECT token_hash, usuario_id, auth_version, expira_epoch, revocada_en FROM seguridad_sesiones LIMIT 0');
  await conn.query('SELECT accion, usuario_id, objetivo_id, creado_en FROM seguridad_eventos LIMIT 0');
  await conn.query('SELECT `key`, points, expire FROM seguridad_intentos LIMIT 0');
}

async function run() {
  const args = process.argv.slice(2);
  const value = flag => args[args.indexOf(flag) + 1];
  if (!['--check', '--apply'].includes(args[0]) || !args.includes('--server-uuid')) throw new Error('EXPLICIT_MODE_AND_SERVER_REQUIRED');
  const conn = await mysql.createConnection({ ...databaseOptions(), supportBigNumbers: true, bigNumberStrings: true });
  let ddlStarted = false;
  try {
    const [identity] = await conn.query('SELECT DATABASE() AS db, CURRENT_USER() AS account, @@server_uuid AS uuid, VERSION() AS version');
    if (identity[0].db !== 'micodent_dev' || identity[0].uuid !== value('--server-uuid')
        || !identity[0].account.startsWith('dev_micodent@')) throw new Error('MIGRATION_DESTINATION_REJECTED');
    const [lock] = await conn.query("SELECT GET_LOCK('micodent_dev_migration_s1a', 0) AS acquired");
    if (Number(lock[0].acquired) !== 1) throw new Error('MIGRATION_ALREADY_RUNNING');
    const [tables] = await conn.query('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()');
    const names = tables.map(t => t.TABLE_NAME);
    if (names.includes('micodent_migrations')) {
      await verifyApplied(conn);
      console.log(JSON.stringify({ status: 'already_applied', migration: migration.id, checksum, database: 'micodent_dev' }));
      return;
    }
    const hasHotfix = baselineKind(names) === 'rc4';
    const [columns] = await conn.query("SELECT COLUMN_NAME,COLUMN_TYPE,COLLATION_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='usuarios'");
    if (columns.some(c => c.COLUMN_NAME === 'auth_version')
        || !columns.some(c => c.COLUMN_NAME === 'id' && c.COLUMN_TYPE === 'varchar(50)' && c.COLLATION_NAME === 'utf8mb4_unicode_ci')) {
      throw new Error('UNEXPECTED_OR_PARTIALLY_MIGRATED_SCHEMA');
    }
    if (hasHotfix) {
      const [versions] = await conn.query("SELECT version FROM finanzas_version WHERE version IN ('001','002')");
      const [[pos]] = await conn.query('SELECT revision FROM finanzas_configuracion WHERE id=1');
      if (versions.length !== 2 || !pos) throw new Error('HOTFIX_SCHEMA_INCOMPLETE');
      await conn.query('SELECT pago_id,porcentaje,revision FROM finanzas_pago_pos LIMIT 0');
      await conn.query('SELECT id FROM pagos_vigentes LIMIT 0');
    }
    const [passwords] = await conn.query("SELECT COUNT(*) AS invalid FROM usuarios WHERE password_hash NOT REGEXP '^[$]2[aby][$][0-9]{2}[$][./A-Za-z0-9]{53}$' OR id NOT REGEXP '^[a-z0-9][a-z0-9._-]{0,49}$'");
    if (Number(passwords[0].invalid)) throw new Error('LEGACY_CREDENTIALS_REQUIRE_REVIEW');
    if (args[0] === '--check') {
      console.log(JSON.stringify({ status: 'ready_not_applied', migration: migration.id, checksum, identity: identity[0] }));
      return;
    }
    if (!args.includes('--backup')) throw new Error('VERIFIED_BACKUP_REQUIRED');
    const backup = path.resolve(value('--backup'));
    const index = JSON.parse(fs.readFileSync(path.join(backup, 'SHA256.json')));
    if (!index['estado_bd.json']?.sha256 || !index['micodent_dev.sql']?.sha256
        || fs.statSync(path.join(backup, 'micodent_dev.sql')).size === 0) {
      throw new Error('VERIFIED_BACKUP_REQUIRED');
    }
    for (const [name, record] of Object.entries(index)) {
      if (path.basename(name) !== name || hash(fs.readFileSync(path.join(backup, name))) !== record.sha256) throw new Error('BACKUP_INTEGRITY_FAILED');
    }
    const baseline = JSON.parse(fs.readFileSync(path.join(backup, 'estado_bd.json')));
    if (baseline.identity.db !== 'micodent_dev' || baseline.identity.uuid !== identity[0].uuid
        || baseline.tables.length !== names.length
        || baseline.tables.map(t => t.name).sort().join('|') !== [...names].sort().join('|')) {
      throw new Error('BACKUP_BASELINE_REJECTED');
    }
    await compareBaseline(conn, baseline);
    // MySQL DDL commits implicitly. On any partial failure, stop; never attempt an automatic destructive rollback.
    ddlStarted = true;
    for (const sql of migration.statements) await conn.query(sql);
    await conn.execute('INSERT INTO micodent_migrations (id, checksum) VALUES (?, ?)', [migration.id, checksum]);
    await verifyApplied(conn);
    await compareBaseline(conn, baseline);
    console.log(JSON.stringify({ status: 'applied', migration: migration.id, checksum,
      identity: identity[0], originalTablesPreserved: names.length, newTables: 4, existingPasswordsAndRolesUnchanged: true }));
  } catch (err) {
    console.error(JSON.stringify({ status: 'stopped', ddlMayBePartial: ddlStarted,
      code: /^[A-Z0-9_]+$/.test(err.message) ? err.message : (err.code || 'MIGRATION_FAILED'),
      originalDatabaseNotUsed: true }));
    process.exitCode = 1;
  } finally {
    try { await conn.query("SELECT RELEASE_LOCK('micodent_dev_migration_s1a')"); } catch { /* Connection may already be gone. */ }
    await conn.end();
  }
}

if (require.main === module) run().catch(() => { console.error('MIGRATION_CONFIGURATION_REJECTED'); process.exitCode = 1; });
module.exports = { verifyApplied, checksum, baselineKind };
