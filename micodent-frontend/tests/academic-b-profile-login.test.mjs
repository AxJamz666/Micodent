import test from 'node:test';
import assert from 'node:assert/strict';
import { React, render, cleanup, fireEvent, screen, waitFor, act, deferred, disposeRuntime } from './helpers/component-runtime.mjs';
import { authService, usuariosService, browserSession, fixture } from './helpers/component-boundaries.mjs';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import toast from 'react-hot-toast';
const { default: MiPerfil } = await import('../src/pages/MiPerfil.jsx');
const { default: Login } = await import('../src/pages/Login.jsx');
test.afterEach(cleanup); test.after(disposeRuntime);
const change = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const mount = component => render(React.createElement(MemoryRouter, { initialEntries: ['/form'] },
  React.createElement(Routes, null,
    React.createElement(Route, { path: '/form', element: React.createElement(component) }),
    React.createElement(Route, { path: '/login', element: React.createElement('p', null, 'Login destination') }),
    React.createElement(Route, { path: '/', element: React.createElement('p', null, 'Home destination') }))));

test('ACA-B-F24 profile preserves failed edits, saves own assets and requires login after password change', async t => {
  const errors = [], successes = [], saved = [], passwords = [], ended = [];
  t.mock.method(toast, 'error', value => errors.push(value));
  t.mock.method(toast, 'success', value => successes.push(value));
  const imageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Image');
  Object.defineProperty(globalThis, 'Image', { configurable: true, value: window.Image });
  t.after(() => imageDescriptor ? Object.defineProperty(globalThis, 'Image', imageDescriptor) : delete globalThis.Image);
  t.mock.method(window.HTMLCanvasElement.prototype, 'getContext', () => ({ clearRect() {}, drawImage() {} }));
  authService.getMe = async () => ({ data: { usuario: { id: 'synthetic-doctor', nombre: 'Doctor sintetico',
    rol: 'Doctor', firma_digital: 'data:image/png;base64,AA==', sello_digital: 'data:image/png;base64,AQ==' } } });
  let failAssets = true;
  usuariosService.actualizarFirmaSello = async value => {
    saved.push(value);
    if (failAssets) throw { response: { data: { mensaje: 'Synthetic asset error' } } };
  };
  browserSession.assertCurrent = () => 'synthetic-epoch';
  browserSession.end = value => ended.push(value);
  let pending;
  usuariosService.cambiarPassword = async value => { passwords.push(value); return pending.promise; };
  mount(MiPerfil);
  await screen.findByRole('button', { name: 'Guardar Firma y Sello' });
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar sello' }));
  fireEvent.click(screen.getByRole('button', { name: 'Guardar Firma y Sello' }));
  await waitFor(() => assert.ok(errors.includes('Error al guardar firma y sello.')));
  assert.deepEqual(saved[0], { firma_digital: 'data:image/png;base64,AA==', sello_digital: null });
  assert.equal(successes.length, 0);
  failAssets = false;
  fireEvent.click(screen.getByRole('button', { name: 'Guardar Firma y Sello' }));
  await waitFor(() => assert.equal(successes.length, 1));
  change('Contrase\u00f1a actual', 'Current synthetic password');
  change('Nueva contrase\u00f1a', 'New synthetic password 2026');
  change('Confirmar nueva contrase\u00f1a', 'Mismatch synthetic password');
  const submit = () => fireEvent.submit(screen.getByLabelText('Contrase\u00f1a actual').closest('form'));
  submit(); assert.equal(passwords.length, 0); assert.ok(errors.some(value => /no coinciden/.test(value)));
  change('Nueva contrase\u00f1a', 'short'); change('Confirmar nueva contrase\u00f1a', 'short');
  submit(); assert.equal(passwords.length, 0);
  change('Nueva contrase\u00f1a', 'New synthetic password 2026');
  change('Confirmar nueva contrase\u00f1a', 'New synthetic password 2026');
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar nueva contrase\u00f1a' }));
  assert.equal(screen.getByLabelText('Nueva contrase\u00f1a').type, 'text');
  pending = deferred(); submit();
  assert.ok(screen.getByRole('button', { name: 'Cambiando...' }).disabled);
  await act(async () => pending.reject({ response: { data: { mensaje: 'Synthetic password error' } } }));
  assert.ok(errors.includes('Synthetic password error'));
  assert.equal(screen.getByLabelText('Nueva contrase\u00f1a').value, 'New synthetic password 2026');
  assert.equal(ended.length, 0);
  pending = deferred(); submit();
  await act(async () => pending.resolve({ data: { ok: true } }));
  await screen.findByText('Login destination');
  assert.deepEqual(ended, ['synthetic-epoch']);
  assert.deepEqual(passwords[1], { passwordActual: 'Current synthetic password', passwordNuevo: 'New synthetic password 2026' });
  assert.ok(successes.some(value => /Inicia sesi/.test(value)));
  cleanup(); authService.getMe = async () => { throw new Error('Private diagnostic'); };
  mount(MiPerfil);
  await waitFor(() => assert.ok(errors.includes('No se pudo cargar el perfil.')));
  assert.ok(!screen.queryByRole('button', { name: 'Guardar Firma y Sello' }));
});

test('ACA-B-F29 login normalizes identifier only, handles errors and disables busy submission', async t => {
  fixture.status = 'anonymous';
  const errors = [], calls = [], accepted = [];
  t.mock.method(toast, 'error', value => errors.push(value));
  t.mock.method(toast, 'success', () => {});
  browserSession.assertCurrent = () => 'epoch-before-login';
  browserSession.acceptLogin = (...args) => accepted.push(args);
  let pending = deferred();
  authService.login = async (...args) => { calls.push(args); return pending.promise; };
  mount(Login);
  change('ID de usuario', '  SYNTHETIC-DOCTOR  ');
  change('Contrase\u00f1a', ' Password preserved  ');
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar contrase\u00f1a' }));
  assert.equal(screen.getByLabelText('Contrase\u00f1a').type, 'text');
  fireEvent.click(screen.getByRole('button', { name: 'Ocultar contrase\u00f1a' }));
  fireEvent.click(screen.getByRole('button', { name: 'Entrar al Sistema' }));
  assert.ok(screen.getByRole('button', { name: 'Verificando...' }).disabled);
  fireEvent.click(screen.getByRole('button', { name: 'Verificando...' }));
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], ['synthetic-doctor', ' Password preserved  ']);
  await act(async () => pending.reject({ response: { data: { mensaje: 'Synthetic invalid credentials' } } }));
  assert.ok(errors.includes('Synthetic invalid credentials')); assert.equal(accepted.length, 0);
  assert.equal(screen.getByLabelText('ID de usuario').value, '  SYNTHETIC-DOCTOR  ');
  pending = deferred(); fireEvent.click(screen.getByRole('button', { name: 'Entrar al Sistema' }));
  await act(async () => pending.reject(new Error('Network unavailable')));
  assert.ok(errors.includes('Error de conexi\u00f3n con el servidor.'));
  pending = deferred(); fireEvent.click(screen.getByRole('button', { name: 'Entrar al Sistema' }));
  const session = { id: 'a'.repeat(64), csrf: 'b'.repeat(64) };
  await act(async () => pending.resolve({ data: { ok: true, sesion: session, usuario: { nombre: 'Doctor sintetico', gender: 'o' } } }));
  await screen.findByText('Home destination');
  assert.deepEqual(accepted, [[session, 'epoch-before-login']]);
  assert.equal(localStorage.getItem('token'), null);
});
