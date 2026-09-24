const db = require('../config/db');
const { cents, amount, fail } = require('../services/finanzas');
const { registrarAuditoriaFinanciera } = require('../utils/auditoriaFinanciera');

const getPos = async (req, res) => {
  try {
    const [[data]] = await db.query('SELECT recargo_pos_porcentaje AS porcentaje, revision FROM finanzas_configuracion WHERE id=1');
    if (!data) fail('Configuracion POS no disponible.', 503);
    res.json({ ok: true, data });
  } catch { res.status(503).json({ ok: false, mensaje: 'No se pudo consultar el recargo POS.' }); }
};

const setPos = async (req, res) => {
  let conn;
  try {
    const rate = cents(req.body.porcentaje, 'Porcentaje POS');
    if (rate > 10000) fail('El porcentaje debe estar entre 0 y 100.');
    if (!Number.isInteger(req.body.revision) || req.body.revision < 1) fail('Revision de configuracion invalida.');
    conn = await db.getConnection();
    await conn.beginTransaction();
    const [[before]] = await conn.query('SELECT recargo_pos_porcentaje,revision FROM finanzas_configuracion WHERE id=1 FOR UPDATE');
    if (!before) fail('Configuracion POS no disponible.', 503);
    if (before.revision !== req.body.revision) fail('El recargo cambio en otra sesion. Vuelve a abrir la configuracion.', 409);
    const revision = before.revision + 1;
    await conn.query('UPDATE finanzas_configuracion SET recargo_pos_porcentaje=?,revision=? WHERE id=1', [amount(rate), revision]);
    await registrarAuditoriaFinanciera(conn, {usuario_id:req.usuario.id,modulo:'configuracion',accion:'Actualizo el recargo POS para nuevos cobros.',detalle:{porcentaje_anterior:before.recargo_pos_porcentaje,porcentaje_nuevo:amount(rate),revision}});
    await conn.commit();
    res.json({ok:true,data:{porcentaje:amount(rate),revision}});
  } catch (error) {
    if (conn) await conn.rollback();
    res.status(error.status || 500).json({ok:false,mensaje:error.status ? error.message : 'No se pudo guardar el recargo POS.'});
  } finally { conn?.release(); }
};
module.exports = {getPos, setPos};
