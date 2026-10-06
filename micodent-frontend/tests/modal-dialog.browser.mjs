import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

// Optional browser checks use an already installed Playwright, without adding project dependencies.
const { chromium } = await import(pathToFileURL(process.env.MICODENT_PLAYWRIGHT_MODULE).href);
const mode = process.argv[2] || 'pos';
const limit = Number(process.argv[3] || 3);
const viewport = process.argv[4] === 'mobile' ? { width: 390, height: 844 } : { width: 1280, height: 720 };
const fixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import toast, { Toaster } from 'react-hot-toast';
import ConfiguracionPos from '/src/components/ConfiguracionPos.jsx';
import OrdenRadiografiaTab from '/src/components/OrdenRadiografiaTab.jsx';
import RecetarioTab from '/src/components/RecetarioTab.jsx';
import FinanzasDashboard from '/src/pages/FinanzasDashboard.jsx';
import PacienteDetalle from '/src/pages/PacienteDetalle.jsx';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { browserSession } from '/src/services/browserSession.js';
import { dashboardService, historiasService, gastosService, laboratorioService, usuariosService, auditoriaService, pacientesService, authService } from '/src/services/api.js';
import '/src/index.css';
window.calls = [];
window.clearToasts = () => toast.remove();
dashboardService.getPos = async () => ({data:{data:{porcentaje:3,revision:1}}});
dashboardService.setPos = async payload => {
  window.calls.push(payload);
  if(window.failSave) throw new Error('synthetic failure');
  await new Promise(resolve=>window.finishSave=resolve);
};
window.record = async (method, args) => {
  window.calls.push({method,args});
  if(window.failSave) throw new Error('synthetic failure');
  await new Promise(resolve=>window.finishSave=resolve);
};
for(const key of ['agregarOrdenRadiografia','reemitirOrdenRadiografia','agregarReceta','reemitirReceta']) {
  historiasService[key] = (...args) => window.record(key,args);
}
historiasService.getCentrosReferencia = async () => ({data:{data:[]}});
const response = data => Promise.resolve({data:{data}});
dashboardService.getFinanciero = () => response({porDoctor:[],totales:{},caja:{}});
gastosService.getAll = () => response([{id:1,categoria:'luz',monto:'10',fecha_pago:'2026-10-02',estado:'activo'}]);
laboratorioService.getTrabajos = () => response([]);
usuariosService.getDoctores = () => response([{id:'qa',nombre_completo:'Doctor sintetico'}]);
auditoriaService.getFinanciera = () => response([{id:1,usuario_nombre:'Prueba',accion:'Registro sintetico',modulo:'Gastos'}]);
for(const key of ['crear','editar','crearPenalidad']) gastosService[key]=(...args)=>window.record(key,args);
pacientesService.getById = () => response({id:1,nombres:'Paciente',apellidos:'Sintetico',dni:'00000001'});
pacientesService.getAuditoria = () => response([]);
authService.getMe = () => Promise.resolve({data:{usuario:{}}});
historiasService.getByPaciente = () => Promise.resolve({data:{ok:true,data:{id:1,nro_historia:'QA',consultas:[
  {id:1,fecha_consulta:'2026-10-02',descripcion:'Tratamiento sintetico',costo_total:100,doctor_id:'qa',bloqueada:1,
    pagos:[{id:1,monto:10,fecha_pago:'2026-10-02'}],adendas:[{id:1,motivo:'Motivo anterior',contenido:'Adenda sintetica'}],
    finanzas:{requiere_conciliacion:true,costo_total:5,costo_cubierto:null,costo_pendiente:null}},
  {id:2,fecha_consulta:'2026-10-02',descripcion:'Editable sintetico',costo_total:100,doctor_id:'qa',bloqueada:0,pagos:[]}
],auditoria:[{id:1,usuario_nombre:'Prueba',accion:'Cambio sintetico',creado_en:'2026-10-02 10:00:00'}]}}});
for(const key of ['agregarConsulta','editarConsulta','registrarPago','agregarAdendaConsulta','conciliarCostos']) {
  historiasService[key]=(...args)=>window.record(key,args);
}
if(${JSON.stringify(mode)} === 'patient') browserSession.verified({id:'qa',nombre:'Prueba',rol:'Doctor',is_admin:true,nivel:3},
  {id:'1'.repeat(64),csrf:'2'.repeat(64)},browserSession.assertCurrent());
const entries = [{id:1,anulada:1,rp:'Original sintetica',tipo_solicitud:'todo_virtual'},
  {id:2,reemplaza_a:1,rp:'Version sintetica',tipo_solicitud:'todo_virtual',motivo:'Motivo sintetico',doctor_nombre:'Prueba'}];
const props = {historiaId:1,esDoctor:true,onGuardado:async()=>{},pacienteInfo:{}};
const content = ${JSON.stringify(mode)} === 'rx' ? <OrdenRadiografiaTab {...props} ordenes={entries}/> :
  ${JSON.stringify(mode)} === 'recipe' ? <RecetarioTab {...props} recetas={entries}/> :
  ${JSON.stringify(mode)} === 'finance' ? <FinanzasDashboard/> :
  ${JSON.stringify(mode)} === 'patient' ? <MemoryRouter initialEntries={['/pacientes/1?tab=evolucion']}><Routes><Route path="/pacientes/:id" element={<PacienteDetalle/>}/></Routes></MemoryRouter> : <ConfiguracionPos/>;
createRoot(document.getElementById('root')).render(<React.StrictMode><button id="outside">Fuera</button>{content}<Toaster/></React.StrictMode>);
`;
const root = fileURLToPath(new URL('..', import.meta.url)).replace(/[\\/]$/, '');
const fixtureId = `${root.replaceAll('\\', '/')}/__modal_fixture.jsx`;
const server = await createServer({
  root,
  configFile: false, envFile: false, plugins: [react(), {
    name: 'synthetic-modal-fixture',
    resolveId: id => id === '/__modal_fixture.jsx' ? fixtureId : undefined,
    load: id => id === fixtureId ? fixture : undefined,
    configureServer(server) {
      server.middlewares.use('/__modal_test', async (_req, res) => {
        res.setHeader('Content-Type', 'text/html');
        res.end(await server.transformIndexHtml('/__modal_test', '<div id="root"></div><script type="module" src="/__modal_fixture.jsx"></script>'));
      });
    },
  }], server: { host: '127.0.0.1', port: 0 },
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
  await page.route('**/api/**', route => route.abort());
  const url = `http://127.0.0.1:${server.httpServer.address().port}/__modal_test`;
  await page.route('**/*', route => new URL(route.request().url()).origin === new URL(url).origin ? route.continue() : route.abort());
  await page.goto(url);
  async function assertLayout(dialog) {
    await dialog.evaluate(async el => {
      await Promise.all(el.firstElementChild.getAnimations().filter(animation =>
        animation.effect.getTiming().iterations !== Infinity).map(animation => animation.finished));
    });
    const layout = await dialog.evaluate(el => {
      const box = el.getBoundingClientRect();
      const panel = el.firstElementChild.getBoundingClientRect();
      return { fullWidth: Math.abs(box.width - innerWidth) < 1, fullHeight: Math.abs(box.height - innerHeight) < 1,
        contained: panel.left >= 0 && panel.right <= innerWidth && panel.top >= 0 && panel.bottom <= innerHeight };
    });
    assert.deepEqual(layout, { fullWidth: true, fullHeight: true, contained: true }, await dialog.evaluate(el => {
      const panel=el.firstElementChild.getBoundingClientRect();
      const box=el.getBoundingClientRect(), style=getComputedStyle(el);
      return JSON.stringify({x:panel.x,y:panel.y,width:panel.width,height:panel.height,boxY:box.y,
        padding:style.padding,display:style.display,position:style.position,top:style.top,scrollTop:el.scrollTop});
    }));
    const scroll = await dialog.evaluate(el => {
      const regions = [...el.querySelectorAll('form, div')].filter(region =>
        ['auto','scroll'].includes(getComputedStyle(region).overflowY) && region.scrollHeight > region.clientHeight);
      return regions.every(region => {
        const original=region.scrollTop;
        region.scrollTop=region.scrollHeight;
        const works=region.scrollTop>0;
        region.scrollTop=original;
        return works;
      });
    });
    assert.equal(scroll,true,'long form/history remains internally scrollable');
    if(process.env.MICODENT_MODAL_ARTIFACTS) {
      mkdirSync(process.env.MICODENT_MODAL_ARTIFACTS, {recursive:true});
      const name=await dialog.getAttribute('aria-label') || 'POS';
      await page.screenshot({path:join(process.env.MICODENT_MODAL_ARTIFACTS,`${mode}-${name}-${viewport.width}.png`)});
    }
  }
  if(mode === 'rx' || mode === 'recipe') {
    const recipe = mode === 'recipe';
    const names = recipe ? ['Nueva Receta','Corregir Receta','Historial de esta Receta'] :
      ['Nueva Orden de Radiografía','Corregir Orden','Historial de esta Orden'];
    for(let i=0;i<limit;i++) {
      await page.evaluate(()=>window.clearToasts());
      const opener = i === 0 ? page.getByRole('button', {name:recipe?'Nueva Receta':'Nueva Orden'}) :
        page.locator(i === 1 ? 'button[title="Corregir (anula esta y emite una nueva)"]' : 'button[title="Historial de correcciones"]');
      await opener.click();
      const dialog = page.getByRole('dialog', {name:names[i], exact:true});
      await dialog.waitFor({state:'visible'});
      await assertLayout(dialog);
      const field = dialog.locator('input:not([type="hidden"]):not(:disabled), textarea:not(:disabled), select:not(:disabled)').first();
      if(await field.count()) assert.equal(await field.evaluate(el=>el===document.activeElement),true);
      const close = dialog.getByRole('button',{name:'Cerrar',exact:true});
      await close.focus();
      await page.keyboard.press('Shift+Tab');
      assert.equal(await dialog.evaluate(el=>el.contains(document.activeElement)),true);
      await page.keyboard.press('Tab');
      assert.equal(await close.evaluate(el=>el===document.activeElement),true);
      await page.mouse.click(4,4);
      assert.equal(await dialog.isVisible(),true);
      await page.keyboard.press('Escape');
      await dialog.waitFor({state:'detached'});
      assert.equal(await opener.evaluate(el=>el===document.activeElement),true);
      await opener.click();
      await close.click();
      await dialog.waitFor({state:'detached'});
      if(i<2) {
        await opener.click();
        if(recipe) {
          const textareas=dialog.locator('textarea');
          await textareas.nth(0).fill(i===1?'Correccion sintetica':'Rp sintetico');
          if(i===1) await textareas.nth(1).fill('Rp corregido sintetico');
        } else if(i===1) await dialog.locator('#orden-motivo-correccion').fill('Correccion sintetica');
        await page.evaluate(()=>{window.calls=[];window.finishSave=null;});
        await dialog.locator('button[type="submit"]').click();
        await page.waitForFunction(()=>!!window.finishSave);
        await page.keyboard.press('Escape');
        assert.equal(await dialog.isVisible(),true,'saving must block Escape');
        await page.evaluate(()=>window.finishSave());
        await dialog.waitFor({state:'detached'});
        assert.equal(await page.evaluate(()=>window.calls.length),1,'exactly one original handler call');
        if(recipe&&i===1) {
          await opener.click();
          await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();
          await dialog.waitFor({state:'detached'});
        }
      }
      console.log(names[i]+': apertura, X, Escape, foco, Tab, overlay y acciones PASS');
    }
    assert.deepEqual(errors,[]);
    assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
  } else if(mode === 'finance') {
    for(let i=0;i<limit;i++) {
      await page.evaluate(()=>window.clearToasts());
      if(i===0) await page.getByRole('button',{name:'Gastos',exact:true}).click();
      if(i===1) await page.getByRole('button',{name:'Resumen',exact:true}).click();
      const name=['Nuevo Gasto','Registrar Penalidad','Registro de Actividad Financiera'][i];
      const opener=page.getByRole('button',{name:['Nuevo Gasto','Registrar Penalidad a Doctor','Registro de Actividad'][i],exact:true});
      await opener.click();
      const dialog=page.getByRole('dialog',{name,exact:true});
      await dialog.waitFor({state:'visible'});
      await assertLayout(dialog);
      if(i===2) await dialog.getByText('Registro sintetico',{exact:true}).waitFor();
      const field=dialog.locator('select,input,textarea').first();
      if(await field.count()) assert.equal(await field.evaluate(el=>el===document.activeElement),true);
      const close=dialog.getByRole('button',{name:'Cerrar',exact:true});
      await close.focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      assert.equal(await close.evaluate(el=>el===document.activeElement),true);
      await page.mouse.click(4,4);
      assert.equal(await dialog.isVisible(),true);
      await page.keyboard.press('Escape');
      await dialog.waitFor({state:'detached'});
      assert.equal(await opener.evaluate(el=>el===document.activeElement),true);
      await opener.click();
      await close.click();
      await dialog.waitFor({state:'detached'});
      if(i<2) {
        await opener.click();
        if(i===0) await dialog.locator('#gasto-monto').fill('12.50');
        else {
          await dialog.locator('#penalidad-doctor').selectOption('qa');
          await dialog.locator('#penalidad-monto').fill('5');
          await dialog.locator('#penalidad-motivo').fill('Motivo sintetico');
        }
        await page.evaluate(()=>{window.calls=[];window.finishSave=null;});
        await dialog.locator('button[type="submit"]').click();
        await page.waitForFunction(()=>!!window.finishSave);
        await page.evaluate(()=>window.finishSave());
        await dialog.waitFor({state:'detached'});
        assert.equal(await page.evaluate(()=>window.calls.length),1);
        if(i===0) {
          const edit=page.locator('button[title="Editar"]').first();
          await edit.click();
          const editing=page.getByRole('dialog',{name:'Editar Gasto',exact:true});
          assert.equal(await editing.locator('#gasto-monto').inputValue(),'10');
          await editing.getByRole('button',{name:'Cerrar',exact:true}).click();
          await editing.waitFor({state:'detached'});
        }
      }
      console.log(name+': apertura, X, Escape, foco, Tab, overlay y acciones PASS');
    }
    assert.deepEqual(errors,[]);
  } else if(mode === 'patient') {
    const names=['Nuevo Tratamiento','Registrar Abono','Agregar Corrección','Historial y Correcciones','Historial de Cambios'];
    for(let i=0;i<limit;i++) {
      await page.evaluate(()=>window.clearToasts());
      const opener=i===0 ? page.getByRole('button',{name:'Nuevo tratamiento',exact:true}) :
        i===1 ? page.locator('button[title="Abonar"]').first() :
        i===2 ? page.locator('button[title="Evolución firmada — clic para agregar una corrección"]') :
        i===3 ? page.locator('button[title="Ver Historial"]').first() :
        page.getByRole('button',{name:'Historial de Cambios',exact:true});
      await opener.click();
      const dialog=page.getByRole('dialog',{name:names[i],exact:true});
      await dialog.waitFor({state:'visible'});
      await assertLayout(dialog);
      const field=dialog.locator('input:not([type="hidden"]),textarea,select').first();
      if(await field.count()) assert.equal(await field.evaluate(el=>el===document.activeElement),true);
      if(i===3) await dialog.getByText('Adenda sintetica',{exact:true}).waitFor();
      if(i===4) await dialog.getByText('Cambio sintetico',{exact:true}).waitFor();
      const close=dialog.getByRole('button',{name:'Cerrar',exact:true});
      await close.focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      assert.equal(await close.evaluate(el=>el===document.activeElement),true);
      await page.mouse.click(4,4);
      assert.equal(await dialog.isVisible(),true);
      await page.keyboard.press('Escape');
      await dialog.waitFor({state:'detached'});
      assert.equal(await opener.evaluate(el=>el===document.activeElement),true);
      await opener.click();
      await close.click();
      await dialog.waitFor({state:'detached'});
      if(i<4) {
        await opener.click();
        let submit;
        if(i===0) {
          await dialog.locator('textarea').nth(0).fill('Nuevo sintetico');
          await dialog.locator('textarea').nth(1).fill('Estado sintetico');
          await dialog.locator('input[placeholder="0.00"][required]').fill('100');
          submit=dialog.getByRole('button',{name:'Guardar y Firmar',exact:true});
        } else if(i===1) {
          await dialog.locator('input[placeholder="0.00"]').fill('5');
          submit=dialog.getByRole('button',{name:'Confirmar Abono',exact:true});
        } else if(i===2) {
          await dialog.locator('textarea').nth(0).fill('Motivo sintetico');
          await dialog.locator('textarea').nth(1).fill('Correccion sintetica');
          submit=dialog.getByRole('button',{name:'Guardar Corrección',exact:true});
        } else {
          await dialog.locator('input[name="costo"]').fill('0');
          await dialog.locator('textarea[name="motivo"]').fill('Referencia sintetica');
          submit=dialog.getByRole('button',{name:'Confirmar conciliación',exact:true});
        }
        await page.evaluate(()=>{window.calls=[];window.finishSave=null;});
        await submit.click();
        await page.waitForFunction(()=>!!window.finishSave);
        if(i===0||i===1||i===3) {
          await page.keyboard.press('Escape');
          assert.equal(await dialog.isVisible(),true,'saving must block Escape');
        }
        await page.evaluate(()=>window.finishSave());
        await dialog.waitFor({state:'detached'});
        assert.equal(await page.evaluate(()=>window.calls.length),1);
        if(i===0) {
          const edit=page.locator('button[title="Editar"]').first();
          await edit.click();
          const editing=page.getByRole('dialog',{name:'Editar Tratamiento',exact:true});
          assert.equal(await editing.locator('textarea').first().inputValue(),'Editable sintetico');
          await editing.getByRole('button',{name:'Cerrar',exact:true}).click();
          await editing.waitFor({state:'detached'});
          await opener.click();
          assert.equal(await dialog.locator('textarea').first().inputValue(),'','close restores original reset');
          await close.click();
          await dialog.waitFor({state:'detached'});
        }
      }
      console.log(names[i]+': apertura, X, Escape, foco, Tab, overlay y acciones PASS');
    }
    assert.deepEqual(errors,[]);
    assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
  } else {
  const opener = page.getByRole('button', { name: 'Configurar recargo POS' });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Recargo por tarjeta (POS)' });
  await dialog.waitFor({ state: 'visible' });
  await assertLayout(dialog);
  assert.equal(await dialog.locator('input').evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await dialog.getByRole('button', { name: 'Cerrar configuración POS' }).evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await dialog.getByRole('button', { name: 'Guardar porcentaje' }).evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Tab');
  assert.equal(await dialog.getByRole('button', { name: 'Cerrar configuración POS' }).evaluate(el => el === document.activeElement), true);
  await page.mouse.click(4, 4);
  assert.equal(await dialog.isVisible(), true, 'backdrop must not close');
  await page.evaluate(() => document.querySelector('#outside').focus());
  assert.equal(await dialog.locator('input').evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'detached' });
  assert.equal(await opener.evaluate(el => el === document.activeElement), true);
  await opener.click();
  await dialog.getByRole('button', { name: 'Cerrar configuración POS' }).click();
  await dialog.waitFor({ state: 'detached' });
  await opener.click();
  await dialog.locator('input').fill('4.25');
  await page.evaluate(() => { window.failSave = true; });
  await dialog.getByRole('button', { name: 'Guardar porcentaje' }).click();
  await page.getByText('No se pudo guardar el recargo.', { exact: true }).waitFor();
  assert.equal(await dialog.isVisible(), true);
  assert.equal(await dialog.locator('input').inputValue(), '4.25');
  await page.evaluate(() => { window.failSave = false; window.calls = []; });
  await dialog.getByRole('button', { name: 'Guardar porcentaje' }).click();
  await page.waitForFunction(() => !!window.finishSave);
  await page.keyboard.press('Escape');
  assert.equal(await dialog.isVisible(), true, 'saving blocks Escape');
  assert.equal(await dialog.getByRole('button', { name: 'Guardando...' }).isDisabled(), true);
  await page.evaluate(() => window.finishSave());
  await dialog.waitFor({ state: 'detached' });
  assert.deepEqual(await page.evaluate(() => window.calls), [{ porcentaje: '4.25', revision: 1 }]);
  assert.equal(await page.evaluate(() => document.body.style.overflow), '');
  assert.deepEqual(errors, []);
  console.log('POS: apertura, X, Escape, foco, Tab, overlay, error/toast, guardado unico y scroll PASS');
  }
} finally {
  await browser?.close();
  await server.close();
}
