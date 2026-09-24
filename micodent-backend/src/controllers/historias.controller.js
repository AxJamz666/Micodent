const { fechaLima, horaLima, horaLimaCorta } = require('../utils/fecha');
const db = require('../config/db');


const { agregarConsulta, registrarPago } = require('./cobros.controller');

// GET /api/historias — listar todas
const getHistorias = async (req, res) => {
  try {
    const { search, incluirArchivadas } = req.query;
     let query = `
      SELECT h.id, h.paciente_id, h.nro_historia, h.fecha_creacion, h.activa,
             p.nombres, p.apellidos, p.dni,
             u.nombre_completo AS creado_por_nombre,
             u.especialidad AS doctor_especialidad, u.cop AS doctor_cop,
             u.firma_digital AS doctor_firma, u.sello_digital AS doctor_sello,
             COALESCE(SUM(c.costo_total), 0) AS total_tratamientos,
             COALESCE((
               SELECT SUM(pg.monto) FROM pagos_vigentes pg
               JOIN consultas cc ON pg.consulta_id = cc.id
               WHERE cc.historia_id = h.id
             ), 0) AS total_pagado
      FROM historias_clinicas h
      JOIN pacientes p ON h.paciente_id = p.id
      LEFT JOIN usuarios u ON h.creado_por = u.id
      LEFT JOIN consultas c ON c.historia_id = h.id`;

    const condiciones = [];
    const params = [];
    if (incluirArchivadas !== 'true') {
      condiciones.push('h.activa = 1');
    }
    if (search) {
      condiciones.push('(p.nombres LIKE ? OR p.apellidos LIKE ? OR p.dni LIKE ? OR h.nro_historia LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (condiciones.length > 0) {
      query += ' WHERE ' + condiciones.join(' AND ');
    }
    query += ' GROUP BY h.id ORDER BY h.creado_en DESC';
    const [rows] = await db.query(query, params);
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener historias.' });
  }
};

// GET /api/historias/:pacienteId — obtener historia de un paciente
const getHistoriaByPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const [historia] = await db.query(
      `SELECT h.*,
                p.nombres, p.apellidos, p.dni, p.sexo,
                p.fecha_nacimiento, p.domicilio, p.celular,
                ap.nombre        AS apoderado_nombre,
                ap.parentesco    AS parentesco,
                ap.celular       AS apoderado_celular,
                u.nombre_completo AS creado_por_nombre,
                u.especialidad    AS doctor_especialidad,
                u.cop             AS doctor_cop
       FROM historias_clinicas h
       JOIN pacientes p ON h.paciente_id = p.id
       LEFT JOIN apoderados ap ON p.id = ap.paciente_id
       LEFT JOIN usuarios u ON h.creado_por = u.id
       WHERE h.paciente_id = ?`,
      [pacienteId]
    );

    if (historia.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Historia no encontrada.' });
    }

    const [antecedentes] = await db.query(
      'SELECT * FROM antecedentes_medicos WHERE historia_id = ?',
      [historia[0].id]
    );
    const [triaje] = await db.query(
      'SELECT * FROM triaje WHERE historia_id = ? ORDER BY fecha_toma DESC LIMIT 1',
      [historia[0].id]
    );
     const [odontograma] = await db.query(
      `SELECT o.*, u.nombre_completo AS registrado_por_nombre
       FROM odontograma_items o
       LEFT JOIN usuarios u ON o.registrado_por = u.id
       WHERE o.historia_id = ?
       ORDER BY o.fecha_registro DESC`,
      [historia[0].id]
    );

    for (const item of odontograma) {
      const [adendasItem] = await db.query(
        `SELECT a.*, u.nombre_completo AS usuario_nombre
         FROM odontograma_adendas a LEFT JOIN usuarios u ON a.usuario_id = u.id
         WHERE a.odontograma_item_id = ? ORDER BY a.creado_en ASC`,
        [item.id]
      );
      item.adendas = adendasItem;
    }

    const [consultas] = await db.query(
      `SELECT c.*, u.nombre_completo AS doctor_nombre,
              COALESCE((SELECT SUM(p.monto) FROM pagos_vigentes p WHERE p.consulta_id = c.id), 0) AS total_pagado
       FROM consultas c
       LEFT JOIN usuarios u ON c.doctor_id = u.id
       WHERE c.historia_id = ?
       ORDER BY c.fecha_consulta DESC`,
      [historia[0].id]
    );

// Pagos y correcciones (adendas) por consulta
    for (const consulta of consultas) {
      const [pagos] = await db.query(
        'SELECT * FROM pagos_vigentes WHERE consulta_id = ? ORDER BY creado_en ASC',
        [consulta.id]
      );
      consulta.pagos = pagos;
      if (req.usuario.isAdmin) {
        const total = await require('../services/finanzas').externalTotal(db, consulta) / 100;
        const [[covered]] = await db.query(`SELECT COALESCE(SUM(f.costo_aplicado),0) AS total
          FROM finanzas_pagos f JOIN pagos_vigentes p ON p.id=f.pago_id WHERE p.consulta_id=?`, [consulta.id]);
        const [[state]] = await db.query('SELECT origen FROM finanzas_costos WHERE consulta_id=?',[consulta.id]);
        const revisar=state?.origen==='legacy_pendiente';
        consulta.finanzas = { costo_total: total, costo_cubierto: revisar ? null : Number(covered.total), costo_pendiente: revisar ? null : Math.max(0,total-Number(covered.total)), requiere_conciliacion: revisar };
      }

      const [adendas] = await db.query(
        `SELECT a.*, u.nombre_completo AS usuario_nombre
         FROM consultas_adendas a LEFT JOIN usuarios u ON a.usuario_id = u.id
         WHERE a.consulta_id = ? ORDER BY a.creado_en ASC`,
        [consulta.id]
      );
      consulta.adendas = adendas;
    }

    const [firma] = await db.query(
      'SELECT * FROM firmas_consentimiento WHERE historia_id = ?',
      [historia[0].id]
    );
    const [radiografias] = await db.query(
      'SELECT * FROM radiografias WHERE historia_id = ? ORDER BY creado_en DESC',
      [historia[0].id]
    );

    const [recetas] = await db.query(
      `SELECT r.*, u.nombre_completo AS doctor_nombre, u.especialidad AS doctor_especialidad,
              u.cop AS doctor_cop, u.firma_digital AS doctor_firma, u.sello_digital AS doctor_sello,
              ua.nombre_completo AS anulada_por_nombre
       FROM recetas r
       LEFT JOIN usuarios u ON r.doctor_id = u.id
       LEFT JOIN usuarios ua ON r.anulada_por = ua.id
       WHERE r.historia_id = ?
       ORDER BY r.creado_en DESC`,
      [historia[0].id]
    );

    const [ordenes] = await db.query(
      `SELECT o.*, u.nombre_completo AS doctor_nombre, u.especialidad AS doctor_especialidad,
              u.cop AS doctor_cop, u.firma_digital AS doctor_firma, u.sello_digital AS doctor_sello,
              ua.nombre_completo AS anulada_por_nombre,
              c.nombre AS centro_nombre, c.sede AS centro_sede, c.direccion AS centro_direccion,
              c.celular AS centro_celular, c.mapa_imagen_url AS centro_mapa
       FROM ordenes_radiografia o
       LEFT JOIN usuarios u ON o.doctor_id = u.id
       LEFT JOIN usuarios ua ON o.anulada_por = ua.id
       LEFT JOIN centros_referencia c ON o.centro_referencia_id = c.id
       WHERE o.historia_id = ?
       ORDER BY o.creado_en DESC`,
      [historia[0].id]
    );

    


    const [auditoria] = await db.query(
      `SELECT a.*, u.nombre_completo AS usuario_nombre
       FROM auditoria_historias a
       LEFT JOIN usuarios u ON a.usuario_id = u.id
       WHERE a.historia_id = ? ORDER BY a.creado_en DESC`,
      [historia[0].id]
    );

    res.json({
      ok: true,
      data: {
        ...historia[0],
        antecedentes:  antecedentes[0] || {},
        triaje:        triaje[0]       || {},
        odontograma,
        consultas,
        firma:         firma[0]        || {},
        radiografias,
        recetas: recetas.map(require('../utils/jsonFields').document),
        ordenes: ordenes.map(require('../utils/jsonFields').document),
        auditoria,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener historia clínica.' });
  }
};


// PUT /api/historias/:historiaId/antecedentes — guardar triaje y antecedentes
const guardarAntecedentes = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { historiaId } = req.params;

    if (!historiaId || isNaN(historiaId)) {
      await conn.rollback();
      return res.status(400).json({ ok: false, mensaje: 'No se pudo identificar la historia clínica. Recarga la página e inténtalo de nuevo.' });
    }

    const {
      motivo_consulta, antecedentes_medicos, antecedentes_quirurgicos,
      antecedentes_odontologicos, diagnostico, plan_tratamiento, examen_clinico,
      presion, pulso, temperatura, fc, fr
    } = req.body;

    // Actualizar antecedentes
    await conn.query(
      `UPDATE antecedentes_medicos SET
        motivo_consulta = ?, antecedentes_medicos = ?,
        antecedentes_quirurgicos = ?, antecedentes_odontologicos = ?,
        diagnostico = ?, plan_tratamiento = ?, examen_clinico = ?
       WHERE historia_id = ?`,
      [motivo_consulta, antecedentes_medicos, antecedentes_quirurgicos,
       antecedentes_odontologicos, diagnostico, plan_tratamiento,
       examen_clinico, historiaId]
    );

    const fecha = fechaLima();
    const horaCorta = horaLimaCorta();

    // Guardar triaje si hay signos vitales
    if (presion || pulso || temperatura || fc || fr) {
      await conn.query(
        `INSERT INTO triaje
          (historia_id, presion, pulso, temperatura, fc, fr, fecha_toma, registrado_por)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [historiaId, presion, pulso, temperatura, fc, fr, fecha, req.usuario.id]
      );
    }

    // Auditoría
    await conn.query(
      `INSERT INTO auditoria_historias
        (historia_id, usuario_id, accion, fecha_accion, hora_accion)
       VALUES (?, ?, ?, ?, ?)`,
      [historiaId, req.usuario.id, 'Actualizó antecedentes, diagnóstico y triaje.', fecha, horaCorta]
    );

    await conn.commit();
    res.json({ ok: true, mensaje: 'Historia clínica guardada exitosamente.' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al guardar antecedentes.' });
  } finally {
    conn.release();
  }
};



// POST /api/historias/:historiaId/odontograma-items — agregar un diagnostico o procedimiento (queda firmado al instante)
const agregarItemOdontograma = async (req, res) => {
  try {
    const { historiaId } = req.params;
    const { pieza, cara, estado_codigo, estado_nombre, color, notas } = req.body;

    if (!pieza || !cara || !estado_codigo) {
      return res.status(400).json({ ok: false, mensaje: 'Faltan datos del diagnóstico o procedimiento.' });
    }

    const [result] = await db.query(
      `INSERT INTO odontograma_items
       (historia_id, pieza, cara, estado_codigo, estado_nombre, color, notas, registrado_por, firmado_en, bloqueada)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1)`,
      [historiaId, pieza, cara, estado_codigo, estado_nombre, color, notas || null, req.usuario.id]
    );

    const fecha = fechaLima();
    const hora = horaLimaCorta();
    await db.query(
      `INSERT INTO auditoria_historias (historia_id, usuario_id, accion, fecha_accion, hora_accion)
       VALUES (?, ?, ?, ?, ?)`,
      [historiaId, req.usuario.id, `Registró en el odontograma — Pieza ${pieza}: "${estado_nombre}"`, fecha, hora]
    );

    res.status(201).json({ ok: true, mensaje: 'Registrado correctamente.', itemId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al registrar en el odontograma.' });
  }
};

// POST /api/historias/odontograma-items/:id/adendas — corregir un diagnostico/procedimiento ya firmado
const agregarAdendaOdontograma = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo, contenido } = req.body;

    if (!motivo || !contenido) {
      return res.status(400).json({ ok: false, mensaje: 'El motivo y la corrección son obligatorios.' });
    }

    const [rows] = await db.query('SELECT historia_id, bloqueada FROM odontograma_items WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Registro no encontrado.' });
    }
    if (!rows[0].bloqueada) {
      return res.status(400).json({ ok: false, mensaje: 'Este registro todavía no está firmado.' });
    }

    await db.query(
      'INSERT INTO odontograma_adendas (odontograma_item_id, usuario_id, motivo, contenido) VALUES (?, ?, ?, ?)',
      [id, req.usuario.id, motivo, contenido]
    );

    const fecha = fechaLima();
    const hora = horaLimaCorta();
    await db.query(
      `INSERT INTO auditoria_historias (historia_id, usuario_id, accion, fecha_accion, hora_accion)
       VALUES (?, ?, ?, ?, ?)`,
      [rows[0].historia_id, req.usuario.id, `Agregó una corrección a un registro del odontograma. Motivo: "${motivo}"`, fecha, hora]
    );

    res.status(201).json({ ok: true, mensaje: 'Corrección agregada correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al agregar la corrección.' });
  }
};

// DELETE /api/historias/odontograma-items/:id — anular un registro reciente por error de pieza
const eliminarItemOdontograma = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    if (!motivo) {
      return res.status(400).json({ ok: false, mensaje: 'Debes indicar el motivo de la eliminación.' });
    }

    const [rows] = await db.query(
      `SELECT o.historia_id, o.pieza, o.estado_nombre, o.registrado_por,
              (SELECT COUNT(*) FROM odontograma_adendas WHERE odontograma_item_id = o.id) AS total_adendas
       FROM odontograma_items o WHERE o.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Registro no encontrado.' });
    }
    const item = rows[0];
    if (item.registrado_por !== req.usuario.id) {
      return res.status(403).json({ ok: false, mensaje: 'Solo el doctor que lo registró puede eliminarlo.' });
    }
    if (item.total_adendas > 0) {
      return res.status(409).json({ ok: false, mensaje: 'Este registro ya tiene una corrección agregada y no se puede eliminar. Usa una corrección en su lugar.' });
    }

    await db.query('DELETE FROM odontograma_items WHERE id = ?', [id]);

    const fecha = fechaLima();
    const hora = horaLimaCorta();
    await db.query(
      `INSERT INTO auditoria_historias (historia_id, usuario_id, accion, fecha_accion, hora_accion)
       VALUES (?, ?, ?, ?, ?)`,
      [item.historia_id, req.usuario.id, `Anuló un registro del odontograma — Pieza ${item.pieza}: "${item.estado_nombre}". Motivo: "${motivo}"`, fecha, hora]
    );

    res.json({ ok: true, mensaje: 'Registro eliminado correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar el registro.' });
  }
};



// POST /api/historias/:historiaId/consultas — agregar consulta/tratamiento (ahora acepta estado clínico y costo de laboratorio, y firma/bloquea sola):
// Cobros y creacion de evoluciones: controlador transaccional compartido.

// DELETE /api/historias/:pacienteId — eliminar historia completa
const eliminarHistoria = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const [historia] = await db.query(
      'SELECT id FROM historias_clinicas WHERE paciente_id = ?', [pacienteId]
    );
    if (historia.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Historia no encontrada.' });
    }

    await db.query(
      'UPDATE historias_clinicas SET activa = 0 WHERE paciente_id = ?', [pacienteId]
    );

    const fecha = fechaLima();
    const hora = horaLimaCorta();
    await db.query(
      `INSERT INTO auditoria_historias (historia_id, usuario_id, accion, fecha_accion, hora_accion)
       VALUES (?, ?, ?, ?, ?)`,
      [historia[0].id, req.usuario.id, 'Archivó (desactivó) la historia clínica.', fecha, hora]
    );

    res.json({ ok: true, mensaje: 'Historia clínica archivada correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al archivar historia.' });
  }
};

// PUT /api/historias/paciente/:pacienteId/reactivar — reactivar una historia archivada
const reactivarHistoria = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const [historia] = await db.query(
      'SELECT id FROM historias_clinicas WHERE paciente_id = ?', [pacienteId]
    );
    if (historia.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Historia no encontrada.' });
    }

    await db.query(
      'UPDATE historias_clinicas SET activa = 1 WHERE paciente_id = ?', [pacienteId]
    );

    const fecha = fechaLima();
    const hora = horaLimaCorta();
    await db.query(
      `INSERT INTO auditoria_historias (historia_id, usuario_id, accion, fecha_accion, hora_accion)
       VALUES (?, ?, ?, ?, ?)`,
      [historia[0].id, req.usuario.id, 'Reactivó (des-archivó) la historia clínica.', fecha, hora]
    );

    res.json({ ok: true, mensaje: 'Historia clínica reactivada correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al reactivar historia.' });
  }
};

// POST /api/historias/:historiaId/radiografias — subir imagen
const subirRadiografia = async (req, res) => {
  try {
    const { historiaId } = req.params;
    const { descripcion, tipo } = req.body;

    if (!req.file) {
      return res.status(400).json({ ok: false, mensaje: 'No se recibió ningún archivo.' });
    }

    const url_archivo = `/uploads/${req.file.filename}`;
    
    const fecha = fechaLima();
    const hora = horaLimaCorta();

    const [result] = await db.query(
      `INSERT INTO radiografias
        (historia_id, tipo, descripcion, url_archivo, fecha_toma, subido_por)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [historiaId, tipo || 'radiografia', descripcion || '', url_archivo, fecha, req.usuario.id]
    );

    await db.query(
      `INSERT INTO auditoria_historias (historia_id, usuario_id, accion, fecha_accion, hora_accion)
       VALUES (?, ?, ?, ?, ?)`,
      [historiaId, req.usuario.id, `Subió una placa/anexo: "${descripcion || 'Radiografía'}"`, fecha, hora]
    );

    res.status(201).json({
      ok:          true,
      mensaje:     'Imagen subida correctamente.',
      radiografiaId: result.insertId,
      url_archivo,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al subir imagen.' });
  }
};

// GET /api/historias/:historiaId/radiografias — listar imágenes
const getRadiografias = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, u.nombre_completo AS subido_por_nombre
       FROM radiografias r
       LEFT JOIN usuarios u ON r.subido_por = u.id
       WHERE r.historia_id = ?
       ORDER BY r.creado_en DESC`,
      [req.params.historiaId]
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener imágenes.' });
  }
};

// DELETE /api/historias/radiografias/:id — eliminar imagen
const eliminarRadiografia = async (req, res) => {
  try {
    const { id } = req.params;
    const path = require('path');
    const fs   = require('fs');
    
    const [rows] = await db.query(
      'SELECT url_archivo, historia_id, descripcion FROM radiografias WHERE id = ?', [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Imagen no encontrada.' });
    }

    const filePath = path.join(__dirname, '../', rows[0].url_archivo);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    
    await db.query('DELETE FROM radiografias WHERE id = ?', [id]);
    
    const fecha = fechaLima();
    const hora = horaLimaCorta();
    await db.query(
      `INSERT INTO auditoria_historias (historia_id, usuario_id, accion, fecha_accion, hora_accion)
       VALUES (?, ?, ?, ?, ?)`,
      [rows[0].historia_id, req.usuario.id, `Eliminó físicamente la placa: "${rows[0].descripcion}"`, fecha, hora]
    );
    
    res.json({ ok: true, mensaje: 'Imagen eliminada correctamente.' });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar imagen.' });
  }
};

// PUT /api/historias/:historiaId/firmas — guardar firmas digitales
const guardarFirmas = async (req, res) => {
  try {
    const { historiaId }          = req.params;
    const { firma_paciente_data, firma_doctor_data } = req.body;
    
    const fecha = fechaLima();
    const hora = horaLimaCorta();

    const [existe] = await db.query(
      'SELECT id FROM firmas_consentimiento WHERE historia_id = ?', [historiaId]
    );

    if (existe.length > 0) {
      await db.query(
        `UPDATE firmas_consentimiento SET
          firma_paciente_data = ?, firma_doctor_data = ?, fecha_firma = ?
         WHERE historia_id = ?`,
        [firma_paciente_data, firma_doctor_data, fecha, historiaId]
      );
    } else {
      await db.query(
        `INSERT INTO firmas_consentimiento
          (historia_id, firma_paciente_data, firma_doctor_data, fecha_firma)
         VALUES (?, ?, ?, ?)`,
        [historiaId, firma_paciente_data, firma_doctor_data, fecha]
      );
    }

    await db.query(
      `INSERT INTO auditoria_historias (historia_id, usuario_id, accion, fecha_accion, hora_accion)
       VALUES (?, ?, ?, ?, ?)`,
      [historiaId, req.usuario.id, 'Actualizó las firmas de consentimiento informado.', fecha, hora]
    );

    res.json({ ok: true, mensaje: 'Firmas guardadas correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al guardar firmas.' });
  }
};

// PUT /api/historias/consultas/:id — editar tratamiento (ahora rechaza si ya está firmada)
const editarConsulta = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, costo_total, fecha_consulta } = req.body;
    const [rows] = await db.query('SELECT historia_id, bloqueada FROM consultas WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Tratamiento no encontrado.' });
    }

    if (rows[0].bloqueada) {
      return res.status(409).json({ ok: false, mensaje: 'Esta Evolución ya está firmada y no se puede editar. Usa una corrección en su lugar.' });
    }

    await db.query(
      'UPDATE consultas SET descripcion=?, costo_total=?, fecha_consulta=? WHERE id=?',
      [descripcion, costo_total, fecha_consulta, id]
    );

    const fecha = fechaLima();
    const hora = horaLimaCorta();
    await db.query(
      `INSERT INTO auditoria_historias (historia_id, usuario_id, accion, fecha_accion, hora_accion)
       VALUES (?, ?, ?, ?, ?)`,
      [rows[0].historia_id, req.usuario.id, `Editó el tratamiento: "${descripcion}" — Nuevo costo: S/ ${parseFloat(costo_total).toFixed(2)}`, fecha, hora]
    );

    res.json({ ok: true, mensaje: 'Tratamiento actualizado.' });
  } catch (err) {
    console.error("🔴 ERROR EN EDITAR CONSULTA:", err);
    res.status(500).json({ ok: false, mensaje: 'Error al editar tratamiento.' });
  }
};


// POST /api/historias/consultas/:id/adendas — corregir una evolución ya firmada
const agregarAdendaConsulta = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo, contenido } = req.body;

    if (!motivo || !contenido) {
      return res.status(400).json({ ok: false, mensaje: 'El motivo y la corrección son obligatorios.' });
    }

    const [rows] = await db.query('SELECT historia_id, bloqueada FROM consultas WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Evolución no encontrada.' });
    }
    if (!rows[0].bloqueada) {
      return res.status(400).json({ ok: false, mensaje: 'Esta Evolución todavía no está firmada — puedes editarla directamente.' });
    }

    await db.query(
      'INSERT INTO consultas_adendas (consulta_id, usuario_id, motivo, contenido) VALUES (?, ?, ?, ?)',
      [id, req.usuario.id, motivo, contenido]
    );

    const fecha = fechaLima();
    const hora = horaLimaCorta();
    await db.query(
      `INSERT INTO auditoria_historias (historia_id, usuario_id, accion, fecha_accion, hora_accion)
       VALUES (?, ?, ?, ?, ?)`,
      [rows[0].historia_id, req.usuario.id, `Agregó una corrección a una Evolución firmada. Motivo: "${motivo}"`, fecha, hora]
    );

    res.status(201).json({ ok: true, mensaje: 'Corrección agregada correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al agregar la corrección.' });
  }
};

// GET /api/historias/centros-referencia — catalogo de centros (para el selector del formulario)
const getCentrosReferencia = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM centros_referencia WHERE activo = 1 ORDER BY nombre ASC');
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener centros de referencia.' });
  }
};

// POST /api/historias/:historiaId/ordenes-radiografia — emitir orden (queda firmada al instante)
const agregarOrdenRadiografia = async (req, res) => {
  try {
    const { historiaId } = req.params;
    const {
      tipo_solicitud, motivo, envio_virtual,
      extraorales, tomografias, piezas_tomografia, fotografias,
      intraorales, periapicales_piezas, modelos_estudio,
    } = req.body;

    const fecha = fechaLima();
    const hora = horaLimaCorta();

    const [result] = await db.query(
      `INSERT INTO ordenes_radiografia
       (historia_id, doctor_id, fecha, tipo_solicitud, motivo, envio_virtual,
        extraorales, tomografias, piezas_tomografia, fotografias, intraorales, periapicales_piezas, modelos_estudio,
        firmado_en, bloqueada)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1)`,
      [
        historiaId, req.usuario.id, fecha,
        tipo_solicitud || 'rx_informe', motivo || null, envio_virtual || 'ninguno',
        JSON.stringify(extraorales || []), JSON.stringify(tomografias || []),
        JSON.stringify(piezas_tomografia || []), JSON.stringify(fotografias || {}),
        JSON.stringify(intraorales || {}), JSON.stringify(periapicales_piezas || []),
        JSON.stringify(modelos_estudio || []),
      ]
    );

    await db.query(
      `INSERT INTO auditoria_historias (historia_id, usuario_id, accion, fecha_accion, hora_accion)
       VALUES (?, ?, ?, ?, ?)`,
      [historiaId, req.usuario.id, 'Emitió y firmó una nueva Orden de Radiografía.', fecha, hora]
    );

    res.status(201).json({ ok: true, mensaje: 'Orden emitida y firmada correctamente.', ordenId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al emitir la orden.' });
  }
};

// POST /api/historias/ordenes-radiografia/:id/reemitir — anular una orden y emitir la version corregida
const reemitirOrdenRadiografia = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const {
      motivo, tipo_solicitud, motivo_radiografia, envio_virtual,
      extraorales, tomografias, piezas_tomografia, fotografias,
      intraorales, periapicales_piezas, modelos_estudio,
    } = req.body;

    if (!motivo) {
      await conn.rollback();
      return res.status(400).json({ ok: false, mensaje: 'El motivo de la corrección es obligatorio.' });
    }

    const [rows] = await conn.query('SELECT historia_id, anulada FROM ordenes_radiografia WHERE id = ?', [id]);
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ ok: false, mensaje: 'Orden no encontrada.' });
    }
    if (rows[0].anulada) {
      await conn.rollback();
      return res.status(409).json({ ok: false, mensaje: 'Esta orden ya fue anulada anteriormente.' });
    }

    const historiaId = rows[0].historia_id;
    const fecha = fechaLima();
    const hora = horaLimaCorta();

    await conn.query(
      'UPDATE ordenes_radiografia SET anulada = 1, motivo_anulacion = ?, anulada_por = ?, anulada_en = NOW() WHERE id = ?',
      [motivo, req.usuario.id, id]
    );

    const [result] = await conn.query(
      `INSERT INTO ordenes_radiografia
       (historia_id, doctor_id, fecha, tipo_solicitud, motivo, envio_virtual,
        extraorales, tomografias, piezas_tomografia, fotografias, intraorales, periapicales_piezas, modelos_estudio,
        firmado_en, bloqueada, reemplaza_a)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1, ?)`,
      [
        historiaId, req.usuario.id, fecha,
        tipo_solicitud || 'rx_informe', motivo_radiografia || null, envio_virtual || 'ninguno',
        JSON.stringify(extraorales || []), JSON.stringify(tomografias || []),
        JSON.stringify(piezas_tomografia || []), JSON.stringify(fotografias || {}),
        JSON.stringify(intraorales || {}), JSON.stringify(periapicales_piezas || []),
        JSON.stringify(modelos_estudio || []), id,
      ]
    );

    await conn.query(
      `INSERT INTO auditoria_historias (historia_id, usuario_id, accion, fecha_accion, hora_accion)
       VALUES (?, ?, ?, ?, ?)`,
      [historiaId, req.usuario.id, `Anuló una Orden de Radiografía y emitió una corregida. Motivo: "${motivo}"`, fecha, hora]
    );

    await conn.commit();
    res.status(201).json({ ok: true, mensaje: 'Orden anulada y versión corregida emitida correctamente.', ordenId: result.insertId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al reemitir la orden.' });
  } finally {
    conn.release();
  }
};

// POST /api/historias/:historiaId/recetas — emitir receta (queda firmada al instante)
const agregarReceta = async (req, res) => {
  try {
    const { historiaId } = req.params;
    const { rp, indicaciones } = req.body;

    if (!rp) {
      return res.status(400).json({ ok: false, mensaje: 'El campo Rp es obligatorio.' });
    }

    const fecha = fechaLima();
    const hora = horaLimaCorta();

    const [result] = await db.query(
      `INSERT INTO recetas (historia_id, doctor_id, fecha, rp, indicaciones, firmado_en, bloqueada)
       VALUES (?, ?, ?, ?, ?, NOW(), 1)`,
      [historiaId, req.usuario.id, fecha, rp, indicaciones || null]
    );

    await db.query(
      `INSERT INTO auditoria_historias (historia_id, usuario_id, accion, fecha_accion, hora_accion)
       VALUES (?, ?, ?, ?, ?)`,
      [historiaId, req.usuario.id, 'Emitió y firmó una nueva receta.', fecha, hora]
    );

    res.status(201).json({ ok: true, mensaje: 'Receta emitida y firmada correctamente.', recetaId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al emitir la receta.' });
  }
};

// POST /api/historias/recetas/:id/reemitir — anular una receta y emitir la version corregida
const reemitirReceta = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const { motivo, rp, indicaciones } = req.body;

    if (!motivo || !rp) {
      await conn.rollback();
      return res.status(400).json({ ok: false, mensaje: 'El motivo y el Rp corregido son obligatorios.' });
    }

    const [rows] = await conn.query('SELECT historia_id, anulada FROM recetas WHERE id = ?', [id]);
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ ok: false, mensaje: 'Receta no encontrada.' });
    }
    if (rows[0].anulada) {
      await conn.rollback();
      return res.status(409).json({ ok: false, mensaje: 'Esta receta ya fue anulada anteriormente.' });
    }

    const historiaId = rows[0].historia_id;
    const fecha = fechaLima();
    const hora = horaLimaCorta();

    await conn.query(
      'UPDATE recetas SET anulada = 1, motivo_anulacion = ?, anulada_por = ?, anulada_en = NOW() WHERE id = ?',
      [motivo, req.usuario.id, id]
    );

    const [result] = await conn.query(
      `INSERT INTO recetas (historia_id, doctor_id, fecha, rp, indicaciones, firmado_en, bloqueada, reemplaza_a)
       VALUES (?, ?, ?, ?, ?, NOW(), 1, ?)`,
      [historiaId, req.usuario.id, fecha, rp, indicaciones || null, id]
    );

    await conn.query(
      `INSERT INTO auditoria_historias (historia_id, usuario_id, accion, fecha_accion, hora_accion)
       VALUES (?, ?, ?, ?, ?)`,
      [historiaId, req.usuario.id, `Anuló una receta y emitió una corregida. Motivo: "${motivo}"`, fecha, hora]
    );

    await conn.commit();
    res.status(201).json({ ok: true, mensaje: 'Receta anulada y versión corregida emitida correctamente.', recetaId: result.insertId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al reemitir la receta.' });
  } finally {
    conn.release();
  }
};
// POST /api/historias/consultas/:consultaId/pagos — registrar abono
// DELETE /api/historias/consultas/:id — eliminar tratamiento (mismo criterio)
const eliminarConsulta = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT historia_id, descripcion, bloqueada FROM consultas WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Tratamiento no encontrado.' });
    }

    if (rows[0].bloqueada) {
      return res.status(409).json({ ok: false, mensaje: 'Esta Evolución ya está firmada y no se puede eliminar.' });
    }
    const [[paymentCount]] = await db.query('SELECT COUNT(*) AS total FROM pagos WHERE consulta_id=?', [id]);
    if (paymentCount.total) return res.status(409).json({ ok: false, mensaje: 'Este tratamiento tiene historial financiero y no puede eliminarse.' });
    await db.query('DELETE FROM consultas WHERE id = ?', [id]);

    const fecha = fechaLima();
    const hora = horaLimaCorta();
    await db.query(
      `INSERT INTO auditoria_historias (historia_id, usuario_id, accion, fecha_accion, hora_accion)
       VALUES (?, ?, ?, ?, ?)`,
      [rows[0].historia_id, req.usuario.id, `Eliminó el tratamiento y su historial de pagos: "${rows[0].descripcion}"`, fecha, hora]
    );

    res.json({ ok: true, mensaje: 'Tratamiento eliminado.' });
  } catch (err) {
    console.error("🔴 ERROR EN ELIMINAR CONSULTA:", err);
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar tratamiento.' });
  }
};

module.exports = {
  getHistorias,
  getHistoriaByPaciente,
  guardarAntecedentes,
  agregarConsulta,
  registrarPago,
  eliminarHistoria,
  subirRadiografia,
  getRadiografias,
  eliminarRadiografia,
  guardarFirmas,
  editarConsulta,
  eliminarConsulta,
  agregarAdendaConsulta,
  agregarItemOdontograma,
  agregarAdendaOdontograma,
  eliminarItemOdontograma,
  reactivarHistoria,
  agregarReceta,
  reemitirReceta,
  getCentrosReferencia,
  agregarOrdenRadiografia,
  reemitirOrdenRadiografia,
};
