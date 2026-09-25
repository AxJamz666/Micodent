const mysql = require('mysql2/promise');
const { databaseOptions } = require('./environment');

// ======================================================
// POOL DE CONEXIONES MYSQL
// ======================================================

const pool = mysql.createPool({
  ...databaseOptions(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  timezone: '-05:00',
  dateStrings: true,

  // Evita esperas excesivas en caso de problemas de conexion.
  connectTimeout: 10000,
});

module.exports = pool;
