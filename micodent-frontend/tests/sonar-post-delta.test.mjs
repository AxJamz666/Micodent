import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { Linter } from 'eslint';

function parse(file) {
  const text = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');
  const linter = new Linter();
  const errors = linter.verify(text, { languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } } });
  assert.equal(errors.filter(error => error.fatal).length, 0);
  return { text, source: linter.getSourceCode() };
}
function walk(node, predicate, found = []) {
  if (!node || typeof node !== 'object') return found;
  if (predicate(node)) found.push(node);
  for (const [key, value] of Object.entries(node)) {
    if (['parent', 'loc', 'range', 'tokens', 'comments'].includes(key)) continue;
    if (Array.isArray(value)) for (const child of value) walk(child, predicate, found);
    else walk(value, predicate, found);
  }
  return found;
}
function canonical(node) {
  if (Array.isArray(node)) return node.map(canonical);
  if (!node || typeof node !== 'object') return node;
  return Object.fromEntries(Object.entries(node).filter(([key]) => !['parent', 'loc', 'range', 'tokens', 'comments', 'start', 'end', 'raw'].includes(key)).map(([key, value]) => [key, canonical(value)]));
}
function presentationCanonical(node) {
  const value = canonical(node);
  for (const text of walk(value, child => child.type === 'JSXText')) {
    text.value = text.value.trim().replace(/\s+/g, ' ');
  }
  return value;
}

test('POST personnel form preserves its complete presentation, conditions and bindings', () => {
  const { source } = parse('pages/AdministracionPersonal.jsx');
  const form = walk(source.ast, node => node.type === 'VariableDeclarator' && node.id.name === 'FormularioPersonal')[0].init;
  assert.equal(createHash('sha256').update(JSON.stringify(presentationCanonical(form.body))).digest('hex'), 'd8b3af9a50a6ae9b6590b8de601f9fa6ba1732a6880bf61d01cfffc7a5e53c6e');
  const handlers = walk(source.ast, node => node.type === 'VariableDeclarator' && ['handleSave', 'handleResetPassword', 'handleDelete', 'canManage', 'canDeactivate'].includes(node.id.name));
  assert.equal(createHash('sha256').update(JSON.stringify(handlers.map(canonical))).digest('hex'), 'ab300cb967b7ce4fb457c875e6e8146e7de896af7687a78c01531a6aba7e7599');
  const list = walk(source.ast, node => node.type === 'VariableDeclarator' && node.id.name === 'renderPersonnelList')[0].init;
  assert.deepEqual(list.body.body.map(statement => statement.type === 'IfStatement' ? statement.consequent.argument.type : statement.argument.type), ['JSXElement', 'JSXElement', 'JSXFragment']);
  const call = walk(source.ast, node => node.type === 'JSXOpeningElement' && node.name.name === 'FormularioPersonal')[0];
  for (const attribute of call.attributes) assert.equal(attribute.name.name, attribute.value.expression.name);
});
function named(file, name, context) {
  const { text, source } = parse(file);
  const fn = walk(source.ast, node => node.type === 'VariableDeclarator' && node.id.name === name)[0].init;
  return runInNewContext(`(${text.slice(...fn.range)})`, context);
}

test('POST patient actions wrapper is passive and native buttons do not also open the row', () => {
  const { text, source } = parse('pages/Pacientes.jsx');
  const wrapper = walk(source.ast, node => node.type === 'JSXOpeningElement' &&
    node.attributes.some(attribute => attribute.name?.name === 'data-patient-actions'))[0];
  assert.equal(wrapper.name.name, 'div');
  assert(!wrapper.attributes.some(attribute => ['onClick', 'role', 'tabIndex'].includes(attribute.name?.name)));
  const row = walk(source.ast, node => node.type === 'JSXOpeningElement' && node.name.name === 'tr' &&
    node.attributes.some(attribute => attribute.name?.name === 'onClick'))[0];
  const handler = row.attributes.find(attribute => attribute.name.name === 'onClick').value.expression;
  for (const activo of [false, true]) for (const action of [false, true]) {
    const calls = [];
    runInNewContext(`(${text.slice(...handler.range)})`, { p: { id: 'synthetic', activo }, navigate: path => calls.push(path) })({
      target: { closest: selector => { assert.equal(selector, '[data-patient-actions]'); return action; } },
      stopPropagation: () => calls.push('stop'),
    });
    assert.deepEqual(calls, action ? ['stop'] : activo ? ['/pacientes/synthetic'] : []);
  }
  const buttons = walk(wrapper.parent, node => node.type === 'JSXOpeningElement' && node.name.name === 'button');
  assert.equal(buttons.length, 4);
  for (const button of buttons) assert(button.attributes.some(attribute => attribute.name.name === 'onClick'));
  // Reconstruct only the old propagation strategy to protect every other cell and action.
  const linter = new Linter();
  linter.verify('const restore = () => <tr onClick={() => p.activo && navigate(`/pacientes/${p.id}`)}><div onClick={e => e.stopPropagation()} /></tr>;',
    { languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } } });
  const originalHandlers = walk(linter.getSourceCode().ast, node => node.type === 'JSXAttribute' && node.name.name === 'onClick').map(canonical);
  const list = canonical(walk(source.ast, node => node.type === 'VariableDeclarator' && node.id.name === 'renderPatientList')[0].init);
  const restoredRow = walk(list, node => node.type === 'JSXOpeningElement' && node.name.name === 'tr' &&
    node.attributes.some(attribute => attribute.name?.name === 'onClick'))[0];
  restoredRow.attributes = restoredRow.attributes.map(attribute => attribute.name?.name === 'onClick' ? originalHandlers[0] : attribute);
  const restoredWrapper = walk(list, node => node.type === 'JSXOpeningElement' &&
    node.attributes.some(attribute => attribute.name?.name === 'data-patient-actions'))[0];
  restoredWrapper.attributes = restoredWrapper.attributes.filter(attribute => attribute.name?.name !== 'data-patient-actions');
  restoredWrapper.attributes.push(originalHandlers[1]);
  const returned = list.body.body.flatMap(node => node.type === 'ReturnStatement' ? [node.argument] : node.type === 'IfStatement' ? [node.consequent.argument] : []);
  assert.equal(createHash('sha256').update(JSON.stringify(returned)).digest('hex'), 'd38e273552d3c626012acfd178809c2071725e3c2fe9c1ea38788987ab2c6a39');
});

test('POST cash indicators and treatment dialog are pure extractions of the original page AST', () => {
  for (const [page, extracted, expected] of [
    ['FinanzasDashboard', 'MovimientosCaja', 'd3a7c313431e7e69dc65175d5aec27b771a8fbf599a07b25b4bf1624582c5d6b'],
    ['PacienteDetalle', 'ModalTratamiento', 'eb7054e6be27477db0b853389c30e8622dfa1efdf8c59bb1745f1d6709f4d6d7'],
  ]) {
    const { source } = parse(`pages/${page}.jsx`);
    const component = walk(source.ast, node => node.type === 'VariableDeclarator' && node.id.name === page)[0].init;
    const helper = walk(source.ast, node => node.type === 'VariableDeclarator' && node.id.name === extracted)[0].init;
    const main = canonical(component);
    let calls = 0;
    function inline(node) {
      if (!node || typeof node !== 'object') return node;
      if (node.type === 'JSXElement' && node.openingElement.name.name === extracted) {
        calls++;
        for (const prop of node.openingElement.attributes) assert.equal(prop.name.name, prop.value.expression.name);
        return canonical(helper.body);
      }
      for (const [key, value] of Object.entries(node)) node[key] = Array.isArray(value) ? value.map(inline) : inline(value);
      return node;
    }
    const reconstructed = inline(main);
    assert.equal(calls, 1);
    assert.equal(createHash('sha256').update(JSON.stringify(reconstructed)).digest('hex'), expected, page);
  }
});

test('POST Historias has only nine live state pairs, all at unconditional component level', () => {
  const { source } = parse('pages/Historias.jsx');
  const component = walk(source.ast, node => node.type === 'VariableDeclarator' && node.id.name === 'Historias')[0].init;
  const scope = source.scopeManager.acquire(component);
  const hooks = walk(component, node => node.type === 'CallExpression' && node.callee.name === 'useState');
  assert.equal(hooks.length, 9);
  for (const hook of hooks) {
    assert.equal(hook.parent.type, 'VariableDeclarator');
    assert.equal(hook.parent.parent.parent, component.body);
    assert.equal(hook.parent.id.type, 'ArrayPattern');
    assert.equal(hook.parent.id.elements.length, 2);
    for (const element of hook.parent.id.elements) {
      assert(element);
      assert(scope.variables.find(variable => variable.name === element.name).references.some(reference => reference.isRead()), element.name);
    }
  }
  const removed = ["mostrarArchivadas","setMostrarArchivadas","dniQuery","setDniQuery","setPacienteEncontrado","pacienteEncontrado","setSavingHC","snapshot","asignadosSearch","isEraserMode","setEditEvoId","setShowNuevoTratamiento","setShowAbonoModal","setShowAdendaModal","formAdenda","setFormAdenda","selectedEvolucion","setFormNuevoTratamiento","setFormAbono","formAbono","setShowHCAuditModal","setHCAuditLogs","recargarListaHistorias","borrarEnCara","aplicarArcada","aplicarPiezaOCara","calcularResta","guardarEdicionTratamiento","tratamientosFiltrados"];
  for (const name of removed) assert(!scope.variables.some(variable => variable.name === name), name);
});

test('POST Historias loading AST changes only discarded legacy-state writes', () => {
  const { source } = parse('pages/Historias.jsx');
  const fn = walk(source.ast, node => node.type === 'VariableDeclarator' && node.id.name === 'cargarTodo')[0].init;
  assert.equal(createHash('sha256').update(JSON.stringify(canonical(fn))).digest('hex'), 'ca137f56e35529c7405c023373d08e4e8692a2dc5024a1dcbb256a73dcad831c');
});

test('POST report loading retains clinical projection, patient signature, API calls and failure notice', async () => {
  for (const fail of [false, true]) for (const ok of [false, true]) {
    const calls = [];
    const setters = Object.fromEntries(['PacientesBD','HistoriasClinicas','TriajeData','DiagnosticoData','Odontograma','TratamientosAsignados','Evoluciones','Radiografias','FirmaPaciente'].map(name => ['set'+name, value => calls.push([name, value])]));
    const h = { triaje: { presion: '120/80' }, antecedentes: { motivo_consulta: 'Synthetic' },
      odontograma: [{id:1,pieza:11,cara:'Toda la pieza',estado_codigo:'qa',color:'red'}],
      consultas: [{id:1,costo_total:'100',pagos:[{monto:'20'}]}], radiografias:[{id:1}], firma:{firma_paciente_data:'synthetic-signature'} };
    await named('pages/Historias.jsx', 'cargarTodo', { ...setters, editId:null, viewId:'1', isCreating:false,
      TRATAMIENTOS_DB:[{id:'qa',visual:'fondo'}],
      pacientesService:{getAll:async()=>({data:{data:[]}})},
      historiasService:{getAll:async()=>({data:{data:[]}}),getByPaciente:async id=>{calls.push(['request',id]);if(fail)throw new Error('synthetic');return{data:{ok,data:h}};}},
      toast:{error:value=>calls.push(['notice',value])},
    })();
    assert.deepEqual(calls.slice(0,3), [['PacientesBD',[]],['HistoriasClinicas',[]],['request','1']]);
    if(fail) assert.deepEqual(calls.at(-1), ['notice','Error al cargar datos de la historia.']);
    else if(ok) {
      assert.equal(calls.find(([name])=>name==='TriajeData')[1].motivo,'Synthetic');
      assert.equal(calls.find(([name])=>name==='Odontograma')[1][11].status.visual,'fondo');
      assert.equal(calls.find(([name])=>name==='Evoluciones')[1][0].costoTotal,'100');
      assert.deepEqual(calls.at(-1), ['FirmaPaciente','synthetic-signature']);
    } else assert.equal(calls.length,3);
  }
});
