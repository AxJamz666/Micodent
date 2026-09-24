const db = require('../config/db');
const { requestOnce } = require('./finanzas');

module.exports = function transactional(operation, handler) {
  return async (req, res) => {
    let conn;
    try {
      conn = await db.getConnection();
      await conn.beginTransaction();
      const once = await requestOnce(conn, req, operation);
      if (once.response) { await conn.commit(); return res.json(once.response); }
      const result = { ok: true, ...await handler(conn, req) };
      await once.save(result);
      await conn.commit();
      res.status(201).json(result);
    } catch (err) {
      if (conn) await conn.rollback();
      res.status(err.status || 500).json({ ok: false, mensaje: err.status ? err.message : 'No se pudo confirmar la operacion. Reintenta sin cambiar los datos.' });
    } finally { conn?.release(); }
  };
};
