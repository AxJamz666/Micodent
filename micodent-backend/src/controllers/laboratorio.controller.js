const db = require('../config/db');
const { fechaLima } = require('../utils/fecha');
const { registrarAuditoriaFinanciera } = require('../utils/auditoriaFinanciera');

// GET /api/laboratorio/consulta/:consultaId
const getTrabajosPorConsulta = async (req, res) => {
  try {
    const { consultaId } = req.params;
    const [trabajos] = await db.query(
      `SELECT t.*, u.nombre_completo AS registrado_por_nombre
       FROM trabajos_laboratorio t
       LEFT JOIN usuarios u ON t.registrado_por = u.id
       WHERE t.consulta_id = ? ORDER BY t.creado_en DESC`,
      [consultaId]
    );
    for (const trabajo of trabajos) {
      const [pagos] = await db.query(
        'SELECT * FROM pagos_laboratorio WHERE trabajo_laboratorio_id = ? ORDER BY fecha_pago ASC',
        [trabajo.id]
      );
      trabajo.pagos = pagos;
      const totalPagado = pagos.reduce((sum, p) => sum + parseFloat(p.monto), 0);
      trabajo.total_pagado = totalPagado;
      trabajo.saldo_pendiente = parseFloat(trabajo.monto_total) - totalPagado;
      trabajo.estado = totalPagado >= parseFloat(trabajo.monto_total) ? 'pagado' : (totalPagado > 0 ? 'parcial' : 'pendiente');
    }
    res.json({ ok: true, data: trabajos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener los trabajos de laboratorio.' });
  }
};

// GET /api/laboratorio/trabajos?estado=pendiente|pagado
const getTrabajos = async (req, res) => {
  try {
    const estado = req.query.estado === 'pagado' ? 'pagado' : 'pendiente';
    const condicionSaldo = estado === 'pagado' ? '<= 0' : '> 0';
    const orden = estado === 'pagado' ? 'ultima_fecha_pago DESC' : 't.creado_en ASC';

    const [rows] = await db.query(
      `SELECT t.id, t.nombre_laboratorio, t.monto_total, t.consulta_id, t.descripcion, t.creado_en,
              h.nro_historia, p.nombres, p.apellidos,
              COALESCE((SELECT SUM(pl.monto) FROM pagos_laboratorio pl WHERE pl.trabajo_laboratorio_id = t.id), 0) AS total_pagado,
              (SELECT MAX(pl.fecha_pago) FROM pagos_laboratorio pl WHERE pl.trabajo_laboratorio_id = t.id) AS ultima_fecha_pago
       FROM trabajos_laboratorio t
       JOIN consultas c ON t.consulta_id = c.id
       JOIN historias_clinicas h ON c.historia_id = h.id
       JOIN pacientes p ON h.paciente_id = p.id
       HAVING (t.monto_total - total_pagado) ${condicionSaldo}
       ORDER BY ${orden}`
    );
    res.json({ ok: true, data: rows.map(r => ({ ...r, saldo_pendiente: parseFloat(r.monto_total) - parseFloat(r.total_pagado) })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener los trabajos de laboratorio.' });
  }
};

// Lock the same consultation as patient payments before adding external costs.
const transactional = require('../services/operacionFinanciera');
const f = require('../services/finanzas');
const { dateRange } = require('./produccion.controller');

const crearTrabajo = transactional('trabajo_laboratorio', async (conn, req) => {
  const { consultaId } = req.params;
  const nombre = String(req.body.nombre_laboratorio || '').trim();
  const monto = f.cents(req.body.monto_total);
  if (!nombre || !monto) f.fail('Nombre del laboratorio y monto positivo son obligatorios.');
  const [[consulta]] = await conn.query('SELECT id FROM consultas WHERE id=? FOR UPDATE', [consultaId]);
  if (!consulta) f.fail('Tratamiento no encontrado.', 404);
  const [result] = await conn.query(
    'INSERT INTO trabajos_laboratorio(consulta_id,nombre_laboratorio,monto_total,descripcion,registrado_por) VALUES(?,?,?,?,?)',
    [consultaId, nombre, f.amount(monto), req.body.descripcion || null, req.usuario.id]);
  await registrarAuditoriaFinanciera(conn, {
    usuario_id: req.usuario.id, modulo: 'laboratorio', accion: `Registro un trabajo con "${nombre}"`,
    detalle: { trabajo_id: result.insertId, consulta_id: consultaId, nombre_laboratorio: nombre, monto_total: f.amount(monto) },
  });
  return { mensaje: 'Trabajo de laboratorio registrado.', trabajoId: result.insertId };
});

const registrarPagoLaboratorio = transactional('pago_laboratorio', async (conn, req) => {
  const { trabajoId } = req.params;
  const monto = f.cents(req.body.monto);
  if (!monto) f.fail('El monto debe ser mayor a cero.');
  const fecha = req.body.fecha_pago || fechaLima();
  dateRange({ desde: fecha, hasta: fecha });
  const [[trabajo]] = await conn.query('SELECT monto_total,nombre_laboratorio FROM trabajos_laboratorio WHERE id=? FOR UPDATE', [trabajoId]);
  if (!trabajo) f.fail('Trabajo de laboratorio no encontrado.', 404);
  const [[{ pagado }]] = await conn.query('SELECT COALESCE(SUM(monto),0) AS pagado FROM pagos_laboratorio WHERE trabajo_laboratorio_id=?', [trabajoId]);
  const saldo = f.cents(trabajo.monto_total) - f.cents(pagado);
  if (monto > saldo) f.fail('El pago excede el saldo pendiente del laboratorio.', 409);
  await conn.query('INSERT INTO pagos_laboratorio(trabajo_laboratorio_id,monto,fecha_pago,registrado_por) VALUES(?,?,?,?)',
    [trabajoId, f.amount(monto), fecha, req.usuario.id]);
  await registrarAuditoriaFinanciera(conn, {
    usuario_id: req.usuario.id, modulo: 'laboratorio', accion: `Registro un pago a "${trabajo.nombre_laboratorio}"`,
    detalle: { trabajo_laboratorio_id: trabajoId, monto: f.amount(monto), fecha_pago: fecha },
  });
  return { mensaje: 'Pago a laboratorio registrado correctamente.' };
});

module.exports = { getTrabajosPorConsulta, getTrabajos, crearTrabajo, registrarPagoLaboratorio };
