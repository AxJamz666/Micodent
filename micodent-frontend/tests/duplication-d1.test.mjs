import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parse } from '@babel/parser';
import { React, render, cleanup, fireEvent, screen, disposeRuntime } from './helpers/component-runtime.mjs';
const { default: SignaturePad } = await import('../src/components/SignaturePad.jsx');
const { default: InputV } = await import('../src/components/InputV.jsx');
const { default: DocumentActions } = await import('../src/components/DocumentActions.jsx');

test.afterEach(cleanup);
test.after(disposeRuntime);

function canonical(node) {
  if (Array.isArray(node)) return node.map(canonical);
  if (!node || typeof node !== 'object') return node;
  return Object.fromEntries(Object.entries(node)
    .filter(([key]) => !['start', 'end', 'loc', 'extra', 'comments', 'leadingComments', 'trailingComments', 'innerComments'].includes(key))
    .map(([key, value]) => [key, canonical(value)]));
}
function initializer(file, name) {
  const ast = parse(readFileSync(new URL('../src/' + file, import.meta.url), 'utf8'),
    { sourceType: 'module', plugins: ['jsx'] });
  const declaration = ast.program.body.find(node => node.type === 'VariableDeclaration' && node.declarations[0].id.name === name);
  assert.ok(declaration, name);
  return declaration.declarations[0].init;
}
const digest = node => createHash('sha256').update(JSON.stringify(canonical(node))).digest('hex');

test('D1 SignaturePad preserves the exact AST of all three previous implementations', () => {
  assert.equal(digest(initializer('components/SignaturePad.jsx', 'SignaturePad')),
    'c7566be2939cf8b9c6b70d9518f447aeeff75c49dd4faf3d47f2a1cdbfccf1f3');
});
test('D1 extracting visual controls preserves all three page component bodies', () => {
  const expected = {
    Historias: '95408f2cf7ed68c7fa6c0642950022f8520a9c68a99d60559843edb744d0df6d',
    MiPerfil: '91c8b2eb792ac4195668c947285a55441eca99001c9eaa2c9c3ead0579c5ed4d',
    PacienteDetalle: '2bb1c74c30d34b6c9b32d38827afd5e87516b73fe682b1e92fe4c874b0ee58ab',
  };
  for (const [name, hash] of Object.entries(expected)) {
    assert.equal(digest(initializer('pages/' + name + '.jsx', name)), hash, name);
  }
});
test('D1 signature mouse/touch output and clear callback remain isolated and single', t => {
  const operations = [], ended = [];
  const context = Object.fromEntries(['beginPath', 'moveTo', 'lineTo', 'stroke', 'clearRect']
    .map(name => [name, (...args) => operations.push([name, ...args])]));
  t.mock.method(window.HTMLCanvasElement.prototype, 'getContext', () => context);
  t.mock.method(window.HTMLCanvasElement.prototype, 'toDataURL', format => {
    assert.equal(format, 'image/png'); return 'data:image/png;base64,AA==';
  });
  const { container } = render(React.createElement(SignaturePad, { onEnd: value => ended.push(value) }));
  const canvas = container.querySelector('canvas');
  t.mock.method(canvas, 'getBoundingClientRect', () => ({ left: 10, top: 20 }));
  assert.equal(canvas.width, 350); assert.equal(canvas.height, 120);
  assert.equal(canvas.className, 'bg-white border-2 border-dashed border-slate-300 rounded-xl cursor-crosshair touch-none shadow-inner max-w-full');
  fireEvent.mouseMove(canvas, { clientX: 13, clientY: 24 });
  assert.deepEqual(operations, []);
  fireEvent.mouseDown(canvas, { clientX: 13, clientY: 24 });
  fireEvent.mouseMove(canvas, { clientX: 15, clientY: 26 });
  fireEvent.mouseUp(canvas); fireEvent.mouseLeave(canvas);
  assert.deepEqual(operations, [['beginPath'], ['moveTo', 3, 4], ['lineTo', 5, 6], ['stroke']]);
  assert.deepEqual(ended, ['data:image/png;base64,AA==']);
  fireEvent.touchStart(canvas, { touches: [{ clientX: 17, clientY: 28 }] });
  fireEvent.touchMove(canvas, { touches: [{ clientX: 19, clientY: 30 }] });
  fireEvent.touchEnd(canvas); fireEvent.touchEnd(canvas);
  assert.deepEqual(operations.slice(4), [['beginPath'], ['moveTo', 7, 8], ['lineTo', 9, 10], ['stroke']]);
  assert.equal(ended.length, 2);
  const clear = screen.getByRole('button', { name: 'Borrar y firmar de nuevo' });
  assert.equal(clear.type, 'button');
  fireEvent.click(clear);
  assert.deepEqual(operations.at(-1), ['clearRect', 0, 0, 350, 120]);
  assert.deepEqual(ended, ['data:image/png;base64,AA==', 'data:image/png;base64,AA==', null]);
});
test('D1 signature initial image loads without new callbacks or implicit clearing', t => {
  const loads = [], drawn = [], ended = [];
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'Image');
  class SyntheticImage {
    set src(value) { loads.push(value); this.onload(); }
  }
  Object.defineProperty(globalThis, 'Image', { configurable: true, value: SyntheticImage });
  t.after(() => descriptor ? Object.defineProperty(globalThis, 'Image', descriptor) : delete globalThis.Image);
  t.mock.method(window.HTMLCanvasElement.prototype, 'getContext', () => ({
    drawImage: (...args) => drawn.push(args), clearRect: () => assert.fail('No implicit clear'),
  }));
  const onEnd = value => ended.push(value);
  const { rerender } = render(React.createElement(SignaturePad, { onEnd, initialImage: 'data:image/png;base64,AA==' }));
  rerender(React.createElement(SignaturePad, { onEnd, initialImage: 'data:image/png;base64,AQ==' }));
  rerender(React.createElement(SignaturePad, { onEnd, initialImage: null }));
  assert.deepEqual(loads, ['data:image/png;base64,AA==', 'data:image/png;base64,AQ==']);
  assert.equal(drawn.length, 2);
  for (const args of drawn) { assert.ok(args[0] instanceof SyntheticImage); assert.deepEqual(args.slice(1), [0, 0]); }
  assert.deepEqual(ended, []);
});

test('D1 InputV preserves the exact AST of both previous implementations', () => {
  assert.equal(digest(initializer('components/InputV.jsx', 'InputV')),
    'ab7e14de16464fb75cd6ca36f375e7ef18bbced0abe5fa43e87832b1299034b0');
});
test('D1 InputV preserves format callbacks, default attributes and optional units', () => {
  const cases = [
    ['pa', '120a/80x', '120/80'], ['num', 'a1/2.3-4', '1234'],
    ['dec', 'S/ 12.30-abc', '12.30'], [undefined, 'texto / 1.2', 'texto / 1.2'],
  ];
  for (const [format, raw, expected] of cases) {
    const values = [];
    function Controlled() {
      const [value, setValue] = React.useState('');
      return React.createElement(InputV, { label: 'Campo sintetico', placeholder: 'Dato',
        value, format, onChange: next => { values.push(next); setValue(next); } });
    }
    render(React.createElement(Controlled));
    const input = screen.getByRole('textbox');
    assert.equal(input.required, true); assert.equal(input.type, 'text');
    assert.equal(input.placeholder, 'Dato');
    fireEvent.change(input, { target: { value: raw } });
    assert.equal(input.value, expected); assert.deepEqual(values, [expected]);
    fireEvent.change(input, { target: { value: '' } });
    assert.equal(input.value, ''); assert.deepEqual(values, [expected, '']);
    cleanup();
  }
  render(React.createElement(InputV, { label: 'Fecha', value: '2026-10-04',
    type: 'date', required: false, unit: 'dias', onChange: () => {} }));
  const input = document.querySelector('input');
  assert.equal(input.type, 'date'); assert.equal(input.required, false);
  assert.equal(input.value, '2026-10-04'); assert.ok(input.className.includes('pr-12'));
  assert.ok(screen.getByText('dias').className.includes('select-none'));
});

function withoutIndentation(node) {
  if (Array.isArray(node)) return node.filter(child => !(child?.type === 'JSXText' && !child.value.trim())).map(withoutIndentation);
  if (!node || typeof node !== 'object') return node;
  return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, withoutIndentation(value)]));
}
function replaceActionProps(node, props) {
  if (Array.isArray(node)) return node.map(child => replaceActionProps(child, props));
  if (!node || typeof node !== 'object') return node;
  if (node.type === 'Identifier' && Object.hasOwn(props, node.name)) return structuredClone(props[node.name]);
  return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, replaceActionProps(value, props)]));
}
test('D1 document extraction preserves the complete owner AST when JSX is expanded', () => {
  const template = initializer('components/DocumentActions.jsx', 'DocumentActions').body;
  const expected = {
    OrdenRadiografiaTab: 'd721b0feb9ff5f25a451867034cbfd46139a45abd1a71b9cd79f6fd5710984aa',
    RecetarioTab: 'e035ba9dbf94e2b063f0a7e57fd73fe21cb9ce6b958a5bf8d22adc6360aa504c',
  };
  for (const [name, hash] of Object.entries(expected)) {
    let expanded = 0;
    function expand(node) {
      if (Array.isArray(node)) return node.map(expand);
      if (!node || typeof node !== 'object') return node;
      if (node.type === 'JSXElement' && node.openingElement.name.name === 'DocumentActions') {
        expanded++;
        const props = Object.fromEntries(node.openingElement.attributes.map(attribute =>
          [attribute.name.name, attribute.value.expression]));
        assert.deepEqual(Object.keys(props), ['hasHistory', 'canCorrect', 'onShowHistory', 'onCorrect', 'onPreview']);
        return replaceActionProps(template, props);
      }
      return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, expand(value)]));
    }
    const result = expand(initializer('components/' + name + '.jsx', name));
    assert.equal(expanded, 1, name);
    assert.equal(digest(withoutIndentation(result)), hash, name);
  }
});
test('D1 document actions preserve visibility, DOM styles/icons and single callbacks for eight flag combinations', () => {
  for (const hasHistory of [undefined, null, 0, 71]) {
    for (const canCorrect of [false, true]) {
      const calls = [];
      const { container } = render(React.createElement(DocumentActions, { hasHistory, canCorrect,
        onShowHistory: () => calls.push('history'), onCorrect: () => calls.push('correct'),
        onPreview: () => calls.push('preview') }));
      assert.equal(container.firstChild.className, 'flex items-center gap-1.5 flex-shrink-0');
      const buttons = screen.getAllByRole('button');
      assert.equal(buttons.length, 1 + Number(!!hasHistory) + Number(canCorrect));
      const history = screen.queryByTitle('Historial de correcciones');
      const correct = screen.queryByTitle('Corregir (anula esta y emite una nueva)');
      const preview = screen.getByTitle('Ver / Imprimir');
      assert.equal(!!history, !!hasHistory); assert.equal(!!correct, canCorrect);
      for (const button of [history, correct].filter(Boolean)) {
        assert.equal(button.className, 'p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors');
        assert.equal(button.querySelector('svg').getAttribute('width'), '16');
      }
      assert.equal(preview.className, 'p-2 text-slate-400 hover:text-clinical-600 hover:bg-clinical-50 rounded-lg transition-colors');
      assert.equal(preview.querySelector('svg').getAttribute('width'), '16');
      assert.equal(container.firstChild.lastChild.getAttribute('width'), '14');
      assert.ok(container.firstChild.lastChild.classList.contains('text-slate-400'));
      if (history) fireEvent.click(history);
      if (correct) fireEvent.click(correct);
      fireEvent.click(preview);
      assert.deepEqual(calls, [...(hasHistory ? ['history'] : []), ...(canCorrect ? ['correct'] : []), 'preview']);
      cleanup();
    }
  }
});
