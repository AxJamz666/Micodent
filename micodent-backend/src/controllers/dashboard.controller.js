const db = require('../config/db');
const { fechaLima } = require('../utils/fecha');

const getStats = async (req, res) => {
  try {
    // 1. Obtenemos la fecha estricta de Perú (YYYY-MM-DD)
    const hoy = fechaLima(); 

    // 2. INGRESOS HOY: Suma todos los pagos registrados con la fecha exacta de hoy
    const [[{ ingresosHoy }]] = await db.query(
      'SELECT COALESCE(SUM(monto + COALESCE(recargo_pos,0)), 0) AS ingresosHoy FROM pagos_vigentes WHERE fecha_pago = ?',
      [hoy]
    );

    // 3. PACIENTES SIN HISTORIA
    const [[{ sinHistoria }]] = await db.query(
      `SELECT COUNT(*) AS sinHistoria FROM pacientes p
       LEFT JOIN historias_clinicas h ON p.id = h.paciente_id
       WHERE h.id IS NULL`
    );

    // 4. TOTAL DE HISTORIAS ACTIVAS
    const [[{ totalHistorias }]] = await db.query(
      'SELECT COUNT(*) AS totalHistorias FROM historias_clinicas WHERE activa = 1'
    );

    // 5. PACIENTES DEUDORES (Historias donde el costo de tratamientos es mayor a lo pagado)
    const [[{ deudores }]] = await db.query(
      `SELECT COUNT(DISTINCT c.historia_id) AS deudores
       FROM consultas c
       LEFT JOIN (SELECT consulta_id, SUM(monto) AS pagado FROM pagos_vigentes GROUP BY consulta_id) p 
       ON c.id = p.consulta_id
       WHERE c.costo_total > COALESCE(p.pagado, 0)`
    );

    res.json({
      ok: true,
      data: {
        ingresosHoy: parseFloat(ingresosHoy),
        sinHistoria: sinHistoria,
        deudores: deudores,
        totalHistorias: totalHistorias
      }
    });
  } catch (err) {
    console.error("🔴 ERROR EN GET STATS (Dashboard):", err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener estadísticas del dashboard' });
  }
};

const getUltimasHistorias = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT h.paciente_id, h.nro_historia, h.fecha_creacion, p.nombres, p.apellidos
       FROM historias_clinicas h
       JOIN pacientes p ON h.paciente_id = p.id
       ORDER BY h.creado_en DESC LIMIT 5`
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error("🔴 ERROR EN ÚLTIMAS HISTORIAS:", err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener últimas historias' });
  }
};

const getDeudores = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT h.paciente_id AS id, p.nombres, p.apellidos, c.id AS consulta_id,
              c.descripcion,c.fecha_consulta,c.costo_total,COALESCE(pg.pagado,0) AS pagado,
              c.costo_total - COALESCE(pg.pagado,0) AS pendiente
       FROM historias_clinicas h
       JOIN pacientes p ON h.paciente_id = p.id
       JOIN consultas c ON h.id = c.historia_id
       LEFT JOIN (SELECT consulta_id, SUM(monto) AS pagado FROM pagos_vigentes GROUP BY consulta_id) pg 
       ON c.id = pg.consulta_id
       WHERE c.costo_total > COALESCE(pg.pagado,0)
       ORDER BY p.apellidos,p.nombres,p.id,c.fecha_consulta,c.id`
    );
    const patients = new Map();
    for (const row of rows) {
      if (!patients.has(row.id)) patients.set(row.id, {id:row.id,nombres:row.nombres,apellidos:row.apellidos,deuda_centimos:0,tratamientos:[]});
      const patient = patients.get(row.id);
      patient.deuda_centimos += Math.round(Number(row.pendiente)*100);
      patient.tratamientos.push({id:row.consulta_id,descripcion:row.descripcion,fecha:row.fecha_consulta,costo_total:Number(row.costo_total),pagado:Number(row.pagado),pendiente:Number(row.pendiente)});
    }
    res.json({ok:true,data:[...patients.values()].map(({deuda_centimos,...patient})=>({...patient,deuda_total:deuda_centimos/100}))});
  } catch (err) {
    console.error("🔴 ERROR EN DEUDORES:", err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener lista de deudores' });
  }
};

const getCitasHoy = async (req, res) => {
  try {
    const hoy = fechaLima();
    const [rows] = await db.query(
      `SELECT c.*, u.nombre_completo AS doctor_nombre, u.prefix AS doctor_prefix
       FROM citas c
       LEFT JOIN usuarios u ON c.doctor_id = u.id
       WHERE c.fecha = ? AND c.estado != 'cancelada'
       ORDER BY c.hora_inicio ASC`,
      [hoy]
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error("🔴 ERROR EN CITAS HOY:", err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener las citas de hoy' });
  }
};

const getFinanciero = async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.query('SET TRANSACTION READ ONLY');
    await connection.beginTransaction();
    const { desde, hasta } = req.query;
    const [fechaDesde, fechaHasta] = require('./produccion.controller').dateRange({ desde, hasta });

    // Base caja (punto A/C): todo se agrupa por la fecha en que realmente entró/salió el dinero,
    // no por la fecha en que se registró el tratamiento.
    const [porDoctor] = await connection.query(
      `SELECT
         u.id AS doctor_id,
         u.nombre_completo AS doctor_nombre,
         COUNT(DISTINCT p.id) AS pagos_recibidos,
         COUNT(DISTINCT CASE WHEN p.id IS NOT NULL THEN c.historia_id END) AS pacientes_atendidos,
         COALESCE(SUM(p.monto), 0) AS total_cobrado,
         COALESCE(SUM(p.comision_generada), 0) AS comision_bruta,
         COALESCE((SELECT SUM(pd.monto) FROM penalidades_doctor pd WHERE pd.doctor_id = u.id AND pd.fecha BETWEEN ? AND ?), 0) AS penalidades
       FROM usuarios u
       LEFT JOIN consultas c ON c.doctor_id = u.id
       LEFT JOIN pagos_vigentes p ON p.consulta_id = c.id AND p.fecha_pago BETWEEN ? AND ?
       WHERE u.rol = 'Doctor' OR EXISTS(SELECT 1 FROM consultas historial WHERE historial.doctor_id=u.id)
       GROUP BY u.id, u.nombre_completo
       ORDER BY total_cobrado DESC`,
      [fechaDesde, fechaHasta, fechaDesde, fechaHasta]
    );

    const porDoctorConNeto = porDoctor.map(d => {
      const comisionBruta = parseFloat(d.comision_bruta);
      const penalidades = parseFloat(d.penalidades);
      return {
        ...d,
        total_cobrado: parseFloat(d.total_cobrado),
        comision_bruta: comisionBruta,
        penalidades,
        comision_neta: parseFloat((comisionBruta - penalidades).toFixed(2)),
      };
    });

    // Costo de laboratorio realmente pagado en el rango (punto F) — independiente de cuándo se hizo el tratamiento
    const [[{ costoLaboratorioPagado }]] = await connection.query(
      `SELECT COALESCE(SUM(monto), 0) AS costoLaboratorioPagado
       FROM pagos_laboratorio WHERE fecha_pago BETWEEN ? AND ?`,
      [fechaDesde, fechaHasta]
    );

    // Gastos operativos del rango (punto B) — no incluye laboratorio, que ya se cuenta arriba.
    // Excluye los anulados (soft delete): un gasto anulado no debe afectar la Ganancia Neta Real.
    const [gastosPorCategoria] = await connection.query(
      `SELECT categoria, COALESCE(SUM(monto), 0) AS total
       FROM gastos_clinica WHERE fecha_pago BETWEEN ? AND ? AND estado = 'activo'
       GROUP BY categoria`,
      [fechaDesde, fechaHasta]
    );
    const totalGastosOperativos = gastosPorCategoria.reduce((sum, g) => sum + parseFloat(g.total), 0);

    const [[cash]] = await connection.query(`SELECT COALESCE(SUM(p.monto),0) AS cobrado,COALESCE(SUM(p.recargo_pos),0) AS recargos,
      COALESCE(SUM(p.comision_generada),0) AS comision,COALESCE(SUM(f.costo_aplicado),0) AS costos,
      COALESCE(SUM(CASE WHEN f.regla='legacy_pendiente' THEN 1 ELSE 0 END),0) AS pendientes
      FROM pagos_vigentes p LEFT JOIN finanzas_pagos f ON f.pago_id=p.id WHERE p.fecha_pago BETWEEN ? AND ?`, [fechaDesde,fechaHasta]);
    const [[quoted]] = await connection.query('SELECT COALESCE(SUM(costo_total),0) AS total FROM consultas WHERE fecha_consulta BETWEEN ? AND ?', [fechaDesde,fechaHasta]);
    const totalCobrado = Number(cash.cobrado);
    const totalComisionNeta = porDoctorConNeto.reduce((sum, d) => sum + d.comision_neta, 0);
    const gananciaClinicaAntesGastos = Number(cash.pendientes) ? null : totalCobrado - Number(cash.comision) - Number(cash.costos);
    // Sin límite en cero (punto B: un gasto grande puede dejar el mes en negativo)
    const gananciaNetaReal = gananciaClinicaAntesGastos === null ? null : gananciaClinicaAntesGastos - totalGastosOperativos;
    // Registered cash flow is separate from allocated costs and unpaid commissions.
    const toCents = value => Math.round(Number(value) * 100);
    const ingresosCaja = toCents(cash.cobrado) + toCents(cash.recargos);
    const gastosCaja = gastosPorCategoria.reduce((sum, g) => sum + toCents(g.total), 0);
    const salidasCaja = toCents(costoLaboratorioPagado) + gastosCaja;

    await connection.commit();
    res.json({
      ok: true,
      data: {
        caja: {
          ingresos: ingresosCaja / 100, recargosTarjeta: toCents(cash.recargos) / 100,
          pagosLaboratorio: toCents(costoLaboratorioPagado) / 100,
          gastosOperativos: gastosCaja / 100, salidas: salidasCaja / 100,
          flujoNeto: (ingresosCaja - salidasCaja) / 100,
        },
        porDoctor: porDoctorConNeto,
        costoLaboratorioPagado: parseFloat(costoLaboratorioPagado),
        gastosPorCategoria,
        totalGastosOperativos,
        totales: { totalFacturado: Number(quoted.total), totalCobrado, totalComisionNeta, totalComisionBruta: Number(cash.comision),
          movimientosPorConciliar: Number(cash.pendientes), costosExternosAplicados: Number(cash.pendientes) ? null : Number(cash.costos), gananciaClinicaAntesGastos, gananciaNetaReal },
        desde: fechaDesde,
        hasta: fechaHasta,
      }
    });
  } catch (err) {
    if (connection) await connection.rollback();

    res.status(err.status || 500).json({ ok: false, mensaje: err.status ? err.message : 'Error al obtener el reporte financiero.' });
  } finally { connection?.release(); }
};

module.exports = {
  getStats,
  getUltimasHistorias,
  getDeudores,
  getCitasHoy,
  getFinanciero,
};
