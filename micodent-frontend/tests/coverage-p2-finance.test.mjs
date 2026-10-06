import test from 'node:test';
import assert from 'node:assert/strict';
import { React, render, cleanup, fireEvent, screen, within, waitFor, disposeRuntime } from './helpers/component-runtime.mjs';
import { usuariosService, dashboardService, gastosService, laboratorioService } from './helpers/component-boundaries.mjs';
import { notifyFinanceChange } from '../src/utils/financeEvents.js';
import toast from 'react-hot-toast';

const { default: FinanzasDashboard } = await import('../src/pages/FinanzasDashboard.jsx');
let notices, successes;
test.beforeEach(t => {
  notices = []; successes = [];
  t.mock.method(toast, 'error', value => notices.push(value));
  t.mock.method(toast, 'success', value => successes.push(value));
  usuariosService.getDoctores = async () => ({ data: { data: [] } });
  gastosService.getAll = async () => ({ data: { data: [] } });
  laboratorioService.getTrabajos = async () => ({ data: { data: [] } });
});
test.afterEach(cleanup);
test.after(disposeRuntime);

const summary = caja => ({ data: { data: { caja, porDoctor: [], totales: {
  totalFacturado: '100.00', totalComisionBruta: '30.00',
  costosExternosAplicados: '20.00', gananciaNetaReal: '50.00', movimientosPorConciliar: 0,
} } } });
const cash = () => within(screen.getByRole('region', { name: 'Movimientos de caja' }));
const change = (element, value) => fireEvent.change(element, { target: { value } });
const filterWith = option => screen.getByRole('option', { name: option }).closest('select');
async function expectCash(tab, value) {
  fireEvent.click(screen.getByRole('button', { name: 'Resumen', exact: true }));
  await waitFor(() => assert.ok(cash().getByText(value)));
  fireEvent.click(screen.getByRole('button', { name: tab, exact: true }));
}

// TEST CASE: FE-P2-01; ACADEMIC CASE: F14; TYPE: Automatizado retroactivo.
test('FE-P2-01 F14 expense form, filters, failed edit and void/reactivation refresh', async t => {
  let rows = [], payload, editCalls = 0, voidCalls = 0, reactivateCalls = 0, failEdit = false;
  let caja = { ingresos: '100.00', pagosLaboratorio: '0.00', gastosOperativos: '0.00', flujoNeto: '100.00' };
  dashboardService.getFinanciero = async () => summary(caja);
  gastosService.getAll = async () => ({ data: { data: rows.map(row => ({ ...row })) } });
  // This transport fixture emits the real notification after a successful mutation.
  gastosService.crear = async value => {
    payload = { ...value };
    rows = [{ id: 61, ...payload, estado: 'activo', registrado_por: 'synthetic-admin',
      registrado_por_nombre: 'Administrador sintetico' }];
    caja = { ...caja, gastosOperativos: '10.00', flujoNeto: '90.00' };
    notifyFinanceChange();
  };
  gastosService.editar = async (id, value) => {
    editCalls++;
    assert.equal(id, 61);
    if (failEdit) throw { response: { data: { mensaje: 'Fallo sintetico de gasto' } } };
    rows = [{ ...rows[0], ...value }];
    caja = { ...caja, gastosOperativos: '12.00', flujoNeto: '88.00' };
    notifyFinanceChange();
  };
  gastosService.eliminar = async id => {
    voidCalls++; assert.equal(id, 61); rows = [{ ...rows[0], estado: 'anulado' }];
    caja = { ...caja, gastosOperativos: '0.00', flujoNeto: '100.00' }; notifyFinanceChange();
  };
  gastosService.reactivar = async id => {
    reactivateCalls++; assert.equal(id, 61); rows = [{ ...rows[0], estado: 'activo' }];
    caja = { ...caja, gastosOperativos: '12.00', flujoNeto: '88.00' }; notifyFinanceChange();
  };
  let confirm = false;
  t.mock.method(window, 'confirm', () => confirm);
  render(React.createElement(FinanzasDashboard));
  await screen.findByRole('region', { name: 'Movimientos de caja' });
  fireEvent.click(screen.getByRole('button', { name: 'Gastos', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Nuevo Gasto' }));
  let dialog = screen.getByRole('dialog', { name: 'Nuevo Gasto' });
  change(within(dialog).getByLabelText('Mes de Consumo (opcional)'), '2026-09');
  change(within(dialog).getByLabelText('Categor\u00eda'), 'materiales');
  assert.ok(!within(dialog).queryByLabelText('Mes de Consumo (opcional)'));
  change(within(dialog).getByLabelText('Categor\u00eda'), 'luz');
  assert.equal(within(dialog).getByLabelText('Mes de Consumo (opcional)').value, '');
  change(within(dialog).getByLabelText('Mes de Consumo (opcional)'), '2026-09');
  change(within(dialog).getByLabelText('Descripci\u00f3n (opcional)'), 'Recibo sintetico');
  change(within(dialog).getByLabelText('Monto (S/)'), 'S/ 10.00x');
  change(within(dialog).getByLabelText('Fecha de Pago'), '2026-10-03');
  fireEvent.submit(dialog.querySelector('form'));
  await waitFor(() => assert.ok(!screen.queryByRole('dialog')));
  assert.deepEqual(payload, { categoria: 'luz', descripcion: 'Recibo sintetico',
    monto: '10.00', fecha_pago: '2026-10-03', mes_consumo: '2026-09' });
  await screen.findByText('Recibo sintetico');
  await expectCash('Gastos', 'S/ 90.00');
  change(filterWith('Todas las categor\u00edas'), 'agua');
  assert.ok(!screen.queryByText('Recibo sintetico'));
  change(filterWith('Todas las categor\u00edas'), 'todas');
  change(filterWith('Todos los usuarios'), 'synthetic-admin');
  assert.ok(screen.getByText('Recibo sintetico'));
  fireEvent.click(screen.getByTitle('Editar'));
  dialog = screen.getByRole('dialog', { name: 'Editar Gasto' });
  assert.equal(within(dialog).getByLabelText('Mes de Consumo (opcional)').value, '2026-09');
  change(within(dialog).getByLabelText('Monto (S/)'), '12.00');
  failEdit = true;
  fireEvent.submit(dialog.querySelector('form'));
  await waitFor(() => assert.ok(notices.includes('Fallo sintetico de gasto')));
  assert.equal(within(dialog).getByLabelText('Monto (S/)').value, '12.00');
  assert.equal(successes.filter(x => x === 'Gasto actualizado.').length, 0);
  failEdit = false;
  fireEvent.submit(dialog.querySelector('form'));
  await waitFor(() => assert.ok(!screen.queryByRole('dialog')));
  assert.equal(editCalls, 2);
  await expectCash('Gastos', 'S/ 88.00');
  fireEvent.click(screen.getByTitle('Anular'));
  assert.equal(voidCalls, 0, 'cancelled confirmation does not mutate');
  confirm = true;
  fireEvent.click(screen.getByTitle('Anular'));
  await screen.findByTitle('Reactivar');
  assert.equal(voidCalls, 1);
  change(filterWith('Todos los estados'), 'activo');
  assert.ok(!screen.queryByText('Recibo sintetico'));
  change(filterWith('Todos los estados'), 'anulado');
  fireEvent.click(screen.getByTitle('Reactivar'));
  await waitFor(() => assert.equal(reactivateCalls, 1));
  change(filterWith('Todos los estados'), 'todos');
  await screen.findByTitle('Editar');
  await expectCash('Gastos', 'S/ 88.00');
  fireEvent.click(screen.getByRole('button', { name: 'Nuevo Gasto' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cerrar' }));
  assert.ok(!screen.queryByRole('dialog'));
  assert.equal(successes.filter(x => x === 'Gasto registrado.').length, 1);
});

// TEST CASE: FE-P2-02; ACADEMIC CASE: F15; TYPE: Automatizado retroactivo.
test('FE-P2-02 F15 laboratory partial/final payments update cash, preserve failures and paid history', async () => {
  const initial = { id: 91, nombre_laboratorio: 'Laboratorio sintetico', apellidos: 'Sintetico',
    nombres: 'Paciente', nro_historia: 'QA-1', descripcion: 'Corona sintetica',
    monto_total: '80.00', total_pagado: '0.00', saldo_pendiente: 80 };
  let row = { ...initial }, pagoCalls = 0, fail = false;
  let caja = { ingresos: '100.00', pagosLaboratorio: '0.00', gastosOperativos: '0.00', flujoNeto: '100.00' };
  dashboardService.getFinanciero = async () => summary(caja);
  laboratorioService.getTrabajos = async filtro => ({ data: { data:
    (filtro === 'pagado' ? row.saldo_pendiente === 0 : row.saldo_pendiente > 0) ? [{ ...row }] : [] } });
  laboratorioService.registrarPago = async (id, payload) => {
    pagoCalls++; assert.equal(id, 91);
    if (fail) throw { response: { data: { mensaje: 'Pago sintetico rechazado' } } };
    if (pagoCalls === 1) {
      assert.deepEqual(payload, { monto: 30 });
      row = { ...row, total_pagado: '30.00', saldo_pendiente: 50 };
      caja = { ...caja, pagosLaboratorio: '30.00', flujoNeto: '70.00' };
    } else {
      assert.deepEqual(payload, { monto: 50 });
      row = { ...row, total_pagado: '80.00', saldo_pendiente: 0, ultima_fecha_pago: '2026-10-03T12:00:00' };
      caja = { ...caja, pagosLaboratorio: '80.00', flujoNeto: '20.00' };
    }
    notifyFinanceChange();
  };
  render(React.createElement(FinanzasDashboard));
  await screen.findByRole('region', { name: 'Movimientos de caja' });
  fireEvent.click(screen.getByRole('button', { name: 'Laboratorio', exact: true }));
  await screen.findByText('Laboratorio sintetico');
  fireEvent.click(screen.getByRole('button', { name: 'Registrar Pago' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
  assert.equal(pagoCalls, 0);
  assert.ok(notices.includes('Ingresa un monto v\u00e1lido.'));
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Registrar Pago' }));
  change(screen.getByPlaceholderText('Monto'), 'S/30x');
  assert.equal(screen.getByPlaceholderText('Monto').value, '30');
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
  await screen.findByRole('button', { name: 'Registrar Pago' });
  await expectCash('Laboratorio', 'S/ 70.00');
  assert.ok(screen.getByText('S/ 50.00'));
  fireEvent.click(screen.getByRole('button', { name: 'Registrar Pago' }));
  change(screen.getByPlaceholderText('Monto'), '50');
  fail = true;
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
  await waitFor(() => assert.ok(notices.includes('Pago sintetico rechazado')));
  assert.equal(screen.getByPlaceholderText('Monto').value, '50');
  assert.ok(screen.getByText('S/ 30.00'));
  fail = false;
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
  await waitFor(() => assert.ok(!screen.queryByPlaceholderText('Monto')));
  await expectCash('Laboratorio', 'S/ 20.00');
  assert.ok(!screen.queryByText('Laboratorio sintetico'));
  fireEvent.click(screen.getByRole('button', { name: 'Historial Pagado' }));
  await screen.findByText(/Pagado completo.*2026-10-03/);
  assert.ok(screen.getByText('Laboratorio sintetico'));
  assert.ok(!screen.queryByRole('button', { name: 'Registrar Pago' }));
  fireEvent.click(screen.getByRole('button', { name: 'Resumen', exact: true }));
  assert.ok(screen.getByText('S/ 50.00'), 'production result does not become a cash-payment total');
  assert.match(screen.getByText('Costos externos aplicados').parentElement.textContent, /S\/ 20.00/);
  assert.equal(pagoCalls, 3);
});
