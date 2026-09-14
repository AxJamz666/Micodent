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

// POST /api/laboratorio/consulta/:consultaId
const crearTrabajo = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { consultaId } = req.params;
    const { nombre_laboratorio, monto_total, descripcion } = req.body;
    if (!nombre_laboratorio || !monto_total || parseFloat(monto_total) <= 0) {
      await conn.rollback();
      return res.status(400).json({ ok: false, mensaje: 'Nombre del laboratorio y monto son obligatorios.' });
    }
    const [result] = await conn.query(
      `INSERT INTO trabajos_laboratorio (consulta_id, nombre_laboratorio, monto_total, descripcion, registrado_por)
       VALUES (?, ?, ?, ?, ?)`,
      [consultaId, nombre_laboratorio, monto_total, descripcion || null, req.usuario.id]
    );

    await registrarAuditoriaFinanciera(conn, {
      usuario_id: req.usuario.id, modulo: 'laboratorio', accion: `Registró un trabajo con "${nombre_laboratorio}"`,
      detalle: { trabajo_id: result.insertId, consulta_id: consultaId, nombre_laboratorio, monto_total: parseFloat(monto_total) },
    });

    await conn.commit();
    res.status(201).json({ ok: true, mensaje: 'Trabajo de laboratorio registrado.', trabajoId: result.insertId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al registrar el trabajo de laboratorio.' });
  } finally {
    conn.release();
  }
};

// POST /api/laboratorio/:trabajoId/pagos
const registrarPagoLaboratorio = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { trabajoId } = req.params;
    const { monto, fecha_pago } = req.body;
    if (!monto || parseFloat(monto) <= 0) {
      await conn.rollback();
      return res.status(400).json({ ok: false, mensaje: 'El monto debe ser mayor a cero.' });
    }
    const [[trabajo]] = await conn.query('SELECT monto_total, nombre_laboratorio FROM trabajos_laboratorio WHERE id = ?', [trabajoId]);
    if (!trabajo) {
      await conn.rollback();
      return res.status(404).json({ ok: false, mensaje: 'Trabajo de laboratorio no encontrado.' });
    }
    const [[{ pagado }]] = await conn.query(
      'SELECT COALESCE(SUM(monto), 0) AS pagado FROM pagos_laboratorio WHERE trabajo_laboratorio_id = ?', [trabajoId]
    );
    const saldo = parseFloat(trabajo.monto_total) - parseFloat(pagado);
    if (parseFloat(monto) > saldo) {
      await conn.rollback();
      return res.status(400).json({ ok: false, mensaje: `El pago excede el saldo pendiente (S/ ${saldo.toFixed(2)}).` });
    }
    const fechaFinal = fecha_pago || fechaLima();
    await conn.query(
      `INSERT INTO pagos_laboratorio (trabajo_laboratorio_id, monto, fecha_pago, registrado_por)
       VALUES (?, ?, ?, ?)`,
      [trabajoId, monto, fechaFinal, req.usuario.id]
    );

    await registrarAuditoriaFinanciera(conn, {
      usuario_id: req.usuario.id, modulo: 'laboratorio', accion: `Registró un pago a "${trabajo.nombre_laboratorio}"`,
      detalle: { trabajo_laboratorio_id: trabajoId, monto: parseFloat(monto), fecha_pago: fechaFinal },
    });

    await conn.commit();
    res.status(201).json({ ok: true, mensaje: 'Pago a laboratorio registrado correctamente.' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al registrar el pago al laboratorio.' });
  } finally {
    conn.release();
  }
};

module.exports = { getTrabajosPorConsulta, getTrabajos, crearTrabajo, registrarPagoLaboratorio };