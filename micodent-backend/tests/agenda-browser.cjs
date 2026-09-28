const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async ({ browser, base, root, pass }) => {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(`${base}/login`);
    await page.locator('input').nth(0).fill('qaadmin');
    await page.locator('input').nth(1).fill(pass);
    await page.locator('button[type=submit]').click();
    await page.waitForURL(base + '/');
    await page.goto(`${base}/agenda`);
    await page.getByRole('heading', { name: 'Agenda de Citas' }).waitFor();
    await page.screenshot({ path: path.join(root, 'agenda-desktop.png') });

    const fill = async name => {
      await page.getByRole('button', { name: 'Nueva Cita', exact: true }).click();
      const modal = page.locator('.dialog-overlay');
      await modal.locator('input').nth(1).fill(name);
      await modal.locator('input').nth(2).fill('900000001');
      await modal.locator('select').nth(0).selectOption('qadoctor');
      await modal.locator('select').nth(1).selectOption('09:00');
      return modal;
    };
    let modal = await fill('Reserva visual QA');
    const search = page.waitForResponse(r => r.url().includes('/api/pacientes?')
      && r.url().includes('limit=6') && r.request().method() === 'GET');
    await modal.locator('input').nth(0).fill('Sintetico');
    assert.equal((await search).status(), 200);
    await modal.locator('input').nth(0).fill('');
    const created = page.waitForResponse(r => r.url().endsWith('/api/citas') && r.request().method() === 'POST');
    await modal.getByRole('button', { name: 'Agendar Cita' }).click();
    assert.equal((await created).status(), 201);
    await modal.waitFor({ state: 'detached' });
    await page.getByText('Reserva visual QA', { exact: true }).waitFor();
    await page.getByText('Cita agendada correctamente.', { exact: true }).waitFor({ state: 'detached' });

    modal = await fill('Reserva duplicada QA');
    const conflict = page.waitForResponse(r => r.url().endsWith('/api/citas') && r.request().method() === 'POST');
    await modal.getByRole('button', { name: 'Agendar Cita' }).click();
    assert.equal((await conflict).status(), 409);
    await page.getByText('Ya existe una cita en ese horario para este doctor.', { exact: true }).waitFor();
    await page.waitForTimeout(350);
    assert.equal(await modal.count(), 1);
    await page.setViewportSize({ width: 390, height: 844 });
    const box = await modal.locator(':scope > div').boundingBox();
    assert(box && box.x >= 0 && box.x + box.width <= 390, 'The agenda dialog must fit the mobile viewport');
    await page.screenshot({ path: path.join(root, 'agenda-conflict-mobile.png') });
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(root, 'agenda-browser.json'), JSON.stringify({ create: 'PASS', conflict: 'PASS', desktop: 1366, mobile: 390, errors }, null, 2));
    console.log('PASS E09 navegador: reserva, conflicto visible y movil');
  } finally { await context.close(); }
};
