const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');

module.exports = async function sessionBrowser({ browser, base, origin, root, mode, pass }) {
  const client = require('./helpers/cookie-client.cjs');
  const adminResponse = await fetch(base + '/api/auth/login', { method: 'POST',
    headers: client.headers(base), body: JSON.stringify({ id: 'qaadmin', password: pass }) });
  assert.equal(adminResponse.status, 200);
  const admin = await client.response(adminResponse);
  const id = 'qa_browser_secure_' + mode;
  const created = await fetch(base + '/api/usuarios', { method: 'POST', headers: client.headers(base,admin.token),
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
    assert.equal(await page.evaluate(() => localStorage.getItem('token')), null);
    const stored = (await context.cookies()).find(c => c.name === client.COOKIE_NAME);
    assert(stored?.httpOnly && stored.sameSite === 'Strict');
    assert.equal(await page.evaluate(() => document.cookie.includes('micodent_dev_session_v2')), false);
    return stored.value;
  };
  const valid = token => fetch(base + '/api/auth/me', { headers: client.headers(base,token) });
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
    await login(next);
    await page.goto(origin + '/perfil');
    await page.locator('input[name=currentPass]').fill('borrador-local');
    await page.locator('input[name=newPass]').fill('Clave futura sintetica 2026');
    await page.locator('input[name=confirmPass]').fill('Clave futura sintetica 2026');
    await page.route('**/api/usuarios/cambiar-password', route => route.fulfill({ status: 503,
      json: { ok: false, mensaje: 'Interrupcion sintetica' } }));
    await page.getByRole('button', { name: 'Cambiar Contraseña', exact: true }).click();
    await page.getByText('Interrupcion sintetica', { exact: true }).waitFor();
    assert.equal(await page.locator('input[name=currentPass]').inputValue(), 'borrador-local');
    await page.unroute('**/api/usuarios/cambiar-password');
    const other = await context.newPage();
    await other.goto(origin + '/');
    await other.getByRole('button', { name: 'Menú de perfil', exact: true }).click();
    await other.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
    await page.getByRole('alertdialog').waitFor();
    assert.equal(await page.locator('input[name=currentPass]').isVisible(), false);
    assert.equal(await page.locator('input[name=currentPass]').inputValue(), 'borrador-local');
    await page.screenshot({ path: path.join(root, mode + '-s1b-bloqueo.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(root, mode + '-s1b-bloqueo-mobile.png') });
    await other.close();
    await page.setViewportSize({ width: 1280, height: 720 });
    await login(next);
    await page.goto(origin + '/perfil');
    await page.locator('input[name=currentPass]').fill(next);
    await page.locator('input[name=newPass]').fill('No debe guardarse 2026');
    await page.locator('input[name=confirmPass]').fill('No debe guardarse 2026');
    // Change only the cookie, deliberately before any storage notification.
    const switchAccount = await context.request.post(origin + '/api/auth/login', {
      headers: { Origin: origin, 'X-Micodent-Client': 'web' }, data: { id: 'qaadmin', password: pass } });
    assert.equal(switchAccount.status(), 200);
    const mismatch = page.waitForResponse(r => r.url().endsWith('/api/usuarios/cambiar-password'));
    await page.getByRole('button', { name: 'Cambiar Contraseña', exact: true }).click();
    assert.equal((await mismatch).status(), 409);
    await page.getByRole('alertdialog').waitFor();
    const fresh = await context.newPage();
    await fresh.goto(origin + '/');
    await fresh.getByRole('button', { name: 'Menú de perfil', exact: true }).click();
    await fresh.getByRole('link', { name: 'Administración de Personal', exact: true }).waitFor();
    assert.equal(await fresh.evaluate(() => localStorage.getItem('token')), null);
    await fresh.close();
    assert.deepEqual(errors, []);
    return { wrongPasswordPreservesSession: 'PASS', passwordChangeRevokes: 'PASS', newPasswordLogin: 'PASS', logoutRevokes: 'PASS',
      httpOnlyCookie: 'PASS', noStoredJWT: 'PASS', outagePreservesDraft: 'PASS', crossTabLogout: 'PASS', cookieRaceRejected: 'PASS' };
  } finally { await context.close(); }
};
