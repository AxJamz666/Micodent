import test from 'node:test';
import assert from 'node:assert/strict';
import { React, render, cleanup, fireEvent, screen, disposeRuntime } from './helpers/component-runtime.mjs';

const { default: ConfirmModal } = await import('../src/components/ConfirmModal.jsx');
const { default: ModalDialog } = await import('../src/components/ModalDialog.jsx');
test.afterEach(cleanup);
test.after(disposeRuntime);

// TEST CASE: FE-P1-01; ACADEMIC CASE: F21; TYPE: Automatizado retroactivo.
test('FE-P1-01 F21 real confirmation: closed, cancel, confirm, Escape and busy', () => {
  let confirmed = 0, cancelled = 0;
  const props = { title: 'Confirmacion sintetica', message: 'Accion de prueba',
    onConfirm: () => confirmed++, onCancel: () => cancelled++ };
  const view = render(React.createElement(ConfirmModal, { ...props, isOpen: false }));
  assert.equal(screen.queryByRole('alertdialog'), null);
  view.rerender(React.createElement(ConfirmModal, { ...props, isOpen: true, type: 'reset' }));
  assert.ok(screen.getByRole('alertdialog', { name: props.title }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  assert.equal(confirmed, 1);
  assert.equal(cancelled, 1);
  view.rerender(React.createElement(ConfirmModal, { ...props, isOpen: true, busy: true, type: 'warning' }));
  assert.ok(screen.getByRole('button', { name: 'Guardando...' }).disabled);
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  fireEvent.keyDown(document, { key: 'Escape' });
  assert.equal(cancelled, 1);
  view.rerender(React.createElement(ConfirmModal, { ...props, isOpen: true, type: 'unknown' }));
  fireEvent.keyDown(document, { key: 'Escape' });
  fireEvent.keyDown(document, { key: 'Escape' });
  assert.equal(cancelled, 2, 'Escape close requested once per mounted modal');
});

// TEST CASE: FE-P1-02; ACADEMIC CASE: F20; TYPE: Automatizado retroactivo.
test('FE-P1-02 F20 real portal: focus, Tab loop, latest close handler and cleanup', () => {
  const opener = document.createElement('button');
  document.body.append(opener);
  opener.focus();
  document.body.style.overflow = 'auto';
  let oldClose = 0, newClose = 0;
  const children = [React.createElement('input', { key: 'field', 'aria-label': 'Campo sintetico' }),
    React.createElement('button', { key: 'end' }, 'Ultimo')];
  const view = render(React.createElement(ModalDialog, { 'aria-label': 'Prueba foco',
    onRequestClose: () => oldClose++ }, children));
  const field = screen.getByRole('textbox', { name: 'Campo sintetico' });
  const end = screen.getByRole('button', { name: 'Ultimo' });
  assert.equal(document.activeElement, field);
  assert.equal(document.body.style.overflow, 'hidden');
  end.focus();
  fireEvent.keyDown(document, { key: 'Tab' });
  assert.equal(document.activeElement, field);
  fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
  assert.equal(document.activeElement, end);
  view.rerender(React.createElement(ModalDialog, { 'aria-label': 'Prueba foco',
    onRequestClose: () => newClose++, closeDisabled: true }, children));
  fireEvent.keyDown(document, { key: 'Escape' });
  assert.equal(newClose, 0);
  view.rerender(React.createElement(ModalDialog, { 'aria-label': 'Prueba foco',
    onRequestClose: () => newClose++ }, children));
  fireEvent.keyDown(document, { key: 'Escape' });
  assert.equal(oldClose, 0);
  assert.equal(newClose, 1);
  let innerClose = 0;
  const nested = React.createElement(ModalDialog, { key: 'inner', 'aria-label': 'Interno',
    onRequestClose: () => innerClose++ }, React.createElement('input', { 'aria-label': 'Campo interno' }));
  view.rerender(React.createElement(ModalDialog, { 'aria-label': 'Prueba foco',
    onRequestClose: () => newClose++ }, [...children, nested]));
  assert.ok(document.activeElement === screen.getByRole('textbox', { name: 'Campo interno' }));
  fireEvent.keyDown(document, { key: 'Escape' });
  assert.equal(innerClose, 1);
  assert.equal(newClose, 1, 'only the top dialog handles Escape');
  view.rerender(React.createElement(ModalDialog, { 'aria-label': 'Prueba foco',
    onRequestClose: () => newClose++ }, children));
  assert.ok(document.activeElement === end, 'inner cleanup restores focus in outer dialog');
  assert.equal(document.body.style.overflow, 'hidden');
  view.unmount();
  assert.equal(document.activeElement, opener);
  assert.equal(document.body.style.overflow, 'auto');
  opener.remove();
});
