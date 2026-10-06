import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { Linter } from 'eslint';

// Targeted 4D render/submit changes are independently checked by sonar-family4d tests.
// Historias POST cleanup is covered by live-state and loading-projection tests.
const semanticBaseline = {"Historias":"8f37f50e54533ed26c0c263960cdaf824cd6e226e16f63fb091e15db6fe583a9","MiPerfil":"fdf0b618ec01c490cc69f2776c280addcabebd2671c8a1beed221b6618ef06fd","PacienteDetalle":"e3db834e3f09803e7e3a838e98f65ecd2b131ecfb3fea153dc745508a2dbe1e1","Pacientes":"a1b4a8c915c4112ecd8b71c3ccbebd281d8e7d8daf128bb817812193ca2482b9"};

function parse(file) {
  const text = readFileSync(new URL(`../src/pages/${file}.jsx`, import.meta.url), 'utf8');
  const linter = new Linter();
  const errors = linter.verify(text, {
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: {},
  });
  assert.equal(errors.filter(error => error.fatal).length, 0, file);
  return { text, source: linter.getSourceCode() };
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

function canonical(node, unused) {
  if (Array.isArray(node)) return node.map(child => canonical(child, unused));
  if (!node || typeof node !== 'object') return node;
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (['parent', 'loc', 'range', 'start', 'end', 'raw', 'tokens', 'comments'].includes(key)) continue;
    out[key] = value instanceof RegExp ? null : canonical(value, unused);
  }
  if (node.type === 'CatchClause' && unused.has(node)) out.param = null;
  return out;
}

test('4C frontend keeps executable AST except unused catch bindings and comments', () => {
  for (const [file, fingerprint] of Object.entries(semanticBaseline)) {
    const { source } = parse(file);
    const unused = new Set(source.scopeManager.scopes
      .filter(scope => scope.type === 'catch' && scope.variables.every(variable => variable.references.length === 0))
      .map(scope => scope.block));
    const hash = createHash('sha256').update(JSON.stringify(canonical(source.ast, unused))).digest('hex');
    assert.equal(hash, fingerprint, file);
  }
});

function fn(file, name, context) {
  const { source, text } = parse(file);
  const node = walk(source.ast, node => node.type === 'VariableDeclarator' && node.id.name === name)[0]?.init;
  assert(node, name);
  return runInNewContext(`(${text.slice(...node.range)})`, context);
}

function stateContext(file, name, calls) {
  const { source } = parse(file);
  const node = walk(source.ast, node => node.type === 'VariableDeclarator' && node.id.name === name)[0]?.init;
  return Object.fromEntries(walk(node, node => node.type === 'CallExpression' && /^set[A-Z]/.test(node.callee?.name || ''))
    .map(node => [node.callee.name, value => calls.push([node.callee.name,
      value === undefined ? undefined : JSON.parse(JSON.stringify(value))])]));
}

test('4C patient list keeps filters, response formats, last list on failure and loading state', async () => {
  for (const mode of ['ok', 'flat', 'reject', 'invalid']) {
    const calls = [];
    await fn('Pacientes', 'cargarPacientes', {
      ...stateContext('Pacientes', 'cargarPacientes', calls),
      useCallback: callback => callback, searchTerm: 'synthetic', mostrarArchivados: true,
      pacientesService: { async getAll(search, archived) {
        assert.equal(search, 'synthetic');
        assert.equal(archived, 'true');
        if (mode === 'reject') throw new Error('PRIVATE_PATIENT');
        return { data: mode === 'flat' ? ['synthetic'] : { data: mode === 'invalid' ? {} : ['synthetic'] } };
      } },
      toast: { error: value => calls.push(['notice', value]) },
    })();
    assert.deepEqual(calls, [
      ['setLoading', true],
      mode === 'reject' ? ['notice', 'Error al cargar pacientes.'] : ['setPacientes', mode === 'invalid' ? [] : ['synthetic']],
      ['setLoading', false],
    ]);
  }
});

test('4C patient loading retains data on success and closes loading on failure', async () => {
  for (const fail of [false, true]) {
    const calls = [];
    await fn('PacienteDetalle', 'cargarTodo', {
      ...stateContext('PacienteDetalle', 'cargarTodo', calls), id: 'synthetic',
      pacientesService: { async getById() {
        if (fail) throw new Error('PRIVATE_PATIENT');
        return { data: { data: { id: 'synthetic', nombres: 'Synthetic' } } };
      } },
      historiasService: { async getByPaciente() { return { data: { ok: true, data: { id: 37 } } }; } },
      toast: { error: value => calls.push(['notice', value]) },
    })();
    assert.deepEqual(calls.filter(([name]) => name === 'setLoading'), [['setLoading', true], ['setLoading', false]]);
    if (fail) assert.deepEqual(calls, [
      ['setLoading', true], ['notice', 'Error al cargar los datos del paciente.'], ['setLoading', false],
    ]);
    else {
      assert(calls.some(([name, value]) => name === 'setPacienteInfo' && value.nombres === 'Synthetic'));
      assert(calls.some(([name, value]) => name === 'setHcId' && value === 37));
      assert(!calls.some(([name]) => name === 'notice'));
    }
  }
});

for (const [name, setter, message] of [
  ['recargarOdontograma', 'setTratamientosAsignados', 'Error al actualizar el odontograma.'],
  ['recargarEvoluciones', 'setEvoluciones', 'Error al actualizar las evoluciones.'],
  ['recargarRecetas', 'setRecetas', 'Error al actualizar las recetas.'],
  ['recargarOrdenes', 'setOrdenes', 'Error al actualizar las órdenes.'],
]) {
  test(`4C ${name}: successful refresh, rejection and unchanged data on non-ok response`, async () => {
    for (const mode of ['ok', 'reject', 'non-ok']) {
      const calls = [];
      await fn('PacienteDetalle', name, {
        ...stateContext('PacienteDetalle', name, calls), id: 'synthetic',
        historiasService: { async getByPaciente(id) {
          assert.equal(id, 'synthetic');
          if (mode === 'reject') throw new Error('PRIVATE_PATIENT');
          return { data: { ok: mode === 'ok', data: {
            odontograma: [{ id: 37, pieza: '11', cara: 'vestibular' }],
            consultas: [{ id: 37, descripcion: 'synthetic' }],
            recetas: [{ id: 37, anulada: 1 }], ordenes: [{ id: 37, anulada: 1 }],
          } } };
        } },
        toast: { error: value => calls.push(['notice', value]) },
      })();
      if (mode === 'reject') assert.deepEqual(calls, [['notice', message]]);
      else if (mode === 'non-ok') assert.deepEqual(calls, []);
      else {
        const value = calls.find(([called]) => called === setter)?.[1];
        assert.equal(value?.length, 1);
        assert.equal(value[0].id, 37);
        if (['setRecetas', 'setOrdenes'].includes(setter)) assert.equal(value[0].anulada, true);
        assert(!calls.some(([called]) => called === 'notice'));
      }
    }
  });
}

test('4C image upload retains payload/list behavior and ends busy state on upload or refresh failure', async () => {
  for (const mode of ['ok', 'upload-failure', 'refresh-failure', 'no-file']) {
    const calls = [];
    const file = { name: 'synthetic.png' };
    class FakeFormData { values = []; append(...args) { this.values.push(args); } }
    await fn('PacienteDetalle', 'handleFileUpload', {
      ...stateContext('PacienteDetalle', 'handleFileUpload', calls), hcId: 37, subiendoImagen: false, FormData: FakeFormData,
      historiasService: {
        async subirRadiografia(id, payload) {
          assert.equal(id, 37);
          assert.deepEqual(payload.values, [['imagen', file], ['descripcion', 'Placa Anexa']]);
          if (mode === 'upload-failure') throw new Error('PRIVATE_PATIENT');
          return { data: { ok: true } };
        },
        async getRadiografias(id) {
          assert.equal(id, 37);
          if (mode === 'refresh-failure') throw new Error('PRIVATE_PATIENT');
          return { data: { data: ['synthetic'] } };
        },
      },
      toast: { error: value => calls.push(['error', value]), success: value => calls.push(['success', value]) },
    })({ target: { files: mode === 'no-file' ? [] : [file] } });
    if (mode === 'no-file') { assert.deepEqual(calls, []); continue; }
    assert.deepEqual(calls.filter(([name]) => name === 'setSubiendoImagen'), [
      ['setSubiendoImagen', true], ['setSubiendoImagen', false],
    ]);
    assert.deepEqual(calls.filter(([name]) => name === 'error'),
      mode === 'ok' ? [] : [['error', 'Error al subir imagen.']]);
    assert.deepEqual(calls.filter(([name]) => name === 'setRadiografias'),
      mode === 'ok' ? [['setRadiografias', ['synthetic']]] : []);
  }
});

test('4C profile signing assets preserve payload, success/failure notice and saving state', async () => {
  for (const fail of [false, true]) {
    const calls = [];
    await fn('MiPerfil', 'guardarFirmaSello', {
      firmaDigital: 'synthetic-signature', selloDigital: 'synthetic-stamp',
      usuariosService: { async actualizarFirmaSello(payload) {
        assert.deepEqual(JSON.parse(JSON.stringify(payload)), {
          firma_digital: 'synthetic-signature', sello_digital: 'synthetic-stamp',
        });
        calls.push(['request']);
        if (fail) throw new Error('PRIVATE_PATIENT');
      } },
      setGuardandoFirma: value => calls.push(['saving', value]),
      toast: { success: value => calls.push(['success', value]), error: value => calls.push(['error', value]) },
    })();
    assert.deepEqual(calls, [['saving', true], ['request'],
      fail ? ['error', 'Error al guardar firma y sello.'] : ['success', 'Firma y sello guardados correctamente.'],
      ['saving', false]]);
  }
});

test('4C/POST Historias loading preserves lists and failure notice without discarded loading state', async () => {
  for (const fail of [false, true]) for (const isCreating of [false, true]) {
    const calls = [];
    const service = { async getAll() {
      if (fail) throw new Error('PRIVATE_PATIENT');
      return { data: { data: ['synthetic'] } };
    } };
    await fn('Historias', 'cargarTodo', {
      pacientesService: service, historiasService: service, editId: null, viewId: null, isCreating,
      setPacientesBD: value => calls.push(['patients', value]),
      setHistoriasClinicas: value => calls.push(['histories', value]),
      toast: { error: value => calls.push(['notice', value]) },
    })();
    assert.deepEqual(calls, fail
      ? (isCreating ? [] : [['notice', 'Error al cargar datos de la historia.']])
      : [['patients', ['synthetic']], ['histories', ['synthetic']]]);
  }
});

test('4C/POST unused report-list refresh stays removed and live loading remains connected', () => {
  const { source } = parse('Historias');
  assert.equal(walk(source.ast, node => node.type === 'Identifier' && node.name === 'recargarListaHistorias').length, 0);
  assert.equal(walk(source.ast, node => node.type === 'CallExpression' && node.callee.name === 'cargarTodo').length, 1);
});
