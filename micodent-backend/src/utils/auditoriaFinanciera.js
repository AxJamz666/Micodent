const { fechaLima, horaLimaCorta } = require('./fecha');

// Inserta un registro en auditoria_financiera. Acepta tanto el pool (db) como una
// conexión de transacción (conn) — ambos exponen .query() con la misma firma,
// así que la auditoría queda atómica con la operación que la origina.
const registrarAuditoriaFinanciera = async (conn, { usuario_id, modulo, accion, detalle }) => {
  await conn.query(
    `INSERT INTO auditoria_financiera (usuario_id, modulo, accion, detalle_json, fecha, hora)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [usuario_id, modulo, accion, JSON.stringify(detalle || {}), fechaLima(), horaLimaCorta()]
  );
};

module.exports = { registrarAuditoriaFinanciera };