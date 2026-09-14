const db = require('../config/db');
const { fechaLima, horaLima, horaLimaCorta } = require('../utils/fecha');

// GET /api/pacientes
const getPacientes = async (req, res) => {
  try {
    const { search, incluirArchivados } = req.query;
    let query = `
      SELECT p.*, u.nombre_completo AS registrado_por_nombre,
             h.id AS historia_id, h.nro_historia, h.activa AS historia_activa,
             (CASE
               WHEN am.motivo_consulta IS NOT NULL AND am.motivo_consulta != '' THEN 1
               WHEN am.diagnostico IS NOT NULL AND am.diagnostico != '' THEN 1
               ELSE 0
             END) AS tiene_antecedentes,
             (SELECT COUNT(*) FROM odontograma_items WHERE historia_id = h.id) AS total_odontograma,
             (SELECT COUNT(*) FROM consultas WHERE historia_id = h.id) AS total_evoluciones,
             GREATEST(
               COALESCE(h.creado_en, p.creado_en),
               COALESCE(am.actualizado_en, h.creado_en, p.creado_en),
               COALESCE((SELECT MAX(creado_en) FROM consultas WHERE historia_id = h.id), h.creado_en, p.creado_en),
               COALESCE((SELECT MAX(fecha_registro) FROM odontograma_items WHERE historia_id = h.id), h.creado_en, p.creado_en),
               COALESCE((SELECT MAX(creado_en) FROM radiografias WHERE historia_id = h.id), h.creado_en, p.creado_en)
             ) AS ultima_actividad
      FROM pacientes p
      LEFT JOIN usuarios u ON p.registrado_por = u.id
      LEFT JOIN historias_clinicas h ON h.paciente_id = p.id
      LEFT JOIN antecedentes_medicos am ON am.historia_id = h.id`;
    const condiciones = [];
    const params = [];
    if (search) {
      // Al buscar, se incluyen tambien los archivados: si escribiste algo, ya sabes a quien buscas
      condiciones.push('(p.nombres LIKE ? OR p.apellidos LIKE ? OR p.dni LIKE ? OR h.nro_historia LIKE ? OR p.celular LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    } else if (incluirArchivados !== 'true') {
      condiciones.push('p.activo = 1');
    }
    if (condiciones.length > 0) {
      query += ' WHERE ' + condiciones.join(' AND ');
    }
    query += ' ORDER BY p.creado_en DESC';
    const [rows] = await db.query(query, params);

    const data = rows.map(p => {
      let estadoHC = 'vacia';
      if (p.tiene_antecedentes && p.total_odontograma > 0 && p.total_evoluciones > 0) {
        estadoHC = 'completa';
      } else if (p.tiene_antecedentes || p.total_odontograma > 0 || p.total_evoluciones > 0) {
        estadoHC = 'en_progreso';
      }
      return { ...p, estado_hc: estadoHC };
    });

    res.json({ ok: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener pacientes.' });
  }
};

// GET /api/pacientes/:id
const getPacienteById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, a.nombre AS apoderado_nombre, a.parentesco, a.celular AS apoderado_celular
       FROM pacientes p
       LEFT JOIN apoderados a ON p.id = a.paciente_id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Paciente no encontrado.' });
    }
    res.json({ ok: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener paciente.' });
  }
};

// POST /api/pacientes
const crearPaciente = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { dni, nombres, apellidos, sexo, fecha_nacimiento,
            domicilio, celular, apoderado_nombre, parentesco, apoderado_celular } = req.body;

    const [existe] = await conn.query(
      'SELECT id FROM pacientes WHERE dni = ?', [dni]
    );
    if (existe.length > 0) {
      await conn.rollback();
      return res.status(400).json({ ok: false, mensaje: `El DNI ${dni} ya está registrado.` });
    }

    const anioNacimiento = new Date(fecha_nacimiento).getFullYear();
    const anioActual = new Date().getFullYear();
    if (!fecha_nacimiento || isNaN(anioNacimiento) || anioNacimiento < 1900 || anioNacimiento > anioActual) {
      await conn.rollback();
      return res.status(400).json({ ok: false, mensaje: 'La fecha de nacimiento no es válida.' });
    }

    // ✅ CORRECCIÓN APLICADA: Usando utils/fecha.js
    const fecha = fechaLima();
    const hora  = horaLima();

    const [result] = await conn.query(
      `INSERT INTO pacientes (dni, nombres, apellidos, sexo, fecha_nacimiento,
        domicilio, celular, fecha_registro, hora_registro, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [dni, nombres, apellidos, sexo, fecha_nacimiento,
       domicilio, celular, fecha, hora, req.usuario.id]
    );

    const pacienteId = result.insertId;

    // Cada paciente genera su historia clínica automáticamente, en la misma transacción.
    // Se inserta primero con un marcador único temporal, y luego se numera con el ID
    // PROPIO de la historia (nunca se repite) — así jamás choca con historias antiguas.
    const [resultHC] = await conn.query(
      `INSERT INTO historias_clinicas
       (paciente_id, nro_historia, fecha_creacion, hora_creacion, creado_por)
       VALUES (?, ?, ?, ?, ?)`,
      [pacienteId, `TEMP-${pacienteId}`, fecha, hora, req.usuario.id]
    );

    const historiaId = resultHC.insertId;
    const nroHistoria = `HC-${String(historiaId).padStart(4, '0')}`;

    await conn.query(
      'UPDATE historias_clinicas SET nro_historia = ? WHERE id = ?',
      [nroHistoria, historiaId]
    );

    await conn.query(
      'INSERT INTO antecedentes_medicos (historia_id) VALUES (?)',
      [historiaId]
    );

    await conn.query(
      `INSERT INTO auditoria_historias
       (historia_id, usuario_id, accion, fecha_accion, hora_accion)
       VALUES (?, ?, ?, ?, ?)`,
      [historiaId, req.usuario.id, `Historia clínica aperturada automáticamente. N° ${nroHistoria}`, fecha, horaLimaCorta()]
    );

    if (apoderado_nombre) {
      await conn.query(
        'INSERT INTO apoderados (paciente_id, nombre, parentesco, celular) VALUES (?, ?, ?, ?)',
        [pacienteId, apoderado_nombre, parentesco, apoderado_celular]
      );
    }

    await conn.query(
      `INSERT INTO auditoria_pacientes (paciente_id, usuario_id, accion, fecha_accion, hora_accion)
       VALUES (?, ?, ?, ?, ?)`,
      [pacienteId, req.usuario.id, 'Creó el registro inicial del paciente.', fecha, horaLimaCorta()]
    );

    await conn.commit();
    res.status(201).json({
      ok: true,
      mensaje: 'Paciente registrado exitosamente.',
      id: pacienteId,
      historiaId,
      nroHistoria,
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al crear paciente.' });
  } finally {
    conn.release();
  }
};

// PUT /api/pacientes/:id
const editarPaciente = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { id } = req.params;
    const { dni, nombres, apellidos, sexo, fecha_nacimiento,
            domicilio, celular, apoderado_nombre, parentesco, apoderado_celular,
            cambios_detectados } = req.body;

    const anioNacimiento = new Date(fecha_nacimiento).getFullYear();
    const anioActual = new Date().getFullYear();
    if (!fecha_nacimiento || isNaN(anioNacimiento) || anioNacimiento < 1900 || anioNacimiento > anioActual) {
      await conn.rollback();
      return res.status(400).json({ ok: false, mensaje: 'La fecha de nacimiento no es válida.' });
    }

    await conn.query(
      `UPDATE pacientes SET dni=?, nombres=?, apellidos=?, sexo=?,
       fecha_nacimiento=?, domicilio=?, celular=? WHERE id=?`,
      [dni, nombres, apellidos, sexo, fecha_nacimiento, domicilio, celular, id]
    );

    const [apo] = await conn.query('SELECT id FROM apoderados WHERE paciente_id = ?', [id]);
    if (apoderado_nombre) {
      if (apo.length > 0) {
        await conn.query(
          'UPDATE apoderados SET nombre=?, parentesco=?, celular=? WHERE paciente_id=?',
          [apoderado_nombre, parentesco, apoderado_celular, id]
        );
      } else {
        await conn.query(
          'INSERT INTO apoderados (paciente_id, nombre, parentesco, celular) VALUES (?,?,?,?)',
          [id, apoderado_nombre, parentesco, apoderado_celular]
        );
      }
    }

    if (cambios_detectados) {
      // ✅ CORRECCIÓN APLICADA: Usando utils/fecha.js
      const fecha = fechaLima();
      const hora = horaLimaCorta();
      await conn.query(
        `INSERT INTO auditoria_pacientes (paciente_id, usuario_id, accion, fecha_accion, hora_accion)
         VALUES (?, ?, ?, ?, ?)`,
        [id, req.usuario.id, `Editó: ${cambios_detectados}`, fecha, hora]
      );
    }

    await conn.commit();
    res.json({ ok: true, mensaje: 'Paciente actualizado correctamente.' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ ok: false, mensaje: 'Error al editar paciente.' });
  } finally {
    conn.release();
  }
};

// DELETE /api/pacientes/:id
const eliminarPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT id FROM pacientes WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Paciente no encontrado.' });
    }

    await db.query('UPDATE pacientes SET activo = 0 WHERE id = ?', [id]);
    await db.query('UPDATE historias_clinicas SET activa = 0 WHERE paciente_id = ?', [id]);

    const fecha = fechaLima();
    const hora = horaLimaCorta();
    await db.query(
      `INSERT INTO auditoria_pacientes (paciente_id, usuario_id, accion, fecha_accion, hora_accion)
       VALUES (?, ?, ?, ?, ?)`,
      [id, req.usuario.id, 'Archivó (desactivó) el registro del paciente y su historia clínica. Todos los datos se conservan intactos.', fecha, hora]
    );

    res.json({ ok: true, mensaje: 'Paciente archivado correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al archivar paciente.' });
  }
};

// PUT /api/pacientes/:id/reactivar
const reactivarPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT id FROM pacientes WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Paciente no encontrado.' });
    }

    await db.query('UPDATE pacientes SET activo = 1 WHERE id = ?', [id]);
    await db.query('UPDATE historias_clinicas SET activa = 1 WHERE paciente_id = ?', [id]);

    const fecha = fechaLima();
    const hora = horaLimaCorta();
    await db.query(
      `INSERT INTO auditoria_pacientes (paciente_id, usuario_id, accion, fecha_accion, hora_accion)
       VALUES (?, ?, ?, ?, ?)`,
      [id, req.usuario.id, 'Reactivó el registro del paciente y su historia clínica.', fecha, hora]
    );

    res.json({ ok: true, mensaje: 'Paciente reactivado correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al reactivar paciente.' });
  }
};

// GET /api/pacientes/:id/auditoria
const getAuditoriaPaciente = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, u.nombre_completo AS usuario_nombre
       FROM auditoria_pacientes a
       LEFT JOIN usuarios u ON a.usuario_id = u.id
       WHERE a.paciente_id = ?
       ORDER BY a.creado_en DESC`,
      [req.params.id]
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener auditoría.' });
  }
};

module.exports = { getPacientes, getPacienteById, crearPaciente, editarPaciente, eliminarPaciente, getAuditoriaPaciente, reactivarPaciente };