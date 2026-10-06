import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Linter } from 'eslint';

const files = [
  'components/AgendaDia', 'components/AgendaSemana', 'components/CitaModal',
  'components/ClinicalImage', 'components/Diente', 'components/MetodoPago',
  'components/OrdenRadiografiaTab', 'pages/AdministracionPersonal',
  'pages/FinanzasDashboard', 'pages/MiPerfil', 'pages/PacienteDetalle', 'pages/Produccion',
];

function source(file) {
  const text = readFileSync(new URL(`../src/${file}.jsx`, import.meta.url), 'utf8');
  const linter = new Linter();
  const messages = linter.verify(text, {
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: {},
  });
  assert.equal(messages.filter(m => m.fatal).length, 0, `${file}: JSX parse error`);
  return { text, ast: linter.getSourceCode().ast };
}

function elements(node, result = []) {
  if (!node || typeof node !== 'object') return result;
  if (node.type === 'JSXElement') result.push(node);
  for (const [key, value] of Object.entries(node)) {
    if (['parent', 'loc', 'range', 'tokens', 'comments'].includes(key)) continue;
    if (Array.isArray(value)) value.forEach(item => elements(item, result));
    else if (value && typeof value === 'object') elements(value, result);
  }
  return result;
}

const tag = el => el.openingElement.name.name;
const attribute = (el, name) => el.openingElement.attributes.find(a => a.type === 'JSXAttribute' && a.name.name === name);
const literal = (el, name) => attribute(el, name)?.value?.value;
const attrText = (el, name, text) => {
  const value = attribute(el, name)?.value;
  return value ? text.slice(...value.range) : null;
};

test('all twelve changed components retain valid JSX', () => {
  for (const file of files) source(file);
});

for (const [file, ids] of [
  ['pages/AdministracionPersonal', ['nombre', 'trato', 'dni', 'telefono', 'email', 'direccion', 'rol', 'especialidad', 'cop', 'comision', 'id', 'password'].map(x => `personal-${x}`)],
  ['pages/FinanzasDashboard', ['finanzas-desde', 'finanzas-hasta', 'finanzas-doctor', 'gasto-categoria', 'gasto-mes', 'gasto-descripcion', 'gasto-monto', 'gasto-fecha', 'penalidad-doctor', 'penalidad-monto', 'penalidad-fecha', 'penalidad-motivo']],
  ['pages/PacienteDetalle', ['paciente-dni', 'paciente-celular', 'paciente-nombres', 'paciente-apellidos', 'paciente-nacimiento', 'paciente-sexo', 'paciente-domicilio', 'apoderado-nombre', 'apoderado-parentesco', 'apoderado-celular', 'tratamiento-laboratorio']],
]) {
  test(`${file}: reported labels target exactly one appropriate control`, () => {
    const nodes = elements(source(file).ast);
    for (const id of ids) {
      const labels = nodes.filter(el => tag(el) === 'label' && literal(el, 'htmlFor') === id);
      const targets = nodes.filter(el => literal(el, 'id') === id);
      assert.equal(labels.length, 1, `${id}: unique label`);
      assert.equal(targets.length, 1, `${id}: unique target`);
      assert.ok(['input', 'textarea', 'select'].includes(tag(targets[0])), id);
    }
  });
}

test('appointment labels use matching instance-specific ids, not shared constants', () => {
  const { text, ast } = source('components/CitaModal');
  const nodes = elements(ast);
  const labels = nodes.filter(el => tag(el) === 'label' && attribute(el, 'htmlFor'));
  assert.equal(labels.length, 7);
  for (const label of labels) {
    const id = attrText(label, 'htmlFor', text);
    assert.ok(id.includes('fieldId'));
    assert.equal(nodes.filter(el => ['input', 'textarea', 'select'].includes(tag(el)) && attrText(el, 'id', text) === id).length, 1);
  }
  assert.match(text, /const fieldId = useId\(\)/);
});

test('agenda slots and teeth use native buttons without duplicate keyboard activation', () => {
  for (const [file, handler] of [
    ['components/AgendaDia', 'onSlotClick'], ['components/AgendaSemana', 'onDiaClick'], ['components/Diente', 'onToothClick'],
  ]) {
    const { text, ast } = source(file);
    const buttons = elements(ast).filter(el => tag(el) === 'button' && attribute(el, 'aria-label') && attrText(el, 'onClick', text)?.includes(handler));
    assert.equal(buttons.length, 1, file);
    assert.equal(literal(buttons[0], 'type'), 'button');
    assert.equal(attribute(buttons[0], 'onKeyDown'), undefined);
    assert.equal(attribute(buttons[0], 'onKeyUp'), undefined);
    if (file !== 'components/AgendaSemana') assert.ok(attribute(buttons[0], 'disabled'));
  }
});

test('clinical preview and archive controls are independent siblings', () => {
  const { ast } = source('pages/PacienteDetalle');
  const containers = elements(ast).filter(el => el.children.some(child => child.type === 'JSXElement' && literal(child, 'className') === 'absolute inset-0'));
  assert.equal(containers.length, 1);
  const container = containers[0];
  assert.equal(attribute(container, 'onClick'), undefined);
  const preview = container.children.find(el => el.type === 'JSXElement' && literal(el, 'className') === 'absolute inset-0');
  assert.equal(tag(preview), 'button');
  assert.equal(literal(preview, 'type'), 'button');
  assert.ok(attribute(preview, 'aria-label'));
  assert.equal(elements(preview).filter(el => tag(el) === 'button').length, 1);
  const archive = container.children.find(el => el.type === 'JSXElement' && literal(el, 'aria-label') === 'Anular anexo');
  assert.equal(tag(archive), 'button');
  assert.ok(elements(container).some(el => literal(el, 'className')?.includes('[&_button]:pointer-events-auto [&_a]:pointer-events-auto')));
});

test('segmented options retain a legend and communicate the selected state', () => {
  for (const file of ['components/CitaModal', 'components/OrdenRadiografiaTab', 'pages/PacienteDetalle']) {
    const nodes = elements(source(file).ast);
    const groups = nodes.filter(el => tag(el) === 'fieldset' && elements(el).some(child => tag(child) === 'button' && attribute(child, 'aria-pressed')));
    assert.ok(groups.length > 0, file);
    for (const group of groups) assert.ok(group.children.some(child => child.type === 'JSXElement' && tag(child) === 'legend'), file);
  }
});

test('loading messages use native output while propagation-only containers remain noninteractive', () => {
  for (const file of ['components/ClinicalImage', 'components/MetodoPago', 'pages/Produccion']) {
    const nodes = elements(source(file).ast);
    assert.ok(nodes.some(el => tag(el) === 'output'), file);
    assert.ok(!nodes.some(el => literal(el, 'role') === 'status'), file);
  }
  for (const file of ['components/ConfirmModal']) {
    const { text, ast } = source(file);
    const expectedTag = 'ModalDialog';
    const containers = elements(ast).filter(el => tag(el) === expectedTag && attrText(el, 'onClick', text)?.includes('stopPropagation()'));
    assert.equal(containers.length, 1, file);
    assert.notEqual(literal(containers[0], 'role'), 'button');
    assert.equal(attribute(containers[0], 'tabIndex'), undefined);
  }
  const { ast } = source('pages/Pacientes');
  const containers = elements(ast).filter(el => attribute(el, 'data-patient-actions'));
  assert.equal(containers.length, 1);
  assert.equal(tag(containers[0]), 'div');
  assert.equal(attribute(containers[0], 'onClick'), undefined);
  assert.equal(attribute(containers[0], 'role'), undefined);
  assert.equal(attribute(containers[0], 'tabIndex'), undefined);
});
