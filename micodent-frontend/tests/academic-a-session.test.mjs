import test from 'node:test';
import assert from 'node:assert/strict';
import { React, render, cleanup, fireEvent, screen, act, deferred, disposeRuntime } from './helpers/component-runtime.mjs';
import { fixture, browserSession, authService } from './helpers/component-boundaries.mjs';
const { default: SessionBoundary } = await import('../src/components/SessionBoundary.jsx');
test.afterEach(() => { cleanup(); fixture.user = null; fixture.status = undefined; });
test.after(disposeRuntime);

test('ACA-A-F25 retroactive: checking/retry identity verification; blocked private UI, expired/changed drafts retained and listeners removed', async () => {
  const first = deferred(), second = deferred();
  const requests = [], verified = [], failures = []; let checks = 0, retries = 0, mounts = 0;
  fixture.user = null; fixture.status = 'checking';
  browserSession.checkStorage = () => { checks++; };
  browserSession.assertCurrent = () => 42;
  browserSession.getSnapshot = () => ({ status: fixture.status });
  browserSession.unavailable = epoch => { failures.push(epoch); fixture.status = 'unavailable'; };
  browserSession.retry = () => { retries++; fixture.status = 'checking'; };
  browserSession.verified = (user, session, epoch) => {
    verified.push({ user, session, epoch }); fixture.user = user; fixture.status = 'active';
  };
  authService.bootstrap = signal => { requests.push(signal); return requests.length === 1 ? first.promise : second.promise; };
  function PrivateForm() {
    const [draft, setDraft] = React.useState('');
    React.useEffect(() => { mounts++; }, []);
    return React.createElement('input', { 'aria-label': 'Borrador clinico ficticio', value: draft,
      onChange: event => setDraft(event.target.value) });
  }
  const element = () => React.createElement(SessionBoundary, null, React.createElement(PrivateForm));
  const view = render(element());
  assert.ok(screen.getByRole('alertdialog', { name: 'Verificando sesion' }));
  assert.equal(mounts, 0); assert.ok(!document.querySelector('input')); assert.equal(requests.length, 1);
  await act(async () => first.reject(new Error('SYNTHETIC_NETWORK_FAILURE')));
  assert.deepEqual(failures, [42]); view.rerender(element());
  assert.ok(screen.getByRole('alertdialog', { name: 'No se pudo verificar la sesion' }));
  assert.equal(mounts, 0); assert.equal(document.activeElement, screen.getByRole('button', { name: 'Reintentar' }));
  assert.equal(requests[0].aborted, true);
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' })); view.rerender(element());
  assert.equal(retries, 1); assert.equal(requests.length, 2); assert.equal(mounts, 0);
  const user = { id: 'one', nombre: 'Identidad sintetica' }, session = { id: 'session-ficticia' };
  await act(async () => second.resolve({ data: { usuario: user, sesion: session } }));
  assert.deepEqual(verified, [{ user, session, epoch: 42 }]); view.rerender(element());
  assert.equal(mounts, 1); assert.ok(!screen.queryByRole('alertdialog'));
  fireEvent.change(screen.getByRole('textbox', { name: 'Borrador clinico ficticio' }), { target: { value: 'Texto no guardado' } });
  for (const [status, title] of [['unavailable', 'No se pudo verificar la sesion'],
    ['expired', 'Sesion finalizada'], ['changed', 'La sesion cambio en otra pestana']]) {
    fixture.status = status; view.rerender(element());
    assert.ok(screen.getByRole('alertdialog', { name: title }));
    assert.ok(!screen.queryByRole('textbox', { name: 'Borrador clinico ficticio' }));
    const input = document.querySelector('input');
    assert.equal(input.value, 'Texto no guardado'); assert.ok(input.closest('[hidden][inert]'));
    assert.equal(mounts, 1);
  }
  fixture.status = 'active'; view.rerender(element());
  assert.equal(screen.getByRole('textbox').value, 'Texto no guardado');
  view.unmount(); const checksBefore = checks;
  fireEvent.focus(window); fireEvent(document, new Event('visibilitychange'));
  fireEvent(window, new window.StorageEvent('storage', { key: 'synthetic', storageArea: localStorage }));
  assert.equal(checks, checksBefore); assert.equal(requests[1].aborted, true);
});
