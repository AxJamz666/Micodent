const fs = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2/promise');
const { databaseOptions } = require('../src/config/environment');
const { storedName } = require('../src/services/clinicalFiles');

async function inventory({ db, root }) {
  const directory = await fs.lstat(root);
  if (!directory.isDirectory() || directory.isSymbolicLink()) throw Error('CLINICAL_ROOT_INVALID');
  const [rows] = await db.query('SELECT id,url_archivo FROM radiografias');
  const referenced = new Set();
  let unsupported = 0;
  let duplicate = 0;
  for (const row of rows) {
    try {
      const name = storedName(row.url_archivo);
      if (referenced.has(name)) duplicate++;
      referenced.add(name);
    }
    catch { unsupported++; }
  }
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files = new Set(entries.filter(e => e.isFile()).map(e => e.name));
  const staging = await fs.readdir(path.join(root, '.staging'));
  const missing = [...referenced].filter(name => !files.has(name)).length;
  const orphan = [...files].filter(name => !referenced.has(name)).length;
  const links = entries.filter(e => e.isSymbolicLink()).length;
  return { records: rows.length, referenced: referenced.size, missing, orphan,
    pending: staging.length, unsupported, duplicate, links,
    clean: missing === 0 && orphan === 0 && staging.length === 0 && unsupported === 0 && duplicate === 0 && links === 0 };
}

async function run() {
  const args = process.argv.slice(2);
  if (args.length !== 3 || args[0] !== '--check' || args[1] !== '--server-uuid') throw Error('EXPLICIT_CHECK_AND_SERVER_REQUIRED');
  const db = await mysql.createConnection(databaseOptions());
  try {
    const [[identity]] = await db.query('SELECT DATABASE() AS db, CURRENT_USER() AS account, @@server_uuid AS uuid');
    if (identity.db !== 'micodent_dev' || identity.uuid !== args[2]
        || !identity.account.startsWith('dev_micodent@')) throw Error('AUDIT_DESTINATION_REJECTED');
    const result = await inventory({ db, root: path.join(__dirname, '../src/uploads') });
    console.log(JSON.stringify(result));
    if (!result.clean) process.exitCode = 1;
  } finally { await db.end(); }
}

if (require.main === module) run().catch(() => { console.error('CLINICAL_AUDIT_UNAVAILABLE'); process.exitCode = 1; });
module.exports = { inventory };
