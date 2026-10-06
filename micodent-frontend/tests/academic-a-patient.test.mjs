import test from 'node:test';
import assert from 'node:assert/strict';
import { React, render, cleanup, fireEvent, screen, waitFor, act, deferred, disposeRuntime } from './helpers/component-runtime.mjs';
import { fixture, pacientesService, historiasService, authService } from './helpers/component-boundaries.mjs';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import toast from 'react-hot-toast';
const { default: PacienteDetalle } = await import('../src/pages/PacienteDetalle.jsx');
let errors, successes;
test.beforeEach(t => {
  errors = []; successes = [];
  t.mock.method(toast, 'error', message => errors.push(message));
  t.mock.method(toast, 'success', message => successes.push(message));
  localStorage.clear(); localStorage.setItem('userRol', 'Doctor');
  localStorage.setItem('isAdmin', 'true'); localStorage.setItem('userId', 'one');
  fixture.user = { id: 'one', isAdmin: true };
  pacientesService.getById = async () => ({ data: { data: { id: 41, dni: '00000001',
    nombres: 'Paciente', apellidos: 'Sintetico', sexo: 'F', fecha_nacimiento: '2015-01-01',
    celular: '900000001', domicilio: 'Direccion ficticia', apoderado_nombre: 'Tutor sintetico',
    parentesco: 'Madre', apoderado_celular: '900000002' } } });
  historiasService.getByPaciente = async () => ({ data: { ok: true, data: { id: 7, nro_historia: 'QA-7',
    consultas: [], radiografias: [], recetas: [], ordenes: [], odontograma: [],
    antecedentes: { motivo_consulta: 'Motivo previo', diagnostico: 'Diagnostico previo' },
    triaje: { presion: '120/80' } } } });
  authService.getMe = async () => ({ data: { usuario: {} } });
});
test.afterEach(() => { cleanup(); localStorage.clear(); fixture.user = null; });
test.after(disposeRuntime);
const change = (element, value) => fireEvent.change(element, { target: { value } });
const field = label => screen.getByText(label, { selector: 'label', exact: true }).parentElement.querySelector('input,textarea');
async function mountPatient() {
  render(React.createElement(MemoryRouter, { initialEntries: ['/pacientes/41'] },
    React.createElement(Routes, null,
      React.createElement(Route, { path: '/pacientes/:id', element: React.createElement(PacienteDetalle) }),
      React.createElement(Route, { path: '/pacientes', element: React.createElement('p', null, 'Lista destino sintetica') }))));
  await screen.findByRole('button', { name: 'Guardar cambios', exact: true });
}

test('ACA-A-F07 retroactive: loaded personal/guardian fields, sanitized audit payload, busy/error retention and role tabs', async () => {
  const pending = deferred(), requests = []; let fail = true;
  pacientesService.editar = async (id, payload) => {
    requests.push({ id, payload });
    if (fail) return pending.promise;
  };
  await mountPatient();
  assert.equal(screen.getByLabelText('DNI').value, '00000001');
  assert.equal(screen.getByLabelText('Fecha de nacimiento').value, '2015-01-01');
  assert.equal(screen.getByLabelText('Nombre completo').value, 'Tutor sintetico');
  assert.equal(screen.getByLabelText('Parentesco').value, 'Madre');
  assert.equal(document.querySelector('#apoderado-celular').value, '900000002');
  change(screen.getByLabelText('Nombres'), 'Paciente2 Nuevo');
  change(document.querySelector('#paciente-celular'), '900-000-003');
  change(screen.getByLabelText('Nombre completo'), 'Tutor actualizado');
  change(screen.getByLabelText('Parentesco'), 'Padre9');
  change(document.querySelector('#apoderado-celular'), '900-000-004');
  fireEvent.submit(screen.getByRole('button', { name: 'Guardar cambios', exact: true }).closest('form'));
  assert.ok(screen.getByRole('button', { name: 'Guardando...' }).disabled);
  await act(async () => pending.reject({ response: { data: { mensaje: 'Edicion sintetica rechazada' } } }));
  assert.ok(errors.includes('Edicion sintetica rechazada')); assert.equal(successes.length, 0);
  assert.equal(screen.getByLabelText('Nombres').value, 'Paciente Nuevo');
  assert.ok(!screen.getByRole('button', { name: 'Guardar cambios', exact: true }).disabled);
  const { cambios_detectados, ...payload } = requests[0].payload;
  assert.equal(requests[0].id, '41');
  assert.deepEqual(payload, { dni: '00000001', nombres: 'Paciente Nuevo', apellidos: 'Sintetico', sexo: 'F',
    fecha_nacimiento: '2015-01-01', domicilio: 'Direccion ficticia', celular: '900000003',
    apoderado_nombre: 'Tutor actualizado', parentesco: 'Padre', apoderado_celular: '900000004' });
  assert.match(cambios_detectados, /Nombres:.*Paciente Nuevo/);
  assert.match(cambios_detectados, /Celular Apoderado:.*900000004/);
  fail = false;
  fireEvent.submit(screen.getByRole('button', { name: 'Guardar cambios', exact: true }).closest('form'));
  await screen.findByText('Lista destino sintetica');
  assert.deepEqual(requests[1], requests[0]); assert.equal(successes.length, 1);
  cleanup(); localStorage.setItem('userRol', 'Asistente');
  await mountPatient();
  assert.ok(!screen.queryByRole('button', { name: 'Triaje y Antecedentes' }));
  assert.ok(!screen.queryByRole('button', { name: 'Diagn\u00f3stico y Plan' }));
  assert.ok(screen.getByRole('button', { name: 'Evoluci\u00f3n', exact: true }));
});

test('ACA-A-F08 retroactive: conditional clinical/signature saves, partial failure keeps draft and retry, signature-only save', async t => {
  const imageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Image');
  Object.defineProperty(globalThis, 'Image', { configurable: true, value: window.Image });
  t.after(() => imageDescriptor ? Object.defineProperty(globalThis, 'Image', imageDescriptor) : delete globalThis.Image);
  const context = { beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, clearRect() {}, drawImage() {} };
  t.mock.method(window.HTMLCanvasElement.prototype, 'getContext', () => context);
  const signature = 'data:image/png;base64,c3ludGhldGlj';
  t.mock.method(window.HTMLCanvasElement.prototype, 'toDataURL', () => signature);
  const calls = []; let failSignature = true;
  historiasService.guardarAntecedentes = async (id, payload) => calls.push({ kind: 'antecedents', id, payload });
  historiasService.guardarFirmas = async (id, payload) => {
    calls.push({ kind: 'signature', id, payload });
    if (failSignature) throw { response: { data: { mensaje: 'Firma sintetica rechazada' } } };
  };
  const sign = () => {
    fireEvent.click(screen.getByRole('button', { name: 'Firmas', exact: true }));
    const canvas = document.querySelector('canvas');
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
    fireEvent.mouseUp(canvas);
  };
  await mountPatient(); sign();
  fireEvent.click(screen.getByRole('button', { name: 'Triaje y Antecedentes' }));
  assert.equal(field('Motivo de Consulta').value, 'Motivo previo');
  assert.equal(field('P.A. (Presi\u00f3n Arterial)').value, '120/80');
  change(field('Motivo de Consulta'), 'Motivo editado');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios cl\u00ednicos' }));
  await waitFor(() => assert.ok(errors.includes('Firma sintetica rechazada')));
  assert.equal(successes.length, 0); assert.equal(field('Motivo de Consulta').value, 'Motivo editado');
  assert.ok(!screen.getByRole('button', { name: 'Guardar cambios cl\u00ednicos' }).disabled);
  assert.deepEqual(calls.map(x => x.kind), ['antecedents', 'signature']);
  assert.equal(calls[0].payload.motivo_consulta, 'Motivo editado');
  assert.equal(calls[0].payload.diagnostico, 'Diagnostico previo');
  assert.equal(calls[0].payload.presion, '120/80');
  assert.deepEqual(calls[1], { kind: 'signature', id: 7, payload: { firma_paciente_data: signature } });
  failSignature = false;
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios cl\u00ednicos' }));
  await screen.findByText('Lista destino sintetica');
  assert.deepEqual(calls.slice(2), calls.slice(0, 2)); assert.equal(successes.length, 1);
  cleanup(); calls.length = 0;
  await mountPatient(); sign();
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios cl\u00ednicos' }));
  await screen.findByText('Lista destino sintetica');
  assert.deepEqual(calls.map(x => x.kind), ['signature']);
  cleanup(); calls.length = 0;
  await mountPatient();
  fireEvent.click(screen.getByRole('button', { name: 'Triaje y Antecedentes' }));
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios cl\u00ednicos' }));
  await screen.findByText('Lista destino sintetica'); assert.deepEqual(calls, []);
});
