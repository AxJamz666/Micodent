import test from 'node:test';
import assert from 'node:assert/strict';
import { React, render, cleanup, fireEvent, screen, within, waitFor, act, deferred, disposeRuntime } from './helpers/component-runtime.mjs';
import { fixture, pacientesService, historiasService, authService, dashboardService } from './helpers/component-boundaries.mjs';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import toast from 'react-hot-toast';

const { default: PacienteDetalle } = await import('../src/pages/PacienteDetalle.jsx');
let history, notices, successes;
test.beforeEach(t => {
  notices = []; successes = [];
  t.mock.method(toast, 'error', value => notices.push(value));
  t.mock.method(toast, 'success', value => successes.push(value));
  localStorage.clear();
  localStorage.setItem('userRol', 'Doctor');
  localStorage.setItem('isAdmin', 'true');
  localStorage.setItem('userId', 'synthetic-doctor');
  fixture.user = { id: 'synthetic-doctor', isAdmin: true };
  pacientesService.getById = async () => ({ data: { data: {
    id: 41, dni: '00000001', apellidos: 'Sintetico', nombres: 'Paciente', fecha_nacimiento: '2000-01-01',
  } } });
  history = { id: 7, nro_historia: 'QA-7', consultas: [{
    id: 71, fecha_consulta: '2026-10-03', descripcion: 'Tratamiento previo sintetico',
    costo_total: '100.00', pagos: [{ id: 1, monto: '20.00' }], bloqueada: false,
    doctor_id: 'synthetic-doctor', tipo_comision: 'estandar',
  }], radiografias: [], ordenes: [], recetas: [], odontograma: [] };
  historiasService.getByPaciente = async () => ({ data: { ok: true, data: history } });
  authService.getMe = async () => ({ data: { usuario: {} } });
  dashboardService.getPos = async () => ({ data: { data: { porcentaje: '3.00', revision: 4 } } });
});
test.afterEach(() => { cleanup(); localStorage.clear(); fixture.user = null; });
test.after(disposeRuntime);

const change = (element, value) => fireEvent.change(element, { target: { value } });
// Legacy labels are not associated yet: locate the control only within its real field container.
function field(scope, label) {
  const element = within(scope).getByText(label, { selector: 'label', exact: true })
    .parentElement.querySelector('input,textarea');
  assert.ok(element, 'field control must exist: ' + label);
  return element;
}
async function mountPatient() {
  render(React.createElement(MemoryRouter, { initialEntries: ['/pacientes/41?tab=evolucion'] },
    React.createElement(Routes, null, React.createElement(Route, { path: '/pacientes/:id',
      element: React.createElement(PacienteDetalle) }))));
  await screen.findByRole('button', { name: 'Nuevo tratamiento', exact: true });
}
const submit = dialog => fireEvent.submit(dialog.querySelector('form'));

// TEST CASE: FE-P2-03; ACADEMIC CASE: F10; TYPE: Automatizado retroactivo.
test('FE-P2-03 F10 real treatment modal: rehabilitation/endodontics, payload, validation, edit and recovery', async () => {
  const pending = deferred();
  const created = [], edited = [];
  let fail = false;
  historiasService.agregarConsulta = async (id, payload) => {
    assert.equal(id, 7);
    created.push({ ...payload });
    if (fail) throw { response: { data: { mensaje: 'Tratamiento sintetico rechazado' } } };
    if (created.length === 1) await pending.promise;
    history.consultas.push({ id: 80 + created.length, descripcion: payload.descripcion,
      fecha_consulta: payload.fecha_consulta, costo_total: payload.costo_total,
      pagos: [], tipo_comision: payload.tipo_comision, bloqueada: true });
  };
  historiasService.editarConsulta = async (id, payload) => { edited.push({ id, ...payload }); };
  await mountPatient();
  fireEvent.click(screen.getByRole('button', { name: 'Nuevo tratamiento', exact: true }));
  let dialog = screen.getByRole('dialog', { name: 'Nuevo Tratamiento' });
  change(field(dialog, 'Fecha de Inicio'), '2026-10-03');
  change(field(dialog, 'Descripci\u00f3n del Tratamiento'), 'Rehabilitacion sintetica');
  change(field(dialog, 'Estado Cl\u00ednico (c\u00f3mo encontraste al paciente hoy)'), 'Estado sintetico');
  change(field(dialog, 'Costo Total (S/)'), 'S/ 120.00x');
  change(field(dialog, 'Abono Inicial (S/)'), '121');
  submit(dialog);
  await waitFor(() => assert.ok(notices.includes('El abono no puede exceder el costo total.')));
  assert.equal(created.length, 0);
  change(field(dialog, 'Abono Inicial (S/)'), '0');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Rehabilitaci\u00f3n' }));
  change(within(dialog).getByLabelText('Nombre del Laboratorio'), 'Laboratorio sintetico');
  change(field(dialog, 'Costo Laboratorio (S/)'), '40');
  change(field(dialog, 'Otros costos externos (S/)'), '10');
  submit(dialog);
  assert.ok(within(dialog).getByRole('button', { name: 'Guardando...' }).disabled);
  fireEvent.keyDown(document, { key: 'Escape' });
  assert.ok(screen.getByRole('dialog'));
  submit(dialog);
  assert.equal(created.length, 1);
  await act(async () => pending.resolve());
  await waitFor(() => assert.ok(!screen.queryByRole('dialog')));
  assert.deepEqual(created[0], { descripcion: 'Rehabilitacion sintetica', costo_total: 120,
    abono_inicial: 0, metodo_pago: 'Efectivo', pos_revision: 4, fecha_consulta: '2026-10-03',
    estado_clinico: 'Estado sintetico', tipo_comision: 'rehabilitacion', cantidad_radiografias: 0,
    costo_externo: '10', laboratorio: { nombre_laboratorio: 'Laboratorio sintetico', monto_total: 40 } });
  await screen.findByText('Rehabilitacion sintetica');
  fireEvent.click(screen.getByRole('button', { name: 'Nuevo tratamiento', exact: true }));
  dialog = screen.getByRole('dialog', { name: 'Nuevo Tratamiento' });
  assert.ok(within(dialog).getByRole('button', { name: 'Est\u00e1ndar' }).getAttribute('aria-pressed') === 'true');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Endodoncia', exact: true }));
  assert.ok(!within(dialog).queryByLabelText('Nombre del Laboratorio'));
  change(field(dialog, 'Fecha de Inicio'), '2026-10-03');
  change(field(dialog, 'Descripci\u00f3n del Tratamiento'), 'Endodoncia sintetica');
  change(field(dialog, 'Costo Total (S/)'), '200');
  change(field(dialog, 'Abono Inicial (S/)'), '50');
  change(field(dialog, 'Cantidad de Radiograf\u00edas'), '3x');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Tarjeta (POS)' }));
  await within(dialog).findByText(/Total a cobrar: S\/ 51.50/);
  fail = true;
  submit(dialog);
  await waitFor(() => assert.ok(notices.includes('Tratamiento sintetico rechazado')));
  assert.equal(field(dialog, 'Descripci\u00f3n del Tratamiento').value, 'Endodoncia sintetica');
  assert.ok(!within(dialog).getByRole('button', { name: 'Guardar y Firmar' }).disabled);
  fail = false;
  submit(dialog);
  await waitFor(() => assert.ok(!screen.queryByRole('dialog')));
  assert.equal(created.at(-1).cantidad_radiografias, 3);
  assert.equal(created.at(-1).metodo_pago, 'Tarjeta');
  assert.equal(created.at(-1).laboratorio, null);
  const row = screen.getByText('Tratamiento previo sintetico').closest('tr');
  fireEvent.click(within(row).getByTitle('Editar'));
  dialog = screen.getByRole('dialog', { name: 'Editar Tratamiento' });
  assert.ok(!within(dialog).queryByText('Abono Inicial (S/)'));
  assert.ok(!within(dialog).queryByRole('button', { name: 'Endodoncia', exact: true }));
  change(field(dialog, 'Descripci\u00f3n del Tratamiento'), 'Tratamiento editado sintetico');
  change(field(dialog, 'Costo Total (S/)'), '150');
  submit(dialog);
  await waitFor(() => assert.ok(!screen.queryByRole('dialog')));
  assert.deepEqual(edited, [{ id: 71, descripcion: 'Tratamiento editado sintetico',
    costo_total: 150, fecha_consulta: '2026-10-03' }]);
  fireEvent.click(screen.getByRole('button', { name: 'Nuevo tratamiento', exact: true }));
  fireEvent.keyDown(document, { key: 'Escape' });
  assert.ok(!screen.queryByRole('dialog'));
});

// TEST CASE: FE-P2-04; ACADEMIC CASE: F11; TYPE: Automatizado retroactivo.
test('FE-P2-04 F11 actual payment: POS unavailable, limits, revision error, busy and retry', async () => {
  let config = null;
  const requests = [], rejected = deferred();
  dashboardService.getPos = async () => ({ data: { data: config } });
  historiasService.registrarPago = async (id, payload) => {
    requests.push({ id, ...payload });
    if (requests.length === 1) return rejected.promise;
    history.consultas[0].pagos.push({ id: 2, monto: '50.00' });
  };
  await mountPatient();
  fireEvent.click(screen.getByTitle('Abonar'));
  let dialog = screen.getByRole('dialog', { name: 'Registrar Abono' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Tarjeta (POS)' }));
  await within(dialog).findByText(/Recargo no disponible/);
  assert.ok(within(dialog).getByRole('button', { name: 'Confirmar Abono' }).disabled);
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cerrar' }));
  config = { porcentaje: '3.00', revision: 8 };
  fireEvent.click(screen.getByTitle('Abonar'));
  dialog = screen.getByRole('dialog', { name: 'Registrar Abono' });
  await within(dialog).findByText(/Recargo POS \(3.00%\)/);
  for (const invalid of ['0', '90']) {
    change(field(dialog, 'Monto a Abonar (S/)'), invalid);
    submit(dialog);
    assert.equal(requests.length, 0);
  }
  assert.ok(notices.includes('Monto inv\u00e1lido.'));
  change(field(dialog, 'Monto a Abonar (S/)'), '50');
  assert.ok(within(dialog).getByText(/Total a cobrar: S\/ 51.50/));
  submit(dialog);
  fireEvent.keyDown(document, { key: 'Escape' });
  assert.ok(within(dialog).getByRole('button', { name: 'Confirmando...' }).disabled);
  submit(dialog);
  assert.equal(requests.length, 1);
  await act(async () => rejected.reject({ response: { data: { mensaje: 'Recargo actualizado. Reabre para recargar.' } } }));
  assert.ok(notices.includes('Recargo actualizado. Reabre para recargar.'));
  assert.equal(field(dialog, 'Monto a Abonar (S/)').value, '50');
  assert.ok(!within(dialog).getByRole('button', { name: 'Confirmar Abono' }).disabled);
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cerrar' }));
  config = { porcentaje: '3.00', revision: 9 };
  fireEvent.click(screen.getByTitle('Abonar'));
  dialog = screen.getByRole('dialog', { name: 'Registrar Abono' });
  await act(async () => {});
  submit(dialog);
  await waitFor(() => assert.ok(!screen.queryByRole('dialog')));
  assert.deepEqual(requests, [{ id: 71, monto: 50, metodo_pago: 'Tarjeta', pos_revision: 8 },
    { id: 71, monto: 50, metodo_pago: 'Tarjeta', pos_revision: 9 }]);
  await waitFor(() => assert.ok(within(screen.getByText('Tratamiento previo sintetico').closest('tr')).getByText('S/ 30.00')));
  assert.equal(successes.filter(x => x === 'Abono registrado.').length, 1);
});
