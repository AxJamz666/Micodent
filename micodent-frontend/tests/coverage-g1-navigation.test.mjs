import test from 'node:test';
import assert from 'node:assert/strict';
import { React, render, cleanup, fireEvent, screen, within, waitFor, act, deferred, disposeRuntime } from './helpers/component-runtime.mjs';
import { fixture, citasService, usuariosService, dashboardService, authService, browserSession } from './helpers/component-boundaries.mjs';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const { default: Agenda } = await import('../src/pages/Agenda.jsx');
const { default: AgendaDia } = await import('../src/components/AgendaDia.jsx');
const { default: AgendaSemana } = await import('../src/components/AgendaSemana.jsx');
const { default: AgendaMes } = await import('../src/components/AgendaMes.jsx');
const { default: MainLayout } = await import('../src/layouts/MainLayout.jsx');
const { default: App } = await import('../src/App.jsx');
const { default: AppErrorBoundary } = await import('../src/components/AppErrorBoundary.jsx');
const h = React.createElement;
const doctor = { id: 7, nombre_completo: 'Doctor sintetico' };
const appointment = (overrides = {}) => ({ id: 91, doctor_id: 7, fecha: '2026-10-04',
  hora_inicio: '09:00', duracion_minutos: 60, estado: 'agendada',
  nombre_contacto: 'Contacto sintetico', celular_contacto: '000000000',
  motivo_consulta: 'Revision sintetica', ...overrides });
const response = data => ({ data: { data } });
const NativeDate = globalThis.Date;
let errors;

test.beforeEach(t => {
  const calendarTime = new NativeDate(2026, 9, 4, 12).getTime();
  // Freeze calendar dates, not the elapsed-time clock used by React/jsdom.
  globalThis.Date = class extends NativeDate {
    constructor(...args) { super(...(args.length ? args : [calendarTime])); }
  };
  errors = [];
  t.mock.method(toast, 'error', value => errors.push(value));
  t.mock.method(toast, 'success', () => {});
  localStorage.clear();
  window.history.replaceState(null, '', '/');
  fixture.user = null; fixture.status = 'anonymous';
  usuariosService.getDoctores = async () => response([doctor]);
  citasService.getAll = async () => response([]);
  browserSession.checkStorage = () => {};
  browserSession.assertCurrent = () => 7;
  dashboardService.getStats = async () => response({});
  dashboardService.getUltimasHistorias = async () => response([]);
  dashboardService.getDeudores = async () => response([]);
  dashboardService.getCitasHoy = async () => response([]);
});
test.afterEach(async () => {
  cleanup();
  await act(async () => {});
  globalThis.Date = NativeDate;
  fixture.user = null; fixture.status = 'anonymous';
  if (process.env.MICODENT_COV_G1_DIAGNOSTICS === '1') {
    console.log('COV-G1 cleanup', JSON.stringify({ roots: document.body.childElementCount,
      resources: process.getActiveResourcesInfo(), rssMB: Math.round(process.memoryUsage().rss / 1048576) }));
  }
});
test.after(disposeRuntime);

function Probe() {
  const location = useLocation();
  return h('output', { 'aria-label': 'Ruta de prueba' }, location.pathname);
}
const agenda = () => render(h(MemoryRouter, null, h(Agenda)));
const change = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const period = direction => screen.getByRole('button', { name: new RegExp('Per.*' + direction) });
const route = () => screen.getByLabelText('Ruta de prueba').textContent;
function layout() {
  return render(h(MemoryRouter, null, h(Routes, null,
    h(Route, { path: '/', element: h(MainLayout) },
      h(Route, { index: true, element: h(Probe) }),
      h(Route, { path: '*', element: h(Probe) })),
    h(Route, { path: '/login', element: h('p', null, 'Acceso sintetico') }))));
}

test('COV-G1-01 daily calendar: occupied/free slots, doctor filtering and appointment callbacks', () => {
  const slots = [], clicks = [];
  const row = appointment({ paciente_nombres: 'Paciente', paciente_apellidos: 'Sintetico' });
  const cancelled = appointment({ id: 92, doctor_id: 8, estado: 'cancelada', hora_inicio: '10:00' });
  const view = render(h(AgendaDia, { doctores: [doctor, { id: 8, nombre_completo: 'Segundo sintetico' }],
    citas: [row, cancelled], onSlotClick: (...args) => slots.push(args), onCitaClick: value => clicks.push(value) }));
  const occupied = screen.getByRole('button', { name: 'Agendar con Doctor sintetico a las 9:00 AM' });
  assert.equal(occupied.disabled, true);
  fireEvent.click(occupied); assert.deepEqual(slots, []);
  fireEvent.click(screen.getByRole('button', { name: 'Agendar con Doctor sintetico a las 10:00 AM' }));
  assert.deepEqual(slots, [[7, '10:00']]);
  const block = screen.getByRole('button', { name: /Sintetico, Paciente/ });
  assert.equal(block.style.top, '112px'); assert.equal(block.style.height, '109px');
  assert.ok(within(block).getByText('Revision sintetica'));
  fireEvent.click(block); assert.deepEqual(clicks, [row]);
  assert.match(screen.getByRole('button', { name: /Contacto sintetico/ }).className, /opacity-60/);
  view.rerender(h(AgendaDia, { doctores: [], citas: [], onSlotClick() {}, onCitaClick() {} }));
  assert.ok(screen.getByText('No hay doctores activos para mostrar en la agenda.'));
});

test('COV-G1-02 weekly calendar: overlapping lanes, day navigation and isolated appointment clicks', () => {
  const days = [], clicks = [];
  const first = appointment();
  const second = appointment({ id: 92, hora_inicio: '09:30', estado: 'cancelada',
    paciente_nombres: 'Dos', paciente_apellidos: 'Sintetico' });
  render(h(AgendaSemana, { fechaActual: new Date(2026, 9, 4),
    citas: [second, first, appointment({ id: 93, fecha: '2026-10-12', nombre_contacto: 'Fuera de semana' })],
    onDiaClick: day => days.push(day), onCitaClick: row => clicks.push(row) }));
  const block = screen.getByRole('button', { name: 'Contacto sintetico' });
  const overlap = screen.getByRole('button', { name: 'Sintetico, Dos' });
  assert.equal(block.style.width, '50%'); assert.equal(overlap.style.left, '50%');
  assert.match(overlap.className, /opacity-50/);
  assert.equal(screen.queryByText('Fuera de semana'), null);
  fireEvent.click(block);
  assert.deepEqual(clicks, [{ ...first, carril: 0, totalCarriles: 2 }]); assert.equal(days.length, 0);
  fireEvent.click(screen.getByRole('button', { name: 'Ver agenda del 2026-10-04 a las 8:00 AM' }));
  assert.equal(days[0].getDate(), 4);
  fireEvent.click(screen.getByRole('button', { name: /^dom.*4$/i }));
  assert.equal(days.length, 2); assert.equal(days[1].getDate(), 4);
});

test('COV-G1-03 monthly calendar: sorted previews, hidden overflow, adjacent dates and selection', () => {
  const selected = [];
  render(h(AgendaMes, { fechaActual: new Date(2026, 9, 4), citas: [
    appointment({ id: 4, hora_inicio: '11:00', nombre_contacto: 'Cuarto' }),
    appointment({ id: 3, hora_inicio: '10:00', nombre_contacto: 'Tercero', estado: 'cancelada' }),
    appointment({ id: 2, hora_inicio: '09:00', nombre_contacto: 'Segundo', estado: 'desconocido' }),
    appointment({ id: 1, hora_inicio: '08:00', paciente_nombres: 'Uno', paciente_apellidos: 'Sintetico' })],
    onDiaClick: day => selected.push(day) }));
  const cell = screen.getByRole('button', { name: '4 de octubre: 4 citas' });
  const previews = [...cell.querySelectorAll('p')];
  assert.match(previews[0].textContent, /8:00 AM Sintetico, Uno/);
  assert.match(previews[1].textContent, /9:00 AM Segundo/);
  assert.match(previews[2].className, /line-through/);
  assert.ok(within(cell).getByText('+1 más')); assert.equal(screen.queryByText(/Cuarto/), null);
  fireEvent.click(cell); assert.equal(selected[0].getDate(), 4);
  const adjacent = screen.getByRole('button', { name: '28 de setiembre: 0 citas' });
  fireEvent.click(adjacent); assert.equal(selected[1].getMonth(), 8);
});

test('COV-G1-04 real agenda: loading, day/week/month ranges, navigation and return to today', async () => {
  const pending = deferred(), calls = [];
  citasService.getAll = async (...args) => { calls.push(args); return calls.length === 1 ? pending.promise : response([]); };
  const view = agenda();
  assert.ok(view.container.querySelector('.animate-spin'));
  assert.deepEqual(calls[0], ['2026-10-04', '2026-10-04']);
  await act(async () => pending.resolve(response([])));
  await screen.findByText('Doctor sintetico');
  fireEvent.click(period('siguiente'));
  await waitFor(() => assert.deepEqual(calls.at(-1), ['2026-10-05', '2026-10-05']));
  fireEvent.click(screen.getByRole('button', { name: 'Hoy' }));
  await waitFor(() => assert.deepEqual(calls.at(-1), ['2026-10-04', '2026-10-04']));
  fireEvent.click(screen.getByRole('button', { name: 'Semana' }));
  await waitFor(() => assert.deepEqual(calls.at(-1), ['2026-09-28', '2026-10-04']));
  fireEvent.click(period('anterior'));
  await waitFor(() => assert.deepEqual(calls.at(-1), ['2026-09-21', '2026-09-27']));
  fireEvent.click(screen.getByRole('button', { name: 'Mes' }));
  await waitFor(() => assert.deepEqual(calls.at(-1), ['2026-08-31', '2026-10-04']));
  fireEvent.click(period('siguiente'));
  await waitFor(() => assert.deepEqual(calls.at(-1), ['2026-09-28', '2026-11-01']));
  const cell = await screen.findByRole('button', { name: '4 de octubre: 0 citas' });
  fireEvent.click(cell);
  await waitFor(() => assert.equal(screen.getByRole('button', { name: 'Día' }).getAttribute('aria-pressed'), 'true'));
  await screen.findByText('Doctor sintetico');
  assert.deepEqual(calls.at(-1), ['2026-10-04', '2026-10-04']);
});

test('COV-G1-05 real agenda: new/slot/edit modals preserve prefill and refresh after saving', async () => {
  let rows = [appointment()], refreshes = 0, saved;
  citasService.getAll = async () => { refreshes++; return response(rows); };
  citasService.editar = async (id, form) => { saved = { id, form: { ...form } }; rows = [{ ...rows[0], ...form }]; };
  agenda(); await screen.findByText('Doctor sintetico');
  fireEvent.click(screen.getByRole('button', { name: 'Nueva cita' }));
  assert.equal(screen.getByLabelText('Fecha').value, '2026-10-04');
  assert.equal(screen.getByLabelText('Doctor').value, '');
  let modal = within(screen.getByText('Nueva cita', { selector: 'h3' }).parentElement.parentElement);
  fireEvent.click(modal.getByRole('button', { name: 'Cerrar cita' }));
  fireEvent.click(screen.getByRole('button', { name: 'Agendar con Doctor sintetico a las 10:00 AM' }));
  assert.equal(screen.getByLabelText('Doctor').value, '7');
  assert.equal(screen.getByLabelText('Hora de inicio').value, '10:00');
  modal = within(screen.getByText('Nueva cita', { selector: 'h3' }).parentElement.parentElement);
  fireEvent.click(modal.getByRole('button', { name: 'Cerrar cita' }));
  fireEvent.click(screen.getByRole('button', { name: /Contacto sintetico/ }));
  assert.ok(screen.getByRole('heading', { name: 'Detalle de la cita' }));
  assert.equal(screen.getByLabelText('Nombre de contacto').value, 'Contacto sintetico');
  change('Motivo de consulta', 'Nuevo motivo sintetico');
  fireEvent.submit(screen.getByText('Guardar Cambios').closest('form'));
  // A pending modal must fail with a boolean, not inspection of its React/DOM graph.
  await waitFor(() => assert.ok(screen.queryByLabelText('Nombre de contacto') === null));
  assert.equal(saved.id, 91); assert.equal(saved.form.motivo_consulta, 'Nuevo motivo sintetico');
  assert.equal(refreshes, 2); assert.ok(screen.getByText('Nuevo motivo sintetico'));
});

test('COV-G1-06 real agenda: stale success/error cannot overwrite current view; current errors clear data', async () => {
  const initial = deferred(), old = deferred(), current = deferred(); let count = 0;
  citasService.getAll = async () => [initial, old, current][count++]?.promise ?? response([]);
  agenda(); await act(async () => initial.resolve(response([appointment()])));
  await screen.findByText('Contacto sintetico');
  fireEvent.click(period('siguiente')); fireEvent.click(period('siguiente'));
  await act(async () => current.resolve(response([appointment({ nombre_contacto: 'Respuesta actual' })])));
  await screen.findByText('Respuesta actual');
  await act(async () => old.resolve(response([appointment({ nombre_contacto: 'Respuesta obsoleta' })])));
  assert.equal(screen.queryByText('Respuesta obsoleta'), null); assert.ok(screen.getByText('Respuesta actual'));
  const staleError = deferred(), latest = deferred(); let retries = 0;
  citasService.getAll = async () => (++retries === 1 ? staleError : latest).promise;
  fireEvent.click(period('siguiente')); fireEvent.click(period('siguiente'));
  await act(async () => latest.resolve(response([appointment({ nombre_contacto: 'Respuesta final' })])));
  await act(async () => staleError.reject(new Error('SYNTHETIC_STALE_FAILURE')));
  assert.ok(screen.getByText('Respuesta final')); assert.equal(errors.length, 0);
  citasService.getAll = async () => { throw new Error('SYNTHETIC_CURRENT_FAILURE'); };
  fireEvent.click(period('siguiente'));
  await waitFor(() => assert.deepEqual(errors, ['Error al cargar las citas.']));
  assert.equal(screen.queryByText('Respuesta final'), null);
  cleanup();
  usuariosService.getDoctores = async () => { throw new Error('SYNTHETIC_DOCTORS_FAILURE'); };
  citasService.getAll = async () => ({ data: {} });
  agenda(); await screen.findByText('No hay doctores activos para mostrar en la agenda.');
  assert.ok(errors.includes('Error al cargar la lista de doctores.'));
});

test('COV-G1-07 real layout: admin/doctor links, outlet navigation, menu closure and identity fallback', () => {
  localStorage.setItem('isAdmin', 'true'); localStorage.setItem('userFullName', 'Admin sintetico');
  let view = layout();
  const toggle = screen.getByRole('button', { name: 'Menú de perfil' });
  fireEvent.click(toggle); assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.ok(screen.getByText('Admin sintetico')); assert.equal(screen.queryByRole('link', { name: 'Mi producción' }), null);
  fireEvent.click(screen.getByRole('link', { name: 'Dashboard Financiero' })); assert.equal(route(), '/finanzas');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  fireEvent.click(toggle); assert.ok(screen.getByRole('link', { name: 'Administración de Personal' }));
  fireEvent.mouseDown(document.body); assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  fireEvent.click(screen.getByRole('link', { name: 'Pacientes' })); assert.equal(route(), '/pacientes');
  fireEvent.click(screen.getByRole('link', { name: 'Agenda' })); assert.equal(route(), '/agenda');
  view.unmount(); localStorage.clear(); localStorage.setItem('userRol', 'Doctor');
  view = layout(); fireEvent.click(screen.getByRole('button', { name: 'Menú de perfil' }));
  assert.ok(screen.getByText('Personal Clínico')); assert.ok(screen.getByText('Usuario'));
  assert.equal(screen.queryByRole('link', { name: 'Dashboard Financiero' }), null);
  fireEvent.click(screen.getByRole('link', { name: 'Mi producción' })); assert.equal(route(), '/produccion');
  fireEvent.click(screen.getByRole('button', { name: 'Menú de perfil' }));
  fireEvent.click(screen.getByRole('link', { name: 'Mi Perfil' })); assert.equal(route(), '/perfil');
});

test('COV-G1-08 real layout: failed logout retains session; pending/success ends once and navigates', async () => {
  let ended = []; browserSession.end = epoch => ended.push(epoch);
  authService.logout = async () => { throw new Error('SYNTHETIC_OFFLINE'); };
  layout(); fireEvent.click(screen.getByRole('button', { name: 'Menú de perfil' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
  await waitFor(() => assert.equal(errors.length, 1)); assert.deepEqual(ended, []); assert.equal(route(), '/');
  authService.logout = async () => { throw { code: 'SESSION_CHANGED' }; };
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
  await waitFor(() => assert.equal(screen.getByRole('button', { name: 'Cerrar sesión' }).disabled, false));
  assert.equal(errors.length, 1); assert.deepEqual(ended, []);
  const pending = deferred(); let calls = 0;
  authService.logout = async () => { calls++; return pending.promise; };
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
  assert.equal(screen.getByRole('button', { name: 'Cerrar sesión' }).disabled, true);
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' })); assert.equal(calls, 1);
  await act(async () => pending.resolve({}));
  assert.ok(screen.getByText('Acceso sintetico')); assert.deepEqual(ended, [7]);
});

test('COV-G1-09 real App: anonymous protected/admin routes redirect to login without data calls', async () => {
  let dataCalls = 0; citasService.getAll = async () => { dataCalls++; return response([]); };
  for (const path of ['/agenda', '/finanzas', '/administracion-personal']) {
    window.history.replaceState(null, '', path);
    const view = render(h(App));
    await screen.findByLabelText('ID de usuario');
    assert.equal(window.location.pathname, '/login');
    assert.equal(screen.queryByRole('navigation'), null); assert.equal(dataCalls, 0);
    view.unmount();
  }
});

test('COV-G1-10 real App: authenticated agenda and non-admin/admin finance guards use actual routes', async () => {
  fixture.user = { id: 'synthetic-doctor', isAdmin: false }; fixture.status = 'ready';
  window.history.replaceState(null, '', '/agenda');
  let view = render(h(App)); await screen.findByText('Doctor sintetico');
  assert.ok(screen.getByRole('navigation')); assert.equal(window.location.pathname, '/agenda');
  view.unmount();
  let financeCalls = 0;
  dashboardService.getFinanciero = async () => { financeCalls++; return response({ caja: {}, totales: {}, porDoctor: [] }); };
  window.history.replaceState(null, '', '/finanzas');
  view = render(h(App)); await screen.findByText(/Bienvenido/);
  assert.equal(window.location.pathname, '/'); assert.equal(financeCalls, 0);
  view.unmount(); fixture.user = { id: 'synthetic-admin', isAdmin: true };
  window.history.replaceState(null, '', '/finanzas');
  render(h(App)); await screen.findByRole('region', { name: 'Movimientos de caja' });
  assert.equal(window.location.pathname, '/finanzas'); assert.equal(financeCalls, 1);
  assert.ok(screen.getByRole('heading', { name: 'Dashboard Financiero' }));
});

test('COV-G1-11 real error boundary: healthy content and render failure expose recovery without resubmitting', t => {
  t.mock.method(console, 'error', () => {});
  const view = render(h(AppErrorBoundary, null, h('p', null, 'Contenido sano')));
  assert.ok(screen.getByText('Contenido sano')); assert.equal(screen.queryByRole('alert'), null);
  let executions = 0;
  function Broken() { executions++; throw new Error('SYNTHETIC_RENDER_FAILURE'); }
  view.rerender(h(AppErrorBoundary, null, h(Broken)));
  const alert = within(screen.getByRole('alert'));
  assert.ok(executions > 0); assert.equal(screen.queryByText('Contenido sano'), null);
  assert.ok(alert.getByRole('heading', { name: 'No se pudo mostrar esta pantalla' }));
  assert.ok(alert.getByText(/consulta el registro antes de repetir/));
  assert.equal(alert.getByRole('link', { name: 'Ir al inicio' }).getAttribute('href'), '/');
  assert.equal(alert.getByRole('button', { name: 'Volver a cargar' }).disabled, false);
});
