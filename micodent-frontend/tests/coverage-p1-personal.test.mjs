import test from 'node:test';
import assert from 'node:assert/strict';
import { React, render, cleanup, fireEvent, screen, within, waitFor, act, deferred, disposeRuntime } from './helpers/component-runtime.mjs';
import { fixture, usuariosService } from './helpers/component-boundaries.mjs';
import toast from 'react-hot-toast';

const { default: Personal } = await import('../src/pages/AdministracionPersonal.jsx');
const actor = { id: 'superqa', nivel: 3, isAdmin: true };
const people = [
  { id: 'superqa', nivel: 3, activo: 1, rol: 'Doctor', nombre_completo: 'Dr. Persona Propia', gender: 'o', comision_porcentaje: 30 },
  { id: 'doctorqa', nivel: 1, activo: 1, rol: 'Doctor', nombre_completo: 'Dra. Persona Uno', cop: '12345', comision_porcentaje: 25, gender: 'a' },
  { id: 'inactiveqa', nivel: 1, activo: 0, rol: 'Asistente', nombre_completo: 'Asist. Persona Inactiva', telefono: '000000001' },
  { id: 'peerqa', nivel: 3, activo: 1, rol: 'Administradora', nombre_completo: 'Adm. Persona Igual' },
];
let errors, successes;
const nextPassword = 'Synthetic component password 2026';

test.beforeEach(t => {
  fixture.user = { ...actor };
  for (const key of Object.keys(usuariosService)) delete usuariosService[key];
  usuariosService.getAll = async () => ({ data: { data: structuredClone(people) } });
  errors = []; successes = [];
  t.mock.method(toast, 'error', message => errors.push(message));
  t.mock.method(toast, 'success', message => successes.push(message));
});
test.afterEach(cleanup);
test.after(disposeRuntime);

async function mount() {
  const view = render(React.createElement(Personal));
  await screen.findByRole('button', { name: 'Editar datos de Dra. Persona Uno' });
  return view;
}
function input(label, value) { fireEvent.change(screen.getByLabelText(label), { target: { value } }); }
function submitFrom(label) { fireEvent.submit(screen.getByLabelText(label).closest('form')); }
async function credentialForm(target, next = nextPassword, confirm = next) {
  fireEvent.click(screen.getByRole('button', { name: target }));
  input('Tu contrase\u00f1a de administrador', 'Synthetic actor credential 2026');
  input('Nueva contrase\u00f1a para el usuario', next);
  input('Confirmar nueva contrase\u00f1a', confirm);
}

// TEST CASE: FE-P1-03; ACADEMIC CASE: F01; TYPE: Automatizado retroactivo.
test('FE-P1-03 F01 actual personnel form creates doctor with normalized payload', async () => {
  let payload;
  usuariosService.crear = async data => { payload = data; };
  await mount();
  input('Nombres y apellidos completos', 'Persona Clinica');
  input('DNI', 'abc00000012');
  input('Celular', 'abc000000012');
  input('Rol en cl\u00ednica', 'Doctor');
  input('Trato', 'a');
  input('Especialidad', 'General');
  input('Nro. COP', 'x12345');
  input('% Comisi\u00f3n', '30.25');
  input('ID de acceso', 'QA!Doc');
  input('Contrase\u00f1a inicial', nextPassword);
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar contrase\u00f1a inicial' }));
  assert.equal(screen.getByLabelText('Contrase\u00f1a inicial').type, 'text');
  fireEvent.click(screen.getByRole('button', { name: 'Ocultar contrase\u00f1a inicial' }));
  submitFrom('Nombres y apellidos completos');
  await waitFor(() => assert.equal(successes.length, 1));
  assert.equal(payload.id, 'qadoc');
  assert.equal(payload.dni, '00000012');
  assert.equal(payload.telefono, '000000012');
  assert.equal(payload.prefix, 'Dra.');
  assert.equal(payload.nombre_completo, 'Dra. Persona Clinica');
  assert.equal(payload.comision_porcentaje, 30.25);
  assert.equal(payload.nivel, 1);
  assert.equal(screen.getByLabelText('ID de acceso').value, '');
});

// TEST CASE: FE-P1-04; ACADEMIC CASE: F01; TYPE: Automatizado retroactivo.
test('FE-P1-04 F01 edit self preserves own role and omits password; cancel resets', async () => {
  let target, payload;
  usuariosService.editar = async (id, data) => { target = id; payload = data; };
  await mount();
  fireEvent.click(screen.getByRole('button', { name: 'Editar datos de Dr. Persona Propia' }));
  assert.equal(screen.getByLabelText('Nombres y apellidos completos').value, 'Persona Propia');
  assert.ok(screen.getByLabelText('Rol en cl\u00ednica').disabled);
  assert.ok(screen.getByLabelText('ID de acceso').disabled);
  assert.equal(screen.queryByLabelText('Contrase\u00f1a inicial'), null);
  input('Nombres y apellidos completos', 'Persona Editada');
  submitFrom('Nombres y apellidos completos');
  await waitFor(() => assert.equal(successes.length, 1));
  assert.equal(target, actor.id);
  assert.equal('password' in payload, false);
  assert.equal(payload.nombre_completo, 'Dr. Persona Editada');
  assert.equal(payload.rol, 'Doctor');
  fireEvent.click(await screen.findByRole('button', { name: 'Editar datos de Dra. Persona Uno' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar', exact: true }));
  assert.equal(screen.getByLabelText('ID de acceso').value, '');
  input('Rol en cl\u00ednica', 'Administradora');
  assert.equal(screen.queryByLabelText('Nro. COP'), null);
});

// TEST CASE: FE-P1-05; ACADEMIC CASE: F02; TYPE: Automatizado retroactivo.
test('FE-P1-05 F02 real loading, empty, API error and filtered list states', async () => {
  const pending = deferred();
  usuariosService.getAll = () => pending.promise;
  const view = render(React.createElement(Personal));
  assert.ok(screen.getByText('Cargando...'));
  await act(async () => pending.resolve({ data: { data: [] } }));
  assert.ok(screen.getByText('Sin resultados.'));
  view.unmount();
  usuariosService.getAll = async () => { throw new Error('SYNTHETIC_FAILURE'); };
  const failed = render(React.createElement(Personal));
  await waitFor(() => assert.equal(errors.length, 1));
  assert.ok(screen.getByText('Sin resultados.'));
  assert.equal(errors[0], 'Error al cargar el personal.');
  failed.unmount();
  usuariosService.getAll = async () => ({ data: { data: structuredClone(people) } });
  await mount();
  fireEvent.change(screen.getByPlaceholderText('Buscar personal...'), { target: { value: 'doctorqa' } });
  assert.ok(screen.getByText('Dra. Persona Uno'));
  assert.equal(screen.queryByText('Dr. Persona Propia'), null);
  assert.ok(screen.getByText(/COP: 12345/));
});

// TEST CASE: FE-P1-06; ACADEMIC CASE: F02; TYPE: Automatizado retroactivo.
test('FE-P1-06 F02 permissions hide peer actions and deny non-admin screen', async () => {
  const view = await mount();
  assert.equal(screen.queryByRole('button', { name: 'Editar datos de Adm. Persona Igual' }), null);
  assert.equal(screen.queryByRole('button', { name: 'Desactivar acceso de Dr. Persona Propia' }), null);
  assert.equal(screen.queryByRole('button', { name: 'Desactivar acceso de Asist. Persona Inactiva' }), null);
  assert.ok(screen.getByRole('button', { name: 'Reactivar acceso de Asist. Persona Inactiva' }));
  fixture.user = { id: 'doctorqa', nivel: 1, isAdmin: false };
  view.rerender(React.createElement(Personal));
  assert.ok(screen.getByText('Acceso Denegado'));
  assert.equal(screen.queryByRole('button', { name: 'Registrar Personal' }), null);
});

// TEST CASE: FE-P1-07; ACADEMIC CASE: F03; TYPE: Automatizado retroactivo.
test('FE-P1-07 F03 reset validation and successful request preserve selected target', async () => {
  let payload, calls = 0;
  usuariosService.resetPassword = async data => { calls++; payload = data; };
  await mount();
  await credentialForm('Restablecer contrase\u00f1a de Dra. Persona Uno', nextPassword, 'Synthetic mismatch 2026');
  submitFrom('Tu contrase\u00f1a de administrador');
  assert.equal(calls, 0);
  assert.match(errors.at(-1), /no coinciden/);
  input('Nueva contrase\u00f1a para el usuario', 'short');
  input('Confirmar nueva contrase\u00f1a', 'short');
  submitFrom('Tu contrase\u00f1a de administrador');
  assert.equal(calls, 0);
  input('Nueva contrase\u00f1a para el usuario', nextPassword);
  input('Confirmar nueva contrase\u00f1a', nextPassword);
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar nueva contrase\u00f1a' }));
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar confirmaci\u00f3n' }));
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar contrase\u00f1a de administrador' }));
  submitFrom('Tu contrase\u00f1a de administrador');
  await waitFor(() => assert.equal(calls, 1));
  assert.equal(payload.targetUserId, 'doctorqa');
  assert.equal(payload.nuevaPassword, nextPassword);
  await waitFor(() => assert.ok(!screen.queryByLabelText('Tu contrase\u00f1a de administrador'), 'Credential modal must close'));
});

// TEST CASE: FE-P1-08; ACADEMIC CASE: F03; TYPE: Automatizado retroactivo.
test('FE-P1-08 F03 reactivation failure preserves credentials; retry clears modal', async () => {
  let target, calls = 0;
  usuariosService.reactivar = async (id, data) => {
    calls++; target = id;
    assert.equal(data.nuevaPassword, nextPassword);
    if (calls === 1) throw { response: { data: { mensaje: 'Reactivacion rechazada sintetica' } } };
  };
  await mount();
  await credentialForm('Reactivar acceso de Asist. Persona Inactiva');
  submitFrom('Tu contrase\u00f1a de administrador');
  await waitFor(() => assert.equal(errors.at(-1), 'Reactivacion rechazada sintetica'));
  assert.equal(screen.getByLabelText('Nueva contrase\u00f1a para el usuario').value, nextPassword);
  assert.equal(screen.getByRole('button', { name: 'Cancelar', exact: true }).disabled, false);
  submitFrom('Tu contrase\u00f1a de administrador');
  await waitFor(() => assert.ok(!screen.queryByLabelText('Tu contrase\u00f1a de administrador'), 'Credential modal must close'));
  assert.equal(target, 'inactiveqa');
  assert.equal(calls, 2);
});

// TEST CASE: FE-P1-09; ACADEMIC CASE: F03; TYPE: Automatizado retroactivo.
test('FE-P1-09 F03 deactivate: cancel, busy, single request and recovery from error', async () => {
  const pending = deferred();
  let calls = 0;
  usuariosService.eliminar = id => { assert.equal(id, 'doctorqa'); calls++; return pending.promise; };
  await mount();
  const trigger = screen.getByRole('button', { name: 'Desactivar acceso de Dra. Persona Uno' });
  fireEvent.click(trigger);
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancelar', exact: true }));
  assert.equal(calls, 0);
  fireEvent.click(trigger);
  const dialog = within(screen.getByRole('alertdialog'));
  fireEvent.click(dialog.getByRole('button', { name: 'S\u00ed, desactivar' }));
  assert.ok(dialog.getByRole('button', { name: 'Guardando...' }).disabled);
  fireEvent.click(dialog.getByRole('button', { name: 'Guardando...' }));
  fireEvent.keyDown(document, { key: 'Escape' });
  assert.equal(calls, 1);
  await act(async () => pending.reject({ response: { data: { mensaje: 'Desactivacion fallida sintetica' } } }));
  assert.equal(errors.at(-1), 'Desactivacion fallida sintetica');
  assert.ok(dialog.getByRole('button', { name: 'S\u00ed, desactivar' }));
  usuariosService.eliminar = async () => { calls++; };
  fireEvent.click(dialog.getByRole('button', { name: 'S\u00ed, desactivar' }));
  await waitFor(() => assert.ok(!screen.queryByRole('alertdialog'), 'Confirmation must close after successful retry'));
  assert.equal(calls, 2);
});

// TEST CASE: FE-P1-10; ACADEMIC CASE: F01; TYPE: Automatizado retroactivo.
test('FE-P1-10 F01 invalid password prevents API; failed save retains editable values', async () => {
  let calls = 0;
  usuariosService.crear = async () => { calls++; throw new Error('SYNTHETIC_FAILURE'); };
  await mount();
  input('Nombres y apellidos completos', 'Persona Prueba');
  input('Contrase\u00f1a inicial', 'short');
  submitFrom('Nombres y apellidos completos');
  assert.equal(calls, 0);
  assert.ok(errors.length);
  input('Contrase\u00f1a inicial', nextPassword);
  submitFrom('Nombres y apellidos completos');
  await waitFor(() => assert.equal(calls, 1));
  await waitFor(() => assert.equal(errors.at(-1), 'Error al guardar.'));
  assert.equal(screen.getByLabelText('Nombres y apellidos completos').value, 'Persona Prueba');
  assert.equal(successes.length, 0);
});
