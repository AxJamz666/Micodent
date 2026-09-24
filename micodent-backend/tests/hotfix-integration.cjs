const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const crypto = require('node:crypto');
const { spawn, execFileSync } = require('node:child_process');
const mysql = require('mysql2/promise');
const { once } = require('node:events');

// The harness initializes its own MariaDB data directory. Never reads application .env.
async function run() {
  const disk = fs.statfsSync(path.resolve(__dirname, '../..'));
  const requiredFree = process.env.HOTFIX_ENGINE === 'mysql8' ? 2 * 1024 ** 3 : 1024 ** 3;
  assert(disk.bavail * disk.bsize >= requiredFree, 'Espacio insuficiente para otra instancia de prueba. No se crearon archivos ni procesos.');
  const root = path.resolve(__dirname, '../../.runtime', `qa-${Date.now()}`);
  fs.mkdirSync(root, { recursive: true });
  const dataDir = path.join(root, 'database');
  const mysql8 = process.env.HOTFIX_ENGINE === 'mysql8';
  const bin = mysql8 ? process.env.HOTFIX_MYSQL_BIN : process.env.HOTFIX_MARIADB_BIN;
  const schemaFile = process.env.HOTFIX_SCHEMA_SOURCE;
  assert(bin && schemaFile, 'Define paths to the local MariaDB binaries and schema-only source.');
  const probe = net.createServer(); probe.listen(0, '127.0.0.1'); await once(probe, 'listening');
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
  assert(![3306,3307,3308].includes(port));
  const password = crypto.randomBytes(24).toString('hex');
  if (mysql8) execFileSync(path.join(bin, 'mysqld.exe'), ['--no-defaults', '--initialize-insecure', `--basedir=${path.dirname(bin)}`, `--datadir=${dataDir}`], { windowsHide: true, stdio: 'pipe' });
  else execFileSync(path.join(bin, 'mysql_install_db.exe'), [`--datadir=${dataDir}`, `--password=${password}`, `--port=${port}`, '--silent'], { windowsHide: true, stdio: 'pipe' });
  const child = spawn(path.join(bin, 'mysqld.exe'), ['--no-defaults', `--basedir=${path.dirname(bin)}`, `--datadir=${dataDir}`, `--port=${port}`, '--bind-address=127.0.0.1', '--innodb-buffer-pool-size=32M', '--max-connections=20', '--skip-log-bin'], { windowsHide: true, stdio: 'ignore' });
  let conn, appServer, pool, browser;
  const results = [];
  async function check(name, action) { await action(); results.push({ prueba: name, resultado: 'PASS' }); console.log(`PASS ${name}`); }
  try {
    for (let i=0;i<120;i++) {
      try { conn=await mysql.createConnection({ host:'127.0.0.1',port,user:'root',password:mysql8 ? '' : password,dateStrings:true }); break; }
      catch { if (child.exitCode != null) throw new Error('Isolated MariaDB exited.'); await new Promise(r=>setTimeout(r,500)); }
    }
    assert(conn, 'Isolated server did not start.');
    const [[instance]]=await conn.query('SELECT @@datadir AS dir, VERSION() AS version');
    assert.equal(path.resolve(instance.dir),dataDir);
    if (mysql8) await conn.query("ALTER USER 'root'@'localhost' IDENTIFIED BY ?", [password]);
    await conn.query('CREATE DATABASE micodent_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await conn.query('USE micodent_dev');
    const source=fs.readFileSync(schemaFile,'utf8');
    const tables=source.match(/CREATE TABLE[\s\S]*?;/g);
    assert(tables?.length >= 24);
    await conn.query('SET FOREIGN_KEY_CHECKS=0');
    for (let ddl of tables) {
      ddl=ddl.replace(/AUTO_INCREMENT=\d+/g,'AUTO_INCREMENT=1');
      if (!mysql8) ddl=ddl.replace(/regexp_like\((`\w+`),(_utf8mb4'[^']*')\)/g, '($1 REGEXP $2)');
      await conn.query(ddl);
    }
    await conn.query('SET FOREIGN_KEY_CHECKS=1');
    // Only the reference-center catalog, never clinical/user INSERT statements.
    const centers=source.split(/\r?\n/).find(line=>line.startsWith('INSERT INTO `centros_referencia` VALUES '));
    assert(centers,'Reference-center catalog missing from the supplied source.');
    await conn.query(centers);
    const [[catalog]]=await conn.query("SELECT COUNT(*) AS count FROM centros_referencia WHERE activo=1 AND mapa_imagen_url LIKE 'data:image/%'");
    assert.equal(Number(catalog.count),2,'Two original embedded reference maps are required.');
    const bcrypt=require('bcryptjs'), pass=process.env.HOTFIX_PREVIEW === '1' ? 'SoloDemo2026!' : crypto.randomBytes(16).toString('hex'), hash=await bcrypt.hash(pass,10);
    for (const [id,admin,rate] of [['qaadmin',1,25],['qadoctor',0,25],['qaotro',0,30]]) await conn.query(`INSERT INTO usuarios(id,password_hash,nombre,nombre_completo,rol,nivel,is_admin,comision_porcentaje)
      VALUES(?,?,?,?,'Doctor',?,?,?)`,[id,hash,id,`Doctor ${id}`,admin ? 3:1,admin,rate]);
    await conn.query(`INSERT INTO pacientes(dni,nombres,apellidos,sexo,fecha_nacimiento,fecha_registro,hora_registro) VALUES('00000001','Paciente','Sintetico','M','1990-01-01','2026-09-22','09:00:00')`);
    await conn.query(`INSERT INTO historias_clinicas(paciente_id,nro_historia,fecha_creacion,hora_creacion,creado_por) VALUES(1,'QA-0001','2026-09-22','09:00:00','qaadmin')`);
    await conn.query(`INSERT INTO consultas(historia_id,descripcion,costo_total,fecha_consulta,doctor_id,tipo_comision,comision_porcentaje_aplicado) VALUES(1,'Legacy sintetico',400,'2026-01-01','qadoctor','estandar',25)`);
    await conn.query(`INSERT INTO pagos(consulta_id,monto,comision_generada,fecha_pago,hora_pago,registrado_por) VALUES(1,80,20,'2026-01-01','09:00:00','qaadmin')`);
    const { migrate }=require('../scripts/migrate-hotfix');
    await check('Migracion incremental repetible y comision historica conservada',async()=>{
      await migrate(conn); await migrate(conn);
      const [[p]]=await conn.query('SELECT p.monto,p.comision_generada,f.porcentaje FROM pagos p JOIN finanzas_pagos f ON f.pago_id=p.id WHERE p.id=1');
      assert.equal(Number(p.monto),80); assert.equal(Number(p.comision_generada),20); assert.equal(Number(p.porcentaje),25);
    });
    Object.assign(process.env,{ DB_HOST:'127.0.0.1',DB_PORT:String(port),DB_USER:'root',DB_PASSWORD:password,DB_NAME:'micodent_dev',JWT_SECRET:crypto.randomBytes(40).toString('hex'),JWT_EXPIRES_IN:'1h' });
    const app=require('../src/index'); pool=require('../src/config/db');
    appServer=app.listen(0,'127.0.0.1'); await once(appServer,'listening');
    const base=`http://127.0.0.1:${appServer.address().port}`;
    async function api(method,url,body,token,key=crypto.randomUUID()) {
      const response=await fetch(`${base}/api${url}`,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{ }),'Idempotency-Key':key},...(body?{body:JSON.stringify(body)}:{})});
      return { status:response.status,body:await response.json() };
    }
    const tokens={}; for(const id of ['qaadmin','qadoctor','qaotro']) {const r=await api('POST','/auth/login',{id,password:pass});assert.equal(r.status,200);tokens[id]=r.body.token;}
    const create=(token,extra={})=>api('POST','/historias/1/consultas',{descripcion:'Tratamiento sintetico',costo_total:'380.00',abono_inicial:'0',fecha_consulta:'2026-09-22',tipo_comision:'estandar',...extra},token);
    let a,b;
    await check('A: cobro 120, comision 30, margen 90',async()=>{
      const r=await create(tokens.qadoctor,{abono_inicial:'120'});assert.equal(r.status,201,JSON.stringify(r.body));a=r.body.consultaId;
      const [[p]]=await conn.query('SELECT p.*,f.* FROM pagos p JOIN finanzas_pagos f ON f.pago_id=p.id WHERE consulta_id=?',[a]);
      assert.equal(Number(p.comision_generada),30);assert.equal(Number(p.margen_clinica),90);
    });
    await check('B: costo 100 recuperado una sola vez con 60 y 80',async()=>{
      const r=await create(tokens.qadoctor,{tipo_comision:'rehabilitacion',laboratorio:{nombre_laboratorio:'Laboratorio QA',monto_total:'100'},abono_inicial:'60'});assert.equal(r.status,201,JSON.stringify(r.body));b=r.body.consultaId;
      const r2=await api('POST',`/historias/consultas/${b}/pagos`,{monto:'80'},tokens.qaadmin);assert.equal(r2.status,201,JSON.stringify(r2.body));
      const [rows]=await conn.query('SELECT p.*,f.* FROM pagos p JOIN finanzas_pagos f ON f.pago_id=p.id WHERE consulta_id=? ORDER BY p.id',[b]);
      assert.deepEqual(rows.map(p=>[Number(p.costo_aplicado),Number(p.comision_generada),Number(p.margen_clinica)]),[[60,0,0],[40,10,30]]);
    });
    await check('C: cambio a 30% sin recalcular el abono previo al 25%',async()=>{
      await conn.query("UPDATE usuarios SET comision_porcentaje=30 WHERE id='qadoctor'");
      const r=await api('POST',`/historias/consultas/${a}/pagos`,{monto:'100'},tokens.qaadmin);assert.equal(r.status,201);
      const [rows]=await conn.query('SELECT p.*,f.porcentaje FROM pagos p JOIN finanzas_pagos f ON f.pago_id=p.id WHERE consulta_id=? ORDER BY p.id',[a]);
      assert.deepEqual(rows.map(p=>[Number(p.porcentaje),Number(p.comision_generada)]),[[25,30],[30,30]]);
    });
    await check('D: doctor responsable distinto del usuario que cobra',async()=>{
      const r=await create(tokens.qaotro);const id=r.body.consultaId;
      await api('POST',`/historias/consultas/${id}/pagos`,{monto:'10'},tokens.qaadmin);
      const [[p]]=await conn.query('SELECT p.registrado_por,f.doctor_id FROM pagos p JOIN finanzas_pagos f ON f.pago_id=p.id WHERE consulta_id=?',[id]);
      assert.equal(p.registrado_por,'qaadmin');assert.equal(p.doctor_id,'qaotro');
    });
    await check('Idempotencia simultanea y exceso de deuda concurrente',async()=>{
      const r=await create(tokens.qadoctor,{costo_total:'100'}),id=r.body.consultaId,key=crypto.randomUUID();
      const responses=await Promise.all([1,2].map(()=>api('POST',`/historias/consultas/${id}/pagos`,{monto:'60'},tokens.qaadmin,key)));
      assert(responses.every(r=>r.status===200||r.status===201));
      const [[count]]=await conn.query('SELECT COUNT(*) AS total FROM pagos WHERE consulta_id=?',[id]);assert.equal(count.total,1);
      const later=await Promise.all([1,2].map(()=>api('POST',`/historias/consultas/${id}/pagos`,{monto:'30'},tokens.qaadmin)));
      assert.deepEqual(later.map(r=>r.status).sort(),[201,409]);
      const changed=await api('POST',`/historias/consultas/${id}/pagos`,{monto:'1'},tokens.qaadmin,key);assert.equal(changed.status,409);
    });
    await check('Anulacion trazable, orden protegido y recuperacion de costos',async()=>{
      const [rows]=await conn.query('SELECT id FROM pagos WHERE consulta_id=? ORDER BY id',[b]);
      assert.equal((await api('POST',`/historias/pagos/${rows[0].id}/anular`,{motivo:'Correccion sintetica'},tokens.qaadmin)).status,409);
      assert.equal((await api('POST',`/historias/pagos/${rows[1].id}/anular`,{motivo:'Correccion sintetica'},tokens.qadoctor)).status,403);
      assert.equal((await api('POST',`/historias/pagos/${rows[1].id}/anular`,{motivo:'Correccion sintetica'},tokens.qaadmin)).status,201);
      const again=await api('POST',`/historias/consultas/${b}/pagos`,{monto:'80'},tokens.qaadmin);assert.equal(again.status,201);assert.equal(Number(again.body.costo),40);
      const [[p]]=await conn.query('SELECT monto FROM pagos WHERE id=?',[rows[1].id]);assert.equal(Number(p.monto),80);
    });
    await check('Permisos doctor, cambios de rol y reportes historicos',async()=>{
      const r=await api('GET','/dashboard/produccion?desde=2026-01-01&hasta=2026-12-31',null,tokens.qadoctor);assert.equal(r.status,200);
      assert(r.body.data.rows.every(row=>row.doctor_id==='qadoctor'&&!('margen' in row)));
      assert.equal((await api('GET','/dashboard/produccion?doctor=qaotro',null,tokens.qadoctor)).status,403);
      await conn.query("UPDATE usuarios SET rol='Asistente',activo=0 WHERE id='qaotro'");
      const all=await api('GET','/dashboard/financiero?desde=2026-01-01&hasta=2026-12-31',null,tokens.qaadmin);assert.equal(all.status,200);
      assert(all.body.data.porDoctor.some(d=>d.doctor_id==='qaotro'&&Number(d.total_cobrado)===10));
    });
    await check('Laboratorio: reintentos, pagos concurrentes y sin doble descuento en dashboard',async()=>{
      const r=await create(tokens.qadoctor),id=r.body.consultaId;
      const created=await api('POST',`/laboratorio/consulta/${id}`,{nombre_laboratorio:'Laboratorio concurrencia',monto_total:'100'},tokens.qaadmin);
      assert.equal(created.status,201);const trabajo=created.body.trabajoId,key=crypto.randomUUID();
      const before=await api('GET','/dashboard/financiero?desde=2026-01-01&hasta=2026-12-31',null,tokens.qaadmin);
      const first=await Promise.all([1,2].map(()=>api('POST',`/laboratorio/${trabajo}/pagos`,{monto:'60'},tokens.qaadmin,key)));
      assert(first.every(x=>[200,201].includes(x.status)));
      const later=await Promise.all([1,2].map(()=>api('POST',`/laboratorio/${trabajo}/pagos`,{monto:'30'},tokens.qaadmin)));
      assert.deepEqual(later.map(x=>x.status).sort(),[201,409]);
      const [[paid]]=await conn.query('SELECT COUNT(*) AS filas,SUM(monto) AS monto FROM pagos_laboratorio WHERE trabajo_laboratorio_id=?',[trabajo]);
      assert.equal(paid.filas,2);assert.equal(Number(paid.monto),90);
      const after=await api('GET','/dashboard/financiero?desde=2026-01-01&hasta=2026-12-31',null,tokens.qaadmin);
      assert.equal(after.body.data.totales.gananciaNetaReal,before.body.data.totales.gananciaNetaReal);
      assert.equal(Number(after.body.data.costoLaboratorioPagado)-Number(before.body.data.costoLaboratorioPagado),90);
      assert.equal(after.body.data.caja.pagosLaboratorio-before.body.data.caja.pagosLaboratorio,90);
      assert.equal(before.body.data.caja.flujoNeto-after.body.data.caja.flujoNeto,90);
      assert.equal(after.body.data.caja.ingresos,before.body.data.caja.ingresos);
      assert.equal((await api('POST',`/laboratorio/${trabajo}/pagos`,{monto:'1.001'},tokens.qaadmin)).status,400);
    });
    await check('Gastos: alta, edicion, anulacion, reactivacion y fechas actualizan caja y resultado',async()=>{
      const summary=async()=> (await api('GET','/dashboard/financiero?desde=2026-01-01&hasta=2026-12-31',null,tokens.qaadmin)).body.data;
      const before=await summary();
      const expense={categoria:'materiales',descripcion:'Gasto QA temporal',monto:'12.34',fecha_pago:'2026-09-23'};
      assert.equal((await api('POST','/gastos',expense,tokens.qadoctor)).status,403);
      const created=await api('POST','/gastos',expense,tokens.qaadmin);assert.equal(created.status,201);
      const id=created.body.gastoId;
      const verify=async expected=>{
        const after=await summary();
        assert.equal(Math.round((after.caja.gastosOperativos-before.caja.gastosOperativos)*100),expected);
        assert.equal(Math.round((before.caja.flujoNeto-after.caja.flujoNeto)*100),expected);
        assert.equal(Math.round((before.totales.gananciaNetaReal-after.totales.gananciaNetaReal)*100),expected);
      };
      await verify(1234);
      assert.equal((await api('PUT',`/gastos/${id}`,{...expense,monto:'20.05'},tokens.qaadmin)).status,200);
      await verify(2005);
      for(const monto of ['-1','0','NaN','1.001']) assert.equal((await api('PUT',`/gastos/${id}`,{...expense,monto},tokens.qaadmin)).status,400);
      assert.equal((await api('PUT',`/gastos/${id}`,{...expense,fecha_pago:'2026-02-31'},tokens.qaadmin)).status,400);
      await verify(2005);
      assert.equal((await api('DELETE',`/gastos/${id}`,null,tokens.qaadmin)).status,200);await verify(0);
      assert.equal((await api('PUT',`/gastos/${id}/reactivar`,{},tokens.qaadmin)).status,200);await verify(2005);
      assert.equal((await api('PUT',`/gastos/${id}`,{...expense,monto:'20.05',fecha_pago:'2025-12-31'},tokens.qaadmin)).status,200);await verify(0);
      const previous=(await api('GET','/dashboard/financiero?desde=2025-12-31&hasta=2025-12-31',null,tokens.qaadmin)).body.data;
      assert.equal(previous.caja.flujoNeto,-20.05);
      const [[row]]=await conn.query('SELECT estado,monto FROM gastos_clinica WHERE id=?',[id]);
      assert.equal(row.estado,'activo');assert.equal(Number(row.monto),20.05);
    });
    await check('Tarjeta y anulacion: caja incluye recargo sin inflar comision ni deuda',async()=>{
      const summary=async()=> (await api('GET','/dashboard/financiero?desde=2026-01-01&hasta=2026-12-31',null,tokens.qaadmin)).body.data;
      const before=await summary(), created=await create(tokens.qadoctor);
      const pos=(await api('GET','/dashboard/configuracion-pos',null,tokens.qaadmin)).body.data;
      const paid=await api('POST',`/historias/consultas/${created.body.consultaId}/pagos`,{monto:'25',metodo_pago:'Tarjeta',pos_revision:pos.revision},tokens.qaadmin);
      assert.equal(paid.status,201);
      const after=await summary();
      assert.equal(after.caja.ingresos-before.caja.ingresos,26);
      assert.equal(after.caja.recargosTarjeta-before.caja.recargosTarjeta,1);
      assert.equal(after.totales.totalCobrado-before.totales.totalCobrado,25);
      assert.equal(after.totales.totalComisionBruta-before.totales.totalComisionBruta,7.5);
      assert.equal((await api('POST',`/historias/pagos/${paid.body.pagoId}/anular`,{motivo:'Ensayo de anulacion de tarjeta'},tokens.qaadmin)).status,201);
      assert.deepEqual((await summary()).caja,before.caja);
    });
    await check('Montos invalidos, login 401 y rango invalido',async()=>{
      for(const monto of ['-1','0','NaN','1.001']) assert.equal((await api('POST',`/historias/consultas/${a}/pagos`,{monto},tokens.qaadmin)).status,400);
      assert.equal((await api('POST','/auth/login',{id:'qaadmin',password:'incorrecta'})).status,401);
      assert.equal((await api('GET','/dashboard/produccion?desde=2026-02-31',null,tokens.qaadmin)).status,400);
    });
    await check('Costos historicos desconocidos: bloquear, conciliar con auditoria y conservar comision',async()=>{
      const [created]=await conn.query(`INSERT INTO consultas(historia_id,descripcion,costo_total,fecha_consulta,doctor_id,tipo_comision,comision_porcentaje_aplicado)
        VALUES(1,'Costo historico QA',200,'2026-09-22','qadoctor','rehabilitacion',25)`);
      const id=created.insertId;
      await conn.query("INSERT INTO trabajos_laboratorio(consulta_id,nombre_laboratorio,monto_total,registrado_por) VALUES(?,'QA',100,'qaadmin')",[id]);
      const [old]=await conn.query("INSERT INTO pagos(consulta_id,monto,comision_generada,fecha_pago,hora_pago,registrado_por) VALUES(?,60,7.5,'2026-09-22','09:00:00','qaadmin')",[id]);
      await migrate(conn);
      assert.equal((await api('POST',`/historias/consultas/${id}/pagos`,{monto:'80'},tokens.qaadmin)).status,409);
      const report=await api('GET','/dashboard/financiero?desde=2026-01-01&hasta=2026-12-31',null,tokens.qaadmin);
      assert.equal(report.body.data.totales.gananciaNetaReal,null);
      const body={costo_cubierto:'30',motivo:'Registro sintetico verificado'};
      assert.equal((await api('POST',`/historias/consultas/${id}/conciliar-costos`,body,tokens.qadoctor)).status,403);
      assert.equal((await api('POST',`/historias/consultas/${id}/conciliar-costos`,body,tokens.qaadmin)).status,201);
      const r=await api('POST',`/historias/consultas/${id}/pagos`,{monto:'80'},tokens.qaadmin);assert.equal(r.status,201);assert.equal(Number(r.body.costo),70);
      const [[previous]]=await conn.query('SELECT monto,comision_generada FROM pagos WHERE id=?',[old.insertId]);assert.equal(Number(previous.monto),60);assert.equal(Number(previous.comision_generada),7.5);
    });
    await check('Eliminar sello persiste NULL y conservar nivel propio',async()=>{
      await conn.query("UPDATE usuarios SET sello_digital='imagen-sintetica' WHERE id='qaadmin'");
      assert.equal((await api('PUT','/usuarios/mi-firma-sello',{sello_digital:null},tokens.qaadmin)).status,200);
      const [[u]]=await conn.query("SELECT sello_digital FROM usuarios WHERE id='qaadmin'");assert.equal(u.sello_digital,null);
    });
    await check('Health y SPA: assets/API faltantes nunca reciben HTML',async()=>{
      assert.equal((await fetch(`${base}/api/health`)).status,200);
      await conn.query("DELETE FROM finanzas_version WHERE version='001'");
      const pending=await fetch(`${base}/api/health`);
      assert.equal(pending.status,503);assert.equal((await pending.json()).reason,'schema_pending');
      await migrate(conn);
      assert.equal((await fetch(`${base}/api/health`)).status,200);
      for(const url of ['/api','/api/no-existe','/assets/no-existe.js','/uploads/no-existe.png'])assert.equal((await fetch(base+url)).status,404);
    });
    await require('./pos-debt-integration.cjs')({api,conn,tokens,create,check,migrate});
    fs.writeFileSync(path.join(root,'results.json'),JSON.stringify({ version:instance.version,results },null,2));
    console.log(`Evidencia sintetica: ${root}`);
    if (process.env.HOTFIX_BROWSER_TEST === '1') await require('./hotfix-browser.cjs').run({ base, root, pass });
    if (process.env.HOTFIX_PREVIEW === '1') {
      fs.writeFileSync(path.join(root,'preview-status.json'),JSON.stringify({url:base,pid:process.pid,expiresAt:new Date(Date.now()+2*60*60*1000).toISOString(),synthetic:true},null,2));
      console.log(`DEMO AISLADA: ${base} (solo datos sinteticos, dos horas)`);
      await new Promise(resolve=>{
        const finish=()=>{clearInterval(poll);clearTimeout(timer);resolve();};
        const poll=setInterval(()=>{if(fs.existsSync(path.join(root,'STOP_PREVIEW')))finish();},1000);
        const timer=setTimeout(finish,2*60*60*1000);
        process.once('SIGINT',finish);process.once('SIGTERM',finish);
      });
    }
  } finally {
    await browser?.close();
    if (appServer) await new Promise(resolve=>appServer.close(resolve));
    if (pool) await pool.end();
    if (conn) { try { await conn.query('SHUTDOWN'); } catch {} await conn.end(); }
    if (child.exitCode == null) { await Promise.race([once(child,'exit'),new Promise(r=>setTimeout(r,10000))]); if(child.exitCode==null) child.kill(); }
  }
}
run().catch(error=>{ console.error(String(error.stack).replace(/(--password=)\S+/g, '$1[REDACTADO]'));process.exitCode=1; });
