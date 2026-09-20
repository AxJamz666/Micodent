const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
if (process.env.S1A_TEST_MODE !== 'isolated' || process.env.DB_PORT !== '3308'
    || process.env.DB_NAME !== 'micodent_dev' || !process.env.TEST_SERVER_UUID
    || process.env.TEST_SERVER_UUID === 'd30b3b32-6881-11f1-9cad-0250447c4405') {
  throw new Error('INTEGRATION_TESTS_REQUIRE_ISOLATED_MYSQL');
}
const db = require('../../src/config/db');
const app = require('../../src/index');
const security = require('../../src/services/security');
const { createSessionService } = require('../../src/services/session.service');
const { tokenOptions } = require('../../src/config/environment');
const password = 'Clave sintetica de pruebas 2026!';
const newPassword = 'Otra clave sintetica segura 2026!';
const prefix = 'qa_s1a_' + crypto.randomBytes(4).toString('hex') + '_';
let server, base, owner, admin, staff;
async function seed(label, level = 1, role = 'Asistente', active = 1, hash = null) {
  const id = prefix + label;
  await db.execute("INSERT INTO usuarios (id,password_hash,nombre,nombre_completo,rol,is_admin,nivel,activo,prefix,gender) VALUES (?,?,'Prueba','Cuenta sintetica S1A',?,?,?,?,'','o')",
    [id, hash || await bcrypt.hash(password, 10), role, level >= 2, level, active]);
  return id;
}
async function request(method, route, token, body) {
  const response = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, headers: response.headers, body: await response.json() };
}
async function login(id, value = password) {
  const result = await request('POST', '/auth/login', null, { id, password: value });
  assert.equal(result.status, 200, 'Synthetic account must authenticate');
  assert.equal(typeof result.body.token, 'string');
  return result.body.token;
}
async function credentials(id) {
  const [[row]] = await db.execute('SELECT password_hash,auth_version FROM usuarios WHERE id=?', [id]);
  return row;
}
test.before(async () => {
  const [[identity]] = await db.query('SELECT @@port AS port,@@server_uuid AS uuid,DATABASE() AS db');
  assert.equal(identity.port, 3308); assert.equal(identity.uuid, process.env.TEST_SERVER_UUID);
  assert.equal(identity.db, 'micodent_dev');
  await require('../../scripts/migrate-s1a').verifyApplied(db);
  owner = await seed('owner', 3, 'Doctor'); admin = await seed('admin', 2, 'Administradora'); staff = await seed('staff');
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  base = 'http://127.0.0.1:' + server.address().port + '/api';
});
test.beforeEach(async () => {
  // Guards above restrict cleanup to the disposable instance, never normal DEV.
  await db.query('DELETE FROM seguridad_intentos');
});
test.after(async () => {
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  await db.end();
});
test('registered JWT has no profile claims; me excludes secrets', async () => {
  const token = await login(owner); const claims = jwt.decode(token);
  assert.equal(claims.sub, owner);
  assert.ok(!('rol' in claims) && !('isAdmin' in claims) && !('nombre' in claims));
  const me = await request('GET', '/auth/me', token);
  assert.equal(me.status, 200); assert.ok(!Object.hasOwn(me.body.usuario, 'password_hash'));
  assert.equal(me.headers.get('cache-control'), 'no-store');
});
test('malformed credentials reject cleanly; nonexistent and wrong credentials share response', async () => {
  for (const body of [{ id: {}, password }, { id: staff, password: {} }, { id: staff, password: '' }]) {
    assert.equal((await request('POST', '/auth/login', null, body)).status, 400);
  }
  const missing = await request('POST', '/auth/login', null, { id: prefix + 'absent', password });
  const wrong = await request('POST', '/auth/login', null, { id: staff, password: 'incorrecta' });
  assert.equal(wrong.status, 401); assert.deepEqual(wrong.body, missing.body);
});
test('plaintext, malformed hashes and inactive accounts cannot authenticate', async () => {
  for (const id of [await seed('plain', 1, 'Asistente', 1, password),
    await seed('bad_hash', 1, 'Asistente', 1, '$2-invalid'), await seed('inactive', 1, 'Asistente', 0)]) {
    assert.equal((await request('POST', '/auth/login', null, { id, password })).status, 401);
  }
});
test('legacy, expired, wrong-audience and newly forged JWTs are rejected', async () => {
  const token = await login(staff); const claims = jwt.decode(token); const opts = tokenOptions();
  const { exp, iat, ...payload } = claims;
  const candidates = [token + 'x', jwt.sign({ id: staff, isAdmin: true }, opts.secret, { expiresIn: '1h' }),
    jwt.sign({ ...payload, exp: 1 }, opts.secret), jwt.sign({ ...payload, aud: 'other', exp }, opts.secret),
    jwt.sign({ ...payload, rol: 'Doctor', exp }, opts.secret), jwt.sign({ ...payload, exp }, opts.secret, { algorithm: 'HS384' })];
  for (const bad of candidates) assert.equal((await request('GET', '/auth/me', bad)).status, 401);
});
test('database permissions override token and browser state', async () => {
  const id = await seed('demoted', 2, 'Doctor'); const token = await login(id);
  assert.equal((await request('GET', '/usuarios', token)).status, 200);
  await db.execute("UPDATE usuarios SET is_admin=0,nivel=1,rol='Asistente' WHERE id=?", [id]);
  assert.equal((await request('GET', '/usuarios', token)).status, 403);
  assert.equal((await request('GET', '/auth/me', token)).status, 200);
  assert.equal((await request('PUT', '/historias/1/antecedentes', token, {})).status, 403);
  await db.execute('UPDATE usuarios SET activo=0 WHERE id=?', [id]);
  assert.equal((await request('GET', '/auth/me', token)).status, 401);
});
test('logout revokes one session; logout-all revokes all persistently', async () => {
  const id = await seed('logout'); const one = await login(id), two = await login(id);
  assert.equal((await request('POST', '/auth/logout', one)).status, 200);
  assert.equal((await request('GET', '/auth/me', one)).status, 401);
  assert.equal((await request('GET', '/auth/me', two)).status, 200);
  assert.equal((await request('POST', '/auth/logout-all', two)).status, 200);
  await assert.rejects(createSessionService(db, tokenOptions()).authenticate(two), { status: 401 });
});
test('password change rejects invalid inputs and revokes every old session', async () => {
  const id = await seed('change'); const one = await login(id), two = await login(id); const before = await credentials(id);
  for (const value of ['', {}, 'short', 'x'.repeat(73)]) {
    assert.equal((await request('PUT', '/usuarios/cambiar-password', one, { passwordActual: password, passwordNuevo: value })).status, 400);
  }
  assert.equal((await request('PUT', '/usuarios/cambiar-password', one, { passwordActual: 'wrong', passwordNuevo: newPassword })).status, 400);
  assert.ok(JSON.stringify(await credentials(id)) === JSON.stringify(before));
  assert.equal((await request('PUT', '/usuarios/cambiar-password', one, { passwordActual: password, passwordNuevo: newPassword })).status, 200);
  for (const token of [one, two]) assert.equal((await request('GET', '/auth/me', token)).status, 401);
  assert.equal((await request('POST', '/auth/login', null, { id, password })).status, 401);
  await login(id, newPassword);
});
test('reset requires admin password and a lower-level target', async () => {
  const target = await seed('reset_target'); const targetToken = await login(target);
  const adminToken = await login(admin); const before = await credentials(target);
  const reset = (targetUserId, adminPassword) => request('POST', '/usuarios/reset-password', adminToken,
    { targetUserId, adminPassword, nuevaPassword: newPassword });
  assert.equal((await reset(target, 'wrong')).status, 400);
  assert.equal((await reset(owner, password)).status, 403);
  assert.equal((await reset(admin, password)).status, 403);
  assert.ok(JSON.stringify(before) === JSON.stringify(await credentials(target)));
  assert.equal((await reset(target, password)).status, 200);
  assert.equal((await request('GET', '/auth/me', targetToken)).status, 401);
  assert.equal((await request('GET', '/auth/me', adminToken)).status, 200);
  await login(target, newPassword);
});
test('general editing cannot bypass password reauthentication', async () => {
  const token = await login(owner); const before = await credentials(staff);
  for (const value of ['', newPassword]) assert.equal((await request('PUT', '/usuarios/' + staff, token, { password: value })).status, 400);
  assert.ok(JSON.stringify(before) === JSON.stringify(await credentials(staff)));
});
test('editing owner profile preserves level 3 and current session', async () => {
  const token = await login(owner);
  const result = await request('PUT', '/usuarios/' + owner, token, {
    nombre: 'Prueba', nombre_completo: 'Cuenta sintetica S1A', prefix: '', gender: 'o', rol: 'Doctor',
    dni: null, telefono: null, email: null, especialidad: '', cop: '', direccion: '', nivel: 3 });
  assert.equal(result.status, 200);
  const me = await request('GET', '/auth/me', token);
  assert.equal(me.status, 200); assert.equal(me.body.usuario.nivel, 3); assert.equal(me.body.usuario.is_admin, 1);
});
test('creation enforces password policy and level boundaries', async () => {
  const token = await login(owner); const id = prefix + 'created';
  const data = { id, nombre: 'Prueba', nombre_completo: 'Cuenta sintetica', rol: 'Asistente', nivel: 1, password: 'short' };
  assert.equal((await request('POST', '/usuarios', token, data)).status, 400);
  data.password = password; data.nivel = -1;
  assert.equal((await request('POST', '/usuarios', token, data)).status, 400);
  data.nivel = 1;
  assert.equal((await request('POST', '/usuarios', token, data)).status, 201); await login(id);
});
test('two simultaneous personal password changes cannot both commit', async () => {
  const id = await seed('concurrent_change'); const token = await login(id);
  const results = await Promise.all([newPassword, newPassword + '2'].map(passwordNuevo =>
    request('PUT', '/usuarios/cambiar-password', token, { passwordActual: password, passwordNuevo })));
  assert.equal(results.filter(r => r.status === 200).length, 1);
  assert.equal(results.filter(r => [401, 409].includes(r.status)).length, 1);
  assert.equal((await request('GET', '/auth/me', token)).status, 401);
});
test('login racing reset cannot leave a usable old-password session', async () => {
  const id = await seed('racing_login'); const actor = await login(owner);
  const [reset, ...attempts] = await Promise.all([
    request('POST', '/usuarios/reset-password', actor, { targetUserId: id, adminPassword: password, nuevaPassword: newPassword }),
    ...Array.from({ length: 3 }, () => request('POST', '/auth/login', null, { id, password }))]);
  assert.equal(reset.status, 200);
  for (const r of attempts) if (r.status === 200) assert.equal((await request('GET', '/auth/me', r.body.token)).status, 401);
  await login(id, newPassword);
});
test('audit failure rolls back password and revocation together', async () => {
  const id = await seed('audit_failure'); const token = await login(id);
  const { auth } = await security.authenticate(token); const before = await credentials(id);
  const failing = createSessionService(db, tokenOptions(), async () => { throw new Error('SIMULATED_AUDIT_FAILURE'); });
  await assert.rejects(failing.changePassword(auth, password, newPassword), /SIMULATED_AUDIT_FAILURE/);
  assert.ok(JSON.stringify(before) === JSON.stringify(await credentials(id)));
  assert.equal((await request('GET', '/auth/me', token)).status, 200);
});
test('unavailable database returns 503, not false invalid credentials', async () => {
  const token = await login(staff); const execute = db.execute;
  db.execute = async () => { throw Object.assign(new Error('sensitive internal details'), { code: 'ECONNREFUSED' }); };
  try {
    const result = await request('GET', '/auth/me', token);
    assert.equal(result.status, 503); assert.equal(result.body.codigo, 'AUTH_UNAVAILABLE');
    assert.ok(!JSON.stringify(result.body).includes('sensitive'));
  } finally { db.execute = execute; }
  assert.equal((await request('GET', '/auth/me', token)).status, 200);
});
test('attempt limits survive a fresh Node process and return Retry-After', async () => {
  for (let i = 0; i < 20; i++) assert.equal((await request('POST', '/auth/login', null, { id: staff, password: 'wrong' })).status, 401);
  const blocked = await request('POST', '/auth/login', null, { id: staff, password: 'wrong' });
  assert.equal(blocked.status, 429); assert.ok(Number(blocked.headers.get('retry-after')) > 0);
  const script = "const {RateLimiterMySQL}=require('rate-limiter-flexible');const db=require('./src/config/db');const l=new RateLimiterMySQL({storeClient:db.pool,storeType:'pool',dbName:'micodent_dev',tableName:'seguridad_intentos',tableCreated:true,clearExpiredByTimeout:false,keyPrefix:'auth-account',points:20,duration:900});l.get(process.argv[1]).then(r=>{if(!r||r.consumedPoints<21)process.exitCode=1;}).catch(()=>{process.exitCode=1;}).finally(()=>db.end());";
  const child = cp.spawnSync(process.execPath, ['-e', script, crypto.createHash('sha256').update(staff).digest('hex')],
    { cwd: require('node:path').resolve(__dirname, '../..'), env: process.env, timeout: 10000 });
  assert.equal(child.status, 0, 'Rate limit must persist in MySQL');
});
test('authenticated read workflows preserve existing API contracts', async () => {
  const token = await login(owner);
  for (const route of ['/pacientes', '/historias', '/usuarios', '/usuarios/doctores', '/dashboard/stats',
    '/dashboard/financiero?desde=2020-01-01&hasta=2030-12-31', '/citas?desde=2020-01-01&hasta=2030-12-31',
    '/gastos?desde=2020-01-01&hasta=2030-12-31', '/laboratorio/trabajos', '/auditoria-financiera']) {
    assert.equal((await request('GET', route, token)).status, 200, route);
  }
});
