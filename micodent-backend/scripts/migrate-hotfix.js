const fs = require('node:fs');
const path = require('node:path');

async function migrate(conn) {
  for (const file of ['001_hotfix_finanzas.sql', '002_pos.sql']) {
    const sql = fs.readFileSync(path.join(__dirname, '../migrations', file), 'utf8');
    for (const statement of sql.replace(/^--.*$/gm, '').split(';').map(s => s.trim()).filter(Boolean)) await conn.query(statement);
  }
  const { snapshotLegacy } = require('../src/services/finanzas');
  await conn.beginTransaction();
  try {
    const [consultas] = await conn.query('SELECT * FROM consultas ORDER BY id FOR UPDATE');
    for (const c of consultas) {
      await conn.query(`INSERT IGNORE INTO finanzas_costos(consulta_id,otros_costos,origen) VALUES(?,?, 'legacy_proporcional')`,
        [c.id, c.tipo_comision === 'endodoncia' ? Number(c.cantidad_radiografias || 0) * 20 : 0]);
      await snapshotLegacy(conn, c);
    }
    await conn.query("INSERT IGNORE INTO finanzas_version(version) VALUES('001')");
    await conn.query("INSERT IGNORE INTO finanzas_version(version) VALUES('002')");
    await conn.commit();
  } catch (error) { await conn.rollback(); throw error; }
}

if (require.main === module) {
  require('dotenv').config();
  if (process.argv[2] !== '--apply' || process.env.DB_NAME !== 'micodent_dev' || !['127.0.0.1', 'localhost'].includes(process.env.DB_HOST)) {
    console.error('Solo DEV local: requiere --apply, DB_NAME=micodent_dev y respaldo previo. No se abrió conexión.');
    process.exitCode = 1;
  } else {
    (async () => {
      const mysql = require('mysql2/promise');
      const conn = await mysql.createConnection({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });
      try { await migrate(conn); console.log('Migración incremental completada. Pagos originales conservados.'); }
      finally { await conn.end(); }
    })().catch(() => { console.error('Migración no completada. Mantener aplicación cerrada y revisar la copia aislada.'); process.exitCode = 1; });
  }
}
module.exports = { migrate };
