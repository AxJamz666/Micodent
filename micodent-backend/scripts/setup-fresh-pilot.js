const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const mysql = require('mysql2/promise');
const passwords = require('../src/services/password.service');
const { databaseOptions } = require('../src/config/environment');
const s1a = require('../migrations/001_s1a');
const { checksum: s1aChecksum, baselineKind } = require('./migrate-s1a');
const clinical = require('./migrate-clinical-files');

async function install(conn, { password = crypto.randomBytes(24).toString('base64url') } = {}) {
  const [[identity]] = await conn.query('SELECT DATABASE() AS db, CURRENT_USER() AS account');
  if (identity.db !== 'micodent_dev' || !identity.account.startsWith('dev_micodent@')) {
    throw new Error('WRONG_DESTINATION');
  }
  const [[lock]] = await conn.query("SELECT GET_LOCK('micodent_dev_fresh_install', 0) AS acquired");
  if (Number(lock.acquired) !== 1) throw new Error('INSTALL_ALREADY_RUNNING');
  let ddlStarted = false;
  try {
    const [existing] = await conn.query('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()');
    if (existing.length) throw new Error('DATABASE_NOT_EMPTY');
    const schema = fs.readFileSync(path.resolve(__dirname, '../migrations/000_fresh_legacy_schema.sql'), 'utf8');
    const statements = schema.match(/CREATE TABLE[\s\S]*?;/g);
    if (statements?.length !== 24 || /\b(?:INSERT|REPLACE|UPDATE|DELETE)\s+INTO\b/i.test(schema)) {
      throw new Error('INVALID_FRESH_SCHEMA');
    }
    // Historical DDL contains a MySQL-only CHECK expression; MariaDB uses REGEXP.
    const [[server]] = await conn.query('SELECT VERSION() AS version');
    const mariadb = /mariadb/i.test(server.version);
    ddlStarted = true;
    await conn.query('SET FOREIGN_KEY_CHECKS=0');
    try {
      for (let statement of statements) {
        if (mariadb) statement = statement.replace(/regexp_like\((`\w+`),(_utf8mb4'[^']*')\)/g, '($1 REGEXP $2)');
        await conn.query(statement);
      }
    } finally {
      await conn.query('SET FOREIGN_KEY_CHECKS=1');
    }
    const [created] = await conn.query('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()');
    if (baselineKind(created.map(row => row.TABLE_NAME)) !== 'legacy') throw new Error('LEGACY_SCHEMA_INCOMPLETE');
    const catalog = fs.readFileSync(path.resolve(__dirname, '../migrations/000_fresh_reference_centers.sql'), 'utf8');
    const seed = catalog.match(/^INSERT INTO `centros_referencia` VALUES [^\r\n]+/m);
    if (!seed || catalog.match(/^INSERT INTO /gm)?.length !== 1) throw new Error('INVALID_REFERENCE_CATALOG');
    await conn.query(seed[0]);
    const [[centers]] = await conn.query("SELECT COUNT(*) AS total FROM centros_referencia WHERE activo=1 AND mapa_imagen_url LIKE 'data:image/%'");
    if (Number(centers.total) !== 2) throw new Error('REFERENCE_CATALOG_INCOMPLETE');
    await require('./migrate-hotfix').migrate(conn);
    for (const statement of s1a.statements) await conn.query(statement);
    await conn.execute('INSERT INTO micodent_migrations(id,checksum) VALUES(?,?)', [s1a.id, s1aChecksum]);
    await require('./migrate-s1a').verifyApplied(conn);
    await conn.query(fs.readFileSync(path.resolve(__dirname, '../migrations/003_clinical_files.sql'), 'utf8'));
    await conn.execute('INSERT INTO micodent_migrations(id,checksum) VALUES(?,?)', [clinical.id, clinical.checksum]);
    await clinical.verifyApplied(conn);
    const hash = await passwords.hashPassword(password);
    await conn.execute(`INSERT INTO usuarios(id,password_hash,nombre,nombre_completo,rol,is_admin,nivel,activo)
      VALUES('gabriela',?,'Gabriela','Dra. Gabriela','Doctor',1,3,1)`, [hash]);
    return { username: 'gabriela', password };
  } catch (error) {
    error.ddlStarted = ddlStarted;
    throw error;
  } finally {
    try { await conn.query("SELECT RELEASE_LOCK('micodent_dev_fresh_install')"); } catch { /* connection lost */ }
  }
}

async function main() {
  if (process.argv[2] !== '--apply') throw new Error('EXPLICIT_APPLY_REQUIRED');
  const conn = await mysql.createConnection(databaseOptions());
  try {
    const result = await install(conn);
    console.log('Instalacion nueva completada. Usuario inicial: ' + result.username);
    console.log('Contrasena inicial, visible solo ahora en esta PC: ' + result.password);
    console.log('Guardela en privado y cambiela al iniciar sesion. No comparta esta pantalla.');
  } finally {
    await conn.end();
  }
}

if (require.main === module) main().catch(error => {
  console.error('Instalacion detenida: ' + (/^[A-Z_]+$/.test(error.message) ? error.message : error.code || 'SETUP_FAILED'));
  if (error.ddlStarted) console.error('Puede haber tablas parciales. No vuelva a ejecutar ni borre datos; solicite revision tecnica.');
  process.exitCode = 1;
});

module.exports = { install };
