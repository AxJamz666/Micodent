// Run against a dedicated Vite server. Every API request is mocked; no DB is used.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.SESSION_TEST_URL || 'http://127.0.0.1:5174';
if (new URL(base).hostname !== '127.0.0.1' || new URL(base).port !== '5174') throw new Error('DEDICATED_TEST_SERVER_REQUIRED');
const user = { id:'synthetic-user', nombre:'Prueba', nombre_completo:'Usuario Prueba', rol:'Doctor', is_admin:0, nivel:1 };
const results = [];
let browser;
async function fixture({token = 'synthetic-a', meStatus = 200, gate} = {}) {
  const context = await browser.newContext({ viewport:{width:1280,height:800}, serviceWorkers:'block',
    storageState:{cookies:[],origins:[{origin:base,localStorage:token ? [
      {name:'token',value:token},{name:'userNombre',value:'Cache no confiable'},{name:'isAdmin',value:'true'},
    ] : []}]} });
  const f = { context, requests:[], meStatus, gate, user, faults:new Map(), errors:[] };
  context.on('page', p=>p.on('pageerror', e=>f.errors.push(e.message)));
  await context.route('**/*',async route=>{
    const req=route.request(); const url=new URL(req.url());
    if (url.origin===base) return route.continue();
    if (url.pathname.startsWith('/api/')) {
      f.requests.push({path:url.pathname,method:req.method(),token:req.headers().authorization});
      const fault=f.faults.get(url.pathname);
      if (fault) return fault(route);
      if (url.pathname==='/api/auth/me') {
        if (f.gate) await f.gate;
        return route.fulfill({status:f.meStatus,json:{ok:f.meStatus===200,usuario:f.user}});
      }
      if (url.pathname==='/api/auth/login') return route.fulfill({json:{ok:true,token:'synthetic-login',usuario:{...user,fullName:user.nombre_completo}}});
      return route.fulfill({json:{ok:true,data:url.pathname.endsWith('/stats') ? {} : []}});
    }
    // Fail closed: never let uploads or unexpected external requests reach DEV.
    return route.abort();
  });
  f.page=await context.newPage();
  return f;
}
async function run(name, fn) {
  await fn(); results.push({test:name,result:'passed'}); console.log('PASS '+name);
}
async function visible(page,text) { await page.getByRole('heading',{name:text,exact:true}).waitFor(); }
async function draft(f) {
  await f.page.goto(base+'/pacientes/nuevo');
  await f.page.locator('input[name="nombres"]').fill('Borrador sintetico');
  await f.page.evaluate(()=>{ window.draftNode=document.querySelector('input[name="nombres"]'); });
}
async function preserved(f) {
  assert.equal(await f.page.evaluate(()=>window.draftNode?.isConnected && window.draftNode.value==='Borrador sintetico'),true);
}
async function probe(page, endpoint='/session-probe') {
  return page.evaluate(async endpoint=>{
    const {default:api}=await import('/src/services/api.js');
    try { await api.post(endpoint,{synthetic:true}); return 'ok'; }
    catch(error) { return error.code==='SESSION_CHANGED' ? error.code : error.response?.status || 'network'; }
  },endpoint);
}
async function clean(f) { assert.deepEqual(f.errors,[]); await f.context.close(); }
async function main() {
  browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    await run('cached admin cannot mount protected pages before server validation',async()=>{
      let release; const gate=new Promise(r=>release=r); const f=await fixture({gate});
      await f.page.goto(base+'/administracion-personal');
      await visible(f.page,'Verificando sesion');
      assert.equal(f.requests.some(r=>r.path!=='/api/auth/me'),false);
      release(); await f.page.waitForURL(base+'/');
      await f.page.getByRole('heading',{name:/Bienvenido/}).waitFor();
      assert.equal(await f.page.evaluate(()=>localStorage.getItem('isAdmin')),'false');
      assert.equal(f.requests.some(r=>r.path==='/api/usuarios'),false);
      await clean(f);
    });
    await run('verification 503 preserves login and retry opens the original route',async()=>{
      const f=await fixture({meStatus:503});
      await f.page.goto(base+'/pacientes/nuevo');
      await visible(f.page,'No se pudo verificar la sesion');
      assert.equal(await f.page.evaluate(()=>Boolean(localStorage.getItem('token'))),true);
      assert.equal(await f.page.locator('input[name="nombres"]').count(),0);
      f.meStatus=200; await f.page.getByRole('button',{name:'Reintentar',exact:true}).click();
      await f.page.locator('input[name="nombres"]').waitFor();
      await clean(f);
    });
    await run('server admin permissions preserve access to administration',async()=>{
      const f=await fixture(); f.user={...user,is_admin:1};
      const loaded=f.page.waitForResponse(r=>new URL(r.url()).pathname==='/api/usuarios');
      await f.page.goto(base+'/administracion-personal');
      await loaded;
      assert.equal(new URL(f.page.url()).pathname,'/administracion-personal');
      assert.equal(await f.page.evaluate(()=>localStorage.getItem('isAdmin')),'true');
      await clean(f);
    });
    await run('invalid server profile fails closed without destroying credentials',async()=>{
      const f=await fixture(); f.user={}; await f.page.goto(base+'/pacientes/nuevo');
      await visible(f.page,'No se pudo verificar la sesion');
      assert.equal(await f.page.locator('input[name="nombres"]').count(),0);
      assert.equal(await f.page.evaluate(()=>Boolean(localStorage.getItem('token'))),true);
      f.user=user; await f.page.getByRole('button',{name:'Reintentar',exact:true}).click();
      await f.page.locator('input[name="nombres"]').waitFor(); await clean(f);
    });
    await run('logout from another tab locks the previous tab',async()=>{
      const f=await fixture(); await draft(f);
      const other=await f.context.newPage(); await other.goto(base+'/');
      await other.evaluate(()=>localStorage.removeItem('token'));
      await visible(f.page,'La sesion cambio en otra pestana'); await preserved(f);
      assert.equal(await probe(f.page),'SESSION_CHANGED'); await clean(f);
    });
    await run('cross-tab login locks drafts and blocks requests without adopting the new account',async()=>{
      const f=await fixture(); await draft(f);
      const other=await f.context.newPage(); await other.goto(base+'/');
      await other.evaluate(()=>localStorage.setItem('token','synthetic-b'));
      await visible(f.page,'La sesion cambio en otra pestana');
      await preserved(f);
      assert.equal(await probe(f.page),'SESSION_CHANGED');
      assert.equal(f.requests.some(r=>r.path==='/api/session-probe'),false);
      assert.equal(await f.page.evaluate(()=>localStorage.getItem('token')==='synthetic-b'),true);
      assert.equal(await f.page.getByRole('button',{name:'Continuar al acceso'}).evaluate(el=>el===document.activeElement),true);
      for (const [name,width,height] of [['desktop',1280,800],['mobile',390,844]]) {
        await f.page.setViewportSize({width,height});
        assert.equal(await f.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
        const bounds=await f.page.getByRole('alertdialog').boundingBox();
        assert.equal(bounds.width,width);
        if (process.env.SESSION_SCREENSHOT_DIR) {
          fs.mkdirSync(process.env.SESSION_SCREENSHOT_DIR,{recursive:true});
          await f.page.screenshot({path:path.join(process.env.SESSION_SCREENSHOT_DIR,name+'.png')});
        }
      }
      await clean(f);
    });
    await run('matching 401 expires session while preserving and hiding the draft',async()=>{
      const f=await fixture(); await draft(f);
      f.faults.set('/api/session-probe',r=>r.fulfill({status:401,json:{ok:false}}));
      assert.equal(await probe(f.page),401);
      await visible(f.page,'Sesion finalizada'); await preserved(f);
      assert.equal(await f.page.evaluate(()=>localStorage.getItem('token')),null);
      assert.equal(await f.page.locator('input[name="nombres"]').isVisible(),false);
      await clean(f);
    });
    await run('403, 503 and network failures do not log out or unmount a draft',async()=>{
      const f=await fixture(); await draft(f);
      for (const status of [403,503,'network']) {
        f.faults.set('/api/session-probe',r=>status==='network' ? r.abort() : r.fulfill({status,json:{ok:false}}));
        assert.equal(await probe(f.page),status); await preserved(f);
        assert.equal(await f.page.locator('input[name="nombres"]').isVisible(),true);
      }
      await clean(f);
    });
    for (const status of [200,401]) await run('late '+status+' response cannot overwrite the newer session',async()=>{
      const f=await fixture(); await draft(f);
      let release, received; const started=new Promise(r=>received=r); const gate=new Promise(r=>release=r);
      f.faults.set('/api/session-probe',async r=>{ received(); await gate; return r.fulfill({status,json:{ok:status===200}}); });
      const result=probe(f.page); await started;
      const other=await f.context.newPage(); await other.goto(base+'/');
      await other.evaluate(()=>localStorage.setItem('token','synthetic-b'));
      release(); assert.equal(await result,'SESSION_CHANGED');
      await visible(f.page,'La sesion cambio en otra pestana'); await preserved(f);
      assert.equal(await f.page.evaluate(()=>localStorage.getItem('token')==='synthetic-b'),true);
      assert.equal(f.requests.filter(r=>r.path==='/api/session-probe').length,1);
      assert.equal(f.requests.find(r=>r.path==='/api/session-probe').token,'Bearer synthetic-a');
      await clean(f);
    });
    await run('login failure stays anonymous and successful login revalidates the server profile',async()=>{
      const f=await fixture({token:null}); await f.page.goto(base+'/login');
      await f.page.getByPlaceholder('Ej. drmiguel').fill('synthetic-user');
      await f.page.locator('input[type="password"]').fill('Synthetic test phrase');
      f.faults.set('/api/auth/login',r=>r.fulfill({status:401,json:{ok:false,mensaje:'Acceso rechazado'}}));
      await f.page.getByRole('button',{name:'Entrar al Sistema'}).click();
      await f.page.getByText('Acceso rechazado',{exact:true}).waitFor();
      assert.equal(await f.page.evaluate(()=>localStorage.getItem('token')),null);
      f.faults.delete('/api/auth/login');
      await f.page.getByRole('button',{name:'Entrar al Sistema'}).click();
      await f.page.getByRole('heading',{name:/Bienvenido/}).waitFor();
      assert.ok(f.requests.some(r=>r.path==='/api/auth/me'));
      assert.equal(await f.page.evaluate(()=>localStorage.getItem('isAdmin')),'false');
      await clean(f);
    });
    await run('logout 503 keeps the form and successful logout returns to login',async()=>{
      const f=await fixture(); await draft(f);
      await f.page.getByRole('button',{name:'Prueba',exact:true}).click();
      f.faults.set('/api/auth/logout',r=>r.fulfill({status:503,json:{ok:false}}));
      await f.page.getByRole('button',{name:/Cerrar sesi/}).click();
      await f.page.getByText(/No se pudo confirmar el cierre/).waitFor(); await preserved(f);
      f.faults.delete('/api/auth/logout');
      await f.page.getByRole('button',{name:/Cerrar sesi/}).click();
      await f.page.getByRole('button',{name:'Entrar al Sistema'}).waitFor();
      assert.equal(await f.page.evaluate(()=>localStorage.getItem('token')),null);
      await clean(f);
    });
    await run('password change keeps 503 inputs and successful change requires login again',async()=>{
      const f=await fixture(); await f.page.goto(base+'/perfil');
      for (const name of ['currentPass','newPass','confirmPass']) await f.page.locator('input[name="'+name+'"]').fill('Synthetic phrase 2026');
      f.faults.set('/api/usuarios/cambiar-password',r=>r.fulfill({status:503,json:{ok:false}}));
      await f.page.getByRole('button',{name:'Cambiar Contraseña',exact:true}).click();
      await f.page.getByText('Error al cambiar contraseña.',{exact:true}).waitFor();
      assert.equal(await f.page.locator('input[name="newPass"]').inputValue(),'Synthetic phrase 2026');
      f.faults.delete('/api/usuarios/cambiar-password');
      await f.page.getByRole('button',{name:'Cambiar Contraseña',exact:true}).click();
      await f.page.getByRole('button',{name:'Entrar al Sistema'}).waitFor();
      assert.equal(await f.page.evaluate(()=>localStorage.getItem('token')),null);
      await clean(f);
    });
    console.log(JSON.stringify({passed:results.length,api:'mocked-only',databaseAccess:false}));
  } finally { await browser.close(); }
}
main().catch(e=>{ console.error(e); process.exitCode=1; });
