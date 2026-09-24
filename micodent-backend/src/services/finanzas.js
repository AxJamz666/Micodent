const crypto = require('node:crypto');
const { fechaLima, horaLima, horaLimaCorta } = require('../utils/fecha');
const { registrarAuditoriaFinanciera } = require('../utils/auditoriaFinanciera');

function fail(message, status = 400) { throw Object.assign(new Error(message), { status }); }
function cents(value, field = 'Monto') {
  if (!/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/.test(String(value))) fail(`${field} debe ser un importe válido con hasta dos decimales.`);
  return Math.round(Number(value) * 100);
}
const amount = value => (value / 100).toFixed(2);
function allocate(monto, pendiente, porcentaje) {
  const paid = cents(monto), pending = cents(pendiente), rate = cents(porcentaje, 'Porcentaje');
  if (!paid || rate > 10000) fail('Monto o porcentaje fuera de rango.');
  const costo = Math.min(paid, pending), base = paid - costo;
  const comision = Math.round(base * rate / 10000);
  return { costo: amount(costo), base: amount(base), comision: amount(comision), margen: amount(base - comision) };
}

async function requestOnce(conn, req, operation) {
  const key = req.get('Idempotency-Key');
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(key || '')) fail('La operación necesita una clave de confirmación. Actualiza la aplicación.');
  const hash = crypto.createHash('sha256').update(JSON.stringify([operation, req.params, req.body])).digest('hex');
  await conn.query('INSERT IGNORE INTO finanzas_peticiones(usuario_id, clave, huella) VALUES (?, ?, ?)', [req.usuario.id, key, hash]);
  const [[row]] = await conn.query('SELECT huella, respuesta FROM finanzas_peticiones WHERE usuario_id=? AND clave=? FOR UPDATE', [req.usuario.id, key]);
  if (row.huella !== hash) fail('Esta confirmación ya se usó con otros datos.', 409);
  let response = row.respuesta;
  if (typeof response === 'string') response = JSON.parse(response);
  return { response, async save(value) { await conn.query('UPDATE finanzas_peticiones SET respuesta=? WHERE usuario_id=? AND clave=?', [JSON.stringify(value), req.usuario.id, key]); } };
}

async function externalTotal(conn, consulta) {
  const [[lab]] = await conn.query('SELECT COALESCE(SUM(monto_total),0) AS total FROM trabajos_laboratorio WHERE consulta_id=?', [consulta.id]);
  const [[extra]] = await conn.query('SELECT otros_costos FROM finanzas_costos WHERE consulta_id=?', [consulta.id]);
  return cents(lab.total) + cents(extra?.otros_costos ?? (consulta.tipo_comision === 'endodoncia' ? amount(2000 * Number(consulta.cantidad_radiografias || 0)) : '0'));
}

// Old payments did not record external cost recovery. Preserve commissions,
// but require an explicit reconciliation instead of inventing historical costs.
async function snapshotLegacy(conn, consulta) {
  const [missing] = await conn.query(`SELECT p.* FROM pagos p LEFT JOIN finanzas_pagos f ON f.pago_id=p.id
    WHERE p.consulta_id=? AND f.pago_id IS NULL ORDER BY p.id`, [consulta.id]);
  if (!missing.length) return;
  const pending = await externalTotal(conn, consulta) > 0;
  if (pending) await conn.query("UPDATE finanzas_costos SET origen='legacy_pendiente' WHERE consulta_id=?", [consulta.id]);
  for (const p of missing) {
    const paid = cents(p.monto), commission = cents(p.comision_generada ?? '0');
    await conn.query(`INSERT INTO finanzas_pagos(pago_id,doctor_id,porcentaje,costo_aplicado,base_comisionable,margen_clinica,regla)
      VALUES(?,?,?,?,?,?,?)`, [p.id, consulta.doctor_id, consulta.comision_porcentaje_aplicado,
      '0.00', amount(paid), amount(paid-commission), pending ? 'legacy_pendiente' : 'legacy_sin_costos']);
  }
}

async function pay(conn, consulta, req, monto, metodo = 'Efectivo') {
  const paid = cents(monto);
  if (!paid) fail('El abono debe ser mayor a cero.');
  if (!['Efectivo', 'Transferencia', 'Yape', 'Plin', 'Tarjeta'].includes(metodo)) fail('Método de pago inválido.');
  await snapshotLegacy(conn, consulta);
  const [[reconciliation]] = await conn.query('SELECT origen FROM finanzas_costos WHERE consulta_id=?', [consulta.id]);
  if (reconciliation?.origen === 'legacy_pendiente') fail('Administración debe conciliar los costos externos anteriores de este tratamiento antes de registrar otro abono.', 409);
  const [[previous]] = await conn.query(`SELECT COALESCE(SUM(p.monto),0) AS paid, COALESCE(SUM(f.costo_aplicado),0) AS used
    FROM pagos_vigentes p LEFT JOIN finanzas_pagos f ON f.pago_id=p.id WHERE p.consulta_id=?`, [consulta.id]);
  if (paid > cents(consulta.costo_total) - cents(previous.paid)) fail('El abono excede la deuda.', 409);
  const [[doctor]] = await conn.query('SELECT comision_porcentaje FROM usuarios WHERE id=? LOCK IN SHARE MODE', [consulta.doctor_id]);
  if (doctor?.comision_porcentaje == null) fail('Configura el porcentaje del doctor responsable antes de registrar el abono.', 409);
  const pending = Math.max(0, await externalTotal(conn, consulta) - cents(previous.used));
  const split = allocate(amount(paid), amount(pending), doctor.comision_porcentaje);
  let pos, recargo = 0;
  if (metodo === 'Tarjeta') {
    if (!Number.isInteger(req.body.pos_revision)) fail('Consulta el recargo POS vigente antes de confirmar el cobro. Actualiza la aplicacion.', 409);
    [[pos]] = await conn.query('SELECT recargo_pos_porcentaje,revision FROM finanzas_configuracion WHERE id=1 LOCK IN SHARE MODE');
    if (!pos) fail('Configuracion POS no disponible.', 503);
    if (req.body.pos_revision !== pos.revision) fail('El recargo POS cambio. Cierra y vuelve a abrir el cobro para confirmar el nuevo total.', 409);
    recargo = Math.round(paid * cents(pos.recargo_pos_porcentaje) / 10000);
  }
  const [result] = await conn.query(`INSERT INTO pagos(consulta_id,monto,metodo_pago,recargo_pos,comision_generada,fecha_pago,hora_pago,registrado_por)
    VALUES(?,?,?,?,?,?,?,?)`, [consulta.id, amount(paid), metodo, amount(recargo), split.comision, fechaLima(), horaLima(), req.usuario.id]);
  if (pos) await conn.query('INSERT INTO finanzas_pago_pos(pago_id,porcentaje,revision) VALUES(?,?,?)', [result.insertId,pos.recargo_pos_porcentaje,pos.revision]);
  await conn.query(`INSERT INTO finanzas_pagos(pago_id,doctor_id,porcentaje,costo_aplicado,base_comisionable,margen_clinica,regla)
    VALUES(?,?,?,?,?,?, 'costo_primero_v1')`, [result.insertId, consulta.doctor_id, doctor.comision_porcentaje, split.costo, split.base, split.margen]);
  await registrarAuditoriaFinanciera(conn, { usuario_id: req.usuario.id, modulo: 'abonos', accion: `Registró un abono de S/ ${amount(paid)}.`, detalle: {
    pago_id: result.insertId, consulta_id: consulta.id, doctor_id: consulta.doctor_id, monto: amount(paid), porcentaje: doctor.comision_porcentaje,
    comision: split.comision, costo_aplicado: split.costo, margen: split.margen, metodo_pago: metodo, recargo_pos: amount(recargo), porcentaje_pos: pos?.recargo_pos_porcentaje ?? null,
  } });
  await conn.query(`INSERT INTO auditoria_historias(historia_id,usuario_id,accion,fecha_accion,hora_accion) VALUES(?,?,?,?,?)`,
    [consulta.historia_id, req.usuario.id, `Registró abono #${result.insertId}: S/ ${amount(paid)}.`, fechaLima(), horaLimaCorta()]);
  return { pagoId: result.insertId, ...split };
}
module.exports = { fail, cents, amount, allocate, requestOnce, externalTotal, snapshotLegacy, pay };
