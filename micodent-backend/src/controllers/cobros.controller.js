const transactional = require('../services/operacionFinanciera');
const f = require('../services/finanzas');
const { registrarAuditoriaFinanciera } = require('../utils/auditoriaFinanciera');

const registrarPago = transactional('abono', async (conn, req) => {
  const [[consulta]] = await conn.query('SELECT * FROM consultas WHERE id=? FOR UPDATE', [req.params.consultaId]);
  if (!consulta) f.fail('Tratamiento no encontrado.', 404);
  return { mensaje: 'Abono registrado.', ...await f.pay(conn, consulta, req, req.body.monto, req.body.metodo_pago) };
});

const agregarConsulta = transactional('tratamiento', async (conn, req) => {
  const b = req.body;
  const costo = f.cents(b.costo_total ?? '0'), abono = f.cents(b.abono_inicial ?? '0');
  if (!String(b.descripcion || '').trim() || !/^\d{4}-\d{2}-\d{2}$/.test(b.fecha_consulta || '')) f.fail('Descripción y fecha válidas son obligatorias.');
  require('./produccion.controller').dateRange({ desde: b.fecha_consulta, hasta: b.fecha_consulta });
  if (abono > costo) f.fail('El abono excede el costo del tratamiento.');
  const [[historia]] = await conn.query('SELECT id FROM historias_clinicas WHERE id=? AND activa=1 FOR UPDATE', [req.params.historiaId]);
  if (!historia) f.fail('Historia clínica no disponible.', 404);
  const tipo = b.tipo_comision || 'estandar';
  if (!['estandar', 'rehabilitacion', 'endodoncia'].includes(tipo)) f.fail('Tipo de tratamiento inválido.');
  const extra = f.cents(b.costo_externo ?? '0', 'Costo externo');
  const lab = tipo === 'rehabilitacion' ? f.cents(b.laboratorio?.monto_total ?? '0', 'Laboratorio') : 0;
  if (lab && !String(b.laboratorio?.nombre_laboratorio || '').trim()) f.fail('Indica el nombre del laboratorio.');
  if (tipo === 'endodoncia' && b.costo_externo == null) f.fail('Indica el costo externo de las radiografías, incluso si es cero.');
  const qty = Number(b.cantidad_radiografias || 0);
  if (!Number.isInteger(qty) || qty < 0 || qty > 100) f.fail('Cantidad de radiografías inválida.');
  const [[doctor]] = await conn.query('SELECT comision_porcentaje FROM usuarios WHERE id=?', [req.usuario.id]);
  const [result] = await conn.query(`INSERT INTO consultas(historia_id,descripcion,costo_total,abono_inicial,fecha_consulta,doctor_id,
    estado_clinico,tipo_comision,cantidad_radiografias,comision_porcentaje_aplicado,firmado_por,firmado_en,bloqueada)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,NOW(),1)`, [historia.id, b.descripcion.trim(), f.amount(costo), f.amount(abono), b.fecha_consulta,
    req.usuario.id, b.estado_clinico || null, tipo, qty, doctor?.comision_porcentaje ?? null, req.usuario.id]);
  const consultaId = result.insertId;
  await conn.query('INSERT INTO finanzas_costos(consulta_id,otros_costos,origen) VALUES(?,?,?)', [consultaId, f.amount(extra), 'costo_primero_v1']);
  if (lab) await conn.query(`INSERT INTO trabajos_laboratorio(consulta_id,nombre_laboratorio,monto_total,registrado_por) VALUES(?,?,?,?)`,
    [consultaId, b.laboratorio.nombre_laboratorio, f.amount(lab), req.usuario.id]);
  const consulta = { id: consultaId, historia_id: historia.id, costo_total: f.amount(costo), doctor_id: req.usuario.id, tipo_comision: tipo };
  if (abono) await f.pay(conn, consulta, req, f.amount(abono), b.metodo_pago);
  const { fechaLima, horaLimaCorta } = require('../utils/fecha');
  await conn.query('INSERT INTO auditoria_historias(historia_id,usuario_id,accion,fecha_accion,hora_accion) VALUES(?,?,?,?,?)',
    [historia.id, req.usuario.id, `Registró y firmó evolución #${consultaId}.`, fechaLima(), horaLimaCorta()]);
  return { mensaje: 'Evolución registrada y firmada.', consultaId };
});

const anularPago = transactional('anulacion', async (conn, req) => {
  const reason = String(req.body.motivo || '').trim();
  if (reason.length < 5 || reason.length > 500) f.fail('Indica un motivo de 5 a 500 caracteres.');
  const [[payment]] = await conn.query('SELECT consulta_id FROM pagos WHERE id=?', [req.params.pagoId]);
  if (!payment) f.fail('Abono no encontrado.', 404);
  const [[consulta]] = await conn.query('SELECT * FROM consultas WHERE id=? FOR UPDATE', [payment.consulta_id]);
  await f.snapshotLegacy(conn, consulta);
  const [[review]] = await conn.query('SELECT origen FROM finanzas_costos WHERE consulta_id=?', [consulta.id]);
  if (review?.origen === 'legacy_pendiente') f.fail('Concilia primero los costos históricos del tratamiento.', 409);
  const [[state]] = await conn.query('SELECT anulado FROM finanzas_pagos WHERE pago_id=?', [req.params.pagoId]);
  if (state.anulado) return { mensaje: 'El abono ya está anulado.' };
  const [[last]] = await conn.query('SELECT id FROM pagos_vigentes WHERE consulta_id=? ORDER BY id DESC LIMIT 1', [consulta.id]);
  if (String(last?.id) !== String(req.params.pagoId)) f.fail('Anula primero los abonos posteriores de este tratamiento para conservar la asignación de costos.', 409);
  await conn.query('UPDATE finanzas_pagos SET anulado=1,anulado_por=?,anulado_en=NOW(),motivo_anulacion=? WHERE pago_id=?', [req.usuario.id, reason, req.params.pagoId]);
  await registrarAuditoriaFinanciera(conn, { usuario_id: req.usuario.id, modulo: 'abonos', accion: `Anuló el abono #${req.params.pagoId}.`, detalle: { pago_id: req.params.pagoId, motivo: reason } });
  const { fechaLima, horaLimaCorta } = require('../utils/fecha');
  await conn.query('INSERT INTO auditoria_historias(historia_id,usuario_id,accion,fecha_accion,hora_accion) VALUES(?,?,?,?,?)',
    [consulta.historia_id, req.usuario.id, `Anuló abono #${req.params.pagoId}. Motivo: ${reason}`, fechaLima(), horaLimaCorta()]);
  return { mensaje: 'Abono anulado sin borrar el registro original.' };
});
const conciliarCostos = transactional('conciliacion', async (conn, req) => {
  const [[consulta]] = await conn.query('SELECT * FROM consultas WHERE id=? FOR UPDATE', [req.params.consultaId]);
  if (!consulta) f.fail('Tratamiento no encontrado.',404);
  const [[state]] = await conn.query('SELECT origen FROM finanzas_costos WHERE consulta_id=?', [consulta.id]);
  if (state?.origen !== 'legacy_pendiente') f.fail('Este tratamiento no tiene una conciliación pendiente.',409);
  const covered = f.cents(req.body.costo_cubierto);
  const motivo = String(req.body.motivo || '').trim();
  if (motivo.length < 5 || motivo.length > 500) f.fail('Indica el respaldo de la conciliación (5 a 500 caracteres).');
  const [rows] = await conn.query(`SELECT p.id,p.monto,p.comision_generada FROM pagos_vigentes p
    JOIN finanzas_pagos fp ON fp.pago_id=p.id WHERE p.consulta_id=? AND fp.regla='legacy_pendiente' ORDER BY p.id`,[consulta.id]);
  const available=rows.reduce((sum,p)=>sum+Math.max(0,f.cents(p.monto)-f.cents(p.comision_generada ?? '0')),0);
  if (covered > await f.externalTotal(conn,consulta) || covered > available) f.fail('El costo recuperado excede el costo externo o el cobro disponible después de las comisiones originales.');
  let remaining=covered;
  for (const p of rows) {
    const paid=f.cents(p.monto), commission=f.cents(p.comision_generada ?? '0');
    const applied=Math.min(remaining,Math.max(0,paid-commission)); remaining-=applied;
    await conn.query(`UPDATE finanzas_pagos SET costo_aplicado=?,base_comisionable=?,margen_clinica=?,regla='legacy_conciliado' WHERE pago_id=?`,
      [f.amount(applied),f.amount(paid-applied),f.amount(paid-applied-commission),p.id]);
  }
  await conn.query("UPDATE finanzas_costos SET origen='legacy_conciliado' WHERE consulta_id=?",[consulta.id]);
  await registrarAuditoriaFinanciera(conn,{usuario_id:req.usuario.id,modulo:'conciliacion',accion:`Concilió costos históricos del tratamiento #${consulta.id}.`,detalle:{consulta_id:consulta.id,costo_cubierto:f.amount(covered),motivo,criterio:'Asignación cronológica conservando comisiones originales'}});
  return {mensaje:'Costos conciliados; abonos y comisiones originales conservados.'};
});
module.exports = { registrarPago, agregarConsulta, anularPago, conciliarCostos };
