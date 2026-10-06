import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

const modulePath = process.env.MICODENT_PLAYWRIGHT_MODULE || path.join(homedir(), '.cache', 'codex-runtimes',
  'codex-primary-runtime', 'dependencies', 'node', 'node_modules', 'playwright', 'index.mjs');
if (!existsSync(modulePath)) throw new Error('Set MICODENT_PLAYWRIGHT_MODULE to the existing Playwright runtime; do not skip keyboard validation.');
const { chromium } = await import(pathToFileURL(modulePath).href);
const root = fileURLToPath(new URL('..', import.meta.url)).replace(/[\\/]$/, '');
const fixtureId = root.replaceAll('\\', '/') + '/__academic_c_fixture.jsx';
const source = `
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import Agenda from '/src/pages/Agenda.jsx';
import AgendaDia from '/src/components/AgendaDia.jsx';
import AgendaSemana from '/src/components/AgendaSemana.jsx';
import AgendaMes from '/src/components/AgendaMes.jsx';
import {Diente} from '/src/components/Diente.jsx';
import PiezaSelector from '/src/components/PiezaSelector.jsx';
import {citasService,usuariosService,pacientesService} from '/src/services/api.js';
import '/src/index.css';
window.actions=[];window.ranges=[];
const doctors=[{id:'one',nombre_completo:'Doctor sintetico'},{id:'two',nombre_completo:'Otro doctor'}];
const date='2024-02-29';
const appointments=[{id:71,doctor_id:'one',fecha:date,hora_inicio:'09:00',duracion_minutos:60,
  estado:'agendada',nombre_contacto:'Contacto sintetico',celular_contacto:'900000001',motivo_consulta:'Control'}];
usuariosService.getDoctores=async()=>({data:{data:doctors}});
citasService.getAll=async(desde,hasta)=>{window.ranges.push({desde,hasta});return{data:{data:appointments}};};
pacientesService.getAll=async()=>({data:{data:[]}});
function Teeth(){
  const [selected,setSelected]=useState(false),[pieces,setPieces]=useState([]);
  return <><Diente numero={11} seleccionado={selected} asignados={[{color:'red'},{color:'blue'}]}
    onToothClick={n=>{window.actions.push(n);setSelected(v=>!v);}}/>
    <Diente numero={12} asignados={[]}/>
    <section aria-label="Selector"><PiezaSelector seleccionadas={pieces} onChange={value=>{window.actions.push(value);setPieces(value);}}/></section></>;
}
function Calendars(){return <>
  <section aria-label="Calendario diario"><AgendaDia doctores={doctors} citas={appointments}
    onSlotClick={(doctor,hour)=>window.actions.push({doctor,hour})} onCitaClick={c=>window.actions.push({id:c.id,doctor:c.doctor_id})}/></section>
  <section aria-label="Calendario semanal"><AgendaSemana fechaActual={new Date(2024,1,29)} citas={appointments}
    onDiaClick={day=>window.actions.push({day:day.getDate()})} onCitaClick={c=>window.actions.push({id:c.id,doctor:c.doctor_id})}/></section>
  <section aria-label="Calendario mensual"><AgendaMes fechaActual={new Date(2024,1,29)} citas={appointments}
    onDiaClick={day=>window.actions.push({day:day.getDate(),month:day.getMonth()})}/></section>
  <section aria-label="Agenda completa"><Agenda/></section>
  </>;}
createRoot(document.getElementById('root')).render(<MemoryRouter>
  {new URL(location.href).searchParams.get('mode')==='teeth'?<Teeth/>:<Calendars/>}
</MemoryRouter>);
`;
let server, browser, origin;
test.before(async () => {
  server = await createServer({ root, configFile: false, envFile: false,
    plugins: [react(), { name: 'academic-c-components',
      resolveId: id => id === '/__academic_c_fixture.jsx' || id === fixtureId ? fixtureId : undefined,
      load: id => id === fixtureId ? source : undefined,
      configureServer(s) { s.middlewares.use('/__academic_c', async (_req, res) => {
        res.setHeader('Content-Type', 'text/html');
        res.end(await s.transformIndexHtml('/__academic_c', '<div id="root"></div><script type="module" src="/__academic_c_fixture.jsx"></script>'));
      }); },
    }], server: { host: '127.0.0.1', port: 0 } });
  await server.listen();
  origin = 'http://127.0.0.1:' + server.httpServer.address().port;
  browser = await chromium.launch({ channel: 'msedge', headless: true });
});
test.after(async () => { if (browser) await browser.close(); if (server) await server.close(); });
async function pageFor(t, mode) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, timezoneId: 'America/Lima' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  t.after(async () => { await page.close(); assert.deepEqual(errors, []); });
  await page.clock.setFixedTime(new Date('2024-02-29T17:00:00Z'));
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.origin === origin && !url.pathname.startsWith('/api') ? route.continue() : route.abort();
  });
  await page.goto(origin + '/__academic_c?mode=' + mode);
  return page;
}
async function pressOnce(page, control, key, expected) {
  await page.evaluate(() => { window.actions.length = 0; });
  await control.focus(); await page.keyboard.press(key);
  await page.waitForFunction(() => window.actions.length > 0);
  assert.deepEqual(await page.evaluate(() => window.actions), [expected]);
}

test('ACA-C-F05 native patient actions isolate row navigation, Enter/Space and cancelled archive on desktop/mobile', async () => {
  const result = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['tests/sonar-post-delta.browser.mjs'], { cwd: root,
      env: { ...process.env, MICODENT_PLAYWRIGHT_MODULE: modulePath }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; }); child.stderr.on('data', chunk => { output += chunk; });
    child.once('error', reject); child.once('close', code => resolve({ code, output }));
  });
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /PASS POST Pacientes 1280x720/);
  assert.match(result.output, /PASS POST Pacientes 390x844/);
});

test('ACA-C-F16 real calendars preserve leap dates, appointment identity, disabled slots and single native activation', async t => {
  const page = await pageFor(t, 'agenda');
  const day = page.getByRole('region', { name: 'Calendario diario' });
  await day.getByRole('button', { name: 'Agendar con Doctor sintetico a las 8:00 AM', exact: true }).waitFor();
  const slot = day.getByRole('button', { name: 'Agendar con Doctor sintetico a las 8:00 AM', exact: true });
  await pressOnce(page, slot, 'Enter', { doctor: 'one', hour: '08:00' });
  await pressOnce(page, slot, 'Space', { doctor: 'one', hour: '08:00' });
  assert.ok(await day.getByRole('button', { name: 'Agendar con Doctor sintetico a las 9:00 AM', exact: true }).isDisabled());
  await pressOnce(page, day.getByRole('button', { name: /Contacto sintetico/ }), 'Enter', { id: 71, doctor: 'one' });
  const week = page.getByRole('region', { name: 'Calendario semanal' });
  await pressOnce(page, week.getByRole('button', { name: 'Ver agenda del 2024-02-29 a las 8:00 AM', exact: true }), 'Space', { day: 29 });
  await pressOnce(page, week.getByRole('button', { name: 'Contacto sintetico', exact: true }), 'Enter', { id: 71, doctor: 'one' });
  const month = page.getByRole('region', { name: 'Calendario mensual' });
  await pressOnce(page, month.getByRole('button', { name: '29 de febrero: 1 citas', exact: true }), 'Enter', { day: 29, month: 1 });
  assert.equal(await month.getByRole('button').count(), 35);
  const agenda = page.getByRole('region', { name: 'Agenda completa' });
  await agenda.getByRole('button', { name: 'Mes', exact: true }).click();
  await page.waitForFunction(() => window.ranges.at(-1)?.hasta === '2024-03-03');
  assert.deepEqual(await page.evaluate(() => window.ranges.at(-1)), { desde: '2024-01-29', hasta: '2024-03-03' });
  await agenda.getByRole('button', { name: 'Semana', exact: true }).click();
  await page.waitForFunction(() => window.ranges.at(-1)?.desde === '2024-02-26');
  assert.deepEqual(await page.evaluate(() => window.ranges.at(-1)), { desde: '2024-02-26', hasta: '2024-03-03' });
  await agenda.getByRole('button', { name: 'Día', exact: true }).click();
  await page.waitForFunction(() => window.ranges.at(-1)?.desde === '2024-02-29');
  await agenda.getByRole('button', { name: 'Período siguiente' }).click();
  await page.waitForFunction(() => window.ranges.at(-1)?.desde === '2024-03-01');
  assert.deepEqual(await page.evaluate(() => window.ranges.at(-1)), { desde: '2024-03-01', hasta: '2024-03-01' });
  await page.clock.setFixedTime(new Date('2026-12-31T17:00:00Z'));
  await page.reload();
  await page.waitForFunction(() => window.ranges.at(-1)?.desde === '2026-12-31');
  await page.getByRole('region', { name: 'Agenda completa' }).getByRole('button', { name: 'Período siguiente' }).click();
  await page.waitForFunction(() => window.ranges.at(-1)?.desde === '2027-01-01');
  assert.deepEqual(await page.evaluate(() => window.ranges.at(-1)), { desde: '2027-01-01', hasta: '2027-01-01' });
});

test('ACA-C-F19 native tooth and selector toggle once, preserve visual state and disable report-only tooth', async t => {
  const page = await pageFor(t, 'teeth'), tooth = page.getByRole('button', { name: 'Pieza 11', exact: true });
  await tooth.waitFor();
  assert.equal(await tooth.getAttribute('aria-pressed'), 'false');
  await pressOnce(page, tooth, 'Enter', 11); assert.equal(await tooth.getAttribute('aria-pressed'), 'true');
  await pressOnce(page, tooth, 'Space', 11); assert.equal(await tooth.getAttribute('aria-pressed'), 'false');
  assert.equal(await tooth.locator('svg path').count(), 4);
  assert.ok(await page.getByTitle('Tiene diagnóstico').isVisible());
  assert.ok(await page.getByTitle('Tiene procedimiento').isVisible());
  assert.ok(await page.getByRole('button', { name: 'Pieza 12', exact: true }).isDisabled());
  const selector = page.getByRole('region', { name: 'Selector' }), piece = selector.getByRole('button', { name: '11', exact: true });
  assert.equal(await selector.getByRole('button').count(), 52);
  await pressOnce(page, piece, 'Enter', [11]); assert.match(await piece.getAttribute('class'), /bg-clinical-500/);
  await pressOnce(page, piece, 'Space', []); assert.match(await piece.getAttribute('class'), /bg-white/);
  await piece.focus(); await page.keyboard.press('Tab');
  assert.ok(await selector.getByRole('button', { name: '21', exact: true }).evaluate(node => node === document.activeElement));
});
