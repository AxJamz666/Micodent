import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import axios from 'axios';
import { React, render, cleanup, screen, deferred, disposeRuntime } from './helpers/component-runtime.mjs';
import { normalizeResponse, activityFields, money } from '../src/utils/data.js';
import { selectedRxTeeth } from '../src/utils/rxTeeth.js';
import { FINANCE_EVENT, notifyFinanceChange } from '../src/utils/financeEvents.js';
import { createSessionState, SESSION_EVENT_KEY } from '../src/services/sessionState.js';
const { default: RxTeethPrint } = await import('../src/components/RxTeethPrint.jsx');
// Execute the real browser session inside Axios; only its transport is replaced.
const apiUrl = new URL('../src/services/api.js', import.meta.url).href;
const sessionUrl = new URL('../src/services/browserSession.js', import.meta.url).href;
const hooks = registerHooks({ resolve(specifier, context, next) {
  if (context.parentURL === apiUrl && specifier === './browserSession') return { url: sessionUrl, shortCircuit: true };
  return next(specifier, context);
} });
const { default: api } = await import('../src/services/api.js');
const { browserSession } = await import('../src/services/browserSession.js');
test.afterEach(cleanup); test.after(() => { hooks.deregister(); disposeRuntime(); });

test('ACA-B-F28 legacy clinical data composes normalization, teeth rendering, audit fields and session isolation', () => {
  localStorage.clear();
  const raw = { data: { orden: { piezas_tomografia: JSON.stringify(JSON.stringify(['11', 21, 99])),
    periapicales_piezas: '[11,12,12]', anulada: '0' },
    detalle_json: JSON.stringify({ monto: '80.00', comision: '12.00', antes: { doctor_id: 'synthetic-old' }, despues: { doctor_id: 'synthetic-new' } }) } };
  const before = structuredClone(raw), normalized = normalizeResponse(raw);
  assert.deepEqual(raw, before);
  assert.equal(normalized.data.orden.anulada, false);
  assert.deepEqual(selectedRxTeeth(normalized.data.orden), [{ number: 12, type: 'P' }, { number: 11, type: 'T/P' }, { number: 21, type: 'T' }]);
  render(React.createElement(RxTeethPrint, { orden: normalized.data.orden }));
  const chart = screen.getByRole('region', { name: 'Odontograma de piezas solicitadas' });
  assert.equal(chart.querySelectorAll('.rx-tooth-selected').length, 3);
  assert.equal(chart.querySelector('[data-rx-piece="11"] strong').textContent, 'T/P');
  const fields = activityFields(normalized.data.detalle_json);
  assert.deepEqual(fields.slice(0, 2), [['Monto', money('80.00')], ['Comisi\u00f3n', money('12.00')]]);
  assert.match(fields[2][1], /synthetic-old/); assert.match(fields[3][1], /synthetic-new/);
  const tabA = createSessionState(localStorage, () => 'test-a');
  const tabB = createSessionState(localStorage, () => 'test-b');
  const session = { id: 'a'.repeat(64), csrf: 'b'.repeat(64) };
  tabA.verified({ id: 'synthetic-old', nombre: 'Old' }, session, tabA.assertCurrent());
  const oldEpoch = tabA.assertCurrent();
  tabA.end(oldEpoch);
  tabA.acceptLogin({ id: 'c'.repeat(64), csrf: 'd'.repeat(64) }, tabA.assertCurrent());
  assert.equal(tabA.getSnapshot().status, 'checking');
  assert.equal(tabA.getSnapshot().user, null);
  assert.throws(() => tabA.assertCurrent(oldEpoch), error => error.code === 'SESSION_CHANGED');
  tabB.checkStorage({ key: SESSION_EVENT_KEY, newValue: localStorage.getItem(SESSION_EVENT_KEY) });
  assert.equal(tabB.getSnapshot().status, 'changed');
  notifyFinanceChange();
  assert.ok(!localStorage.getItem(FINANCE_EVENT).includes('synthetic-old'));
  assert.ok(!localStorage.getItem(FINANCE_EVENT).includes('80.00'));
  assert.equal(localStorage.getItem('token'), null);
});

test('ACA-B-F30 real Axios interceptors preserve transient sessions and reject late replies after identity changes', async t => {
  localStorage.clear();
  const originalAdapter = api.defaults.adapter;
  t.after(() => { api.defaults.adapter = originalAdapter; });
  const sessionA = { id: 'e'.repeat(64), csrf: 'f'.repeat(64) };
  browserSession.verified({ id: 'synthetic-a', nombre: 'A' }, sessionA, browserSession.assertCurrent());
  let status = 200, network = false, ok = true, notifications = 0, observed;
  const listener = () => { notifications++; };
  window.addEventListener(FINANCE_EVENT, listener);
  t.after(() => window.removeEventListener(FINANCE_EVENT, listener));
  api.defaults.adapter = async config => {
    observed = config;
    if (network) throw new axios.AxiosError('Synthetic network failure', 'ERR_NETWORK', config);
    const response = { status, statusText: 'Synthetic', config, headers: {}, data: { ok, data: { medicamentos: '["synthetic"]', activo: '1' } } };
    if (status >= 400) throw new axios.AxiosError('Synthetic HTTP failure', 'ERR_BAD_RESPONSE', config, {}, response);
    return response;
  };
  const result = await api.put('/gastos/61', { monto: '10.00' });
  assert.equal(observed.withCredentials, true);
  assert.equal(observed.headers['X-Micodent-Client'], 'web');
  assert.ok(observed.headers['X-Micodent-Session'] === sessionA.id);
  assert.ok(observed.headers['X-CSRF-Token'] === sessionA.csrf);
  assert.deepEqual(result.data.data.medicamentos, ['synthetic']);
  assert.equal(result.data.data.activo, true);
  assert.equal(notifications, 1);
  ok = false; await api.put('/gastos/61', {}); assert.equal(notifications, 1); ok = true;
  for (const code of [403, 503]) {
    status = code;
    await assert.rejects(api.put('/gastos/61', {}), error => error.response.status === code);
    assert.equal(browserSession.getSnapshot().status, 'ready');
    assert.equal(localStorage.getItem('userId'), 'synthetic-a');
    assert.equal(notifications, 1);
  }
  status = 200; network = true;
  await assert.rejects(api.get('/pacientes'), error => error.code === 'ERR_NETWORK');
  assert.equal(browserSession.getSnapshot().status, 'ready');
  network = false;
  const late = deferred(), captured = deferred();
  api.defaults.adapter = config => { captured.resolve(config); return late.promise; };
  const oldRequest = api.get('/pacientes');
  const rejected = assert.rejects(oldRequest, error => error.code === 'SESSION_CHANGED');
  const oldConfig = await captured.promise;
  browserSession.end(browserSession.assertCurrent());
  const sessionB = { id: '1'.repeat(64), csrf: '2'.repeat(64) };
  browserSession.acceptLogin(sessionB, browserSession.assertCurrent());
  browserSession.verified({ id: 'synthetic-b', nombre: 'B' }, sessionB, browserSession.assertCurrent());
  late.reject(new axios.AxiosError('Late unauthorized', 'ERR_BAD_RESPONSE', oldConfig, {}, { status: 401, data: {} }));
  await rejected;
  assert.equal(browserSession.getSnapshot().status, 'ready');
  assert.equal(localStorage.getItem('userId'), 'synthetic-b');
  api.defaults.adapter = async config => { throw new axios.AxiosError('Current unauthorized', 'ERR_BAD_RESPONSE', config, {}, { status: 401, data: {} }); };
  await assert.rejects(api.get('/pacientes'), error => error.response.status === 401);
  assert.equal(browserSession.getSnapshot().status, 'expired');
  assert.equal(localStorage.getItem('userId'), null);
  assert.equal(localStorage.getItem('token'), null);
});
