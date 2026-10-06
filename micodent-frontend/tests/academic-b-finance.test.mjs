import test from 'node:test';
import assert from 'node:assert/strict';
import { React, render, cleanup, screen, waitFor, act, disposeRuntime } from './helpers/component-runtime.mjs';
import { dashboardService, gastosService, laboratorioService, usuariosService } from './helpers/component-boundaries.mjs';
import { FINANCE_EVENT } from '../src/utils/financeEvents.js';
const { default: FinanzasDashboard } = await import('../src/pages/FinanzasDashboard.jsx');
test.afterEach(cleanup); test.after(disposeRuntime);

test('ACA-B-F13 finance refresh handles focus, storage, visibility, timer and listener cleanup', async t => {
  const calls = { summary: 0, expenses: 0, lab: 0 }, timers = new Map();
  let visible = 'visible', sequence = 0;
  const original = Object.getOwnPropertyDescriptor(document, 'visibilityState');
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visible });
  t.after(() => original ? Object.defineProperty(document, 'visibilityState', original) : delete document.visibilityState);
  const realInterval = globalThis.setInterval, realClear = globalThis.clearInterval;
  t.mock.method(globalThis, 'setInterval', (callback, duration, ...args) => {
    if (duration !== 30000) return realInterval(callback, duration, ...args);
    const id = `academic-timer-${++sequence}`; timers.set(id, callback); return id;
  });
  t.mock.method(globalThis, 'clearInterval', id => timers.has(id) ? timers.delete(id) : realClear(id));
  dashboardService.getFinanciero = async () => {
    calls.summary++;
    return { data: { data: { porDoctor: [], totales: { totalFacturado: '100.00' },
      caja: { ingresos: '100.00', pagosLaboratorio: '20.00', gastosOperativos: '10.00', flujoNeto: '70.00' } } } };
  };
  gastosService.getAll = async () => { calls.expenses++; return { data: { data: [] } }; };
  laboratorioService.getTrabajos = async () => { calls.lab++; return { data: { data: [] } }; };
  usuariosService.getDoctores = async () => ({ data: { data: [] } });
  const view = render(React.createElement(FinanzasDashboard));
  await screen.findByRole('region', { name: 'Movimientos de caja' });
  assert.equal(timers.size, 1);
  const refresh = async (event, expected) => {
    const before = { ...calls };
    await act(async () => event());
    await waitFor(() => assert.deepEqual(calls, Object.fromEntries(Object.entries(before).map(([key, value]) => [key, value + expected]))));
  };
  await refresh(() => window.dispatchEvent(new Event('focus')), 1);
  await refresh(() => window.dispatchEvent(new window.StorageEvent('storage', { key: 'unrelated' })), 0);
  await refresh(() => window.dispatchEvent(new window.StorageEvent('storage', { key: FINANCE_EVENT })), 1);
  await refresh(() => window.dispatchEvent(new Event(FINANCE_EVENT)), 1);
  visible = 'hidden';
  await refresh(() => document.dispatchEvent(new Event('visibilitychange')), 0);
  await refresh(() => [...timers.values()][0](), 0);
  visible = 'visible';
  await refresh(() => document.dispatchEvent(new Event('visibilitychange')), 1);
  await refresh(() => [...timers.values()][0](), 1);
  view.unmount();
  assert.equal(timers.size, 0);
  await refresh(() => {
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event(FINANCE_EVENT));
    window.dispatchEvent(new window.StorageEvent('storage', { key: FINANCE_EVENT }));
    document.dispatchEvent(new Event('visibilitychange'));
  }, 0);
});
