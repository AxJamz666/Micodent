import test from 'node:test';
import assert from 'node:assert/strict';
import { React, render, cleanup, fireEvent, screen, within, waitFor, act, deferred, disposeRuntime } from './helpers/component-runtime.mjs';
import { historiasService, pacientesService, citasService } from './helpers/component-boundaries.mjs';
import { MemoryRouter } from 'react-router-dom';
import toast from 'react-hot-toast';

const { default: OdontogramaEditor } = await import('../src/components/OdontogramaEditor.jsx');
const { default: CitaModal } = await import('../src/components/CitaModal.jsx');
let notices;
test.beforeEach(t => { notices = []; t.mock.method(toast, 'error', value => notices.push(value)); t.mock.method(toast, 'success', () => {}); });
test.afterEach(cleanup);
test.after(disposeRuntime);
const change = (element, value) => fireEvent.change(element, { target: { value } });
function unlinkedField(scope, label) {
  const element = within(scope).getByText(label, { selector: 'label', exact: true })
    .parentElement.querySelector('textarea,input');
  assert.ok(element); return element;
}
const diagnosis = () => screen.getByRole('heading', { name: /Pieza 11.*Diagn/ }).parentElement.parentElement;

// TEST CASE: FE-P2-05; ACADEMIC CASE: F18; TYPE: Automatizado retroactivo.
test('FE-P2-05 F18 real odontogram entry, arcada confirmation, errors and signed corrections', async () => {
  const pending = deferred();
  const created = [], adendas = [];
  let refresh = 0, fail = false;
  historiasService.agregarItemOdontograma = async (id, payload) => {
    assert.equal(id, 7); created.push(payload);
    if (fail) throw { response: { data: { mensaje: 'Registro sintetico rechazado' } } };
    return pending.promise;
  };
  historiasService.agregarAdendaOdontograma = async (id, payload) => adendas.push({ id, ...payload });
  render(React.createElement(OdontogramaEditor, { historiaId: 7, odontogramaVisual: {},
    tratamientosAsignados: [
      { id: 21, pieza: '11', color: 'red', tratamientoNombre: 'Diagnostico firmado sintetico',
        fecha: '2026-10-03', bloqueada: true, registrado_por: 'synthetic-doctor', adendas: [] },
      { id: 22, pieza: '11', color: 'blue', tratamientoNombre: 'Procedimiento ajeno sintetico',
        fecha: '2026-10-03', bloqueada: true, registrado_por: 'other-doctor',
        adendas: [{ id: 1, motivo: 'Motivo previo', contenido: 'Correccion previa' }] },
    ], miUserId: 'synthetic-doctor', onGuardado: async () => { refresh++; } }));
  assert.ok(!screen.queryByRole('button', { name: /Nuevo diagn/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Pieza 11', exact: true }));
  assert.equal(screen.getByRole('button', { name: 'Pieza 11', exact: true }).getAttribute('aria-pressed'), 'true');
  assert.equal(screen.getAllByTitle('Eliminar por error de pieza').length, 1);
  assert.ok(screen.getByText('Correccion previa'));
  fireEvent.click(within(diagnosis()).getByRole('button', { name: /Nuevo diagn/ }));
  const form = diagnosis().querySelector('form');
  fireEvent.submit(form);
  assert.equal(created.length, 0);
  assert.ok(notices.includes('Selecciona una opci\u00f3n de la lista.'));
  change(within(diagnosis()).getByRole('combobox'), '8');
  change(unlinkedField(diagnosis(), 'Detalles (opcional)'), 'Notas sinteticas');
  fireEvent.submit(form);
  assert.equal(created.length, 0, 'arcada needs confirmation before saving');
  assert.ok(within(diagnosis()).getByText(/Maxilar Superior Permanente, 16 piezas/));
  fireEvent.click(within(diagnosis()).getByRole('button', { name: 'Cancelar', exact: true }));
  assert.ok(diagnosis().querySelector('form'));
  fireEvent.submit(diagnosis().querySelector('form'));
  fireEvent.click(within(diagnosis()).getByRole('button', { name: 'Confirmar' }));
  assert.ok(within(diagnosis()).getByRole('button', { name: 'Guardando...' }).disabled);
  assert.equal(created.length, 1);
  await act(async () => pending.resolve());
  await waitFor(() => assert.ok(within(diagnosis()).getByRole('button', { name: /Nuevo diagn/ })));
  assert.deepEqual(created[0], { pieza: 'Maxilar Superior Permanente', cara: 'Toda la arcada',
    estado_codigo: '8', estado_nombre: 'Diente Ausente Edentulismo Total', color: 'red', notas: 'Notas sinteticas' });
  assert.equal(refresh, 1);
  fireEvent.click(within(diagnosis()).getByRole('button', { name: /Nuevo diagn/ }));
  change(within(diagnosis()).getByRole('combobox'), '1');
  fail = true;
  fireEvent.submit(diagnosis().querySelector('form'));
  await waitFor(() => assert.ok(notices.includes('Registro sintetico rechazado')));
  assert.equal(within(diagnosis()).getByRole('combobox').value, '1');
  assert.equal(refresh, 1);
  fireEvent.click(within(diagnosis()).getByRole('button', { name: 'Cancelar', exact: true }));
  fireEvent.click(within(diagnosis()).getByRole('button', { name: 'Agregar correcci\u00f3n' }));
  fireEvent.click(within(diagnosis()).getByRole('button', { name: 'Guardar Correcci\u00f3n' }));
  assert.equal(adendas.length, 0);
  change(unlinkedField(diagnosis(), 'Motivo de la correcci\u00f3n'), 'Ajuste sintetico');
  change(unlinkedField(diagnosis(), 'Correcci\u00f3n'), 'Detalle sintetico');
  fireEvent.click(within(diagnosis()).getByRole('button', { name: 'Guardar Correcci\u00f3n' }));
  await waitFor(() => assert.equal(refresh, 2));
  assert.deepEqual(adendas, [{ id: 21, motivo: 'Ajuste sintetico', contenido: 'Detalle sintetico' }]);
  await within(diagnosis()).findByRole('button', { name: 'Agregar correcci\u00f3n' });
});

// TEST CASE: FE-P2-06; ACADEMIC CASE: F17; TYPE: Automatizado retroactivo.
test('FE-P2-06 F17 real appointment create/edit, labels, conflict, busy and state changes', async () => {
  const pending = deferred(), conflict = deferred();
  const created = [], edited = [], states = [];
  let saved = 0, closed = 0;
  pacientesService.getAll = async () => ({ data: { data: [] } });
  citasService.crear = async payload => { created.push({ ...payload }); return pending.promise; };
  citasService.editar = async (id, payload) => { edited.push({ id, ...payload }); if (edited.length === 1) return conflict.promise; };
  citasService.actualizarEstado = async (id, estado) => states.push({ id, estado });
  const doctors = [{ id: 'synthetic-doctor', nombre_completo: 'Doctor sintetico' }];
  const props = { onClose: () => closed++, onGuardado: async () => { saved++; }, doctores: doctors };
  const view = render(React.createElement(MemoryRouter, null,
    React.createElement(CitaModal, { ...props, isOpen: false })));
  assert.ok(!screen.queryByRole('button', { name: 'Agendar Cita' }));
  const prefill = { doctor_id: 'synthetic-doctor', fecha: '2026-10-03', hora_inicio: '09:00' };
  view.rerender(React.createElement(MemoryRouter, null, React.createElement(CitaModal, { ...props, isOpen: true, prefill })));
  const getForm = () => screen.getByRole('button', { name: /Agendar Cita|Guardar Cambios|Guardando/ }).closest('form');
  const labelIds = [...getForm().querySelectorAll('label')].map(label => label.htmlFor);
  assert.ok(labelIds.every(id => id && document.getElementById(id)));
  assert.equal(new Set(labelIds).size, labelIds.length);
  fireEvent.submit(getForm());
  assert.equal(created.length, 0);
  assert.ok(notices.includes('Completa todos los campos obligatorios.'));
  change(screen.getByLabelText('Nombre de contacto'), 'Contacto sintetico');
  change(screen.getByLabelText('Celular'), 'abc999123456');
  change(screen.getByLabelText('Motivo de consulta'), 'Consulta sintetica');
  fireEvent.click(screen.getByRole('button', { name: '1 hora', exact: true }));
  assert.equal(screen.getByRole('button', { name: '1 hora', exact: true }).getAttribute('aria-pressed'), 'true');
  fireEvent.submit(getForm());
  assert.ok(screen.getByRole('button', { name: 'Guardando...' }).disabled);
  assert.ok(screen.getByRole('button', { name: 'Cerrar cita' }).disabled);
  fireEvent.submit(getForm());
  assert.equal(created.length, 1);
  await act(async () => pending.resolve());
  await waitFor(() => assert.equal(saved, 1));
  assert.equal(closed, 1);
  assert.deepEqual(created[0], { paciente_id: null, nombre_contacto: 'Contacto sintetico',
    celular_contacto: '999123456', motivo_consulta: 'Consulta sintetica',
    doctor_id: 'synthetic-doctor', fecha: '2026-10-03', hora_inicio: '09:00', duracion_minutos: 60 });
  const existing = { id: 101, ...created[0], paciente_id: 41, paciente_apellidos: 'Sintetico',
    paciente_nombres: 'Paciente', estado: 'agendada', hora_inicio: '09:00:00' };
  view.rerender(React.createElement(MemoryRouter, null, React.createElement(CitaModal,
    { ...props, isOpen: true, citaExistente: existing })));
  assert.ok(screen.getByText('Sintetico, Paciente'));
  assert.equal(screen.getByLabelText('Hora de inicio').value, '09:00');
  fireEvent.click(screen.getByRole('button', { name: 'Quitar', exact: true }));
  assert.ok(screen.getByLabelText('Paciente (opcional, buscar existente)'));
  change(screen.getByLabelText('Motivo de consulta'), 'Motivo editado');
  fireEvent.submit(getForm());
  fireEvent.submit(getForm());
  assert.equal(edited.length, 1);
  await act(async () => conflict.reject({ response: { status: 409, data: { mensaje: 'Horario sintetico ocupado' } } }));
  assert.match(screen.getByRole('alert').textContent, /Horario sintetico ocupado/);
  assert.equal(screen.getByLabelText('Motivo de consulta').value, 'Motivo editado');
  assert.equal(saved, 1);
  assert.equal(closed, 1);
  fireEvent.submit(getForm());
  await waitFor(() => assert.equal(saved, 2));
  assert.equal(edited[1].id, 101);
  assert.equal(edited[1].paciente_id, null);
  assert.equal(edited[1].motivo_consulta, 'Motivo editado');
  fireEvent.click(screen.getByRole('button', { name: 'Atendida', exact: true }));
  await waitFor(() => assert.equal(saved, 3));
  assert.deepEqual(states, [{ id: 101, estado: 'atendida' }]);
  view.rerender(React.createElement(MemoryRouter, null, React.createElement(CitaModal,
    { ...props, isOpen: true, citaExistente: { ...existing, estado: 'atendida' } })));
  fireEvent.click(screen.getByRole('button', { name: 'Revertir a Agendada' }));
  await waitFor(() => assert.equal(saved, 4));
  assert.deepEqual(states.at(-1), { id: 101, estado: 'agendada' });
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar cita' }));
  assert.equal(closed, 5);
});
