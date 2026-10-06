import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { Linter } from 'eslint';
import axios from 'axios';
import { obtenerDiasGrillaMes, generarSlotsHorario } from '../src/utils/agendaUtils.js';

// Includes targeted 4D render, key and session-branch changes covered by sonar-family4d tests.
// Historias POST cleanup is covered by live-state and loading-projection tests.
const semanticBaseline = {"components/ClinicalImage.jsx":"c95090b4d20d5f96b5ea0ddf15faf73645d10b7e476a6e5581a4139241d0aa26","pages/AdministracionPersonal.jsx":"ce43360b560bad8cb58f5f39f49fbd9ddaa021387863e9de36f6e63b0646316e","pages/Agenda.jsx":"a01abdd8a41998b0a4b18dcfe4fc57563360b92b685b980c563704b6e50d77ef","pages/Dashboard.jsx":"aa6d80e965bfdc65b240885925055c6f02409643646fcad189ead2ecd227e458","pages/FinanzasDashboard.jsx":"161919b87c692c5abee70b4616c97e58f5e7d2dc7a787e20bf47819f74176d96","pages/Historias.jsx":"fa594449303df8f3ed2991cfd54f0db2d0d1dcce4e6699044b323a598115bd77","pages/PacienteDetalle.jsx":"e1eede2dbd17ee9d8094c4d0729518f3e652e46a045d88e79c2439afc70197a1","services/api.js":"59d798bce5699c5319f83d2e942ea62444a7df65b884d7d264708989fa2c3ef6","services/sessionState.js":"733feca13d33ebb572959246e90206cdbf995ae12adc47bc8f4de6de7ed43f41","utils/agendaUtils.js":"7a835b28c23fc0c6417f7ebdf045841957b6c998fc62013954e82e8b6039908c"};

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

// Canonicalize only the authorized equivalent syntax, retaining arguments, JSX and flow.
function canonical(node) {
  if (Array.isArray(node)) return node.map(canonical);
  if (!node || typeof node !== 'object') return node;
  const result = {};
  for (const [key, value] of Object.entries(node)) {
    if (['parent', 'loc', 'range', 'start', 'end', 'raw', 'tokens', 'comments'].includes(key)) continue;
    result[key] = value instanceof RegExp ? null : canonical(value);
  }
  if (result.type === 'CallExpression' && result.callee.type === 'MemberExpression' &&
      result.callee.object.name === 'Number' && ['parseFloat', 'parseInt'].includes(result.callee.property.name)) {
    result.callee = { type: 'Identifier', name: result.callee.property.name };
  }
  if (result.type === 'NewExpression' && result.callee.name === 'Error') { result.type = 'CallExpression'; result.optional = false; }
  if (result.regex?.pattern === '\\D') result.regex.pattern = '[^0-9]';
  if (result.type === 'NewExpression' && result.callee.name === 'Set' &&
      result.arguments[0]?.type === 'ArrayExpression') return result.arguments[0];
  if (result.type === 'MemberExpression' && result.object.name === 'CATEGORIAS_CON_MES_CONSUMO' &&
      result.property.name === 'has') result.property.name = 'includes';
  if (result.type === 'CallExpression' && result.callee.type === 'MemberExpression' &&
      result.callee.property.name === 'at' && result.arguments[0]?.type === 'UnaryExpression' &&
      result.arguments[0].operator === '-' && result.arguments[0].argument.value === 1) {
    return { type: 'MemberExpression', object: result.callee.object, computed: true, optional: false,
      property: { type: 'BinaryExpression', operator: '-',
        left: { type: 'MemberExpression', object: result.callee.object, computed: false, optional: false,
          property: { type: 'Identifier', name: 'length' } },
        right: { type: 'Literal', value: 1 } } };
  }
  if (result.type === 'CallExpression' && result.callee.name === 'useEffect') {
    const last = result.arguments[0]?.body?.body?.at(-1);
    if (last?.type === 'IfStatement' && last.test.operator === '!' && last.test.argument.name === 'viewId' &&
        last.consequent.body?.length === 2 && last.consequent.body[0].expression?.callee?.name === 'navigate' &&
        last.consequent.body[0].expression.arguments[0]?.value === '/pacientes' &&
        last.consequent.body[1].type === 'ReturnStatement' && last.consequent.body[1].argument === null) {
      last.consequent.body.pop();
    }
  }
  if (result.type === 'ReturnStatement' && result.argument?.callee?.object?.name === 'Promise' &&
      result.argument.callee.property.name === 'reject') {
    return { type: 'ThrowStatement', argument: result.argument.arguments[0] };
  }
  if (result.type === 'BlockStatement') {
    for (let index = 0; index < result.body.length - 1; index++) {
      const first = result.body[index].expression, next = result.body[index + 1].expression;
      if (first?.callee?.object?.name === 'slots' && first.callee.property?.name === 'push' &&
          next?.callee?.object?.name === 'slots' && next.callee.property?.name === 'push') {
        first.arguments.push(...next.arguments);
        result.body.splice(index + 1, 1);
        index--;
      }
    }
  }
  return result;
}

function fingerprint(file) {
  const normalized = JSON.stringify(canonical(parse(file).ast), (_key, value) =>
    value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).sort()) : value);
  return createHash('sha256').update(normalized).digest('hex');
}

test('4B targeted files preserve AST apart from explicitly equivalent syntax', () => {
  for (const [file, expected] of Object.entries(semanticBaseline)) assert.equal(fingerprint(file), expected, file);
});

test('4B Number parsers preserve coercion, prefixes, radix and NaN behavior', () => {
  assert.equal(Number.parseInt, parseInt);
  assert.equal(Number.parseFloat, parseFloat);
  for (const value of ['', ' ', '12.75', '12abc', '1e3', '0x10', null, undefined, true, false, 0, -0, NaN, Infinity]) {
    assert.ok(Object.is(Number.parseFloat(value), parseFloat(value)));
    for (const radix of [undefined, 2, 10, 16]) assert.ok(Object.is(Number.parseInt(value, radix), parseInt(value, radix)));
  }
  assert.throws(() => Number.parseInt(Symbol('synthetic')), TypeError);
  assert.throws(() => Number.parseFloat(Symbol('synthetic')), TypeError);
});

test('4B clinical file rejection still preserves allowed MIME types and error state', () => {
  const { text, ast } = parse('components/ClinicalImage.jsx');
  const callback = walk(ast, node => node.type === 'CallExpression' && node.callee.property?.name === 'then')[0].arguments[0];
  assert.equal(walk(callback, node => node.type === 'NewExpression' && node.callee.name === 'Error').length, 1);
  for (const type of ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/html', '']) {
    const updates = [], created = [];
    const handler = runInNewContext(`(${text.slice(...callback.range)})`, {
      active: true, Error, update: value => updates.push(value),
      URL: { createObjectURL: data => { created.push(data); return 'blob:synthetic'; } },
    });
    if (['text/html', ''].includes(type)) {
      assert.throws(() => handler({ data: { type } }), error => error instanceof Error && error.message === 'UNSUPPORTED_CLINICAL_FILE');
      assert.equal(created.length, 0);
      assert.equal(updates.length, 0);
    } else {
      handler({ data: { type } });
      assert.equal(created.length, 1);
      assert.equal(updates[0].state, type === 'application/pdf' ? 'attachment' : 'decoding');
    }
  }
});

test('4B monthly agenda selects the same final day at calendar boundaries', () => {
  const { ast } = parse('pages/Agenda.jsx');
  assert.equal(walk(ast, node => node.type === 'CallExpression' && node.callee.object?.name === 'dias' && node.callee.property?.name === 'at').length, 1);
  for (const date of [new Date(2024, 1, 15), new Date(2026, 11, 31), new Date(2027, 0, 1), new Date(2026, 7, 31)]) {
    const days = obtenerDiasGrillaMes(date);
    assert.ok(days.length >= 28);
    assert.equal(days.at(-1), days[days.length - 1]);
  }
  assert.equal([].at(-1), [][-1]);
});

test('4B expense categories preserve membership and month visibility without coercion', () => {
  const { text, ast } = parse('pages/FinanzasDashboard.jsx');
  const declaration = walk(ast, node => node.type === 'VariableDeclarator' && node.id.name === 'CATEGORIAS_CON_MES_CONSUMO')[0];
  const categories = runInNewContext(text.slice(...declaration.init.range));
  const original = ['luz', 'agua', 'internet', 'alquiler'];
  assert.deepEqual(Array.from(categories), original);
  for (const value of [...original, 'personal', 'imprevistos', '', null, undefined, NaN, 0, {}, { toString: () => 'luz' }]) {
    assert.equal(categories.has(value), original.includes(value));
  }
  assert.equal(walk(ast, node => node.type === 'MemberExpression' && node.object.name === 'CATEGORIAS_CON_MES_CONSUMO' && node.property.name === 'has').length, 2);
});

test('4B final empty return removal retains all legacy report redirects', () => {
  const { text, ast } = parse('pages/Historias.jsx');
  const effect = walk(ast, node => node.type === 'CallExpression' && node.callee.name === 'useEffect' && node.arguments[1]?.elements?.some(element => element.name === 'navigate'))[0].arguments[0];
  for (const [editId, isCreating, viewId, expected] of [['7', false, '9', '/pacientes/7'], [null, true, null, '/pacientes/nuevo'], [null, false, null, '/pacientes'], [null, false, '9', null]]) {
    const calls = [];
    const run = runInNewContext(`(${text.slice(...effect.range)})`, { editId, isCreating, viewId, navigate: (...args) => calls.push(args) });
    assert.equal(run(), undefined);
    assert.equal(calls.length, expected ? 1 : 0);
    if (expected) { assert.equal(calls[0][0], expected); assert.equal(calls[0][1].replace, true); }
  }
});

test('4B concise digit filtering keeps ASCII digits and removes the same characters', () => {
  for (const value of ['', '001234', 'abc12.5 /-9', ' 7\n8\t9 ', '\u00e1\u00f1', '\u0661\u0662\uff11\uff12', '\ud83d\ude00']) {
    assert.equal(value.replace(/\D/g, ''), value.replace(/[^0-9]/g, ''));
  }
});

test('4B clinical payment helpers retain decimal strings, empty payments and rounding', () => {
  const { text, ast } = parse('pages/PacienteDetalle.jsx');
  const declarations = walk(ast, node => node.type === 'VariableDeclarator');
  const totalNode = declarations.find(node => node.id.name === 'calcularTotalPagado');
  const total = runInNewContext(`(${text.slice(...totalNode.init.range)})`, { Number });
  const balanceNode = declarations.find(node => node.id.name === 'calcularResta');
  const balance = runInNewContext(`(${text.slice(...balanceNode.init.range)})`, { Number, calcularTotalPagado: total });
  for (const payments of [undefined, null, [], [{ monto: '30.05' }, { monto: '0.25' }], [{ monto: null }, {}]]) {
    const expected = Array.isArray(payments) ? payments.reduce((sum, payment) => sum + parseFloat(payment?.monto || 0), 0) : 0;
    assert.equal(total(payments), expected);
    assert.equal(balance('200.30', payments), (parseFloat('200.30') - expected).toFixed(2));
  }
  assert.equal(balance('0.30', [{ monto: '0.10' }, { monto: '0.20' }]), '-0.00');
});

test('4B async throws retain errors, session handling and subsequent Axios interceptors', async () => {
  const { text, ast } = parse('services/api.js');
  const registration = walk(ast, node => node.type === 'CallExpression' && node.callee.object?.object?.property?.name === 'interceptors' && node.callee.object.property.name === 'response')[0];
  const callback = registration.arguments[1];
  assert.equal(callback.async, true);
  const current = text.slice(...callback.range);
  assert.equal(walk(callback, node => node.type === 'ThrowStatement' && node.argument.name === 'error').length, 2);
  const previous = current.replaceAll('throw error;', 'return Promise.reject(error);');
  const scenarios = [
    { cancel: true }, { network: true }, { noConfig: true },
    { status: 401 }, { status: 401, login: true }, { status: 403 }, { status: 500 },
    { status: 400, data: { codigo: 'AUTH_CSRF_INVALID' } },
    { status: 401, data: { codigo: 'AUTH_SESSION_CHANGED' } },
    { status: 401, blob: '{"codigo":"AUTH_SESSION_CHANGED"}' },
    { status: 401, blob: 'not json' }, { status: 500, blob: ' '.repeat(65536) },
    { status: 401, stale: true },
  ];
  async function exercise(code, scenario) {
    const actions = [], later = [];
    let original;
    const client = axios.create({ adapter: async config => {
      original = scenario.cancel ? new axios.CanceledError('synthetic cancellation') : new Error('synthetic failure');
      if (!scenario.noConfig) original.config = config;
      if (scenario.status) original.response = { status: scenario.status, data: scenario.blob === undefined ? (scenario.data || {}) : new Blob([scenario.blob], { type: 'application/json' }) };
      throw original;
    } });
    const onError = runInNewContext(`(${code})`, { axios, Blob, Promise, browserSession: {
      assertCurrent(epoch) { actions.push(`assert:${epoch}`); if (scenario.stale) throw new Error('synthetic stale session'); },
      changed(epoch) { actions.push(`changed:${epoch}`); },
      expire(epoch) { actions.push(`expire:${epoch}`); },
    } });
    client.interceptors.response.use(value => value, onError);
    client.interceptors.response.use(value => value, error => { later.push(error); throw error; });
    let caught;
    try { await client.get(scenario.login ? '/auth/login' : '/synthetic', { sessionEpoch: 7 }); }
    catch (error) { caught = error; }
    assert.ok(caught);
    assert.equal(later.length, 1);
    assert.equal(later[0], caught);
    assert.equal(caught === original, !scenario.stale || Boolean(scenario.cancel));
    return { actions, sameError: caught === original, message: caught.message, canceled: axios.isCancel(caught),
      status: caught.response?.status, data: caught.response?.data instanceof Blob ? ['blob', caught.response.data.size] :
        caught.response?.data === undefined ? undefined : JSON.parse(JSON.stringify(caught.response.data)) };
  }
  for (const scenario of scenarios) assert.deepEqual(await exercise(current, scenario), await exercise(previous, scenario));
});

test('4B session context errors retain type, message and existing validation boundaries', () => {
  const { text, ast } = parse('services/sessionState.js');
  const validator = walk(ast, node => node.type === 'VariableDeclarator' && node.id.name === 'validSession')[0].init;
  const validate = runInNewContext(`(${text.slice(...validator.range)})`, { Error });
  for (const value of [undefined, null, {}, { id: 1, csrf: 'b'.repeat(64) },
    { id: 'a'.repeat(63), csrf: 'b'.repeat(64) }, { id: 'A'.repeat(64), csrf: 'b'.repeat(64) },
    { id: 'a'.repeat(64), csrf: 'not valid' }]) {
    assert.throws(() => validate(value), error => error instanceof Error && error.name === 'Error' && error.message === 'INVALID_SESSION_CONTEXT');
  }
  const valid = { id: 'a'.repeat(64), csrf: 'b'.repeat(64) };
  assert.equal(validate(valid).id, valid.id);
  assert.equal(validate(valid).csrf, valid.csrf);
});

test('4B combined push preserves every half-hour slot in its original order', () => {
  const actual = generarSlotsHorario();
  const expected = [];
  for (let hour = 8; hour < 20; hour++) {
    expected.push(`${String(hour).padStart(2, '0')}:00`);
    expected.push(`${String(hour).padStart(2, '0')}:30`);
  }
  assert.deepEqual(actual, expected);
  assert.equal(actual.length, 24);
  assert.equal(new Set(actual).size, 24);
  assert.equal(actual[0], '08:00');
  assert.equal(actual.at(-1), '19:30');
});
