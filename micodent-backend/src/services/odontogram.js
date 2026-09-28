const db = require('../config/db');
const { fechaLima, horaLimaCorta } = require('../utils/fecha');

class OdontogramError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function clinicalText(value, name, max) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new OdontogramError(400, `${name} es obligatorio y admite hasta ${max} caracteres.`);
  }
  return value.trim();
}

async function revise({ id, usuarioId, motivo, contenido, annul = false }) {
  if (typeof id !== 'string' || !/^[1-9][0-9]{0,18}$/.test(id)) {
    throw new OdontogramError(400, 'Identificador de registro inválido.');
  }
  motivo = clinicalText(motivo, 'El motivo', 4000);
  if (!annul) contenido = clinicalText(contenido, 'La corrección', 10000);
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    // Both operations lock the same original, then read current child rows.
    const [[item]] = await conn.query('SELECT * FROM odontograma_items WHERE id=? FOR UPDATE', [id]);
    if (!item) throw new OdontogramError(404, 'Registro no encontrado.');
    if (annul && item.registrado_por !== usuarioId) {
      throw new OdontogramError(403, 'Solo el doctor que lo registró puede anularlo.');
    }
    const [cancelled] = await conn.query(
      'SELECT odontograma_item_id FROM odontograma_anulaciones WHERE odontograma_item_id=? FOR UPDATE', [id]);
    if (cancelled.length) throw new OdontogramError(409, 'Este registro ya está anulado.');
    if (annul) {
      const [adendas] = await conn.query(
        'SELECT id FROM odontograma_adendas WHERE odontograma_item_id=? FOR UPDATE', [id]);
      if (adendas.length) throw new OdontogramError(409, 'Este registro tiene correcciones y no se puede anular.');
      await conn.execute(
        'INSERT INTO odontograma_anulaciones (odontograma_item_id,motivo,anulada_por) VALUES (?,?,?)',
        [id, motivo, usuarioId]);
    } else {
      if (!item.bloqueada) throw new OdontogramError(400, 'Este registro todavía no está firmado.');
      await conn.execute(
        'INSERT INTO odontograma_adendas (odontograma_item_id,usuario_id,motivo,contenido) VALUES (?,?,?,?)',
        [id, usuarioId, motivo, contenido]);
    }
    const accion = annul
      ? `Anuló el registro ${id} del odontograma. Pieza ${item.pieza}. Motivo: "${motivo}"`
      : `Agregó una corrección al registro ${id} del odontograma. Motivo: "${motivo}"`;
    await conn.execute(
      'INSERT INTO auditoria_historias (historia_id,usuario_id,accion,fecha_accion,hora_accion) VALUES (?,?,?,?,?)',
      [item.historia_id, usuarioId, accion, fechaLima(), horaLimaCorta()]);
    await conn.commit();
  } catch (error) {
    await conn.rollback().catch(() => {});
    throw error;
  } finally { conn.release(); }
}

module.exports = { revise, OdontogramError };
