import test from 'node:test';
import assert from 'node:assert/strict';
import { FINANCE_EVENT, isFinancialMutation, notifyFinanceChange } from '../src/utils/financeEvents.js';

test('financial mutations include expenses, laboratory, payments, voids and personnel', () => {
  for (const url of ['/gastos', '/gastos/5', '/gastos/5/reactivar', '/gastos/penalidades', '/laboratorio/2/pagos', '/historias/1/consultas', '/historias/consultas/5/pagos', '/historias/pagos/2/anular', '/usuarios/doctor', '/dashboard/configuracion-pos']) {
    for (const method of ['post', 'PUT', 'patch', 'delete']) assert(isFinancialMutation({url, method}), `${method} ${url}`);
    assert(!isFinancialMutation({url, method:'get'}));
  }
  for (const url of ['/auth/login', '/citas', '/historias/1/recetas', '/historias/1/firmas', '/gastos-extra']) assert(!isFinancialMutation({url, method:'post'}));
  assert(!isFinancialMutation());
});

test('notification has no financial data and still works when browser storage is blocked', t => {
  const events = new EventTarget(), values = [];
  let count = 0;
  events.addEventListener(FINANCE_EVENT, () => count++);
  const originals = Object.fromEntries(['window','localStorage'].map(key => [key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  t.after(() => { for (const [key, descriptor] of Object.entries(originals)) { if (descriptor) Object.defineProperty(globalThis,key,descriptor); else delete globalThis[key]; } });
  Object.defineProperty(globalThis, 'window', {value:events, configurable:true, writable:true});
  Object.defineProperty(globalThis, 'localStorage', {value:{setItem:(key,value)=>values.push([key,value])}, configurable:true, writable:true});
  notifyFinanceChange(); notifyFinanceChange();
  assert.equal(count, 2);
  assert.equal(values[0][0], FINANCE_EVENT);
  assert.notEqual(values[0][1], values[1][1]);
  assert.match(values[0][1], /^\d+-[0-9a-f-]+$/);
  globalThis.localStorage = {setItem:() => {throw new Error('Blocked');}};
  assert.doesNotThrow(notifyFinanceChange);
  assert.equal(count, 3);
});
