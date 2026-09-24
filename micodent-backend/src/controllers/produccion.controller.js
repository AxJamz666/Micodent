const db = require('../config/db');
const { fechaLima } = require('../utils/fecha');

function dateRange(query) {
  const desde = query.desde || fechaLima(), hasta = query.hasta || desde;
  const valid = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!valid(desde) || !valid(hasta) || desde > hasta) throw Object.assign(new Error('Rango de fechas inválido.'), { status: 400 });
  return [desde, hasta];
}

async function getProduccion(req, res) {
  let connection;
  try {
    const admin = req.usuario.isAdmin;
    if (!admin && req.usuario.rol !== 'Doctor') return res.status(403).json({ ok: false, mensaje: 'Acceso no autorizado.' });
    if (!admin && req.query.doctor && req.query.doctor !== req.usuario.id) return res.status(403).json({ ok: false, mensaje: 'Solo puedes consultar tu propia producción.' });
    const doctor = admin ? req.query.doctor || null : req.usuario.id;
    const [desde, hasta] = dateRange(req.query);
    connection = await db.getConnection();
    await connection.query('SET TRANSACTION READ ONLY');
    await connection.beginTransaction();
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1), limit = 50;
    const [doctores] = admin ? await connection.query(`SELECT id,nombre_completo,activo FROM usuarios u
      WHERE rol='Doctor' OR EXISTS(SELECT 1 FROM consultas c WHERE c.doctor_id=u.id) ORDER BY nombre_completo`) : [[]];
    const where = `(? IS NULL OR c.doctor_id=?) AND (p.id IS NOT NULL OR c.fecha_consulta BETWEEN ? AND ?)`;
    const params = [desde, hasta, doctor, doctor, desde, hasta];
    const from = `FROM consultas c JOIN historias_clinicas h ON h.id=c.historia_id JOIN pacientes pa ON pa.id=h.paciente_id
      LEFT JOIN usuarios du ON du.id=c.doctor_id
      LEFT JOIN pagos_vigentes p ON p.consulta_id=c.id AND p.fecha_pago BETWEEN ? AND ?
      LEFT JOIN finanzas_pagos f ON f.pago_id=p.id WHERE ${where}`;
    const [rows] = await connection.query(`SELECT c.id AS consulta_id,c.descripcion,c.costo_total,c.doctor_id,du.nombre_completo AS doctor_nombre,
      CONCAT(pa.apellidos, ', ',pa.nombres) AS paciente, COALESCE(p.fecha_pago,c.fecha_consulta) AS fecha,
      p.id AS pago_id,COALESCE(p.monto,0) AS abonado, f.porcentaje,COALESCE(p.comision_generada,0) AS comision,
      CASE WHEN f.regla='legacy_pendiente' THEN NULL ELSE COALESCE(f.costo_aplicado,0) END AS costo_externo,
      CASE WHEN f.regla='legacy_pendiente' THEN NULL ELSE COALESCE(f.margen_clinica,0) END AS margen,
      f.regla ${from} ORDER BY fecha DESC,c.id DESC,p.id DESC LIMIT ? OFFSET ?`, [...params, limit, (page-1)*limit]);
    const [[totales]] = await connection.query(`SELECT COUNT(*) AS filas,COALESCE(SUM(p.monto),0) AS cobrado,
      COALESCE(SUM(p.comision_generada),0) AS comision,COALESCE(SUM(f.costo_aplicado),0) AS costo_externo,
      COALESCE(SUM(f.margen_clinica),0) AS margen,
      COALESCE(SUM(CASE WHEN f.regla='legacy_pendiente' THEN 1 ELSE 0 END),0) AS pendientes ${from}`, params);
    if (Number(totales.pendientes)) { totales.costo_externo=null; totales.margen=null; }
    const [[quoted]] = await connection.query(`SELECT COALESCE(SUM(costo_total),0) AS facturado FROM consultas
      WHERE fecha_consulta BETWEEN ? AND ? AND (? IS NULL OR doctor_id=?)`, [desde,hasta,doctor,doctor]);
    if (!admin) {
      rows.forEach(row => { delete row.costo_externo; delete row.margen; });
      delete totales.costo_externo; delete totales.margen;
    }
    await connection.commit();
    res.json({ ok: true, data: { rows, doctores, totales: { ...totales,...quoted }, page, pages: Math.max(1,Math.ceil(Number(totales.filas)/limit)), desde, hasta, admin } });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(err.status || 500).json({ ok: false, mensaje: err.status ? err.message : 'No se pudo consultar la producción.' });
  } finally { connection?.release(); }
}
module.exports = { getProduccion, dateRange };
