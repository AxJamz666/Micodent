import test from 'node:test';
import assert from 'node:assert/strict';
import { React, render, cleanup, fireEvent, screen, waitFor, act, deferred, disposeRuntime } from './helpers/component-runtime.mjs';
import { fixture, pacientesService, historiasService, authService, default as api } from './helpers/component-boundaries.mjs';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import toast from 'react-hot-toast';
const { default: PacienteDetalle } = await import('../src/pages/PacienteDetalle.jsx');
test.afterEach(cleanup); test.after(disposeRuntime);

test('ACA-C-F09 attachment upload and refresh failures retain list, release busy and show safe image errors', async t => {
  const errors = [], successes = [], uploaded = [];
  t.mock.method(toast, 'error', value => errors.push(value));
  t.mock.method(toast, 'success', value => successes.push(value));
  const originalForm = Object.getOwnPropertyDescriptor(globalThis, 'FormData');
  Object.defineProperty(globalThis, 'FormData', { configurable: true, value: window.FormData });
  t.after(() => Object.defineProperty(globalThis, 'FormData', originalForm));
  localStorage.clear(); localStorage.setItem('userRol', 'Doctor');
  fixture.user = { id: 'one', isAdmin: true }; fixture.status = 'ready';
  pacientesService.getById = async () => ({ data: { data: { id: 41, nombres: 'Paciente', apellidos: 'Sintetico', dni: '00000001' } } });
  historiasService.getByPaciente = async () => ({ data: { ok: true, data: { id: 7, nro_historia: 'QA-7',
    consultas: [], recetas: [], ordenes: [], odontograma: [], antecedentes: {}, triaje: {},
    radiografias: [{ id: 81, descripcion: 'Anexo existente', url_archivo: '/uploads/synthetic.png' }] } } });
  authService.getMe = async () => ({ data: { usuario: {} } });
  api.get = async () => { throw new Error('Synthetic private image failure'); };
  let pending = deferred(), failRefresh = false;
  historiasService.subirRadiografia = async (id, data) => {
    assert.equal(id, 7); uploaded.push(data); return pending.promise;
  };
  historiasService.getRadiografias = async () => {
    if (failRefresh) throw new Error('Synthetic refresh failure');
    return { data: { data: [{ id: 82, descripcion: 'Anexo nuevo', imageBase64: 'data:image/png;base64,AA==' }] } };
  };
  render(React.createElement(MemoryRouter, { initialEntries: ['/pacientes/41'] },
    React.createElement(Routes, null, React.createElement(Route, { path: '/pacientes/:id', element: React.createElement(PacienteDetalle) }))));
  await screen.findByRole('button', { name: 'Guardar cambios', exact: true });
  fireEvent.click(screen.getByRole('button', { name: 'Radiograf\u00edas' }));
  await screen.findByRole('button', { name: 'Abrir anexo: Anexo existente' });
  await screen.findByText(/Archivo no disponible/);
  assert.ok(!document.body.textContent.includes('Synthetic private image failure'));
  const input = () => document.querySelector('input[type=file]');
  fireEvent.change(input(), { target: { files: [] } }); assert.equal(uploaded.length, 0);
  const file = new window.File(['synthetic png fixture'], 'synthetic.png', { type: 'image/png' });
  fireEvent.change(input(), { target: { files: [file] } });
  assert.ok(input().disabled);
  fireEvent.change(input(), { target: { files: [file] } }); assert.equal(uploaded.length, 1);
  assert.equal(uploaded[0].get('imagen').name, file.name);
  assert.equal(uploaded[0].get('descripcion'), 'Placa Anexa');
  assert.equal(input().value, '');
  await act(async () => pending.reject(new Error('Synthetic upload failure')));
  assert.ok(!input().disabled); assert.equal(successes.length, 0);
  assert.ok(errors.includes('Error al subir imagen.'));
  assert.ok(screen.getByRole('button', { name: 'Abrir anexo: Anexo existente' }));
  // The current component delegates MIME rejection to the API, not accept=image/*.
  pending = deferred();
  const invalid = new window.File(['synthetic executable'], 'invalid.exe', { type: 'application/octet-stream' });
  fireEvent.change(input(), { target: { files: [invalid] } });
  assert.equal(uploaded.length, 2); assert.equal(uploaded[1].get('imagen').type, invalid.type);
  await act(async () => pending.reject({ response: { status: 400 } }));
  assert.ok(!input().disabled); assert.equal(successes.length, 0);
  failRefresh = true; pending = deferred();
  fireEvent.change(input(), { target: { files: [file] } });
  await act(async () => pending.resolve({ data: { ok: true } }));
  assert.ok(!input().disabled); assert.ok(screen.getByRole('button', { name: 'Abrir anexo: Anexo existente' }));
  assert.ok(!screen.queryByRole('button', { name: 'Abrir anexo: Anexo nuevo' }));
  assert.deepEqual(successes, ['Imagen subida']); // Upload succeeded; its following refresh did not.
  assert.equal(errors.filter(value => value === 'Error al subir imagen.').length, 3);
  failRefresh = false; pending = deferred();
  fireEvent.change(input(), { target: { files: [file] } });
  await act(async () => pending.resolve({ data: { ok: true } }));
  await screen.findByRole('button', { name: 'Abrir anexo: Anexo nuevo' });
  assert.ok(!screen.queryByRole('button', { name: 'Abrir anexo: Anexo existente' }));
  assert.ok(!input().disabled);
});
