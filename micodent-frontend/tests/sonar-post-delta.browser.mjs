import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

const { chromium } = await import(pathToFileURL(process.env.MICODENT_PLAYWRIGHT_MODULE).href);
const root = fileURLToPath(new URL('..', import.meta.url)).replace(/[\\/]$/, '');
const fixtureId = root.replaceAll('\\', '/') + '/__post_fixture.jsx';
const fixture = `
import React, {useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter, useLocation} from 'react-router-dom';
import Pacientes from '/src/pages/Pacientes.jsx';
import {pacientesService} from '/src/services/api.js';
import '/src/index.css';
window.routes=[];
window.operations=[];
window.outerClicks=0;
const active={id:1,apellidos:'Sintetico',nombres:'Activo',dni:'00000001',activo:1,estado_hc:'vacia'};
const archived={id:2,apellidos:'Sintetico',nombres:'Archivado',dni:'00000002',activo:0,estado_hc:'vacia'};
pacientesService.getAll=async (_search,includeArchived)=>({data:{data:includeArchived==='true'?[active,archived]:[active]}});
for(const operation of ['eliminar','reactivar'])pacientesService[operation]=async id=>{window.operations.push({operation,id});return{data:{ok:true}};};
function LocationProbe(){const location=useLocation();useEffect(()=>{window.routes.push(location.pathname+location.search);},[location]);return null;}
createRoot(document.getElementById('root')).render(<React.StrictMode>
  <MemoryRouter initialEntries={['/pacientes']}><div onClick={()=>window.outerClicks++}><Pacientes/></div><LocationProbe/></MemoryRouter>
</React.StrictMode>);
`;
const server = await createServer({ root, configFile: false, envFile: false, plugins: [react(), {
  name: 'post-synthetic-patients',
  resolveId: id => id === '/__post_fixture.jsx' || id === fixtureId ? fixtureId : undefined,
  load: id => id === fixtureId ? fixture : undefined,
  configureServer(server) {
    server.middlewares.use('/__post_test', async (_req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.end(await server.transformIndexHtml('/__post_test',
        '<div id="root"></div><script type="module" src="/__post_fixture.jsx"></script>'));
    });
  },
}], server: { host: '127.0.0.1', port: 0 } });
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const origin = 'http://127.0.0.1:' + server.httpServer.address().port;
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport, hasTouch: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      return url.origin === origin && !url.pathname.startsWith('/api') ? route.continue() : route.abort();
    });
    await page.goto(origin + '/__post_test');
    const row = page.locator('tbody tr').filter({ hasText: 'Sintetico, Activo' });
    await row.waitFor();
    const clear = () => page.evaluate(() => { window.routes.length = 0; window.outerClicks = 0; });
    const checkRoutes = async expected => {
      if (expected.length) await page.waitForFunction(() => window.routes.length > 0);
      assert.deepEqual(await page.evaluate(() => window.routes), expected);
    };
    const open = row.getByRole('button', { name: 'Abrir ficha' });
    const report = row.getByRole('button', { name: 'Ver reporte' });
    const archive = row.getByRole('button', { name: 'Archivar paciente' });
    await clear();
    await row.locator('td').first().click();
    await checkRoutes(['/pacientes/1']);
    await clear();
    await open.click();
    await checkRoutes(['/pacientes/1']);
    assert.equal(await page.evaluate(() => window.outerClicks), 0);
    await clear();
    await report.click();
    await checkRoutes(['/historias?view=1']);
    assert.equal(await page.evaluate(() => window.outerClicks), 0);
    await clear();
    await report.focus();
    await page.keyboard.press('Enter');
    await checkRoutes(['/historias?view=1']);
    await clear();
    await open.focus();
    await page.keyboard.press('Space');
    await checkRoutes(['/pacientes/1']);
    await open.focus();
    await page.keyboard.press('Tab');
    assert(await report.evaluate(element => element === document.activeElement));
    await page.keyboard.press('Tab');
    assert(await archive.evaluate(element => element === document.activeElement));
    await clear();
    await report.tap();
    await checkRoutes(['/historias?view=1']);
    await clear();
    const wrapper = row.locator('[data-patient-actions]');
    await wrapper.click({ position: { x: 1, y: 1 } });
    await checkRoutes([]);
    assert.equal(await page.evaluate(() => window.outerClicks), 0);
    await archive.click();
    const dialog = page.getByRole('alertdialog');
    await dialog.waitFor();
    await checkRoutes([]);
    assert.deepEqual(await page.evaluate(() => window.operations), []);
    await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await dialog.waitFor({ state: 'detached' });
    await archive.click();
    await dialog.getByRole('button', { name: /archivar$/i }).click();
    await dialog.waitFor({ state: 'detached' });
    assert.deepEqual(await page.evaluate(() => window.operations), [{ operation: 'eliminar', id: 1 }]);
    await checkRoutes([]);
    await page.getByRole('button', { name: 'Mostrar archivados', exact: true }).click();
    const inactive = page.locator('tbody tr').filter({ hasText: 'Sintetico, Archivado' });
    await inactive.waitFor();
    await clear();
    await inactive.locator('td').first().click();
    await checkRoutes([]);
    await inactive.getByRole('button', { name: 'Reactivar paciente' }).focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.operations.length === 2);
    assert.deepEqual(await page.evaluate(() => window.operations), [{ operation: 'eliminar', id: 1 }, { operation: 'reactivar', id: 2 }]);
    await checkRoutes([]);
    assert.deepEqual(errors, []);
    console.log('PASS POST Pacientes ' + viewport.width + 'x' + viewport.height + ': row, mouse, Tab, Enter, Space, touch, padding, archive/reactivate, single actions');
    await page.close();
  }
} finally {
  if (browser) await browser.close();
  await server.close();
}
