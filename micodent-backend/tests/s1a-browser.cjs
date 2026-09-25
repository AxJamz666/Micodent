const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');

module.exports = async function sessionBrowser({ browser, base, origin, root, mode, pass }) {
  const adminResponse = await fetch(base + '/api/auth/login', { method: 'POST',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'qaadmin', password: pass }) });
  assert.equal(adminResponse.status, 200);
  const admin = await adminResponse.json();
  const id = 'qa_browser_secure_' + mode;
  const created = await fetch(base + '/api/usuarios', { method: 'POST', headers: {
    'Content-Type': 'application/json', Authorization: 'Bearer ' + admin.token },
  body: JSON.stringify({ id, password: pass, nombre: 'Prueba', nombre_completo: 'Cuenta sintetica navegador',
    rol: 'Asistente', nivel: 1 }) });
  assert.equal(created.status, 201);
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.name));
  const login = async password => {
    await page.goto(origin + '/login');
    await page.locator('input').nth(0).fill(id);
    await page.locator('input').nth(1).fill(password);
    await page.locator('button[type=submit]').click();
    await page.waitForURL(origin + '/');
    return page.evaluate(() => localStorage.getItem('token'));
  };
  const valid = token => fetch(base + '/api/auth/me', { headers: { Authorization: 'Bearer ' + token } });
  try {
    const oldToken = await login(pass);
    await page.goto(origin + '/perfil');
    await page.locator('input[name=currentPass]').waitFor();
    await page.screenshot({ path: path.join(root, mode + '-s1a-perfil.png') });
    const next = crypto.randomBytes(18).toString('hex');
    await page.locator('input[name=currentPass]').fill('incorrecta');
    await page.locator('input[name=newPass]').fill(next);
    await page.locator('input[name=confirmPass]').fill(next);
    const rejected = page.waitForResponse(r => r.url().endsWith('/api/usuarios/cambiar-password'));
    await page.getByRole('button', { name: 'Cambiar Contraseña', exact: true }).click();
    assert.equal((await rejected).status(), 400);
    assert.equal((await valid(oldToken)).status, 200);
    await page.locator('input[name=currentPass]').fill(pass);
    const changed = page.waitForResponse(r => r.url().endsWith('/api/usuarios/cambiar-password'));
    await page.getByRole('button', { name: 'Cambiar Contraseña', exact: true }).click();
    assert.equal((await changed).status(), 200);
    await page.waitForURL(origin + '/login');
    assert.equal((await valid(oldToken)).status, 401);
    const currentToken = await login(next);
    await page.getByRole('button', { name: 'Menú de perfil', exact: true }).click();
    await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
    await page.waitForURL(origin + '/login');
    assert.equal((await valid(currentToken)).status, 401);
    assert.deepEqual(errors, []);
    return { wrongPasswordPreservesSession: 'PASS', passwordChangeRevokes: 'PASS', newPasswordLogin: 'PASS', logoutRevokes: 'PASS' };
  } finally { await context.close(); }
};
