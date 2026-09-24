const assert = require('node:assert/strict');
const path = require('node:path');

module.exports = async function ({page, context, origin, root, mode}) {
  await page.goto(`${origin}/finanzas`);
  await page.locator('[data-financial-kpi="Flujo neto registrado"]').waitFor();
  const observer = await context.newPage();
  const errors = [];
  observer.on('pageerror', error => errors.push(error.message));
  try {
    await observer.goto(`${origin}/finanzas`);
    const read = async (target, label) => {
      const text = await target.locator(`[data-financial-kpi="${label}"]`).innerText();
      return Math.round(Number(text.match(/S\/\s*(-?[\d,]+\.\d{2})/)[1].replaceAll(',',''))*100);
    };
    const expect = async (target, label, cents) => {
      await target.waitForFunction(({label,cents}) => {
        const text = document.querySelector(`[data-financial-kpi="${label}"]`)?.innerText;
        const match = text?.match(/S\/\s*(-?[\d,]+\.\d{2})/);
        return match && Math.round(Number(match[1].replaceAll(',',''))*100) === cents;
      }, {label,cents});
    };
    await observer.locator('[data-financial-kpi="Flujo neto registrado"]').waitFor();
    const start = await read(observer,'Flujo neto registrado');
    const labStart = await read(observer,'Pagos a laboratorio');
    const expenseStart = await read(observer,'Gastos pagados');
    const productionStart = await read(observer,'Resultado tras costos y gastos');
    await page.getByRole('button',{name:'Laboratorio',exact:true}).click();
    await page.getByRole('button',{name:'Registrar Pago',exact:true}).first().click();
    await page.getByPlaceholder('Monto',{exact:true}).fill('1');
    const saved = page.waitForResponse(r=>r.url().includes('/laboratorio/')&&r.request().method()==='POST');
    await page.getByRole('button',{name:'Confirmar',exact:true}).click();
    assert.equal((await saved).status(),201);
    await expect(observer,'Pagos a laboratorio',labStart+100);
    await expect(observer,'Flujo neto registrado',start-100);
    await expect(observer,'Resultado tras costos y gastos',productionStart);
    await page.getByRole('button',{name:'Resumen',exact:true}).click();
    await expect(page,'Flujo neto registrado',start-100);

    await page.getByRole('button',{name:'Gastos',exact:true}).click();
    await page.getByRole('button',{name:'Nuevo Gasto',exact:true}).click();
    const modal = page.locator('.dialog-overlay');
    await modal.locator('select').selectOption('materiales');
    const description = `Sincronizacion ${mode}`;
    await modal.getByPlaceholder('Ej. Recibo Luz Sur - Marzo').fill(description);
    await modal.getByPlaceholder('0.00',{exact:true}).fill('13.27');
    await modal.getByRole('button',{name:'Registrar Gasto',exact:true}).click();
    await modal.waitFor({state:'detached'});
    await expect(observer,'Gastos pagados',expenseStart+1327);
    await expect(observer,'Flujo neto registrado',start-1427);
    await expect(observer,'Resultado tras costos y gastos',productionStart-1327);
    const row = page.getByRole('row').filter({hasText:description});
    await row.getByTitle('Editar',{exact:true}).click();
    await modal.getByPlaceholder('0.00',{exact:true}).fill('20.05');
    await modal.getByRole('button',{name:'Guardar Cambios',exact:true}).click();
    await modal.waitFor({state:'detached'});
    await expect(observer,'Flujo neto registrado',start-2105);
    page.once('dialog',dialog=>dialog.accept());
    await row.getByTitle('Anular',{exact:true}).click();
    await expect(observer,'Flujo neto registrado',start-100);
    await observer.getByRole('button',{name:'Registro de Actividad',exact:true}).click();
    const activity = observer.locator('.dialog-overlay');
    await activity.getByText(/Anuló un gasto/).first().waitFor();
    const logsBefore = await activity.getByText(/Reactivó un gasto/).count();
    await row.getByTitle('Reactivar',{exact:true}).click();
    await observer.waitForFunction(before => [...document.querySelectorAll('.dialog-overlay p')].filter(p=>p.textContent.includes('Reactivó un gasto')).length>before,logsBefore);
    await activity.locator('button').first().click();
    await expect(observer,'Flujo neto registrado',start-2105);
    await observer.getByRole('button',{name:'Gastos',exact:true}).click();
    const otherRow = observer.getByRole('row').filter({hasText:description});
    await otherRow.getByTitle('Editar',{exact:true}).waitFor();
    page.once('dialog',dialog=>dialog.accept());
    await row.getByTitle('Anular',{exact:true}).click();
    await otherRow.getByTitle('Reactivar',{exact:true}).waitFor();
    await observer.getByRole('button',{name:'Resumen',exact:true}).click();
    await expect(observer,'Flujo neto registrado',start-100);

    // A rejected write must not emit a financial-change notification.
    await page.evaluate(()=>{window.__financeEvents=0;window.addEventListener('micodent-finanzas-updated',()=>window.__financeEvents++);});
    await page.getByRole('button',{name:'Nuevo Gasto',exact:true}).click();
    await modal.locator('select').selectOption('materiales');
    await modal.getByPlaceholder('0.00',{exact:true}).fill('1.001');
    const invalid = page.waitForResponse(r=>r.url().endsWith('/api/gastos')&&r.request().method()==='POST');
    await modal.getByRole('button',{name:'Registrar Gasto',exact:true}).click();
    assert.equal((await invalid).status(),400);
    assert.equal(await page.evaluate(()=>window.__financeEvents),0);
    await modal.locator('button').first().click();
    await expect(observer,'Flujo neto registrado',start-100);
    await observer.screenshot({path:path.join(root,`${mode}-caja-desktop.png`),fullPage:true});
    await observer.setViewportSize({width:390,height:844});
    assert(await observer.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
    await observer.screenshot({path:path.join(root,`${mode}-caja-mobile.png`),fullPage:true});
    assert.deepEqual(errors,[]);
  } finally { await observer.close(); }
};
