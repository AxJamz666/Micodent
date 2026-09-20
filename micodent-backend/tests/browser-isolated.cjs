const fs = require('node:fs');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const net = require('node:net');
const path = require('node:path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const root = path.resolve(__dirname, '../..');
const out = process.env.S1A_TEST_EVIDENCE;
if (!out || !process.env.S1A_PLAYWRIGHT) throw new Error('ISOLATED_TEST_CONFIGURATION_REQUIRED');
const { chromium } = require(process.env.S1A_PLAYWRIGHT);
const secrets = JSON.parse(fs.readFileSync(path.join(out, 'credentials.json')));
const { rootPassword, ...env } = secrets;
const children = [];
let db, browser;
const results = [];
async function free(port) {
  await new Promise((resolve, reject) => {
    const s = net.createServer(); s.once('error', reject);
    s.listen(port, '127.0.0.1', () => s.close(resolve));
  });
}
async function ready(url) {
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(url)).ok) return; } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error('SERVER_NOT_READY');
}
async function main() {
  assert.equal(env.DB_PORT, '3308');
  assert.equal(env.DB_NAME, 'micodent_dev');
  assert.equal(env.TEST_SERVER_UUID, '2e686779-b08b-11f1-a09d-9c6b002457fe');
  await free(4401); await free(5173);
  db = await mysql.createConnection({ host: '127.0.0.1', port: 3308, user: env.DB_USER, password: env.DB_PASSWORD, database: 'micodent_dev' });
  const [[identity]] = await db.query('SELECT @@server_uuid AS uuid,@@port AS port');
  assert.equal(identity.uuid, env.TEST_SERVER_UUID); assert.equal(identity.port, 3308);
  const id = 'qa_browser_' + crypto.randomBytes(5).toString('hex');
  const password = 'Prueba visual S1A inicial 2026!';
  const next = 'Prueba visual S1A siguiente 2026!';
  await db.execute("INSERT INTO usuarios (id,password_hash,nombre,nombre_completo,rol,is_admin,nivel,activo,prefix,gender) VALUES (?,?,'PruebaNavegador','Cuenta sintetica S1A','Asistente',0,1,1,'','o')", [id, await bcrypt.hash(password, 10)]);
  await db.query('DELETE FROM seguridad_intentos');
  children.push(cp.spawn(process.execPath, ['src/index.js'], { cwd: root + '/micodent-backend', env: { ...process.env, ...env, PORT: '4401' }, stdio: 'ignore', windowsHide: true }));
  children.push(cp.spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], { cwd: root + '/micodent-frontend', env: { ...process.env, VITE_API_BASE_URL: 'http://127.0.0.1:4401/api' }, stdio: 'ignore', windowsHide: true }));
  await ready('http://127.0.0.1:4401/api/ping'); await ready('http://127.0.0.1:5173');
  browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = []; page.on('pageerror', e => errors.push(e.name));
  await page.goto('http://localhost:5173/login');
  await page.locator('img[alt="Logo Micodent"]').waitFor();
  assert.ok(await page.locator('img[alt="Logo Micodent"]').evaluate(el => el.complete && el.naturalWidth > 0));
  await page.screenshot({ path: out + '/login-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.screenshot({ path: out + '/login-mobile.png', fullPage: true });
  results.push('Login desktop/mobile and logo: PASS');
  await page.setViewportSize({ width: 1440, height: 1000 });
  async function login(pass) {
    await page.locator('input[type=text]').fill(id);
    await page.locator('input[type=password]').fill(pass);
    await page.getByRole('button', { name: 'Entrar al Sistema' }).click();
    await page.waitForURL('http://localhost:5173/');
  }
  await login(password);
  const oldToken = await page.evaluate(() => localStorage.getItem('token'));
  await page.goto('http://localhost:5173/perfil');
  await page.locator('input[name=currentPass]').fill(password);
  await page.locator('input[name=newPass]').fill(next);
  await page.locator('input[name=confirmPass]').fill(next);
  await page.getByRole('button', { name: 'Cambiar Contrase\u00f1a', exact: true }).click();
  await page.waitForURL('**/login');
  assert.equal(await page.evaluate(() => localStorage.getItem('token')), null);
  assert.equal((await fetch('http://127.0.0.1:4401/api/auth/me', { headers: { Authorization: 'Bearer ' + oldToken } })).status, 401);
  results.push('Personal password change redirects and revokes old JWT: PASS');
  await login(next);
  await page.goto('http://localhost:5173/perfil');
  await page.locator('input[name=currentPass]').waitFor();
  await page.screenshot({ path: out + '/profile-synthetic.png', fullPage: true });
  const currentToken = await page.evaluate(() => localStorage.getItem('token'));
  await page.evaluate(() => localStorage.setItem('unrelated', 'preserve'));
  await page.route('**/api/auth/logout', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false, mensaje: 'Prueba de indisponibilidad' }) }));
  await page.getByRole('button', { name: 'PruebaNavegador', exact: true }).click();
  await page.getByRole('button', { name: 'Cerrar sesi\u00f3n' }).click();
  await page.getByText('No se pudo confirmar el cierre de sesi\u00f3n. Intenta nuevamente.').waitFor();
  assert.ok(await page.evaluate(token => localStorage.getItem('token') === token, currentToken));
  results.push('Unavailable logout preserves session and reports failure: PASS');
  await page.unroute('**/api/auth/logout');
  await page.getByRole('button', { name: 'Cerrar sesi\u00f3n' }).click();
  await page.waitForURL('**/login');
  assert.equal(await page.evaluate(() => localStorage.getItem('token')), null);
  assert.equal(await page.evaluate(() => localStorage.getItem('unrelated')), 'preserve');
  assert.equal((await fetch('http://127.0.0.1:4401/api/auth/me', { headers: { Authorization: 'Bearer ' + currentToken } })).status, 401);
  results.push('Server logout and selective browser cleanup: PASS');
  assert.equal(errors.length, 0);
  results.push('No browser JavaScript exceptions: PASS');
}
main().then(() => {
  fs.writeFileSync(out + '/browser-results.json', JSON.stringify({ date: new Date().toISOString(), results }, null, 2));
  console.log(JSON.stringify(results));
}).catch(e => {
  console.error('BROWSER_CHECK_FAILED: ' + e.name + ' ' + String(e.message).replace(/[\r\n].*/s, '').slice(0, 250));
  process.exitCode = 1;
}).finally(async () => {
  if (browser) await browser.close();
  for (const p of children) {
    if (p.exitCode === null) { const ended = new Promise(r => p.once('exit', r)); p.kill(); await ended; }
  }
  if (db) await db.end();
});
