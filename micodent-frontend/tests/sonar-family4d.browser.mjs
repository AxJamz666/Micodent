import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

// Isolated fixture: no credentials, API requests or real clinical records.
const { chromium } = await import(pathToFileURL(process.env.MICODENT_PLAYWRIGHT_MODULE).href);
const root = fileURLToPath(new URL('..', import.meta.url)).replace(/[\\/]$/, '');
const fixtureId = root.replaceAll('\\', '/') + '/__family4d_fixture.jsx';
const fixture = `
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import ConfirmModal from '/src/components/ConfirmModal.jsx';
import '/src/index.css';
window.calls={cancel:0,confirm:0};
function Fixture(){
  const [open,setOpen]=useState(false);
  const [busy,setBusy]=useState(false);
  window.setBusy=setBusy;
  const close=kind=>{window.calls[kind]++;setOpen(false);};
  return <><button id="opener" onClick={()=>setOpen(true)}>Abrir</button>
    <ConfirmModal isOpen={open} busy={busy} title="Confirmacion sintetica"
      message="Mensaje sintetico para comprobar el ajuste de texto sin datos clinicos."
      onCancel={()=>close('cancel')} onConfirm={()=>close('confirm')}/></>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><Fixture/></React.StrictMode>);
`;
const server = await createServer({ root, configFile: false, envFile: false, plugins: [react(), {
  name: 'family4d-confirm-fixture',
  resolveId: id => id === '/__family4d_fixture.jsx' || id === fixtureId ? fixtureId : undefined,
  load: id => id === fixtureId ? fixture : undefined,
  configureServer(server) {
    server.middlewares.use('/__family4d', async (_req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.end(await server.transformIndexHtml('/__family4d', '<div id="root"></div><script type="module" src="/__family4d_fixture.jsx"></script>'));
    });
  },
}], server: { host: '127.0.0.1', port: 0 } });
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const origin = 'http://127.0.0.1:' + server.httpServer.address().port;
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      return url.origin === origin && !url.pathname.startsWith('/api') ? route.continue() : route.abort();
    });
    await page.goto(origin + '/__family4d');
    const opener = page.locator('#opener');
    const dialog = page.getByRole('alertdialog');
    const cancel = page.getByRole('button', { name: 'Cancelar', exact: true });
    const confirm = page.getByRole('button', { name: 'Confirmar', exact: true });
    const focused = selector => page.waitForFunction(value => document.activeElement.matches(value), selector);
    const closeCheck = async () => {
      await dialog.waitFor({ state: 'detached' });
      await focused('#opener');
      assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    };
    await opener.click();
    await dialog.waitFor();
    await focused('dialog button:first-child');
    assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
    const box = await dialog.locator(':scope > div').boundingBox();
    assert(box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width && box.y + box.height <= viewport.height);
    await page.keyboard.press('Tab');
    assert(await confirm.evaluate(element => element === document.activeElement));
    await page.keyboard.press('Tab');
    assert(await cancel.evaluate(element => element === document.activeElement));
    await page.keyboard.press('Shift+Tab');
    assert(await confirm.evaluate(element => element === document.activeElement));
    await page.mouse.click(2, 2);
    assert(await dialog.isVisible());
    await page.keyboard.press('Escape');
    await closeCheck();
    assert.deepEqual(await page.evaluate(() => window.calls), { cancel: 1, confirm: 0 });
    await opener.click();
    await cancel.click();
    await closeCheck();
    await opener.click();
    await confirm.click();
    await closeCheck();
    assert.deepEqual(await page.evaluate(() => window.calls), { cancel: 2, confirm: 1 });
    await opener.click();
    await page.evaluate(() => window.setBusy(true));
    await page.waitForFunction(() => [...document.querySelectorAll('dialog button')].every(button => button.disabled));
    await page.keyboard.press('Escape');
    await page.keyboard.press('Tab');
    assert(await dialog.isVisible());
    assert(await dialog.evaluate(element => element.contains(document.activeElement)));
    assert.deepEqual(await page.evaluate(() => window.calls), { cancel: 2, confirm: 1 });
    await page.evaluate(() => window.setBusy(false));
    await cancel.click();
    await closeCheck();
    assert.deepEqual(await page.evaluate(() => window.calls), { cancel: 3, confirm: 1 });
    assert.deepEqual(errors, []);
    console.log('PASS ConfirmModal ' + viewport.width + 'x' + viewport.height + ': foco, Tab, Escape, acciones unicas, busy, overlay, scroll, ajuste');
    await page.close();
  }
} finally {
  if (browser) await browser.close();
  await server.close();
}
