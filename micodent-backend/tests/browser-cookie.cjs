const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH || 'playwright');
const {createCookieApp}=require('./helpers/cookie-app.cjs');
const {COOKIE_NAME}=require('../src/services/browserTransport');
const web='http://localhost:5174',api='http://localhost:4402';
const fixture=createCookieApp(web);
let server,browser;
let passed=0;
async function context(){
  const ctx=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
  ctx.errors=[];
  ctx.on('page',page=>page.on('pageerror',error=>ctx.errors.push(error.name)));
  await ctx.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin===web)return route.continue();
    if(url.origin===api){
      // Auth and password endpoints go through the real HTTP app and cookie jar.
      if(url.pathname.startsWith('/api/auth/') || url.pathname==='/api/usuarios/cambiar-password')return route.continue();
      return route.fulfill({json:{ok:true,data:url.pathname.endsWith('/stats')?{}:[]}});
    }
    return route.abort();
  });
  return ctx;
}
async function login(page,id='one',password=fixture.password){
  await page.goto(web+'/login');
  await page.getByPlaceholder('Ej. drmiguel').fill(id);
  await page.locator('input[type=password]').fill(password);
  await page.getByRole('button',{name:'Entrar al Sistema'}).click();
  await page.getByRole('heading',{name:/Bienvenido/}).waitFor();
}
async function draft(page){
  await page.goto(web+'/pacientes/nuevo');
  await page.locator('input[name=nombres]').fill('Borrador sintetico');
  await page.evaluate(()=>{window.draftNode=document.querySelector('input[name=nombres]');});
}
async function close(ctx){assert.deepEqual(ctx.errors,[]);await ctx.close();}
async function run(name,fn){await fn();passed++;console.log('PASS '+name);}
async function directLogin(ctx,id='two'){
  const r=await ctx.request.post(api+'/api/auth/login',{headers:{Origin:web,'X-Micodent-Client':'web'},data:{id,password:fixture.password}});
  assert.equal(r.status(),200);return r.json();
}
async function currentUser(ctx){
  const r=await ctx.request.get(api+'/api/auth/me',{headers:{Origin:web,'X-Micodent-Client':'web','X-Micodent-Bootstrap':'1'}});
  assert.equal(r.status(),200);return(await r.json()).usuario.id;
}
async function main(){
  server=await new Promise((resolve,reject)=>{const s=fixture.app.listen(4402,'127.0.0.1',()=>resolve(s));s.on('error',reject);});
  browser=await chromium.launch({channel:'msedge',headless:true});
  await run('real browser cookie is HttpOnly and JWT/CSRF never persist in web storage',async()=>{
    const ctx=await context(),page=await ctx.newPage();
    let bearerSent=false;page.on('request',r=>{if(r.headers().authorization)bearerSent=true;});
    await login(page);
    const cookies=await ctx.cookies(api+'/api');const session=cookies.find(c=>c.name===COOKIE_NAME);
    assert.ok(session?.httpOnly);assert.equal(session.sameSite,'Strict');assert.equal(session.path,'/api');
    assert.equal(bearerSent,false);
    const state=await page.evaluate(async()=>{const{browserSession}=await import('/src/services/browserSession.js');return browserSession.requestContext();});
    assert.equal(await page.evaluate(({jwt,csrf})=>[...Object.values(localStorage),...Object.values(sessionStorage)].some(v=>v===jwt||v===csrf),{jwt:session.value,csrf:state.csrf}),false);
    assert.equal(await page.evaluate(()=>localStorage.getItem('token')),null);
    await page.reload();await page.getByRole('heading',{name:/Bienvenido/}).waitFor();
    const probe=await ctx.newPage();await probe.goto(api+'/api/auth/me');
    assert.equal(await probe.evaluate(()=>document.cookie.includes('micodent_dev_session_v2')),false);
    await close(ctx);
  });
  await run('missing CSRF header is rejected by real HTTP without revoking session',async()=>{
    const ctx=await context(),page=await ctx.newPage();await login(page);
    const status=await page.evaluate(async api=>{
      const{browserSession}=await import('/src/services/browserSession.js');
      const r=await fetch(api+'/api/auth/logout',{method:'POST',credentials:'include',headers:{'X-Micodent-Client':'web','X-Micodent-Session':browserSession.requestContext().id}});return r.status;
    },api);
    assert.equal(status,403);assert.equal(await currentUser(ctx),'one');await close(ctx);
  });
  await run('cookie account changed without storage event cannot submit an old form',async()=>{
    const ctx=await context(),page=await ctx.newPage();await login(page);await draft(page);
    await directLogin(ctx);
    const before=fixture.flags.logoutCount;
    const status=await page.evaluate(async()=>{const{authService}=await import('/src/services/api.js');try{await authService.logout();return 200;}catch(e){return e.response?.status;}});
    assert.equal(status,409);
    await page.getByRole('heading',{name:'La sesion cambio en otra pestana'}).waitFor();
    assert.equal(fixture.flags.logoutCount,before);assert.equal(await currentUser(ctx),'two');
    assert.equal(await page.evaluate(()=>window.draftNode.isConnected&&window.draftNode.value==='Borrador sintetico'),true);
    for(const [name,width,height] of [['desktop',1280,800],['mobile',390,844]]){
      await page.setViewportSize({width,height});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      if(process.env.SESSION_SCREENSHOT_DIR){fs.mkdirSync(process.env.SESSION_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.SESSION_SCREENSHOT_DIR,'cookie-'+name+'.png')});}
    }
    await close(ctx);
  });
  await run('late logout response cannot delete a newer cookie or switch its account',async()=>{
    const ctx=await context(),page=await ctx.newPage();await login(page);await draft(page);
    let release,received;const ready=new Promise(r=>received=r),gate=new Promise(r=>release=r);
    await page.route('**/api/auth/logout',async route=>{const response=await route.fetch();received();await gate;await route.fulfill({response});});
    const result=page.evaluate(async()=>{const{authService}=await import('/src/services/api.js');try{await authService.logout();return 'ok';}catch(e){return e.code;}});
    await ready;await directLogin(ctx);
    const other=await ctx.newPage();await other.goto(web+'/');await other.getByRole('heading',{name:/Bienvenido/}).waitFor();
    release();assert.equal(await result,'SESSION_CHANGED');assert.equal(await currentUser(ctx),'two');await close(ctx);
  });
  await run('real 503 preserves the draft and a confirmed logout revokes access',async()=>{
    const ctx=await context(),page=await ctx.newPage();await login(page);await draft(page);
    fixture.flags.unavailable=true;
    await page.getByRole('button',{name:'Prueba',exact:true}).click();await page.getByRole('button',{name:/Cerrar sesi/}).click();
    await page.getByText(/No se pudo confirmar el cierre/).waitFor();
    assert.equal(await page.locator('input[name=nombres]').inputValue(),'Borrador sintetico');
    fixture.flags.unavailable=false;
    await page.getByRole('button',{name:/Cerrar sesi/}).click();await page.getByRole('button',{name:'Entrar al Sistema'}).waitFor();
    await page.reload();await page.getByRole('button',{name:'Entrar al Sistema'}).waitFor();await close(ctx);
  });
  await run('same-site hostile form from another origin cannot log the user out',async()=>{
    const ctx=await context(),page=await ctx.newPage();await login(page);
    const hostile=await ctx.newPage();
    await hostile.route('http://localhost:5175/**',r=>r.fulfill({contentType:'text/html',body:'<form method="post" action="http://localhost:4402/api/auth/logout"><button>Submit</button></form>'}));
    await hostile.goto('http://localhost:5175/');
    const response=hostile.waitForResponse(r=>r.url()===api+'/api/auth/logout');
    await hostile.getByRole('button',{name:'Submit'}).click();assert.equal((await response).status(),403);
    assert.equal(await currentUser(ctx),'one');await close(ctx);
  });
  await run('password change requires a new login and keeps old cookies revoked',async()=>{
    const ctx=await context(),page=await ctx.newPage();await login(page,'two');await page.goto(web+'/perfil');
    await page.locator('input[name=currentPass]').fill(fixture.password);
    for(const field of ['newPass','confirmPass'])await page.locator('input[name='+field+']').fill('Synthetic changed browser 2026');
    await page.getByRole('button',{name:'Cambiar Contraseña',exact:true}).click();await page.getByRole('button',{name:'Entrar al Sistema'}).waitFor();
    await login(page,'two','Synthetic changed browser 2026');await close(ctx);
  });
  console.log(JSON.stringify({passed,transport:'real HTTP cookies',database:'synthetic memory only',rateLimiter:'stubbed'}));
}
main().catch(e=>{console.error('COOKIE_BROWSER_TEST_FAILED',e.name,e.message);process.exitCode=1;}).finally(async()=>{
  fixture.flags.unavailable=false;
  if(browser)await browser.close();
  if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}
});
