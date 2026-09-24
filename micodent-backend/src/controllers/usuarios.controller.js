const db     = require('../config/db');
const bcrypt = require('bcryptjs');
const validRate = value => value == null || value === '' || (/^\d{1,3}(\.\d{1,2})?$/.test(String(value)) && Number(value) <= 100);

// GET /api/usuarios
const getUsuarios = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, nombre, nombre_completo, prefix, gender, rol, is_admin,
      nivel, dni, telefono, email, especialidad, cop, direccion, activo, comision_porcentaje
      FROM usuarios ORDER BY nivel DESC, nombre_completo ASC`
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener usuarios.' });
  }
};

// POST /api/usuarios
const crearUsuario = async (req, res) => {
  try {
    const { id, password, nombre, nombre_completo, prefix, gender,
            rol, dni, telefono, email, especialidad, cop, direccion, nivel, comision_porcentaje } = req.body;
    if (!validRate(comision_porcentaje)) return res.status(400).json({ ok: false, mensaje: 'Porcentaje de comisión inválido.' });

    if (!id || !password || !nombre || !rol) {
      return res.status(400).json({ ok: false, mensaje: 'Faltan campos requeridos.' });
    }

    const [existe] = await db.query('SELECT id FROM usuarios WHERE id = ?', [id]);
    if (existe.length > 0) {
      return res.status(400).json({ ok: false, mensaje: 'Este ID de acceso ya existe.' });
    }

    // Nivel máximo que puede asignar quien crea:
    // Superadmin (3) puede crear hasta Admin (2), Admin (2) solo Staff (1)
    const adminNivel   = req.usuario.nivel || 1;
    const nivelSolicit = parseInt(nivel) || 1;
    const nivelFinal   = adminNivel >= 3 ? Math.min(nivelSolicit, 2) : 1;

    const salt           = await bcrypt.genSalt(10);
    const passwordHasheada = await bcrypt.hash(password, salt);

    await db.query(
      `INSERT INTO usuarios (id, password_hash, nombre, nombre_completo, prefix, gender,
        rol, is_admin, nivel, dni, telefono, email, especialidad, cop, direccion, comision_porcentaje)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id.toLowerCase().trim(), passwordHasheada, nombre, nombre_completo,
       prefix, gender, rol,
       nivelFinal >= 2,  // is_admin = true si nivel >= 2
       nivelFinal,
       dni, telefono, email, especialidad, cop, direccion, comision_porcentaje === '' ? null : comision_porcentaje ?? null]
    );

    res.status(201).json({ ok: true, mensaje: 'Personal registrado exitosamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al crear usuario.' });
  }
};

// PUT /api/usuarios/:id
const editarUsuario = async (req, res) => {
  try {
    const { id }       = req.params;
    const adminNivel   = req.usuario.nivel || 1;

    // Verificar que el target existe y obtener su nivel
    const [targetRows] = await db.query('SELECT nivel FROM usuarios WHERE id = ?', [id]);
    if (targetRows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    }

    // Solo puede editar usuarios de nivel inferior
    if (adminNivel <= targetRows[0].nivel && id !== req.usuario.id) {
      return res.status(403).json({
        ok: false,
        mensaje: 'No puedes editar a un usuario de igual o mayor nivel.'
      });
    }

      const { nombre, nombre_completo, prefix, gender, rol,
            dni, telefono, email, especialidad, cop, direccion, password,
            comision_porcentaje, nivel } = req.body;
    if (!validRate(comision_porcentaje)) return res.status(400).json({ ok: false, mensaje: 'Porcentaje de comisión inválido.' });

    // Calcular el nivel final (solo el Superadmin nivel >= 3 puede cambiarlo, de lo contrario se mantiene igual)
    const nivelSolicit = parseInt(nivel) || 1;
    const nivelFinal   = adminNivel >= 3 && id !== req.usuario.id ? Math.min(Math.max(nivelSolicit, 1), 2) : targetRows[0].nivel;

    let hashParaActualizar = '';
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      hashParaActualizar = await bcrypt.hash(password, salt);
    }

    await db.query(
      `UPDATE usuarios SET
        nombre = ?, nombre_completo = ?, prefix = ?, gender = ?, rol = ?,
        dni = ?, telefono = ?, email = ?, especialidad = ?, cop = ?,
        direccion = ?, comision_porcentaje = ?, nivel = ?, is_admin = ?,
        password_hash = COALESCE(NULLIF(?, ''), password_hash)
       WHERE id = ?`,
      [nombre, nombre_completo, prefix, gender, rol,
       dni, telefono, email, especialidad, cop, direccion, comision_porcentaje === '' ? null : comision_porcentaje ?? null,
       nivelFinal, nivelFinal >= 2,
       hashParaActualizar, id]
    );

    res.json({ ok: true, mensaje: 'Personal actualizado correctamente.' });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al editar usuario.' });
  }
};

// DELETE /api/usuarios/:id
const eliminarUsuario = async (req, res) => {
  try {
    const { id }     = req.params;
    const adminNivel = req.usuario.nivel || 1;
    const adminId    = req.usuario.id;

    // No puede eliminarse a sí mismo
    if (id === adminId) {
      return res.status(403).json({ ok: false, mensaje: 'No puedes eliminar tu propio acceso.' });
    }

    // Obtener nivel del target
    const [targetRows] = await db.query('SELECT nivel, nombre_completo FROM usuarios WHERE id = ?', [id]);
    if (targetRows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    }

    const targetNivel = targetRows[0].nivel;

    // Solo puede eliminar usuarios de MENOR nivel
    if (adminNivel <= targetNivel) {
      return res.status(403).json({
        ok: false,
        mensaje: targetNivel >= 3
          ? 'No se puede eliminar a un Superadministrador del sistema.'
          : 'No puedes eliminar a un usuario de igual o mayor nivel que el tuyo.'
      });
    }

    await db.query('UPDATE usuarios SET activo=0 WHERE id = ?', [id]);
    res.json({ ok: true, mensaje: 'Usuario eliminado correctamente.' });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar usuario.' });
  }
};

// PUT /api/usuarios/cambiar-password
const cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;
    const userId = req.usuario.id;

    const [rows] = await db.query('SELECT password_hash FROM usuarios WHERE id = ?', [userId]);
    if (rows.length === 0) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });

    const esBcrypt = rows[0].password_hash.startsWith('$2');
    const esValida = esBcrypt
      ? await bcrypt.compare(passwordActual, rows[0].password_hash)
      : passwordActual === rows[0].password_hash;

    if (!esValida) return res.status(400).json({ ok: false, mensaje: 'La contraseña actual es incorrecta.' });

    const nuevoHash = await bcrypt.hash(passwordNuevo, 10);
    await db.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [nuevoHash, userId]);
    res.json({ ok: true, mensaje: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al cambiar contraseña.' });
  }
};

// POST /api/usuarios/reset-password
const resetPassword = async (req, res) => {
  try {
    const { targetUserId, nuevaPassword, adminPassword } = req.body;
    const adminId    = req.usuario.id;
    const adminNivel = req.usuario.nivel || 1;

    if (!nuevaPassword || nuevaPassword.length < 6) {
      return res.status(400).json({ ok: false, mensaje: 'Mínimo 6 caracteres.' });
    }

    // Verificar contraseña del admin
    const [adminRows] = await db.query('SELECT password_hash FROM usuarios WHERE id = ?', [adminId]);
    if (adminRows.length === 0) return res.status(404).json({ ok: false, mensaje: 'Administrador no encontrado.' });

    const esBcrypt = adminRows[0].password_hash.startsWith('$2');
    const esValida = esBcrypt
      ? await bcrypt.compare(adminPassword, adminRows[0].password_hash)
      : adminPassword === adminRows[0].password_hash;

    if (!esValida) return res.status(400).json({ ok: false, mensaje: 'Tu contraseña de administrador es incorrecta.' });

    // Verificar jerarquía
    const [targetRows] = await db.query('SELECT nivel FROM usuarios WHERE id = ?', [targetUserId]);
    if (targetRows.length === 0) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });

    if (adminNivel <= targetRows[0].nivel) {
      return res.status(403).json({ ok: false, mensaje: 'No puedes resetear la contraseña de este usuario.' });
    }

    const nuevoHash = await bcrypt.hash(nuevaPassword, 10);
    await db.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [nuevoHash, targetUserId]);
    res.json({ ok: true, mensaje: `Contraseña de "${targetUserId}" reseteada correctamente.` });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al resetear contraseña.' });
  }
};

// PUT /api/usuarios/mi-firma-sello (autoservicio, cualquier usuario logueado edita SOLO su propia fila)
const actualizarFirmaSello = async (req, res) => {
  try {
    const { firma_digital, sello_digital } = req.body;
    const userId = req.usuario.id;

    await db.query(
      'UPDATE usuarios SET firma_digital = IF(?, ?, firma_digital), sello_digital = IF(?, ?, sello_digital) WHERE id = ?',
      [Object.hasOwn(req.body, 'firma_digital'), firma_digital || null, Object.hasOwn(req.body, 'sello_digital'), sello_digital || null, userId]
    );

    res.json({ ok: true, mensaje: 'Firma y sello actualizados correctamente.' });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar firma y sello.' });
  }
};

// GET /api/usuarios/doctores — lista simplificada de doctores activos, abierta a cualquier rol (para agendar citas)
const getDoctores = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, nombre_completo, prefix, especialidad FROM usuarios WHERE rol = 'Doctor' AND activo = 1 ORDER BY nombre_completo ASC`
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener doctores.' });
  }
};

module.exports = {
  getUsuarios, crearUsuario, editarUsuario, eliminarUsuario,
  cambiarPassword, resetPassword, actualizarFirmaSello, getDoctores
};
