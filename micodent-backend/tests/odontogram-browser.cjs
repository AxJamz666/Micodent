const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async ({ browser, origin, root, pass, conn, mode }) => {
  const [created] = await conn.query(`INSERT INTO odontograma_items
    (historia_id,pieza,cara,estado_codigo,estado_nombre,color,notas,registrado_por,firmado_en,bloqueada)
    VALUES (1,'48','Toda la pieza','qa_browser','Hallazgo visual QA','red',?,'qaadmin',NOW(),1)`, ['Nota original QA']);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(`${origin}/login`);
    await page.locator('input').nth(0).fill('qaadmin');
    await page.locator('input').nth(1).fill(pass);
    const login = page.waitForResponse(r => r.url().endsWith('/api/auth/login') && r.request().method() === 'POST');
    await page.locator('button[type=submit]').click();
    assert.equal((await login).status(), 200, `Login ${mode} must succeed`);
    await page.waitForURL(origin + '/');
    await page.goto(`${origin}/pacientes/1?tab=odontograma`);
    await page.getByRole('button', { name: 'Odontograma', exact: true }).click();
    const tooth = page.getByText('48', { exact: true }).locator('..');
    await tooth.locator('[title="Tiene diagnóstico"]').waitFor();
    await tooth.locator('.cursor-pointer').click();
    await page.getByText('Hallazgo visual QA', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Anular por error de pieza', exact: true }).click();
    await page.getByLabel('Motivo de la anulación', { exact: true }).fill('Pieza incorrecta, revisión visual QA');
    const response = page.waitForResponse(r => r.url().endsWith(`/odontograma-items/${created.insertId}`) && r.request().method() === 'DELETE');
    await page.getByRole('button', { name: 'Confirmar anulación', exact: true }).click();
    assert.equal((await response).status(), 200);
    const history = page.getByTestId('odontograma-anulado');
    await history.locator('summary').click();
    await history.getByText('Pieza incorrecta, revisión visual QA', { exact: true }).waitFor();
    assert.equal(await tooth.locator('[title="Tiene diagnóstico"]').count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Anular por error de pieza' }).count(), 0);
    const row = history.locator('li').filter({ hasText: 'Hallazgo visual QA' });
    assert((await row.innerText()).includes('Nota original QA'));
    assert.equal(await row.locator('button,textarea,input').count(), 0);
    for (const width of [1366, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await row.scrollIntoViewIfNeeded();
      const box = await history.boundingBox();
      assert(box && box.x >= 0 && box.x + box.width <= width, 'Annulment history must fit the viewport');
      assert(await row.evaluate(el => el.scrollWidth <= el.clientWidth), 'Trace text must wrap');
      await page.screenshot({ path: path.join(root, `m07d-${mode}-${width}.png`) });
    }
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto(`${origin}/historias?view=1`);
    await page.locator('.hoja-impresion').first().waitFor();
    assert.equal(await page.getByText('Hallazgo visual QA', { exact: true }).count(), 0);
    const printedTooth = page.getByText('48', { exact: true }).locator('..');
    assert.equal(await printedTooth.locator('[title="Tiene diagnóstico"]').count(), 0);
    await page.emulateMedia({ media: 'print' });
    await page.screenshot({ path: path.join(root, `m07d-${mode}-print.png`), fullPage: true });
    const [[preserved]] = await conn.query('SELECT notas FROM odontograma_items WHERE id=?', [created.insertId]);
    assert.equal(preserved.notas, 'Nota original QA');
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(root, `m07d-${mode}-browser.json`), JSON.stringify({ annulment: 'PASS', trace: 'PASS', widths: [1366,390], print: 'PASS', errors }, null, 2));
    console.log(`PASS M07-D navegador ${mode}: anulacion, trazabilidad, responsive e impresion`);
  } catch (error) {
    fs.writeFileSync(path.join(root, `m07d-${mode}-failure.json`), JSON.stringify({
      path: new URL(page.url()).pathname, errors, message: error.message,
      alerts: await page.locator('[role="status"]').allTextContents(),
    }, null, 2));
    throw error;
  } finally { await context.close(); }
};
