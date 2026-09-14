const db = require('../config/db');
const { fechaLima } = require('../utils/fecha');

const getStats = async (req, res) => {
  try {
    // 1. Obtenemos la fecha estricta de Perú (YYYY-MM-DD)
    const hoy = fechaLima(); 

    // 2. INGRESOS HOY: Suma todos los pagos registrados con la fecha exacta de hoy
    const [[{ ingresosHoy }]] = await db.query(
      'SELECT COALESCE(SUM(monto), 0) AS ingresosHoy FROM pagos WHERE fecha_pago = ?',
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
       LEFT JOIN (SELECT consulta_id, SUM(monto) AS pagado FROM pagos GROUP BY consulta_id) p 
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
      `SELECT h.paciente_id AS id, p.nombres, p.apellidos,
              SUM(c.costo_total) - COALESCE(SUM(pg.pagado), 0) AS deuda_total
       FROM historias_clinicas h
       JOIN pacientes p ON h.paciente_id = p.id
       JOIN consultas c ON h.id = c.historia_id
       LEFT JOIN (SELECT consulta_id, SUM(monto) AS pagado FROM pagos GROUP BY consulta_id) pg 
       ON c.id = pg.consulta_id
       GROUP BY h.id
       HAVING deuda_total > 0
       ORDER BY deuda_total DESC LIMIT 10`
    );
    res.json({ ok: true, data: rows });
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
  try {
    const { desde, hasta } = req.query;
    const fechaDesde = desde || fechaLima();
    const fechaHasta = hasta || fechaDesde;

    // Base caja (punto A/C): todo se agrupa por la fecha en que realmente entró/salió el dinero,
    // no por la fecha en que se registró el tratamiento.
    const [porDoctor] = await db.query(
      `SELECT
         u.id AS doctor_id,
         u.nombre_completo AS doctor_nombre,
         COUNT(DISTINCT p.id) AS pagos_recibidos,
         COUNT(DISTINCT c.historia_id) AS pacientes_atendidos,
         COALESCE(SUM(p.monto), 0) AS total_cobrado,
         COALESCE(SUM(p.comision_generada), 0) AS comision_bruta,
         COALESCE((SELECT SUM(pd.monto) FROM penalidades_doctor pd WHERE pd.doctor_id = u.id AND pd.fecha BETWEEN ? AND ?), 0) AS penalidades
       FROM usuarios u
       LEFT JOIN consultas c ON c.doctor_id = u.id
       LEFT JOIN pagos p ON p.consulta_id = c.id AND p.fecha_pago BETWEEN ? AND ?
       WHERE u.rol = 'Doctor' AND u.activo = 1
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
    const [[{ costoLaboratorioPagado }]] = await db.query(
      `SELECT COALESCE(SUM(monto), 0) AS costoLaboratorioPagado
       FROM pagos_laboratorio WHERE fecha_pago BETWEEN ? AND ?`,
      [fechaDesde, fechaHasta]
    );

    // Gastos operativos del rango (punto B) — no incluye laboratorio, que ya se cuenta arriba.
    // Excluye los anulados (soft delete): un gasto anulado no debe afectar la Ganancia Neta Real.
    const [gastosPorCategoria] = await db.query(
      `SELECT categoria, COALESCE(SUM(monto), 0) AS total
       FROM gastos_clinica WHERE fecha_pago BETWEEN ? AND ? AND estado = 'activo'
       GROUP BY categoria`,
      [fechaDesde, fechaHasta]
    );
    const totalGastosOperativos = gastosPorCategoria.reduce((sum, g) => sum + parseFloat(g.total), 0);

    const totalCobrado = porDoctorConNeto.reduce((sum, d) => sum + d.total_cobrado, 0);
    const totalComisionNeta = porDoctorConNeto.reduce((sum, d) => sum + d.comision_neta, 0);
    const gananciaClinicaAntesGastos = totalCobrado - totalComisionNeta - parseFloat(costoLaboratorioPagado);
    // Sin límite en cero (punto B: un gasto grande puede dejar el mes en negativo)
    const gananciaNetaReal = gananciaClinicaAntesGastos - totalGastosOperativos;

    res.json({
      ok: true,
      data: {
        porDoctor: porDoctorConNeto,
        costoLaboratorioPagado: parseFloat(costoLaboratorioPagado),
        gastosPorCategoria,
        totalGastosOperativos,
        totales: { totalCobrado, totalComisionNeta, gananciaClinicaAntesGastos, gananciaNetaReal },
        desde: fechaDesde,
        hasta: fechaHasta,
      }
    });
  } catch (err) {
    console.error("🔴 ERROR EN FINANCIERO:", err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener el reporte financiero.' });
  }
};

module.exports = {
  getStats,
  getUltimasHistorias,
  getDeudores,
  getCitasHoy,
  getFinanciero,
};