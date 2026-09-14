const db     = require('../config/db');
const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const login = async (req, res) => {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      return res.status(400).json({
        ok: false,
        mensaje: 'ID y contraseña son requeridos.'
      });
    }

    const [rows] = await db.query(
      'SELECT * FROM usuarios WHERE id = ? AND activo = TRUE',
      [id.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        ok: false,
        mensaje: 'ID de usuario o contraseña incorrectos.'
      });
    }

    const usuario = rows[0];

    let passwordValida = false;
    const esBcrypt = usuario.password_hash.startsWith('$2');
    if (esBcrypt) {
      passwordValida = await bcrypt.compare(password, usuario.password_hash);
    } else {
      passwordValida = password === usuario.password_hash;
    }

    if (!passwordValida) {
      return res.status(401).json({
        ok: false,
        mensaje: 'ID de usuario o contraseña incorrectos.'
      });
    }

    const token = jwt.sign(
    {
        id:          usuario.id,
        nombre:      usuario.nombre,
        fullName:    usuario.nombre_completo,
        rol:         usuario.rol,
        prefix:      usuario.prefix,
        gender:      usuario.gender,
        isAdmin:     usuario.is_admin,
        nivel:       usuario.nivel || 1,        
        especialidad:usuario.especialidad || '',
        cop:         usuario.cop || '',         
    },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
     ok: true,
    token,
    usuario: {
       id:          usuario.id,
       nombre:      usuario.nombre,
           fullName:    usuario.nombre_completo,
           rol:         usuario.rol,
           prefix:      usuario.prefix,
           gender:      usuario.gender,
           isAdmin:     usuario.is_admin,
           nivel:       usuario.nivel || 1,        
           especialidad:usuario.especialidad || '',
           cop:         usuario.cop || '',         
         },
       });

  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
};

const getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, nombre, nombre_completo, rol, prefix, gender,
      is_admin, nivel, especialidad, cop, dni, telefono, email, direccion,
      firma_digital, sello_digital, comision_porcentaje
      FROM usuarios WHERE id = ?`,
      [req.usuario.id]
    );
    if (rows.length === 0) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    res.json({ ok: true, usuario: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
};

module.exports = { login, getMe };