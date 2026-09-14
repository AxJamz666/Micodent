const db = require('../config/db');

// GET /api/auditoria-financiera
const getAuditoriaFinanciera = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, u.nombre_completo AS usuario_nombre
       FROM auditoria_financiera a
       LEFT JOIN usuarios u ON a.usuario_id = u.id
       ORDER BY a.fecha DESC, a.hora DESC, a.id DESC
       LIMIT 200`
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener el registro de actividad.' });
  }
};

module.exports = { getAuditoriaFinanciera };