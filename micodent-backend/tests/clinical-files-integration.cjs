const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
let fixture;

async function prepare({conn,root}) {
  const storage = path.join(root,'clinical-files'); fs.mkdirSync(storage);
  const png = fs.readFileSync(path.resolve(__dirname,'../public/logo.png'));
  const pdf = Buffer.from('%PDF-1.4\n% Synthetic download fixture, not a clinical document.\n%%EOF');
  const records = [];
  for (const [name,bytes] of [['legacy-image.png',png],['legacy-document.pdf',pdf]]) {
    fs.writeFileSync(path.join(storage,name),bytes,{flag:'wx'});
    const [row] = await conn.execute(`INSERT INTO radiografias(historia_id,tipo,descripcion,url_archivo,fecha_toma,subido_por)
      VALUES(1,'foto_clinica','Anexo sintetico',?,'2026-09-22','qaadmin')`,['/uploads/'+name]);
    records.push({id:row.insertId,name,bytes});
  }
  const moduleId = require.resolve('../src/services/clinicalFiles');
  const original = require(moduleId);
  // Only this disposable process reads files from its synthetic storage directory.
  require.cache[moduleId].exports = { ...original,
    clinicalFileHandler: options => original.clinicalFileHandler({...options,root:storage}) };
  const uploadModule = require.resolve('../src/config/multer');
  const uploadConfig = require(uploadModule);
  require.cache[uploadModule].exports = { ...uploadConfig,
    upload: uploadConfig.createUpload(storage), uploadDir: storage };
  fixture = {storage,records};
}

async function run({base,root,pass,api,tokens,check}) {
  const client = require('./helpers/cookie-client.cjs');
  await check('M03-A: archivos privados, bytes historicos y cierre de acceso publico',async()=>{
    for(const file of fixture.records) {
      const url=base+`/api/historias/radiografias/${file.id}/archivo`;
      assert.equal((await fetch(url)).status,401);
      assert.equal((await fetch(base+'/uploads/'+file.name)).status,404);
      assert.equal((await fetch(base+'/uploads/'+file.name,{headers:client.headers(base,tokens.qaadmin)})).status,404);
      const r=await fetch(url,{headers:client.headers(base,tokens.qaadmin)});
      assert.equal(r.status,200); assert.equal(r.headers.get('cache-control'),'private, no-store');
      assert.equal(hash(Buffer.from(await r.arrayBuffer())),hash(file.bytes));
      const wrong={...client.headers(base,tokens.qaadmin),Cookie:client.headers(base,tokens.qadoctor).Cookie};
      assert.equal((await fetch(url,{headers:wrong})).status,409);
    }
  });
  await check('M03-B: carga verificada, anulación sin borrado y restauración administrativa', async () => {
    const headers = token => {
      const value = client.headers(base, token);
      delete value['Content-Type'];
      return value;
    };
    const upload = async (bytes, filename, mime, historyId = 1) => {
      const form = new FormData();
      form.append('imagen', new Blob([bytes], { type: mime }), filename);
      form.append('descripcion', 'Anexo sintetico nuevo');
      return fetch(base + `/api/historias/${historyId}/radiografias`, {
        method: 'POST', headers: headers(tokens.qaadmin), body: form,
      });
    };
    const before = fs.readdirSync(fixture.storage).sort();
    assert.equal((await upload(Buffer.from('<html>falso</html>'), 'falso.png', 'image/png')).status, 400);
    assert.deepEqual(fs.readdirSync(fixture.storage).sort(), before);
    assert.equal((await upload(fixture.records[0].bytes, 'falso.png.exe', 'image/png')).status, 400);
    assert.equal((await upload(fixture.records[0].bytes, 'falso.png', 'application/pdf')).status, 400);
    assert.equal((await upload(fixture.records[0].bytes, 'clinica.png', 'image/png', 99999)).status, 404);
    assert.deepEqual(fs.readdirSync(fixture.storage).sort(), before);
    const accepted = await upload(fixture.records[0].bytes, 'clinica.png', 'image/png');
    assert.equal(accepted.status, 201);
    const body = await accepted.json();
    const filename = body.url_archivo.split('/').at(-1);
    assert.match(filename, /^rad_[0-9a-f-]{36}\.png$/);
    const pathname = path.join(fixture.storage, filename);
    assert.equal(hash(fs.readFileSync(pathname)), hash(fixture.records[0].bytes));
    assert.equal(fs.readdirSync(path.join(fixture.storage, '.staging')).length, 0);
    const fileUrl = `/historias/radiografias/${body.radiografiaId}/archivo`;
    const read = () => fetch(base + '/api' + fileUrl, { headers: client.headers(base, tokens.qaadmin) });
    assert.equal((await read()).status, 200);
    assert.equal((await api('DELETE', `/historias/radiografias/${body.radiografiaId}`, null, tokens.qaadmin)).status, 200);
    assert.equal((await read()).status, 404);
    assert.equal((await api('DELETE', `/historias/radiografias/${body.radiografiaId}`, null, tokens.qaadmin)).status, 409);
    assert.equal((await api('POST', `/historias/radiografias/${body.radiografiaId}/restaurar`, {}, tokens.qadoctor)).status, 403);
    assert.equal((await api('GET', '/historias/1/radiografias?archivadas=1', null, tokens.qadoctor)).status, 403);
    assert.equal(hash(fs.readFileSync(pathname)), hash(fixture.records[0].bytes));
    const archived = await api('GET', '/historias/1/radiografias?archivadas=1', null, tokens.qaadmin);
    assert(archived.body.data.some(row => row.id === body.radiografiaId));
    fs.renameSync(pathname, pathname + '.temporarily-missing');
    try {
      assert.equal((await api('POST', `/historias/radiografias/${body.radiografiaId}/restaurar`, {}, tokens.qaadmin)).status, 409);
    } finally { fs.renameSync(pathname + '.temporarily-missing', pathname); }
    assert.equal((await api('POST', `/historias/radiografias/${body.radiografiaId}/restaurar`, {}, tokens.qaadmin)).status, 200);
    assert.equal((await read()).status, 200);
    assert.equal(hash(fs.readFileSync(pathname)), hash(fixture.records[0].bytes));
    assert.equal((await api('DELETE', `/historias/radiografias/${body.radiografiaId}`, null, tokens.qaadmin)).status, 200);
    fixture.archivedId = body.radiografiaId;
    const inventory = await require('../scripts/audit-clinical-files').inventory({db:require('../src/config/db'),root:fixture.storage});
    assert.equal(inventory.clean,true);
    assert.equal(inventory.records,3);
    const orphan = path.join(fixture.storage, 'orphan-synthetic.png');
    fs.writeFileSync(orphan, fixture.records[0].bytes, {flag:'wx'});
    try {
      const found = await require('../scripts/audit-clinical-files').inventory({db:require('../src/config/db'),root:fixture.storage});
      assert.equal(found.orphan,1);
      assert.equal(found.clean,false);
    } finally { fs.unlinkSync(orphan); }
  });
  if(process.env.HOTFIX_PLAYWRIGHT) {
    const {chromium}=require(process.env.HOTFIX_PLAYWRIGHT);
    const front=path.resolve(__dirname,'../../micodent-frontend');
    const {createServer}=await import(pathToFileURL(path.join(front,'node_modules/vite/dist/node/index.js')));
    const vite=await createServer({root:front,server:{host:'127.0.0.1',port:0,proxy:{'/api':{target:base,changeOrigin:false},'/uploads':{target:base,changeOrigin:false}}}});
    await vite.listen();
    const browser=await chromium.launch({channel:'msedge',headless:true});
    const outcomes=[];
    try {
      for(const [mode,origin] of [['build',base],['dev',`http://127.0.0.1:${vite.httpServer.address().port}`]]) {
        const context=await browser.newContext({viewport:{width:1280,height:800},acceptDownloads:true});
        const page=await context.newPage(),errors=[],publicRequests=[];
        page.on('pageerror',e=>errors.push(e.name));
        page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/uploads/'))publicRequests.push('public');});
        await page.addInitScript(()=>{window.__revokedBlobs=0;const original=URL.revokeObjectURL.bind(URL);
          URL.revokeObjectURL=value=>{window.__revokedBlobs++;original(value);};});
        await page.goto(origin+'/login');
        await page.locator('input').nth(0).fill('qaadmin');await page.locator('input').nth(1).fill(pass);
        await page.locator('button[type=submit]').click();await page.waitForURL(origin+'/');
        await page.goto(origin+'/pacientes/1?tab=radiografias');
        const image=page.getByAltText('Placa',{exact:true});await image.waitFor();
        await image.evaluate(img=>img.decode());assert((await image.getAttribute('src')).startsWith('blob:'));
        const downloadEvent=page.waitForEvent('download');
        await page.getByRole('link',{name:'Descargar PDF'}).click();
        const download=await downloadEvent;
        assert.equal(hash(fs.readFileSync(await download.path())),hash(fixture.records[1].bytes));
        await image.click();await page.getByAltText('Radiografía ampliada',{exact:true}).evaluate(img=>img.decode());
        await page.screenshot({path:path.join(root,mode+'-archivo-ampliado.png')});
        await page.goto(origin+'/historias?view=1');
        await page.locator('.hoja-impresion img[src^="blob:"]').evaluate(img=>img.decode());
        await page.waitForFunction(()=>!document.querySelector('[data-clinical-state="decoding"], [data-clinical-state="loading"]'));
        await page.evaluate(()=>{window.__prints=0;window.print=()=>window.__prints++;});
        await page.getByRole('button',{name:'Imprimir Reporte'}).click();
        assert.equal(await page.evaluate(()=>window.__prints),1);
        await page.emulateMedia({media:'print'});
        await page.pdf({path:path.join(root,mode+'-anexos-privados.pdf'),format:'A4',printBackground:true});
        await page.emulateMedia({media:'screen'});
        await page.setViewportSize({width:390,height:844});
        await page.goto(origin+'/pacientes/1?tab=radiografias');
        await page.getByAltText('Placa',{exact:true}).evaluate(img=>img.decode());
        await page.screenshot({path:path.join(root,mode+'-archivos-mobile.png')});
        await page.getByRole('button',{name:'Ver anexos anulados'}).click();
        await page.getByRole('button',{name:'Restaurar'}).click();
        await page.waitForFunction(()=>document.querySelectorAll('button[aria-label="Anular anexo"]').length===3);
        page.once('dialog',dialog=>dialog.accept());
        const deleteResponse = page.waitForResponse(r=>r.request().method()==='DELETE' && /\/historias\/radiografias\/\d+$/.test(new URL(r.url()).pathname));
        await page.getByRole('button',{name:'Anular anexo'}).first().click();
        const deleted = await deleteResponse;
        assert.equal(deleted.status(),200,`Anulacion UI: HTTP ${deleted.status()}`);
        await page.waitForTimeout(500);
        const remaining = await page.locator('button[aria-label="Anular anexo"]').count();
        assert.equal(remaining,2,`La galeria debe volver a sus dos anexos iniciales; botones visibles: ${remaining}`);
        const fileRequest=page.waitForRequest(r=>r.url().endsWith('/archivo'));
        await page.getByAltText('Placa',{exact:true}).click();
        const request=await fileRequest;
        await page.getByAltText('Radiografía ampliada',{exact:true}).evaluate(img=>img.decode());
        const headers=request.headers();
        const revoked=await context.request.post(origin+'/api/auth/logout',{headers:{Origin:origin,
          'X-Micodent-Client':'web','X-Micodent-Session':headers['x-micodent-session'],'X-CSRF-Token':headers['x-csrf-token']}});
        assert.equal(revoked.status(),200);
        await page.evaluate(async()=>{
          const api=await fetch('/api/auth/me',{headers:{'X-Micodent-Client':'web','X-Micodent-Bootstrap':'1'}});
          if(api.status!==401)throw Error('EXPECTED_REVOKED');
        });
        // A new page must no longer display the protected record after server revocation.
        await page.reload();await page.waitForURL(origin+'/login');
        assert.equal(await page.getByAltText('Placa',{exact:true}).count(),0);
        assert.deepEqual(publicRequests,[]);assert.deepEqual(errors,[]);
        outcomes.push({mode,gallery:'PASS',zoom:'PASS',pdfDownload:'PASS',print:'PASS',revoked:'PASS',publicRequests:0,exceptions:0});
        await context.close();
      }
      fs.writeFileSync(path.join(root,'clinical-files-browser.json'),JSON.stringify(outcomes,null,2));
    }finally{await browser.close();await vite.close();}
  }
  for(const file of fixture.records)assert.equal(hash(fs.readFileSync(path.join(fixture.storage,file.name))),hash(file.bytes));
  await check('M03-A: archivos sinteticos originales sin modificaciones',async()=>{});
}
module.exports={prepare,run};
