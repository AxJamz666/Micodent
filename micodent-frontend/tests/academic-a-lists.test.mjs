import test from 'node:test';
import assert from 'node:assert/strict';
import { React, render, cleanup, fireEvent, screen, within, waitFor, act, disposeRuntime } from './helpers/component-runtime.mjs';
import { pacientesService, dashboardService, usuariosService } from './helpers/component-boundaries.mjs';
import { MemoryRouter, useLocation, createMemoryRouter, RouterProvider } from 'react-router-dom';
import toast from 'react-hot-toast';
const { default: Pacientes } = await import('../src/pages/Pacientes.jsx');
const { default: Dashboard } = await import('../src/pages/Dashboard.jsx');
test.afterEach(cleanup); test.after(disposeRuntime);
function Location() {
  const location = useLocation();
  return React.createElement('output', { 'aria-label': 'Ruta sintetica' }, location.pathname + location.search);
}
const mount = Component => render(React.createElement(MemoryRouter, null,
  React.createElement(Component), React.createElement(Location)));

test('ACA-A-F06 retroactive: real 300ms debounce cleanup, archived filter, stable sort and outside menu close', async t => {
  const originalTimeout = globalThis.setTimeout, originalClear = globalThis.clearTimeout;
  const timers = new Set(); let latest;
  t.mock.method(globalThis, 'setTimeout', (callback, delay, ...args) => {
    if (delay !== 300) return originalTimeout(callback, delay, ...args);
    latest = { callback, delay }; timers.add(latest); return latest;
  });
  t.mock.method(globalThis, 'clearTimeout', timer => {
    if (timers.has(timer)) timers.delete(timer); else originalClear(timer);
  });
  const rows = Object.freeze([
    Object.freeze({ id: 1, apellidos: 'Zulu', nombres: 'Paciente', activo: 1, fecha_nacimiento: '1910-06-15', estado_hc: 'completa' }),
    Object.freeze({ id: 2, apellidos: 'Alfa', nombres: 'Paciente', activo: 1, fecha_nacimiento: '2000-06-15', estado_hc: 'vacia' }),
    Object.freeze({ id: 3, apellidos: 'Medio', nombres: 'Paciente', activo: 1, fecha_nacimiento: '1980-06-15', estado_hc: 'en_progreso' }),
  ]);
  const calls = [];
  pacientesService.getAll = async (search, archived) => {
    calls.push({ search, archived }); return { data: { data: search ? [rows[1]] : rows } };
  };
  mount(Pacientes);
  assert.equal(calls.length, 0); assert.equal(latest.delay, 300);
  fireEvent.change(screen.getByRole('textbox', { name: 'Buscar pacientes' }), { target: { value: 'Al' } });
  const previous = latest;
  fireEvent.change(screen.getByRole('textbox', { name: 'Buscar pacientes' }), { target: { value: 'Alfa' } });
  assert.ok(!timers.has(previous)); assert.equal(timers.size, 1); assert.equal(calls.length, 0);
  await act(async () => latest.callback());
  assert.deepEqual(calls, [{ search: 'Alfa', archived: undefined }]);
  await screen.findByText('Alfa, Paciente');
  fireEvent.click(screen.getByRole('button', { name: 'Limpiar b\u00fasqueda' }));
  await act(async () => latest.callback());
  const names = () => screen.getAllByRole('row').slice(1).map(row => row.querySelector('td').textContent);
  assert.deepEqual(names(), ['Zulu, Paciente', 'Alfa, Paciente', 'Medio, Paciente']);
  const sort = label => {
    fireEvent.click(screen.getByRole('button', { name: /Ordenar por:/ }));
    fireEvent.click(screen.getByRole('button', { name: label, exact: true }));
  };
  sort('Nombre (A-Z)'); assert.deepEqual(names(), ['Alfa, Paciente', 'Medio, Paciente', 'Zulu, Paciente']);
  sort('Edad (mayor a menor)'); assert.deepEqual(names(), ['Zulu, Paciente', 'Medio, Paciente', 'Alfa, Paciente']);
  sort('Estado de HC (vac\u00edas primero)'); assert.deepEqual(names(), ['Alfa, Paciente', 'Medio, Paciente', 'Zulu, Paciente']);
  assert.deepEqual(rows.map(row => row.id), [1, 2, 3]);
  fireEvent.click(screen.getByRole('button', { name: /Ordenar por:/ }));
  assert.ok(screen.getByRole('button', { name: 'Nombre (A-Z)', exact: true }));
  fireEvent.mouseDown(document.body);
  assert.ok(!screen.queryByRole('button', { name: 'Nombre (A-Z)', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar archivados' }));
  await act(async () => latest.callback());
  assert.deepEqual(calls.at(-1), { search: undefined, archived: 'true' });
  assert.equal(screen.getByRole('button', { name: 'Archivados visibles' }).getAttribute('aria-pressed'), 'true');
  const last = latest; cleanup(); assert.ok(!timers.has(last));
});

test('ACA-A-F27 retroactive: grouped debt keeps every treatment, server total, empty list and single navigation', async t => {
  const errors = []; t.mock.method(toast, 'error', message => errors.push(message));
  const data = value => ({ data: { data: value } });
  dashboardService.getStats = async () => data({ ingresosHoy: 0, sinHistoria: 0, deudores: 1, totalHistorias: 1 });
  dashboardService.getUltimasHistorias = async () => data([]);
  dashboardService.getCitasHoy = async () => data([]); usuariosService.getDoctores = async () => data([]);
  let debts = [{ id: 41, apellidos: 'Sintetico', nombres: 'Paciente', deuda_total: '110.00', tratamientos: [
    { id: 71, descripcion: 'Tratamiento A', fecha: '2026-10-03', costo_total: '100.00', pagado: '20.00', pendiente: '80.00' },
    { id: 72, descripcion: 'Tratamiento B', fecha: '2026-10-03', costo_total: '50.00', pagado: '20.00', pendiente: '30.00' },
  ] }];
  let fail = false;
  dashboardService.getDeudores = async () => { if (fail) throw new Error('SYNTHETIC_OUTAGE'); return data(debts); };
  const router = createMemoryRouter([{ path: '*', element: React.createElement(React.Fragment, null,
    React.createElement(Dashboard), React.createElement(Location)) }]);
  const navigations = [];
  const unsubscribe = router.subscribe(state => navigations.push(state.location.pathname + state.location.search));
  t.after(() => { unsubscribe(); router.dispose(); });
  render(React.createElement(RouterProvider, { router })); await screen.findByText('Tratamiento A');
  const group = document.querySelector('[data-patient-debt="41"]');
  assert.equal(document.querySelectorAll('[data-patient-debt]').length, 1);
  assert.equal(group.querySelectorAll('[data-pending-treatment]').length, 2);
  assert.ok(within(group).getByText('Tratamiento B'));
  assert.ok(within(group).getByText('S/ 80.00')); assert.ok(within(group).getByText('S/ 30.00'));
  assert.ok(within(group).getByText('Pendiente: S/ 110.00'));
  fireEvent.click(within(group).getByRole('button', { name: 'Ir a pagos' }));
  assert.equal(screen.getByLabelText('Ruta sintetica').textContent, '/pacientes/41?tab=evolucion');
  assert.deepEqual(navigations, ['/pacientes/41?tab=evolucion']);
  fail = true; fireEvent.focus(window);
  await waitFor(() => assert.ok(errors.includes('Error al actualizar el inicio.')));
  assert.ok(screen.getByText('Tratamiento A'));
  cleanup(); fail = false; debts = []; mount(Dashboard);
  await screen.findByText('Sin deudas pendientes.');
  assert.equal(document.querySelectorAll('[data-pending-treatment]').length, 0);
  assert.ok(!screen.queryByRole('button', { name: 'Ir a pagos' }));
});
