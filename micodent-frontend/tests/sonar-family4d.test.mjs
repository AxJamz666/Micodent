import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { Linter } from 'eslint';
import { TOOTH_ROWS, selectedRxTeeth } from '../src/utils/rxTeeth.js';
import { activityFields } from '../src/utils/data.js';

function parse(file) {
  const text = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');
  const linter = new Linter();
  const errors = linter.verify(text, {
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } }, rules: {},
  });
  assert.equal(errors.filter(error => error.fatal).length, 0, file);
  return { text, ast: linter.getSourceCode().ast };
}

function walk(node, predicate, found = []) {
  if (!node || typeof node !== 'object') return found;
  if (predicate(node)) found.push(node);
  for (const [key, value] of Object.entries(node)) {
    if (['parent', 'loc', 'range', 'tokens', 'comments'].includes(key)) continue;
    if (Array.isArray(value)) for (const child of value) walk(child, predicate, found);
    else if (value && typeof value === 'object') walk(value, predicate, found);
  }
  return found;
}

function expression(file, predicate, context, index = 0) {
  const { ast, text } = parse(file);
  const node = walk(ast, predicate)[index];
  assert(node, file);
  return runInNewContext(`(${text.slice(...node.range)})`, context);
}

function attribute(file, name, context, index = 0, predicate = () => true) {
  const { ast, text } = parse(file);
  const node = walk(ast, node => node.type === 'JSXAttribute' && node.name.name === name && predicate(node))[index].value.expression;
  return runInNewContext(`(${text.slice(...node.range)})`, context);
}

function computed(file, name, context) {
  const { ast, text } = parse(file);
  const declaration = walk(ast, node => node.type === 'VariableDeclarator' && node.id.name === name)[0];
  assert(declaration, name);
  const body = declaration.parent.parent.body;
  const statements = body.filter(node =>
    node.type === 'VariableDeclaration' && node.declarations.some(d => d.id.name === name) ||
    node.type === 'IfStatement' && walk(node, child => child.type === 'AssignmentExpression' && child.left.name === name).length > 0);
  return runInNewContext(statements.map(node => text.slice(...node.range)).join('\n') + '\n' + name, context);
}

function namedFunction(file, name, context) {
  return expression(file, node => node.type === 'ArrowFunctionExpression' &&
    node.parent?.type === 'VariableDeclarator' && node.parent.id.name === name, context);
}

function renderMarker(file, name, context, args = []) {
  const { ast, text } = parse(file);
  const fn = walk(ast, node => node.type === 'VariableDeclarator' && node.id.name === name)[0].init;
  let body = text.slice(...fn.range);
  const jsx = walk(fn, node => node.type === 'JSXElement');
  const roots = jsx.filter(node => !jsx.some(other => other !== node && other.range[0] < node.range[0] && other.range[1] > node.range[1]));
  const edits = roots.map(node => {
    const tag = node.openingElement.name.name;
    const marker = tag === 'TarjetaPersonal' ? "'card:' + u.id" :
      JSON.stringify(tag === 'p' ? node.children.find(child => child.type === 'JSXText').value : tag);
    return { range: node.range, replacement: marker };
  });
  // Unwrap expression-only fragments while evaluating their original list.
  for (const fragment of walk(fn, node => node.type === 'JSXFragment')) {
    edits.push({ range: fragment.openingFragment.range, replacement: '(' },
      { range: fragment.closingFragment.range, replacement: ')' });
    for (const child of fragment.children.filter(node => node.type === 'JSXExpressionContainer')) {
      edits.push({ range: [child.range[0], child.range[0] + 1], replacement: '' },
        { range: [child.range[1] - 1, child.range[1]], replacement: '' });
    }
  }
  for (const edit of edits.sort((a, b) => b.range[0] - a.range[0])) {
    body = body.slice(0, edit.range[0] - fn.range[0]) + edit.replacement + body.slice(edit.range[1] - fn.range[0]);
  }
  return runInNewContext(`(${body})`, context)(...args);
}

function canonical(node) {
  if (Array.isArray(node)) return node.map(canonical);
  if (!node || typeof node !== 'object') return node;
  return Object.fromEntries(Object.entries(node)
    .filter(([key]) => !['parent', 'loc', 'range', 'tokens', 'comments', 'start', 'end', 'raw'].includes(key))
    .map(([key, value]) => [key, canonical(value)]));
}

test('4D Rx age is a display string with unchanged empty, birthday and invalid-date output', () => {
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : ['2026-10-03T12:00:00'])); }
  }
  const calculate = namedFunction('components/OrdenRadiografiaTab.jsx', 'calcularEdad', { Date: FixedDate });
  for (const [date, expected] of [[null, ''], [undefined, ''], ['', ''], ['2000-10-03T12:00:00', '26'],
    ['2000-10-04T12:00:00', '25'], ['2000-09-01T12:00:00', '26'], ['invalid', 'NaN']]) {
    assert.equal(calculate(date), expected);
    assert.equal(typeof calculate(date), 'string');
  }
});

test('4D/POST calendar and patient list preserve branches and protected JSX', () => {
  for (const [file, name, expectedHash] of [
    ['Agenda', 'renderCalendar', '7c11d121bf25f47b9caed31029fbb62be39f90b8ec6bdb53557fedfd720aae4a'],
    ['Pacientes', 'renderPatientList', 'c28a83b92f5ac0b8b2f02da7c085d0eda759b03c54b2b4955168a83bacd79e5c'],
  ]) {
    const { ast } = parse(`pages/${file}.jsx`);
    const fn = walk(ast, node => node.type === 'VariableDeclarator' && node.id.name === name)[0].init;
    const returned = fn.body.body.flatMap(node => {
      if (node.type === 'ReturnStatement') return [node];
      if (node.type === 'IfStatement') return [node.consequent];
      return [];
    });
    assert.equal(createHash('sha256').update(JSON.stringify(returned.map(node => canonical(node.argument)))).digest('hex'), expectedHash);
  }
  for (const loading of [false, true]) for (const vista of ['dia', 'semana', 'mes', 'unknown']) {
    assert.equal(renderMarker('pages/Agenda.jsx', 'renderCalendar', { loading, vista }),
      loading ? 'div' : vista === 'dia' ? 'AgendaDia' : vista === 'semana' ? 'AgendaSemana' : 'AgendaMes');
  }
  for (const loading of [false, true]) for (const pacientesOrdenados of [[], [{ id: 'test' }]]) {
    assert.equal(renderMarker('pages/Pacientes.jsx', 'renderPatientList', { loading, pacientesOrdenados }), 'div');
  }
});

test('4D patient submit text retains loading, new and editing precedence', () => {
  const file = 'pages/PacienteDetalle.jsx';
  for (const saving of [false, true]) for (const value of [false, true, null, 'synthetic-id']) {
    for (const [flag, action, context, expected] of [
      ['savingPersonal', 'personalAction', { esNuevo: value }, value ? 'Registrar paciente' : 'Guardar cambios'],
      ['savingTreatment', 'treatmentAction', { editEvoId: value }, value ? 'Guardar Cambios' : 'Guardar y Firmar'],
    ]) {
      const label = computed(file, action, context);
      assert.equal(expression(file, node => node.type === 'ConditionalExpression' && node.test.name === flag && node.alternate.name === action,
        { [flag]: saving, [action]: label }), saving ? 'Guardando...' : expected);
    }
  }
});

test('4D laboratory paid, edit and pending states were already extracted without nesting', () => {
  for (const vistaLab of ['pagados', 'pendientes']) for (const pagandoLabId of [null, 'test']) {
    assert.equal(renderMarker('pages/FinanzasDashboard.jsx', 'EstadoPagoLaboratorio', {}, [{ trabajo: { id: 'test' }, vistaLab, pagandoLabId }]),
      vistaLab === 'pagados' ? 'span' : pagandoLabId === 'test' ? 'div' : 'button');
  }
});

test('4D odontogram form renders the same new, confirmation and editing branches', () => {
  for (const mostrarForm of [false, true]) for (const confirmarArcada of [null, { tratamiento: {} }]) {
    assert.equal(renderMarker('components/OdontogramaEditor.jsx', 'renderEntryForm', { mostrarForm, confirmarArcada }),
      !mostrarForm ? 'button' : confirmarArcada ? 'div' : 'form');
  }
});

test('4D personnel names, details, credential text and list preserve all original branches', () => {
  const file = 'pages/AdministracionPersonal.jsx';
  const build = namedFunction(file, 'buildNombreCompleto', {});
  const deactivation = namedFunction(file, 'mensajeDesactivacion', {});
  for (const [target, expected] of [
    [{ nivel: 3, id: 'self', activo: false }, 'No se puede desactivar a un Superadministrador.'],
    [{ nivel: 1, id: 'self', activo: false }, 'No puedes desactivar tu propio acceso.'],
    [{ nivel: 1, id: 'other', activo: false }, 'Este acceso ya esta desactivado.'],
    [{ nivel: 2, id: 'other', activo: true }, 'No puedes desactivar a un usuario de igual o mayor nivel.'],
  ]) assert.equal(deactivation(target, 'self'), expected);
  for (const rol of ['Doctor', 'Administradora', 'Asistente', 'Unknown']) for (const gender of ['o', 'a', undefined]) {
    const prefix = rol === 'Doctor' ? (gender === 'o' ? 'Dr.' : 'Dra.') : rol === 'Administradora' ? 'Adm.' : 'Asist.';
    assert.deepEqual(JSON.parse(JSON.stringify(build('Synthetic', rol, gender))), { prefix, nombre_completo: prefix + ' Synthetic' });
    for (const comision_porcentaje of [null, 0, 30, '0']) {
      const u = { rol, comision_porcentaje, cop: '', telefono: '123' };
      assert.equal(computed(file, 'userDetail', { u }),
        u.rol === 'Doctor' ? `COP: ${u.cop || 'S/N'} · Comisión: ${u.comision_porcentaje ? u.comision_porcentaje + '%' : 'sin definir'}` : `Cel: ${u.telefono || '-'}`);
    }
  }
  for (const savingReset of [false, true]) for (const reactivate of [false, true]) {
    const credentialAction = computed(file, 'credentialAction', { resetModal: { reactivate } });
    assert.equal(expression(file, node => node.type === 'ConditionalExpression' && node.test.name === 'savingReset' &&
      node.alternate.name === 'credentialAction', { savingReset, credentialAction }),
      savingReset ? 'Guardando...' : reactivate ? 'Reactivar acceso' : 'Restablecer contraseña');
  }
  for (const loading of [false, true]) for (const filteredUsers of [[], [{ id: 'one' }, { id: 'two' }]]) {
    const value = renderMarker(file, 'renderPersonnelList', { loading, filteredUsers });
    assert.deepEqual(JSON.parse(JSON.stringify(value)), loading ? 'Cargando...' : filteredUsers.length ? ['card:one', 'card:two'] : 'Sin resultados.');
  }
});

test('4D activity formatting preserves null, primitives and nested objects', () => {
  assert.deepEqual(activityFields({ motivo: null, desconocido: 0, antes: { motivo: null, x: { nombre: 'A' } }, activo: false }), [
    ['Motivo', 'Sin dato'], ['desconocido', '0'], ['Anterior', 'Motivo: Sin dato; x: nombre: A'], ['activo', 'false'],
  ]);
});

test('4D Rx selection preserves periapical, tomography, overlap and empty branches', () => {
  for (const tomography of [[], [11]]) for (const periapical of [[], [11]]) {
    const teeth = selectedRxTeeth({ piezas_tomografia: tomography, periapicales_piezas: periapical });
    assert.deepEqual(teeth, tomography.length || periapical.length ? [{
      number: 11, type: tomography.length && periapical.length ? 'T/P' : tomography.length ? 'T' : 'P',
    }] : []);
  }
});

test('4D calendar colors and appointment submit text preserve both condition priorities', () => {
  for (const esHoy of [false, true]) for (const esDelMes of [false, true]) {
    const dayTextColor = computed('components/AgendaMes.jsx', 'dayTextColor', { esDelMes });
    const actual = attribute('components/AgendaMes.jsx', 'className', { esHoy, dayTextColor }, 0,
      node => walk(node, child => child.type === 'Identifier' && child.name === 'esHoy').length > 0);
    assert.equal(actual, 'text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ' +
      (esHoy ? 'bg-clinical-500 text-white' : esDelMes ? 'text-slate-700' : 'text-slate-300'));
  }
  for (const guardando of [false, true]) for (const esEdicion of [false, true]) {
    const submitLabel = computed('components/CitaModal.jsx', 'submitLabel', { esEdicion });
    const actual = expression('components/CitaModal.jsx', node => node.type === 'ConditionalExpression' &&
      node.test.name === 'guardando' && node.alternate.name === 'submitLabel', { guardando, submitLabel });
    assert.equal(actual, guardando ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Agendar Cita');
  }
});

test('4D session boundary messages preserve checking/unavailable/expired/default states', () => {
  for (const status of ['checking', 'unavailable', 'expired', 'changed', 'ready', 'anonymous']) {
    const checking = status === 'checking';
    const context = { status, checking };
    assert.equal(computed('components/SessionBoundary.jsx', 'title', context),
      checking ? 'Verificando sesion' : status === 'unavailable' ? 'No se pudo verificar la sesion' :
        status === 'expired' ? 'Sesion finalizada' : 'La sesion cambio en otra pestana');
    assert.equal(computed('components/SessionBoundary.jsx', 'description', context),
      checking ? 'Espera un momento.' : status === 'unavailable' ?
        'No se cerro tu sesion. Comprueba la conexion e intenta nuevamente.' :
        'Esta pestana esta bloqueada. Al continuar se descartara lo que no hayas guardado en ella.');
  }
});

test('4D request context retains precedence and permissions across every mode and session state', () => {
  for (const status of ['anonymous', 'checking', 'ready', 'changed', 'unavailable']) {
    for (const login of [false, true]) for (const bootstrap of [false, true]) for (const session of [null, { id: 'test', csrf: 'synthetic' }]) {
      const request = expression('services/sessionState.js', node => node.type === 'ArrowFunctionExpression' &&
        node.parent?.type === 'Property' && node.parent.key.name === 'requestContext', {
        snapshot: { status }, session, epoch: 'synthetic', assertCurrent() {},
        sessionChangedError: () => new Error('SESSION_CHANGED'),
      });
      const reject = login ? status !== 'anonymous' : bootstrap ? status !== 'checking' : status !== 'ready' || !session;
      if (reject) assert.throws(() => request({ login, bootstrap }), /SESSION_CHANGED/);
      else assert.deepEqual(JSON.parse(JSON.stringify(request({ login, bootstrap }))),
        session ? { epoch: 'synthetic', id: session.id, csrf: session.csrf } : { epoch: 'synthetic' });
    }
  }
});

test('4D tooth rows and latest histories have unique domain keys stable on reorder', () => {
  for (const [file, rowName] of [['components/RxTeethPrint.jsx', 'row'], ['components/PiezaSelector.jsx', 'fila']]) {
    const keys = TOOTH_ROWS.map((row, i) => attribute(file, 'key', { [rowName]: row, i }));
    assert.equal(new Set(keys).size, TOOTH_ROWS.length);
    assert.deepEqual([...TOOTH_ROWS].reverse().map((row, i) => attribute(file, 'key', { [rowName]: row, i })), [...keys].reverse());
  }
  const histories = [
    { paciente_id: 1, nro_historia: 'HC-1' }, { paciente_id: 2, nro_historia: 'HC-2' },
    { paciente_id: 1, nro_historia: 'HC-3' },
  ];
  const historyKey = h => attribute('pages/Dashboard.jsx', 'key', { h }, 0,
    node => walk(node, child => child.type === 'Identifier' && child.name === 'h').length > 0);
  const keys = histories.map(historyKey);
  assert.equal(new Set(keys).size, histories.length);
  assert.deepEqual([...histories].reverse().map(historyKey), [...keys].reverse());
});

test('4D Rx piece labels preserve every character without nested templates', () => {
  for (const type of [undefined, 'T', 'P', 'T/P']) {
    const number = 11;
    const types = new Map(type === undefined ? [] : [[number, type]]);
    const label = attribute('components/RxTeethPrint.jsx', 'aria-label', { number, types }, 1);
    assert.equal(label, `Pieza ${number}${types.has(number) ? `: ${types.get(number)}` : ': no solicitada'}`);
  }
});

test('4D confirmation uses managed native dialog while retaining cancel, confirm, busy and propagation', () => {
  const file = 'components/ConfirmModal.jsx';
  const { ast } = parse(file);
  const dialog = walk(ast, node => node.type === 'JSXOpeningElement' && node.name.name === 'ModalDialog')[0];
  assert(dialog);
  assert.equal(dialog.attributes.find(node => node.name?.name === 'role').value.value, 'alertdialog');
  const calls = [];
  const context = { busy: true, onCancel: () => calls.push('cancel'), onConfirm: () => calls.push('confirm') };
  assert.equal(attribute(file, 'closeDisabled', context), true);
  attribute(file, 'onRequestClose', context)();
  attribute(file, 'onClick', context, 0)({ stopPropagation: () => calls.push('stop') });
  attribute(file, 'onClick', context, 1)();
  attribute(file, 'onClick', context, 2)();
  assert.deepEqual(calls, ['cancel', 'stop', 'cancel', 'confirm']);
  assert.equal(attribute(file, 'disabled', context, 0), true);
  assert.equal(attribute(file, 'disabled', context, 1), true);
  assert.equal(walk(ast, node => node.type === 'JSXOpeningElement' && node.name.name === 'div' &&
    node.attributes.some(attr => attr.name?.name === 'onClick')).length, 0);
});
