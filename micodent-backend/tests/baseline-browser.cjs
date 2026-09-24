const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const express=require('express');
const {once}=require('node:events');

module.exports=async function baseline({base,root,pass,browser}) {
  const folder=path.resolve(__dirname,'../../../baseline-clinica/micodent-frontend/micodent-frontend/dist');
  if(!fs.existsSync(path.join(folder,'index.html')))throw new Error('Baseline build required for comparative test.');
  const app=express();app.use(express.static(folder));app.use((req,res)=>res.sendFile('index.html',{root:folder}));
  const server=app.listen(0,'127.0.0.1');await once(server,'listening');
  const origin=`http://127.0.0.1:${server.address().port}`;
  const context=await browser.newContext({viewport:{width:1280,height:720}}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try {
    const login=await fetch(`${base}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'qaadmin',password:pass})}).then(r=>r.json());
    const values={token:login.token,userId:'qaadmin',userNombre:'QA',userFullName:'Doctor QA',userRol:'Doctor',userNivel:'3',isAdmin:'true'};
    await context.addInitScript(values=>{for(const [k,v]of Object.entries(values))localStorage.setItem(k,v);},values);
    // Original MariaDB controller returns JSON columns as text. Reproduce that exact
    // boundary against synthetic records, without accessing the original database.
    await page.route('**/api/**',async route=>{
      const req=route.request(),url=new URL(req.url());
      const r=await fetch(base+url.pathname+url.search,{method:req.method(),headers:{'Content-Type':'application/json',Authorization:`Bearer ${login.token}`},...(req.postData()?{body:req.postData()}: {})});
      const body=await r.json();
      if(url.pathname.includes('/historias/paciente/'))for(const row of body.data?.ordenes||[])for(const key of ['extraorales','tomografias','piezas_tomografia','fotografias','intraorales','periapicales_piezas','modelos_estudio'])row[key]=JSON.stringify(row[key]);
      if(url.pathname==='/api/auditoria-financiera')for(const row of body.data||[])row.detalle_json=JSON.stringify(row.detalle_json);
      await route.fulfill({status:r.status,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(body)});
    });
    await page.goto(origin+'/pacientes/1?tab=evolucion');
    await page.getByRole('button',{name:'Nuevo Tratamiento',exact:true}).click();
    await page.getByRole('button',{name:'Rehabilitación',exact:true}).click();
    const panel=page.locator('.fixed.inset-0 > div').filter({has:page.getByRole('heading',{name:'Nuevo Tratamiento'})});
    const bounds=await panel.boundingBox();
    const modalOverflow=bounds.y<0 || bounds.y+bounds.height>720;
    await page.screenshot({path:path.join(root,'baseline-modal.png')});
    await page.goto(origin+'/finanzas');
    await page.getByRole('button',{name:/Registro de Actividad/}).click();
    const activity=await page.locator('.fixed.inset-0').innerText();
    const auditCharacters=/0:\s*\{/.test(activity);
    await page.screenshot({path:path.join(root,'baseline-actividad.png')});
    await page.goto(origin+'/pacientes/1?tab=ordenesRx');
    const failed=page.waitForEvent('pageerror');
    await page.getByTitle('Ver / Imprimir').first().click();
    const rxError=(await failed).message;
    await page.screenshot({path:path.join(root,'baseline-rx-error.png')});
    assert(modalOverflow);assert(auditCharacters);assert(/map|function/i.test(rxError));
    fs.writeFileSync(path.join(root,'baseline-results.json'),JSON.stringify({modalOverflow,auditCharacters,rxError,personalAndPayments:'No exact failure reproduced with available synthetic records; full hotfix workflows tested in DEV and BUILD.'},null,2));
    console.log('PASS reproduccion baseline: modal fuera de pantalla, JSON por caracteres y error Rx.');
  } finally {await context.close();await new Promise(resolve=>server.close(resolve));}
};
