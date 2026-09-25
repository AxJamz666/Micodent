const test=require('node:test'),assert=require('node:assert/strict'),cookie=require('cookie'),jwt=require('jsonwebtoken');
const {COOKIE_NAME}=require('../../src/services/browserTransport');
const {createCookieApp}=require('../helpers/cookie-app.cjs');
const f=createCookieApp();
let server,base;
test.before(async()=>{server=await new Promise(resolve=>{const s=f.app.listen(0,'127.0.0.1',()=>resolve(s));});base='http://127.0.0.1:'+server.address().port;});
test.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));});
async function request(route,{method='GET',session,body,headers={}}={}){
 const r=await fetch(base+'/api'+route,{method,headers:{Origin:'http://localhost:5173','X-Micodent-Client':'web',
 'Content-Type':'application/json',...(session?{Cookie:session.cookie,'X-Micodent-Session':session.id,'X-CSRF-Token':session.csrf}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});
 return{status:r.status,headers:r.headers,body:await r.json()};
}
async function login(id='one'){
 const r=await request('/auth/login',{method:'POST',body:{id,password:f.password}});
 assert.equal(r.status,200);assert.equal('token' in r.body,false);
 const value=cookie.parse(r.headers.get('set-cookie'))[COOKIE_NAME];
 assert.ok(value);return{...r.body.sesion,cookie:COOKIE_NAME+'='+value,value,headers:r.headers};
}
test('login only returns a host-only HttpOnly Strict cookie, never a JWT in JSON',async()=>{
 const s=await login();const header=s.headers.get('set-cookie');
 for(const attr of ['HttpOnly','SameSite=Strict','Path=/api','Max-Age='])assert.ok(header.includes(attr));
 assert.equal(/Domain=|Secure/.test(header),false,'HTTP exception is restricted to loopback DEV');
 assert.equal(jwt.decode(s.value).bt,2);
 const me=await request('/auth/me',{session:s});assert.equal(me.status,200);assert.equal(me.body.usuario.id,'one');
 assert.equal(me.headers.get('cache-control'),'no-store');assert.equal('password_hash' in me.body.usuario,false);
});
test('a fresh tab can bootstrap, but cannot omit binding on other reads or writes',async()=>{
 const s=await login();const headers={Cookie:s.cookie,'X-Micodent-Bootstrap':'1'};
 assert.equal((await request('/auth/me',{headers})).status,200);
 assert.equal((await request('/auth/me',{headers:{Cookie:s.cookie}})).status,409);
 assert.equal((await request('/auth/logout',{method:'POST',headers})).status,409);
});
test('cross-tab account mismatch is rejected on reads, writes and bound bootstrap',async()=>{
 const a=await login(),b=await login('two');
 for(const [method,route] of [['GET','/auth/me'],['POST','/auth/logout']]){
   const r=await request(route,{method,session:{...a,cookie:b.cookie}});assert.equal(r.status,409);assert.equal(r.body.codigo,'AUTH_SESSION_CHANGED');
 }
 assert.equal((await request('/auth/me',{session:{...a,cookie:b.cookie},headers:{'X-Micodent-Bootstrap':'1'}})).status,409);
 assert.equal((await request('/auth/me',{session:b})).status,200);
});
test('CSRF is bound to the cookie and required on every unsafe authenticated operation',async()=>{
 const a=await login(),b=await login('two');const before=f.flags.logoutCount;
 for(const csrf of ['',b.csrf,'x'.repeat(64),'\u00e9'.repeat(64)]){
   const r=await request('/auth/logout',{method:'POST',session:{...a,csrf}});assert.equal(r.status,403);assert.equal(r.body.codigo,'AUTH_CSRF_INVALID');
 }
 assert.equal(f.flags.logoutCount,before);
 assert.equal((await request('/auth/logout',{method:'POST',session:a})).status,200);
});
test('origin and client header checks protect login before authentication is attempted',async()=>{
 const before=f.flags.loginCount;
 for(const headers of [{Origin:'http://evil.invalid'},{Origin:'http://localhost:3000'},{Origin:'null'},{Origin:''},{'X-Micodent-Client':''},{'Sec-Fetch-Site':'cross-site'}]){
   const r=await request('/auth/login',{method:'POST',body:{id:'one',password:f.password},headers});assert.equal(r.status,403);
 }
 assert.equal(f.flags.loginCount,before);
});
test('DNS-rebinding host and cross-origin authenticated reads fail closed',async()=>{
 const s=await login();
 const hostStatus=await new Promise((resolve,reject)=>{
   require('node:http').get(base+'/api/auth/me',{headers:{Host:'evil.invalid'}},r=>{r.resume();resolve(r.statusCode);}).on('error',reject);
 });
 assert.equal(hostStatus,403);
 assert.equal((await request('/auth/me',{session:s,headers:{Origin:'http://evil.invalid'}})).status,403);
});
test('bearer fallback, missing cookie and duplicate cookies are rejected',async()=>{
 const s=await login();
 assert.equal((await request('/auth/me',{headers:{Authorization:'Bearer '+s.value}})).status,401);
 assert.equal((await request('/auth/me')).status,401);
 assert.equal((await request('/auth/me',{session:s,headers:{Cookie:s.cookie+'; '+s.cookie}})).status,401);
});
test('pre-cookie JWT generation is rejected without deleting session history',async()=>{
 const s=await login();const {bt,...claims}=jwt.decode(s.value);
 const old=jwt.sign(claims,f.options.secret);const count=f.sessions.size;
 await assert.rejects(f.service.authenticate(old),{status:401});assert.equal(f.sessions.size,count);
});
test('logout revokes server session and never emits a late cookie deletion',async()=>{
 const a=await login(),b=await login('two');
 const out=await request('/auth/logout',{method:'POST',session:a});assert.equal(out.status,200);assert.equal(out.headers.get('set-cookie'),null);
 assert.equal((await request('/auth/me',{session:a})).status,401);
 assert.equal((await request('/auth/me',{session:b})).status,200);
});
test('database outage is 503 and does not delete the cookie',async()=>{
 const s=await login();f.flags.unavailable=true;
 try{const r=await request('/auth/me',{session:s});assert.equal(r.status,503);assert.equal(r.headers.get('set-cookie'),null);}
 finally{f.flags.unavailable=false;}
 assert.equal((await request('/auth/me',{session:s})).status,200);
});
test('password change revokes existing sessions and issues no cookie on its delayed response',async()=>{
 const a=await login('two'),b=await login('two');
 const r=await request('/usuarios/cambiar-password',{method:'PUT',session:a,body:{passwordActual:f.password,passwordNuevo:'Synthetic replacement 2026'}});
 assert.equal(r.status,200);assert.equal(r.headers.get('set-cookie'),null);
 for(const s of [a,b])assert.equal((await request('/auth/me',{session:s})).status,401);
});

test('clinical, financial, file and user mutations reject missing CSRF before controllers',async()=>{
 const session=await login();
 const routes=[['POST','/pacientes'],['PUT','/pacientes/1'],['DELETE','/pacientes/1'],
 ['POST','/historias/1/consultas'],['PUT','/historias/1/antecedentes'],['PUT','/historias/1/firmas'],
 ['POST','/historias/1/radiografias'],['POST','/historias/1/recetas'],['POST','/historias/1/ordenes-radiografia'],
 ['POST','/historias/consultas/1/pagos'],['POST','/citas'],['POST','/gastos'],
 ['POST','/laboratorio/consulta/1'],['POST','/laboratorio/1/pagos'],['POST','/usuarios'],
 ['PUT','/usuarios/mi-firma-sello'],['POST','/usuarios/reset-password']];
 for(const [method,route]of routes){
   const r=await request(route,{method,session:{...session,csrf:''},body:{}});
   assert.equal(r.status,403,route);assert.equal(r.body.codigo,'AUTH_CSRF_INVALID',route);
 }
});
test('cookie identity does not grant administrative permissions and DB roles remain authoritative',async()=>{
 const session=await login();
 assert.equal((await request('/usuarios',{session})).status,403);
 const fixtureUser=f.users.get('one');
 fixtureUser.is_admin=1;
 try{assert.equal((await request('/usuarios',{session})).status,200);}
 finally{fixtureUser.is_admin=0;}
 assert.equal((await request('/usuarios',{session})).status,403);
});

test('same-origin compiled/proxied loopback requests work without a fixed frontend port',async()=>{
 const r=await request('/auth/login',{method:'POST',body:{id:'one',password:f.password},headers:{Origin:base}});
 assert.equal(r.status,200);
 const denied=await request('/auth/login',{method:'POST',body:{id:'one',password:f.password},
   headers:{Origin:'http://localhost:59999','X-Forwarded-Host':'localhost:59999'}});
 assert.equal(denied.status,403);
});
