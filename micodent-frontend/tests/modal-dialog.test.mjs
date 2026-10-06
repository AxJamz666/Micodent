import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Linter } from 'eslint';
import { manageModalFocus } from '../src/utils/modalFocus.js';

function fixture(count = 3) {
  const listeners = new Map();
  const document = {
    body: { style: { overflow: 'auto' } },
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: name => listeners.delete(name),
  };
  const control = (field = false) => ({
    disabled: false, tabIndex: 0, isConnected: true,
    closest: () => null, getClientRects: () => [1], matches: () => field,
    focus() { document.activeElement = this; },
  });
  const opener = control();
  const controls = Array.from({ length: count }, (_, i) => control(i === 1));
  document.activeElement = opener;
  const cancel = new Map();
  const dialog = {
    ownerDocument: document, querySelectorAll: () => controls,
    contains: target => controls.includes(target) || target === dialog,
    focus() { document.activeElement = this; },
    addEventListener: (name, fn) => cancel.set(name, fn),
    removeEventListener: name => cancel.delete(name),
  };
  const event = (key, shiftKey = false) => ({ key, shiftKey, defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true; } });
  return { document, dialog, controls, opener, listeners, cancel, event };
}

test('modal initial focus selects first field; cleanup restores opener and prior scroll', () => {
  const f = fixture();
  const cleanup = manageModalFocus(f.dialog, () => {}, () => false);
  assert.equal(f.document.activeElement, f.controls[1]);
  assert.equal(f.document.body.style.overflow, 'hidden');
  cleanup();
  assert.equal(f.document.activeElement, f.opener);
  assert.equal(f.document.body.style.overflow, 'auto');
  assert.equal(f.listeners.size, 0);
  assert.equal(f.cancel.size, 0);
});

test('Tab and Shift+Tab wrap without suppressing ordinary form navigation', () => {
  const f = fixture();
  const cleanup = manageModalFocus(f.dialog, () => {}, () => false);
  const middle = f.event('Tab');
  f.listeners.get('keydown')(middle);
  assert.equal(middle.defaultPrevented, false);
  f.controls.at(-1).focus();
  const end = f.event('Tab');
  f.listeners.get('keydown')(end);
  assert.equal(f.document.activeElement, f.controls[0]);
  assert.equal(end.defaultPrevented, true);
  f.listeners.get('keydown')(f.event('Tab', true));
  assert.equal(f.document.activeElement, f.controls.at(-1));
  cleanup();
});

test('Escape honors saving state and requests close exactly once; Enter is untouched', () => {
  const f = fixture();
  let saving = true;
  let calls = 0;
  const cleanup = manageModalFocus(f.dialog, () => { calls++; }, () => saving);
  f.listeners.get('keydown')(f.event('Escape'));
  assert.equal(calls, 0);
  const enter = f.event('Enter');
  f.listeners.get('keydown')(enter);
  assert.equal(enter.defaultPrevented, false);
  saving = false;
  f.listeners.get('keydown')({ ...f.event('Escape'), repeat: true });
  assert.equal(calls, 0);
  f.listeners.get('keydown')(f.event('Escape'));
  f.cancel.get('cancel')(f.event());
  assert.equal(calls, 1);
  cleanup();
});

test('hidden, disabled and negative tab stops are excluded; an empty dialog is focusable', () => {
  const f = fixture();
  f.controls[0].disabled = true;
  f.controls[1].getClientRects = () => [];
  f.controls[2].tabIndex = -1;
  const cleanup = manageModalFocus(f.dialog, () => {}, () => false);
  assert.equal(f.document.activeElement, f.dialog);
  f.listeners.get('keydown')(f.event('Tab'));
  assert.equal(f.document.activeElement, f.dialog);
  cleanup();
});

test('background focus is redirected, removed opener is not focused on cleanup', () => {
  const f = fixture();
  const cleanup = manageModalFocus(f.dialog, () => {}, () => false);
  f.opener.focus();
  f.listeners.get('focusin')({ target: f.opener });
  assert.equal(f.document.activeElement, f.controls[1]);
  f.opener.isConnected = false;
  cleanup();
  assert.notEqual(f.document.activeElement, f.opener);
});

test('nested modal cleanup retains scroll lock and returns focus within underlying dialog', () => {
  const outer = fixture();
  const cleanupOuter = manageModalFocus(outer.dialog, () => {}, () => false);
  const inner = fixture();
  inner.dialog.ownerDocument = outer.document;
  inner.dialog.focus = () => { outer.document.activeElement = inner.dialog; };
  const cleanupInner = manageModalFocus(inner.dialog, () => {}, () => false);
  cleanupInner();
  assert.equal(outer.document.activeElement, outer.controls[1]);
  assert.equal(outer.document.body.style.overflow, 'hidden');
  cleanupOuter();
  assert.equal(outer.document.body.style.overflow, 'auto');
});

const converted = [['components/ConfiguracionPos', 1, 1], ['components/OrdenRadiografiaTab', 3, 3], ['components/RecetarioTab', 3, 3], ['pages/FinanzasDashboard', 3, 3], ['pages/PacienteDetalle', 5, 5]];
for (const [file, count, total] of converted) {
  test(`${file}: converted modals retain names and explicit close callbacks`, () => {
    const text = readFileSync(new URL(`../src/${file}.jsx`, import.meta.url), 'utf8');
    const linter = new Linter();
    const messages = linter.verify(text, {
      languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } }, rules: {},
    });
    assert.equal(messages.filter(message => message.fatal).length, 0);
    const ast = linter.getSourceCode().ast;
    const modals = [];
    function visit(node) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'JSXOpeningElement' && node.name.name === 'ModalDialog') modals.push(node);
      for (const [key, value] of Object.entries(node)) {
        if (['parent', 'tokens', 'comments'].includes(key)) continue;
        if (Array.isArray(value)) value.forEach(visit);
        else if (value && typeof value === 'object') visit(value);
      }
    }
    visit(ast);
    assert.equal(modals.length, count);
    for (const modal of modals) {
      const names = modal.attributes.map(a => a.name?.name);
      assert.ok(names.includes('aria-label') || names.includes('aria-labelledby'));
      assert.ok(names.includes('onRequestClose'));
      assert.ok(names.includes('className'));
      assert.ok(!names.includes('onClick'), 'backdrop must not discard a form');
    }
    assert.equal((text.match(/role="dialog"/g) || []).length, total - count);
  });
}
