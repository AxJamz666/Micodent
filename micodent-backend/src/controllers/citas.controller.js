const db = require('../config/db');
const { fechaLima } = require('../utils/fecha');

const DURACIONES = new Set([30, 60, 90, 120]);
const ESTADOS = new Set(['agendada', 'atendida', 'cancelada', 'no_asistio']);
const AGENDA_LOCK_SUFFIX = '_agenda_writes_v1';

class CitaError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function fechaValida(value) {
  if (typeof value !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function minutos(value) {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}(?::00)?$/.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

function citaId(value) {
  if (typeof value !== 'string' || !/^[1-9]\d{0,18}$/.test(value)) {
    throw new CitaError(400, 'Identificador de cita no válido.');
  }
  return value;
}

function texto(value, max, name, required = true) {
  if (!required && (value === null || value === undefined || value === '')) return null;
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new CitaError(400, `${name} debe tener entre 1 y ${max} caracteres.`);
  }
  return value.trim();
}

function validarCita(body) {
  const nombre_contacto = texto(body?.nombre_contacto, 150, 'El nombre de contacto');
  const celular_contacto = texto(body?.celular_contacto, 20, 'El celular');
  if (!/^\+?[\d ()-]+$/.test(celular_contacto) || !/^\d{6,20}$/.test(celular_contacto.replace(/\D/g, ''))) {
    throw new CitaError(400, 'El celular debe contener de 6 a 20 dígitos.');
  }
  const doctor_id = texto(body?.doctor_id, 50, 'El doctor');
  const fecha = body?.fecha;
  const hora_inicio = body?.hora_inicio;
  const start = minutos(hora_inicio);
  const rawDuration = body?.duracion_minutos;
  const durationShape = (typeof rawDuration === 'number' && Number.isInteger(rawDuration))
    || (typeof rawDuration === 'string' && /^(30|60|90|120)$/.test(rawDuration));
  const duracion_minutos = Number(rawDuration);
  if (!fechaValida(fecha) || start === null || !durationShape || !DURACIONES.has(duracion_minutos)
      || start + duracion_minutos > 1440) {
    throw new CitaError(400, 'Fecha, hora o duración de la cita no válida.');
  }
  let paciente_id = body?.paciente_id ?? null;
  if (paciente_id === '') paciente_id = null;
  if (paciente_id !== null && !(typeof paciente_id === 'number' && Number.isSafeInteger(paciente_id) && paciente_id > 0)
      && !(typeof paciente_id === 'string' && /^[1-9]\d{0,18}$/.test(paciente_id))) {
    throw new CitaError(400, 'Paciente no válido.');
  }
  return { paciente_id, nombre_contacto, celular_contacto,
    motivo_consulta: texto(body?.motivo_consulta, 5000, 'El motivo', false),
    doctor_id, fecha, hora_inicio: hora_inicio.slice(0, 5), duracion_minutos };
}

function sendError(res, error, fallback) {
  if (error instanceof CitaError) return res.status(error.status).json({ ok: false, mensaje: error.message });
  console.error('AGENDA_OPERATION_FAILED', error.code || 'UNKNOWN');
  return res.status(500).json({ ok: false, mensaje: fallback });
}

async function withScheduleLock(action) {
  const conn = await db.getConnection();
  let locked = false;
  let begun = false;
  let connectionUncertain = false;
  try {
    const [[lock]] = await conn.query('SELECT GET_LOCK(CONCAT(DATABASE(), ?), 10) AS acquired', [AGENDA_LOCK_SUFFIX]);
    if (Number(lock.acquired) !== 1) throw new CitaError(503, 'La agenda está ocupada. Inténtalo de nuevo.');
    locked = true;
    await conn.beginTransaction();
    begun = true;
    const result = await action(conn);
    await conn.commit();
    begun = false;
    return result;
  } catch (error) {
    if (begun) {
      try { await conn.rollback(); }
      catch { connectionUncertain = true; }
    }
    throw error;
  } finally {
    let released = !locked;
    if (locked) {
      try {
        const [[row]] = await conn.query('SELECT RELEASE_LOCK(CONCAT(DATABASE(), ?)) AS released', [AGENDA_LOCK_SUFFIX]);
        released = Number(row.released) === 1;
      } catch { /* Destroy below if the connection is uncertain. */ }
    }
    if (released && !connectionUncertain) conn.release(); else conn.destroy();
  }
}

async function doctorActivo(conn, id) {
  const [doctors] = await conn.query("SELECT id FROM usuarios WHERE id=? AND rol='Doctor' AND activo=1", [id]);
  if (!doctors.length) throw new CitaError(400, 'Selecciona un doctor activo.');
}

async function pacienteExiste(conn, id) {
  if (id === null) return;
  const [patients] = await conn.query('SELECT id FROM pacientes WHERE id=? AND activo=1', [id]);
  if (!patients.length) throw new CitaError(400, 'Selecciona un paciente activo.');
}

async function conflicto(conn, data, excludeId = null) {
  const [rows] = await conn.query(`SELECT id,hora_inicio,duracion_minutos FROM citas
    WHERE doctor_id=? AND fecha=? AND estado!='cancelada'`, [data.doctor_id, data.fecha]);
  const start = minutos(data.hora_inicio);
  return rows.some(row => String(row.id) !== String(excludeId)
    && start < minutos(row.hora_inicio) + Number(row.duracion_minutos)
    && start + data.duracion_minutos > minutos(row.hora_inicio));
}

async function getCitas(req, res) {
  try {
    const desde = req.query.desde || fechaLima();
    const hasta = req.query.hasta || desde;
    const doctorId = req.query.doctorId;
    if (!fechaValida(desde) || !fechaValida(hasta)
        || new Date(hasta) < new Date(desde)
        || (doctorId !== undefined && (typeof doctorId !== 'string' || !doctorId || doctorId.length > 50))) {
      throw new CitaError(400, 'Rango de fechas o doctor no válido.');
    }
    let query = `SELECT c.*,u.nombre_completo AS doctor_nombre,u.prefix AS doctor_prefix,
      p.nombres AS paciente_nombres,p.apellidos AS paciente_apellidos
      FROM citas c LEFT JOIN usuarios u ON c.doctor_id=u.id
      LEFT JOIN pacientes p ON c.paciente_id=p.id WHERE c.fecha BETWEEN ? AND ?`;
    const params = [desde, hasta];
    if (doctorId) { query += ' AND c.doctor_id=?'; params.push(doctorId); }
    query += ' ORDER BY c.fecha ASC,c.hora_inicio ASC,c.id ASC';
    const [rows] = await db.query(query, params);
    return res.json({ ok: true, data: rows });
  } catch (error) { return sendError(res, error, 'Error al obtener las citas.'); }
}

async function crearCita(req, res) {
  try {
    const data = validarCita(req.body);
    const id = await withScheduleLock(async conn => {
      await doctorActivo(conn, data.doctor_id);
      await pacienteExiste(conn, data.paciente_id);
      if (await conflicto(conn, data)) throw new CitaError(409, 'Ya existe una cita en ese horario para este doctor.');
      const [result] = await conn.query(`INSERT INTO citas
        (paciente_id,nombre_contacto,celular_contacto,motivo_consulta,doctor_id,fecha,hora_inicio,duracion_minutos,creado_por)
        VALUES (?,?,?,?,?,?,?,?,?)`, [data.paciente_id, data.nombre_contacto, data.celular_contacto,
        data.motivo_consulta, data.doctor_id, data.fecha, data.hora_inicio, data.duracion_minutos, req.usuario.id]);
      return result.insertId;
    });
    return res.status(201).json({ ok: true, mensaje: 'Cita agendada correctamente.', citaId: id });
  } catch (error) { return sendError(res, error, 'Error al agendar la cita.'); }
}

async function editarCita(req, res) {
  try {
    const id = citaId(req.params.id);
    const data = validarCita(req.body);
    await withScheduleLock(async conn => {
      const [[previous]] = await conn.query('SELECT * FROM citas WHERE id=? FOR UPDATE', [id]);
      if (!previous) throw new CitaError(404, 'Cita no encontrada.');
      const changed = previous.doctor_id !== data.doctor_id || previous.fecha !== data.fecha
        || minutos(previous.hora_inicio) !== minutos(data.hora_inicio)
        || Number(previous.duracion_minutos) !== data.duracion_minutos;
      if (changed) await doctorActivo(conn, data.doctor_id);
      if (changed || String(previous.paciente_id ?? '') !== String(data.paciente_id ?? '')) {
        await pacienteExiste(conn, data.paciente_id);
      }
      if (previous.estado !== 'cancelada' && changed && await conflicto(conn, data, id)) {
        throw new CitaError(409, 'Ya existe una cita en ese horario para este doctor.');
      }
      await conn.query(`UPDATE citas SET paciente_id=?,nombre_contacto=?,celular_contacto=?,motivo_consulta=?,
        doctor_id=?,fecha=?,hora_inicio=?,duracion_minutos=? WHERE id=?`,
      [data.paciente_id, data.nombre_contacto, data.celular_contacto, data.motivo_consulta,
        data.doctor_id, data.fecha, data.hora_inicio, data.duracion_minutos, id]);
    });
    return res.json({ ok: true, mensaje: 'Cita actualizada correctamente.' });
  } catch (error) { return sendError(res, error, 'Error al actualizar la cita.'); }
}

async function actualizarEstadoCita(req, res) {
  try {
    const id = citaId(req.params.id);
    const estado = req.body?.estado;
    if (!ESTADOS.has(estado)) throw new CitaError(400, 'Estado no válido.');
    await withScheduleLock(async conn => {
      const [[previous]] = await conn.query('SELECT * FROM citas WHERE id=? FOR UPDATE', [id]);
      if (!previous) throw new CitaError(404, 'Cita no encontrada.');
      if (previous.estado === estado) return;
      if (previous.estado !== 'agendada' && estado !== 'agendada') {
        throw new CitaError(409, 'Primero devuelve la cita a agendada.');
      }
      if (estado === 'agendada') {
        await doctorActivo(conn, previous.doctor_id);
        if (await conflicto(conn, previous, id)) throw new CitaError(409, 'Ese horario ya está ocupado. Cambia la hora antes de reactivar la cita.');
      }
      await conn.query('UPDATE citas SET estado=? WHERE id=?', [estado, id]);
    });
    return res.json({ ok: true, mensaje: 'Estado actualizado correctamente.' });
  } catch (error) { return sendError(res, error, 'Error al actualizar el estado.'); }
}

module.exports = { getCitas, crearCita, editarCita, actualizarEstadoCita };
