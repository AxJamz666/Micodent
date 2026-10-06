import test from 'node:test';
import assert from 'node:assert/strict';
import { React, render, cleanup, fireEvent, screen, within, waitFor, act, deferred, disposeRuntime } from './helpers/component-runtime.mjs';
import { usuariosService, pacientesService, dashboardService, gastosService, laboratorioService } from './helpers/component-boundaries.mjs';
import { MemoryRouter, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FINANCE_EVENT } from '../src/utils/financeEvents.js';

const { default: Pacientes } = await import('../src/pages/Pacientes.jsx');
const { default: FinanzasDashboard } = await import('../src/pages/FinanzasDashboard.jsx');
let errors;
test.beforeEach(t => {
  errors = [];
  t.mock.method(toast, 'error', message => errors.push(message));
  t.mock.method(toast, 'success', () => {});
  usuariosService.getDoctores = async () => ({ data: { data: [] } });
  gastosService.getAll = async () => ({ data: { data: [] } });
  laboratorioService.getTrabajos = async () => ({ data: { data: [] } });
});
test.afterEach(cleanup);
test.after(disposeRuntime);

function RouteProbe() {
  const location = useLocation();
  return React.createElement('output', { 'aria-label': 'Ruta de prueba' }, location.pathname + location.search);
}

// TEST CASE: FE-P1-11; ACADEMIC CASE: F04; PARTIAL CASE: F05; TYPE: Automatizado retroactivo.
test('FE-P1-11 F04 real patient list: response shapes, retained data on failure and independent actions', async () => {
  const pending = deferred();
  let mode = 'pending', archiveCalls = 0;
  const patient = { id: 41, activo: 1, apellidos: 'Sintetico', nombres: 'Paciente',
    dni: '00000001', estado_hc: 'en_progreso', fecha_nacimiento: '2000-01-01' };
  pacientesService.getAll = async () => {
    if (mode === 'pending') return pending.promise;
    if (mode === 'error') throw new Error('SYNTHETIC_FAILURE');
    return { data: mode === 'empty' ? [] : [patient] };
  };
  pacientesService.eliminar = async () => { archiveCalls++; };
  render(React.createElement(MemoryRouter, null,
    React.createElement(React.Fragment, null, React.createElement(Pacientes), React.createElement(RouteProbe))));
  assert.ok(!screen.queryByRole('table'));
  await act(async () => pending.resolve({ data: { data: [patient] } }));
  await screen.findByText('Sintetico, Paciente');
  fireEvent.click(screen.getByTitle('Archivar paciente'));
  assert.equal(screen.getByLabelText('Ruta de prueba').textContent, '/');
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancelar' }));
  assert.equal(archiveCalls, 0);
  fireEvent.click(screen.getByTitle('Ver reporte'));
  assert.equal(screen.getByLabelText('Ruta de prueba').textContent, '/historias?view=41');
  mode = 'error';
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar archivados' }));
  await waitFor(() => assert.equal(errors.length, 1));
  assert.ok(screen.getByText('Sintetico, Paciente'));
  assert.equal(errors[0], 'Error al cargar pacientes.');
  mode = 'array';
  fireEvent.click(screen.getByRole('button', { name: 'Archivados visibles' }));
  await screen.findByText('Sintetico, Paciente');
  mode = 'empty';
  fireEvent.change(screen.getByRole('textbox', { name: 'Buscar pacientes' }), { target: { value: 'sinresultado' } });
  await screen.findByText('No se encontraron pacientes.');
});

// TEST CASE: FE-P1-12; ACADEMIC CASE: F12; PARTIAL CASE: F13; TYPE: Automatizado retroactivo.
test('FE-P1-12 F12 real financial summary: cash, negative/legacy values, stale/error responses and retry', async () => {
  const initial = deferred(), older = deferred(), newer = deferred();
  const base = {
    caja: { ingresos: '103.00', pagosLaboratorio: '20.00', gastosOperativos: '10.00', flujoNeto: '73.00', recargosTarjeta: '3.00' },
    porDoctor: [], totales: { totalFacturado: '200.00', totalComisionBruta: '15.00',
      movimientosPorConciliar: 0, costosExternosAplicados: '30.00', gananciaNetaReal: '-5.00' },
  };
  const results = [initial, older, newer];
  let calls = 0, fail = false;
  dashboardService.getFinanciero = async () => {
    const index = calls++;
    if (fail) throw new Error('SYNTHETIC_FAILURE');
    if (results[index]) return results[index].promise;
    return { data: { data: base } };
  };
  const view = render(React.createElement(FinanzasDashboard));
  assert.ok(screen.getByText('Cargando reporte financiero...'));
  await act(async () => initial.resolve({ data: { data: base } }));
  const cash = within(screen.getByRole('region', { name: 'Movimientos de caja' }));
  assert.ok(cash.getByText('S/ 103.00'));
  assert.ok(cash.getByText('S/ 73.00'));
  assert.ok(cash.getByText('S/ 20.00'));
  assert.ok(cash.getByText('S/ 10.00'));
  assert.ok(screen.getByText('S/ -5.00'));
  assert.deepEqual(screen.getAllByRole('columnheader').map(cell => cell.textContent.trim()),
    ['Doctor', 'Pacientes', 'Cobrado', 'Comisi\u00f3n Bruta', 'Penalidades', 'Comisi\u00f3n Neta']);
  fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-01-01' } });
  fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-01-31' } });
  await act(async () => newer.resolve({ data: { data: { ...base,
    caja: { ...base.caja, ingresos: '0.00', flujoNeto: '0.00' },
    totales: { ...base.totales, movimientosPorConciliar: 1, costosExternosAplicados: null, gananciaNetaReal: null } } } }));
  assert.ok(screen.getAllByText('Por conciliar').length >= 2);
  assert.ok(within(screen.getByRole('region', { name: 'Movimientos de caja' })).getAllByText('S/ 0.00').length >= 2);
  await act(async () => older.resolve({ data: { data: base } }));
  assert.ok(screen.getAllByText('Por conciliar').length >= 2, 'older response cannot replace current data');
  fail = true;
  fireEvent(window, new window.Event(FINANCE_EVENT));
  await screen.findByRole('alert');
  assert.match(screen.getByRole('alert').textContent, /desactualizados/);
  assert.ok(screen.getAllByText('Por conciliar').length >= 2);
  fail = false;
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  await screen.findByText('S/ -5.00');
  await waitFor(() => assert.ok(!screen.queryByRole('alert')));
  const before = calls;
  view.unmount();
  fireEvent(window, new window.Event(FINANCE_EVENT));
  assert.equal(calls, before, 'unmount removes financial refresh listener');
});
