const assert = require('node:assert/strict');
const crypto = require('node:crypto');

module.exports = async ({api,conn,tokens,create,check,migrate}) => {
  const config = async()=> (await api('GET','/dashboard/configuracion-pos',null,tokens.qaadmin)).body.data;
  await check('POS configurable: permisos, concurrencia, historicos y abono inicial',async()=>{
    let current = await config();
    assert.equal(Number(current.porcentaje),4);
    assert.equal((await create(tokens.qadoctor,{abono_inicial:'1',metodo_pago:'Tarjeta'})).status,409);
    assert.equal((await api('PUT','/dashboard/configuracion-pos',{porcentaje:'6',revision:current.revision},tokens.qadoctor)).status,403);
    for (const porcentaje of ['-1','100.01','1.001','NaN']) assert.equal((await api('PUT','/dashboard/configuracion-pos',{porcentaje,revision:current.revision},tokens.qaadmin)).status,400);
    const old = await create(tokens.qadoctor,{descripcion:'POS anterior QA',abono_inicial:'100',metodo_pago:'Tarjeta',pos_revision:current.revision});
    assert.equal(old.status,201);
    const first = await api('PUT','/dashboard/configuracion-pos',{porcentaje:'5.5',revision:current.revision},tokens.qaadmin);
    assert.equal(first.status,200);
    const [[countBefore]] = await conn.query('SELECT COUNT(*) AS n FROM consultas');
    const stale = await create(tokens.qadoctor,{abono_inicial:'100',metodo_pago:'Tarjeta',pos_revision:current.revision});
    assert.equal(stale.status,409);
    const [[countAfter]] = await conn.query('SELECT COUNT(*) AS n FROM consultas');assert.equal(countAfter.n,countBefore.n,'Stale rate must roll back the entire new treatment.');
    current = await config();
    const newer = await create(tokens.qadoctor,{descripcion:'POS vigente QA',abono_inicial:'100',metodo_pago:'Tarjeta',pos_revision:current.revision});
    assert.equal(newer.status,201);
    const key = crypto.randomUUID();
    const body = {monto:'10',metodo_pago:'Tarjeta',pos_revision:current.revision};
    const payment = await api('POST',`/historias/consultas/${newer.body.consultaId}/pagos`,body,tokens.qaadmin,key);
    assert.equal(payment.status,201);
    const updates = await Promise.all(['3','6'].map(porcentaje=>api('PUT','/dashboard/configuracion-pos',{porcentaje,revision:current.revision},tokens.qaadmin)));
    assert.deepEqual(updates.map(r=>r.status).sort(),[200,409]);
    assert.equal((await api('POST',`/historias/consultas/${newer.body.consultaId}/pagos`,body,tokens.qaadmin,key)).status,200,'Retry preserves the old confirmed charge even after a rate change.');
    const [rows] = await conn.query('SELECT p.monto,p.recargo_pos,p.comision_generada,s.porcentaje FROM pagos p JOIN finanzas_pago_pos s ON s.pago_id=p.id WHERE p.consulta_id IN (?,?) ORDER BY p.id',[old.body.consultaId,newer.body.consultaId]);
    assert.deepEqual(rows.map(r=>[Number(r.monto),Number(r.recargo_pos),Number(r.porcentaje)]),[[100,4,4],[100,5.5,5.5],[10,.55,5.5]]);
    assert.deepEqual(rows.map(r=>Number(r.comision_generada)),[30,30,3]);
    const beforeMigration = await config();await migrate(conn);assert.deepEqual(await config(),beforeMigration);
    current=await config();assert.equal((await api('PUT','/dashboard/configuracion-pos',{porcentaje:'0',revision:current.revision},tokens.qaadmin)).status,200);
    current=await config();
    const zero = await create(tokens.qadoctor,{abono_inicial:'10',metodo_pago:'Tarjeta',pos_revision:current.revision});
    const [[zeroPay]] = await conn.query('SELECT recargo_pos FROM pagos WHERE consulta_id=?',[zero.body.consultaId]);assert.equal(Number(zeroPay.recargo_pos),0);
    const cash = await create(tokens.qadoctor,{abono_inicial:'10',metodo_pago:'Efectivo'});
    const [[cashPay]] = await conn.query('SELECT recargo_pos FROM pagos WHERE consulta_id=?',[cash.body.consultaId]);assert.equal(Number(cashPay.recargo_pos),0);
    const [[audit]] = await conn.query("SELECT COUNT(*) AS n FROM auditoria_financiera WHERE modulo='configuracion'");assert(Number(audit.n)>=3);
    current=await config();await api('PUT','/dashboard/configuracion-pos',{porcentaje:'4',revision:current.revision},tokens.qaadmin);
  });
  await check('Inicio: todos los pacientes y tratamientos pendientes, liquidacion y anulacion',async()=>{
    for(let i=2;i<=12;i++) {
      const [p] = await conn.query("INSERT INTO pacientes(dni,nombres,apellidos,sexo,fecha_nacimiento,fecha_registro,hora_registro) VALUES(?,?,'QA deuda','M','1990-01-01','2026-09-22','09:00:00')",[String(i).padStart(8,'0'),`Paciente ${i}`]);
      const [h] = await conn.query("INSERT INTO historias_clinicas(paciente_id,nro_historia,fecha_creacion,hora_creacion,creado_por) VALUES(?,?,'2026-09-22','09:00:00','qaadmin')",[p.insertId,`QA-${i}`]);
      await api('POST',`/historias/${h.insertId}/consultas`,{descripcion:'Pendiente QA',costo_total:'10',fecha_consulta:'2026-09-22'},tokens.qadoctor);
    }
    const debt = async()=> (await api('GET','/dashboard/deudores',null,tokens.qaadmin)).body.data;
    const before=await debt();assert.equal(before.length,12);
    const finance=(await api('GET','/dashboard/financiero?desde=2026-01-01&hasta=2026-12-31',null,tokens.qaadmin)).body.data;
    assert.equal(Number(finance.porDoctor.find(d=>d.doctor_id==='qadoctor').pacientes_atendidos),1,'Unpaid treatments must not inflate patients with receipts.');
    const patient=before.find(p=>p.id===1);assert(patient.tratamientos.length>2);
    assert.equal(Math.round(patient.deuda_total*100),patient.tratamientos.reduce((sum,t)=>sum+Math.round(t.pendiente*100),0));
    const treatment=patient.tratamientos[0];
    const paid=await api('POST',`/historias/consultas/${treatment.id}/pagos`,{monto:String(treatment.pendiente)},tokens.qaadmin);assert.equal(paid.status,201);
    assert(!(await debt()).find(p=>p.id===1).tratamientos.some(t=>t.id===treatment.id));
    assert.equal((await api('POST',`/historias/pagos/${paid.body.pagoId}/anular`,{motivo:'Ensayo de restitucion de deuda'},tokens.qaadmin)).status,201);
    assert((await debt()).find(p=>p.id===1).tratamientos.some(t=>t.id===treatment.id&&t.pendiente===treatment.pendiente));
  });
};
