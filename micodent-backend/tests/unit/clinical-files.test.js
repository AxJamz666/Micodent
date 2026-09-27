const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const express = require('express');
const { clinicalFileHandler, storedName } = require('../../src/services/clinicalFiles');
const f = require('../helpers/cookie-app.cjs').createCookieApp();
const { verificarToken } = require('../../src/middleware/auth');
const { COOKIE_NAME } = require('../../src/services/browserTransport');
let root, server, base, token, session;
let stored = '/uploads/rad_123.PNG';
const bytes = Buffer.from('synthetic file bytes');
const db = { async execute(sql, params) {
  assert(sql.includes('INNER JOIN historias_clinicas'));
  assert.deepEqual(params, ['1']);
  if (stored === 'unavailable') throw Object.assign(Error('private query parameters'), {code:'ECONNREFUSED'});
  return [stored === null ? [] : [{url_archivo:stored}]];
} };
test.before(async () => {
  root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'micodent-files-'));
  fs.writeFileSync(path.join(root,'rad_123.PNG'), bytes);
  const app = express();
  app.use('/api', f.transport.boundary);
  app.get('/api/files/:id', verificarToken, clinicalFileHandler({db,root}));
  server=app.listen(0,'127.0.0.1'); await require('node:events').once(server,'listening');
  base='http://127.0.0.1:'+server.address().port;
  ({token} = await f.service.login('one',f.password));session=f.transport.session(token);
});
test.after(async () => {
  if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}
  const actual=fs.realpathSync(root);
  if(path.dirname(actual)!==fs.realpathSync(os.tmpdir())||!path.basename(actual).startsWith('micodent-files-'))throw Error('CLEANUP_GUARD');
  fs.rmSync(actual,{recursive:true});
});
function headers(){return {Cookie:`${COOKIE_NAME}=${token}`,'X-Micodent-Client':'web','X-Micodent-Session':session.id};}
test('private file requires both live cookie and matching tab identity',async()=>{
  assert.equal((await fetch(base+'/api/files/1')).status,401);
  assert.equal((await fetch(base+'/api/files/1',{headers:{Cookie:`${COOKIE_NAME}=${token}`}})).status,409);
  const b=await f.service.login('two',f.password);
  assert.equal((await fetch(base+'/api/files/1',{headers:{...headers(),Cookie:`${COOKIE_NAME}=${b.token}`}})).status,409);
});
test('streams existing bytes with private no-store, no sniffing, and safe disposition',async()=>{
  const r=await fetch(base+'/api/files/1',{headers:headers()});assert.equal(r.status,200);
  assert.deepEqual(Buffer.from(await r.arrayBuffer()),bytes);
  assert.equal(r.headers.get('cache-control'),'private, no-store');
  assert.equal(r.headers.get('content-type'),'image/png');
  assert.equal(r.headers.get('content-disposition'),'attachment; filename="anexo-1.png"');
  assert.equal(r.headers.get('x-content-type-options'),'nosniff');
  assert.equal(r.headers.get('etag'),null);
  assert.deepEqual(fs.readFileSync(path.join(root,'rad_123.PNG')),bytes);
});
test('paths cannot escape, use alternate streams, fetch remote URLs or serve active HTML/SVG',()=>{
  for(const input of ['/uploads/../secret.png','/uploads/a\\b.png','/uploads/%2e%2e.png',
    '/uploads/a.png:secret','/uploads/a.svg','/uploads/a.html','/uploads/con.jpg','/uploads/a.png ',
    'https://example.invalid/a.png','data:image/png;base64,AA==']) assert.throws(()=>storedName(input),{status:404});
  assert.equal(storedName('/uploads/rad_123.PDF'),'rad_123.PDF');
});
test('unknown records, missing bytes and invalid ids return generic errors without modifying files',async()=>{
  for(const value of [null,'/uploads/missing.jpg','/uploads/../private.png']) {
    stored=value;const r=await fetch(base+'/api/files/1',{headers:headers()});assert.equal(r.status,404);
    assert.equal((await r.json()).codigo,'CLINICAL_FILE_UNAVAILABLE');
  }
  stored='/uploads/rad_123.PNG';
  for(const id of ['0','-1','1e3','9007199254740993'])assert.equal((await fetch(base+'/api/files/'+id,{headers:headers()})).status,404);
});
test('database failure is sanitized and never produces file bytes',async()=>{
  stored='unavailable';const r=await fetch(base+'/api/files/1',{headers:headers()});assert.equal(r.status,503);
  assert(!(await r.text()).includes('private query'));stored='/uploads/rad_123.PNG';
});
test('revoked sessions cannot read previously accessible files',async()=>{
  await f.service.logout((await f.service.authenticate(token)).auth);
  assert.equal((await fetch(base+'/api/files/1',{headers:headers()})).status,401);
});
