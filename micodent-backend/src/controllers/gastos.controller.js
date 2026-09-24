const db = require('../config/db');
const { fechaLima } = require('../utils/fecha');
const { registrarAuditoriaFinanciera } = require('../utils/auditoriaFinanciera');

const CATEGORIAS_VALIDAS = ['luz', 'agua', 'internet', 'alquiler', 'materiales', 'sueldos', 'imprevistos'];
const CATEGORIAS_CON_MES_CONSUMO = ['luz', 'agua', 'internet', 'alquiler'];
function validarImporteFecha({ monto, fecha_pago }) {
  const { cents, fail } = require('../services/finanzas');
  if (!cents(monto)) fail('El monto debe ser mayor a cero.');
  if (!fecha_pago) fail('La fecha de pago es obligatoria.');
  require('./produccion.controller').dateRange({ desde: fecha_pago, hasta: fecha_pago });
}

// GET /api/gastos?desde=&hasta=
const getGastos = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const fechaHoy = fechaLima();
    const [rows] = await db.query(
      `SELECT g.*, u.nombre_completo AS registrado_por_nombre
       FROM gastos_clinica g
       LEFT JOIN usuarios u ON g.registrado_por = u.id
       WHERE g.fecha_pago BETWEEN ? AND ?
       ORDER BY g.fecha_pago DESC`,
      [desde || fechaHoy, hasta || desde || fechaHoy]
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener gastos.' });
  }
};

// POST /api/gastos
const crearGasto = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { categoria, descripcion, monto, fecha_pago, mes_consumo } = req.body;
    validarImporteFecha(req.body);

    if (!categoria || !CATEGORIAS_VALIDAS.includes(categoria)) {
      await conn.rollback();
      return res.status(400).json({ ok: false, mensaje: 'Categoría de gasto no válida.' });
    }
    if (!monto || parseFloat(monto) <= 0) {
      await conn.rollback();
      return res.status(400).json({ ok: false, mensaje: 'El monto debe ser mayor a cero.' });
    }
    if (!fecha_pago) {
      await conn.rollback();
      return res.status(400).json({ ok: false, mensaje: 'La fecha de pago es obligatoria.' });
    }

    const mesConsumoFinal = CATEGORIAS_CON_MES_CONSUMO.includes(categoria) ? (mes_consumo || null) : null;

    const [result] = await conn.query(
      `INSERT INTO gastos_clinica (categoria, descripcion, monto, fecha_pago, mes_consumo, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [categoria, descripcion || null, monto, fecha_pago, mesConsumoFinal, req.usuario.id]
    );

    await registrarAuditoriaFinanciera(conn, {
      usuario_id: req.usuario.id, modulo: 'gastos', accion: `Registró un gasto de "${categoria}"`,
      detalle: { gasto_id: result.insertId, categoria, monto: parseFloat(monto), fecha_pago, mes_consumo: mesConsumoFinal },
    });

    await conn.commit();
    res.status(201).json({ ok: true, mensaje: 'Gasto registrado correctamente.', gastoId: result.insertId });
  } catch (err) {
    await conn.rollback();
    if (!err.status) console.error('Error al registrar gasto:', err.code || 'unexpected');
    res.status(err.status || 500).json({ ok: false, mensaje: err.status ? err.message : 'Error al registrar el gasto.' });
  } finally {
    conn.release();
  }
};

// PUT /api/gastos/:id
const editarGasto = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const { categoria, descripcion, monto, fecha_pago, mes_consumo } = req.body;
    validarImporteFecha(req.body);

    if (!CATEGORIAS_VALIDAS.includes(categoria)) {
      await conn.rollback();
      return res.status(400).json({ ok: false, mensaje: 'Categoría de gasto no válida.' });
    }

    const [[gastoActual]] = await conn.query('SELECT * FROM gastos_clinica WHERE id = ? FOR UPDATE', [id]);
    if (!gastoActual) {
      await conn.rollback();
      return res.status(404).json({ ok: false, mensaje: 'Gasto no encontrado.' });
    }
    if (gastoActual.estado === 'anulado') {
      await conn.rollback();
      return res.status(409).json({ ok: false, mensaje: 'Este gasto está anulado. Reactívalo primero para poder editarlo.' });
    }

    const mesConsumoFinal = CATEGORIAS_CON_MES_CONSUMO.includes(categoria) ? (mes_consumo || null) : null;

    await conn.query(
      `UPDATE gastos_clinica SET categoria=?, descripcion=?, monto=?, fecha_pago=?, mes_consumo=? WHERE id=?`,
      [categoria, descripcion || null, monto, fecha_pago, mesConsumoFinal, id]
    );

    await registrarAuditoriaFinanciera(conn, {
      usuario_id: req.usuario.id, modulo: 'gastos', accion: `Editó un gasto (ID ${id})`,
      detalle: {
        antes: { categoria: gastoActual.categoria, monto: parseFloat(gastoActual.monto), fecha_pago: gastoActual.fecha_pago, mes_consumo: gastoActual.mes_consumo },
        despues: { categoria, monto: parseFloat(monto), fecha_pago, mes_consumo: mesConsumoFinal },
      },
    });

    await conn.commit();
    res.json({ ok: true, mensaje: 'Gasto actualizado correctamente.' });
  } catch (err) {
    await conn.rollback();
    if (!err.status) console.error('Error al editar gasto:', err.code || 'unexpected');
    res.status(err.status || 500).json({ ok: false, mensaje: err.status ? err.message : 'Error al editar el gasto.' });
  } finally {
    conn.release();
  }
};

// DELETE /api/gastos/:id — Soft Delete: nunca se borra físicamente, se anula
const eliminarGasto = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;

    const [[gasto]] = await conn.query('SELECT * FROM gastos_clinica WHERE id = ? FOR UPDATE', [id]);
    if (!gasto) {
      await conn.rollback();
      return res.status(404).json({ ok: false, mensaje: 'Gasto no encontrado.' });
    }
    if (gasto.estado === 'anulado') {
      await conn.rollback();
      return res.status(409).json({ ok: false, mensaje: 'Este gasto ya estaba anulado.' });
    }

    await conn.query(`UPDATE gastos_clinica SET estado = 'anulado' WHERE id = ?`, [id]);

    await registrarAuditoriaFinanciera(conn, {
      usuario_id: req.usuario.id, modulo: 'gastos', accion: `Anuló un gasto (ID ${id})`,
      detalle: { gasto_id: id, categoria: gasto.categoria, monto: parseFloat(gasto.monto) },
    });

    await conn.commit();
    res.json({ ok: true, mensaje: 'Gasto anulado correctamente.' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al anular el gasto.' });
  } finally {
    conn.release();
  }
};

// PUT /api/gastos/:id/reactivar
const reactivarGasto = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;

    const [[gasto]] = await conn.query('SELECT * FROM gastos_clinica WHERE id = ? FOR UPDATE', [id]);
    if (!gasto) {
      await conn.rollback();
      return res.status(404).json({ ok: false, mensaje: 'Gasto no encontrado.' });
    }
    if (gasto.estado === 'activo') {
      await conn.rollback();
      return res.status(409).json({ ok: false, mensaje: 'Este gasto ya está activo.' });
    }

    await conn.query(`UPDATE gastos_clinica SET estado = 'activo' WHERE id = ?`, [id]);

    await registrarAuditoriaFinanciera(conn, {
      usuario_id: req.usuario.id, modulo: 'gastos', accion: `Reactivó un gasto (ID ${id})`,
      detalle: { gasto_id: id, categoria: gasto.categoria, monto: parseFloat(gasto.monto) },
    });

    await conn.commit();
    res.json({ ok: true, mensaje: 'Gasto reactivado correctamente.' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al reactivar el gasto.' });
  } finally {
    conn.release();
  }
};

// GET /api/gastos/penalidades?doctorId=&desde=&hasta=
const getPenalidades = async (req, res) => {
  try {
    const { doctorId, desde, hasta } = req.query;
    const fechaHoy = fechaLima();
    let query = `
      SELECT pd.*, d.nombre_completo AS doctor_nombre, u.nombre_completo AS registrado_por_nombre
      FROM penalidades_doctor pd
      LEFT JOIN usuarios d ON pd.doctor_id = d.id
      LEFT JOIN usuarios u ON pd.registrado_por = u.id
      WHERE pd.fecha BETWEEN ? AND ?`;
    const params = [desde || fechaHoy, hasta || desde || fechaHoy];
    if (doctorId) { query += ' AND pd.doctor_id = ?'; params.push(doctorId); }
    query += ' ORDER BY pd.fecha DESC';
    const [rows] = await db.query(query, params);
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener penalidades.' });
  }
};

// POST /api/gastos/penalidades
const crearPenalidad = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { doctor_id, consulta_id, trabajo_laboratorio_id, monto, motivo, fecha } = req.body;
    if (!doctor_id || !monto || parseFloat(monto) <= 0 || !motivo) {
      await conn.rollback();
      return res.status(400).json({ ok: false, mensaje: 'Doctor, monto y motivo son obligatorios.' });
    }
    const [result] = await conn.query(
      `INSERT INTO penalidades_doctor (doctor_id, consulta_id, trabajo_laboratorio_id, monto, motivo, fecha, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [doctor_id, consulta_id || null, trabajo_laboratorio_id || null, monto, motivo, fecha || fechaLima(), req.usuario.id]
    );

    await registrarAuditoriaFinanciera(conn, {
      usuario_id: req.usuario.id, modulo: 'gastos', accion: `Registró una penalidad al Dr(a). ${doctor_id}`,
      detalle: { penalidad_id: result.insertId, doctor_id, monto: parseFloat(monto), motivo },
    });

    await conn.commit();
    res.status(201).json({ ok: true, mensaje: 'Penalidad registrada correctamente.', penalidadId: result.insertId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al registrar la penalidad.' });
  } finally {
    conn.release();
  }
};

module.exports = { getGastos, crearGasto, editarGasto, eliminarGasto, reactivarGasto, getPenalidades, crearPenalidad };
