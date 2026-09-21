const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { createSessionService } = require('../../src/services/session.service');
const { createBrowserTransport } = require('../../src/services/browserTransport');

// Dedicated process only: real app/controllers/services, synthetic in-memory DB.
// Never import config/db or read a clinical environment file in this fixture.
function createCookieApp(origin = 'http://localhost:5173') {
  const password = 'Synthetic browser fixture 2026';
  const hash = bcrypt.hashSync(password, 10);
  const users = new Map(['one', 'two'].map(id => [id, {id, password_hash: hash, auth_version: 1,
    activo: 1, is_admin: 0, nivel: 1, rol: 'Doctor', nombre: 'Prueba', nombre_completo: 'Usuario sintetico',
    prefix: '', gender: 'o', especialidad: '', cop: ''}]));
  const sessions = new Map();
  const options = {secret: crypto.randomBytes(64).toString('hex'), issuer:'cookie-fixture', audience:'fixture', expiresIn:'8h'};
  const flags = { unavailable: false, loginCount: 0, logoutCount: 0 };
  const db = {
    async execute(sql, p) {
      if(flags.unavailable) throw Object.assign(Error('SYNTHETIC_OUTAGE'),{code:'ECONNREFUSED'});
      if(sql.startsWith('SELECT ') && sql.includes('FROM usuarios WHERE id = ?')) return [users.has(p[0]) ? [{...users.get(p[0])}] : []];
      if(sql.startsWith('SELECT ') && sql.includes('FROM seguridad_sesiones')) {
        const s=sessions.get(p[0].toString('hex'));return [s?[{...s}]:[]];
      }
      if(sql.startsWith('INSERT INTO seguridad_sesiones')) {
        sessions.set(p[0].toString('hex'),{usuario_id:p[1],auth_version:p[2],expira_epoch:p[3],revocada_en:null});return [{affectedRows:1}];
      }
      if(sql.startsWith('UPDATE seguridad_sesiones')) {
        for(const [key,s] of sessions) if(Buffer.isBuffer(p[0]) ? key===p[0].toString('hex') : s.usuario_id===p[0]) s.revocada_en=new Date();
        return [{affectedRows:1}];
      }
      if(sql.startsWith('UPDATE usuarios SET auth_version')) {users.get(p[0]).auth_version++;return [{affectedRows:1}];}
      if(sql.startsWith('UPDATE usuarios SET password_hash')) {users.get(p[1]).password_hash=p[0];return [{affectedRows:1}];}
      throw Error('UNEXPECTED_FIXTURE_QUERY');
    },
    async query(sql,p){
      if(flags.unavailable)throw Object.assign(Error('SYNTHETIC_OUTAGE'),{code:'ECONNREFUSED'});
      if(sql.includes('FROM usuarios WHERE id = ?')){
        const {password_hash,auth_version,...profile}=users.get(p[0]);return [[profile]];
      }
      return [[]];
    },
    async getConnection(){return{execute:db.execute,query:db.query,async beginTransaction(){},async commit(){},async rollback(){},release(){}};},
  };
  const service=createSessionService(db,options,async(_db,event)=>{
    if(event==='LOGIN_OK')flags.loginCount++;
    if(event==='LOGOUT')flags.logoutCount++;
  });
  const transport=createBrowserTransport({secret:options.secret,origins:[origin]});
  for(const [file,exports] of [
    ['../../src/config/db',db],['../../src/config/environment',{databaseOptions:()=>{throw Error('NO_SQL_ALLOWED');},tokenOptions:()=>options}],
    ['../../src/config/browserTransport',transport],['../../src/services/security',service],
    ['../../src/middleware/limitarAutenticacion',{limitAuthentication:()=> (_req,_res,next)=>next()}],
  ]) {const id=require.resolve(file);require.cache[id]={id,filename:id,loaded:true,exports};}
  const app=require('../../src/index');
  return {app,service,transport,options,flags,users,sessions,password};
}
module.exports={createCookieApp};
