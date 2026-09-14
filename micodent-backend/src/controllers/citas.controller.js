const db = require('../config/db');
const { fechaLima } = require('../utils/fecha');

const aMinutos = (horaStr) => {
  const [h, m] = String(horaStr).split(':').map(Number);
  return h * 60 + m;
};

const hayConflictoHorario = async (doctorId, fecha, horaInicio, duracionMinutos, excludeId = null) => {
  const params = excludeId ? [doctorId, fecha, excludeId] : [doctorId, fecha];
  const [existentes] = await db.query(
    `SELECT id, hora_inicio, duracion_minutos FROM citas
     WHERE doctor_id = ? AND fecha = ? AND estado != 'cancelada' ${excludeId ? 'AND id != ?' : ''}`,
    params
  );

  const nuevaInicio = aMinutos(horaInicio);
  const nuevaFin = nuevaInicio + parseInt(duracionMinutos);

  return existentes.some(c => {
    const existInicio = aMinutos(c.hora_inicio);
    const existFin = existInicio + c.duracion_minutos;
    return nuevaInicio < existFin && nuevaFin > existInicio;
  });
};

const validarDuracion = (duracion) => [30, 60, 90, 120].includes(parseInt(duracion));

// GET /api/citas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&doctorId=...
const getCitas = async (req, res) => {
  try {
    const { desde, hasta, doctorId } = req.query;
    const fechaHoy = fechaLima();
    let query = `
      SELECT c.*, u.nombre_completo AS doctor_nombre, u.prefix AS doctor_prefix,
             p.nombres AS paciente_nombres, p.apellidos AS paciente_apellidos
      FROM citas c
      LEFT JOIN usuarios u ON c.doctor_id = u.id
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      WHERE c.fecha BETWEEN ? AND ?`;
    const params = [desde || fechaHoy, hasta || desde || fechaHoy];

    if (doctorId) {
      query += ' AND c.doctor_id = ?';
      params.push(doctorId);
    }
    query += ' ORDER BY c.fecha ASC, c.hora_inicio ASC';

    const [rows] = await db.query(query, params);
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener las citas.' });
  }
};

// POST /api/citas
const crearCita = async (req, res) => {
  try {
    const {
      paciente_id, nombre_contacto, celular_contacto, motivo_consulta,
      doctor_id, fecha, hora_inicio, duracion_minutos,
    } = req.body;

    if (!nombre_contacto || !celular_contacto || !doctor_id || !fecha || !hora_inicio || !duracion_minutos) {
      return res.status(400).json({ ok: false, mensaje: 'Faltan datos obligatorios para agendar la cita.' });
    }
    if (!validarDuracion(duracion_minutos)) {
      return res.status(400).json({ ok: false, mensaje: 'La duración debe ser 30, 60, 90 o 120 minutos.' });
    }

    const conflicto = await hayConflictoHorario(doctor_id, fecha, hora_inicio, duracion_minutos);
    if (conflicto) {
      return res.status(409).json({ ok: false, mensaje: 'Ya existe una cita en ese horario para este doctor.' });
    }

    const [result] = await db.query(
      `INSERT INTO citas
       (paciente_id, nombre_contacto, celular_contacto, motivo_consulta, doctor_id, fecha, hora_inicio, duracion_minutos, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [paciente_id || null, nombre_contacto, celular_contacto, motivo_consulta || null, doctor_id, fecha, hora_inicio, duracion_minutos, req.usuario.id]
    );

    res.status(201).json({ ok: true, mensaje: 'Cita agendada correctamente.', citaId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al agendar la cita.' });
  }
};

// PUT /api/citas/:id
const editarCita = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      paciente_id, nombre_contacto, celular_contacto, motivo_consulta,
      doctor_id, fecha, hora_inicio, duracion_minutos,
    } = req.body;

    if (!nombre_contacto || !celular_contacto || !doctor_id || !fecha || !hora_inicio || !duracion_minutos) {
      return res.status(400).json({ ok: false, mensaje: 'Faltan datos obligatorios.' });
    }
    if (!validarDuracion(duracion_minutos)) {
      return res.status(400).json({ ok: false, mensaje: 'La duración debe ser 30, 60, 90 o 120 minutos.' });
    }

    const conflicto = await hayConflictoHorario(doctor_id, fecha, hora_inicio, duracion_minutos, id);
    if (conflicto) {
      return res.status(409).json({ ok: false, mensaje: 'Ya existe una cita en ese horario para este doctor.' });
    }

    await db.query(
      `UPDATE citas SET
       paciente_id=?, nombre_contacto=?, celular_contacto=?, motivo_consulta=?,
       doctor_id=?, fecha=?, hora_inicio=?, duracion_minutos=?
       WHERE id=?`,
      [paciente_id || null, nombre_contacto, celular_contacto, motivo_consulta || null, doctor_id, fecha, hora_inicio, duracion_minutos, id]
    );

    res.json({ ok: true, mensaje: 'Cita actualizada correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar la cita.' });
  }
};

// PUT /api/citas/:id/estado
const actualizarEstadoCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const estadosValidos = ['agendada', 'atendida', 'cancelada', 'no_asistio'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ ok: false, mensaje: 'Estado no válido.' });
    }
    await db.query('UPDATE citas SET estado = ? WHERE id = ?', [estado, id]);
    res.json({ ok: true, mensaje: 'Estado actualizado correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar el estado.' });
  }
};

module.exports = { getCitas, crearCita, editarCita, actualizarEstadoCita };