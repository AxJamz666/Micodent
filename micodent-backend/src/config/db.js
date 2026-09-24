const mysql = require('mysql2/promise');
require('dotenv').config();

// ======================================================
// POOL DE CONEXIONES MYSQL
// ======================================================

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  timezone: '-05:00',
  dateStrings: true,

  // Evita esperas excesivas en caso de problemas de conexion.
  connectTimeout: 10000,
});

// ======================================================
// PRUEBA INICIAL DE CONEXION
// ======================================================

async function verificarConexionInicial() {
  let connection;

  try {
    connection = await pool.getConnection();

    await connection.query('SELECT 1');

    console.log(
      `✅ Conectado a MySQL — Base de datos: ${process.env.DB_NAME || 'micodent'}`
    );
  } catch (error) {
    console.error('');
    console.error('⚠️ MySQL aun no esta disponible.');
    console.error(`   Motivo: ${error.message}`);
    console.error('');
    console.error(
      'El servidor Micodent continuara activo y volvera a comprobar'
    );
    console.error(
      'la base de datos mediante el endpoint /api/health.'
    );
    console.error('');
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

verificarConexionInicial();

// ======================================================
// EXPORTAR POOL
// ======================================================

module.exports = pool;

