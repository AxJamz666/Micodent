import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Linter } from 'eslint';

// Live fingerprints include equivalent 4B syntax and unused 4C catch bindings verified by AST and behavior tests.
// POST delta removes proven orphan hooks; report and redirection fingerprints are preserved.
const baseline = {
  "Historias": {
    "effects": [
      "5fef6b7954f46959909ab2a2e3300db1bd96b80f79c21d59b1f0c45614c80d7f",
      "1661ab13802e21be99dc0f6cf81513a31720388c38a8521cbcd5b4617b1064cf",
      "041fb980012318280409fc429e139b6c43bdc676b7a460ad8ae832dda6c862a1"
    ],
    "hooks": [
      "58f152f7dec31788f1b339b71a123caf7511d2e925d642dc5dacd9add3d92c6e",
      "c05bdf010159ea1eb4fc42b0eb51d5eed8ffb40b1354d461fe82e24b1263f9f9",
      "ceae9c159619468843509d14449d859f51d87463f62951cf4114ad4766c07317",
      "a81958f5fb18229897be9f5ba722eeaa24729ccbcd6d1b6c52952c55b747041f",
      "a81958f5fb18229897be9f5ba722eeaa24729ccbcd6d1b6c52952c55b747041f",
      "4f2cf04bad324bb0f548c6840e84e8e9167b11b76a0152208678e8edb20f9bd2",
      "1d0e73d7105785d9c6157ee51c8ba8b9f198b21ee39b35767d87cd45100335f5",
      "a81958f5fb18229897be9f5ba722eeaa24729ccbcd6d1b6c52952c55b747041f",
      "a81958f5fb18229897be9f5ba722eeaa24729ccbcd6d1b6c52952c55b747041f",
      "0ae72125e45bac9753bf6ff9ada5b34abdfe236296e7af8a356f9a83d94d79d4",
      "a06e8d12c808324a01e8e471dbf6367e59726bf60c39774defc1fef6060aedfd",
      "a81958f5fb18229897be9f5ba722eeaa24729ccbcd6d1b6c52952c55b747041f",
      "6c1079694c186b26a0d09339c9c866e0c33cd9a653bbb337e1ed427a63518f72",
      "651ff60d9b8d4d64e42ad6ffc93774f19b678bfec06fbd7f1e3215b04bec2959"
    ],
    "report": "fb522950b2c6ac5efe2348f03527b3195c34585e0b4413fb3139ce49104b9582",
    "handlers": {
      "recargarOdontograma": "35d7fdd1f2ca9bcc83da1ed75704be45d8cab5e4c0b7a293a21b0aa655295d60",
      "abrirAuditoriaHC": "ff8a3bc92414a79837f2880158f8498ad343917055dadf4e3bd51d56233d7736",
      "handleGuardarDatosHC": "a487b73ac5c259f9eb41d7910792414971440b504834f3957496a1c59f0f8311",
      "handleToggleArchivadas": "f2686c7f077a8854a3adb38b39adc84726fc662bf69be9093105466dc189e0e5",
      "handleBorrarHistoria": "5e9e87c7be2e72cdc00080544ba550f8aba049619290cb7c78b345d9e36c5d48",
      "handleReactivarHistoria": "27f8dd393c588a0acf722ed4641e57a5f3ba512ffe4c12cc3406cd438a434818",
      "handleCaraClick": "555e42fe7648f543815969ed253bd2c7f52750607aead77b9d544a2772ab5ef9",
      "handleLimpiarOdontograma": "42fa4d85347f7b770a3ad4e82638eb35cc3801d469a53772d11e5e361fa3586c",
      "handleBuscarPorDni": "f2cc4b6109582af81578a71f28c60a2c28a8b55762da0a3ea99b11aa6e37ba45",
      "handleFileUpload": "31f8a114d49e6cb25a624409b8bce854a14e6e78a4093ad0ef6d8522f901449f",
      "handleEliminarRadiografia": "fe3c0c053d4afd53ee64f1c4a8cbf00771479b3db3ccf90f2ab8d4afa094acbd",
      "handleCrearTratamiento": "5ee17e3c92e14bd97217d8fe553518786f60b1ba5215f23475ec8ef65689b516",
      "handleEliminarEvolucion": "903764c12463b08943002190599f894fa1f6ccc840c4cdf1771b956511fe6b50",
      "handleAbonar": "492a03168f477783c6270ad3d3c08d1e162183d6a015cf6dc32e7a04e7943476",
      "handleAgregarAdenda": "9bd426dacb70bfee7f835a038b59fb26757bb13a7f9c912a50587bac75b3688a"
    }
  },
  "MiPerfil": {
    "effects": [
      "82c81a950214aab3482d5f1d3c2cba6e985a6e09890cf42c0960cf8d0292af2e"
    ],
    "hooks": [
      "c05bdf010159ea1eb4fc42b0eb51d5eed8ffb40b1354d461fe82e24b1263f9f9",
      "0ae72125e45bac9753bf6ff9ada5b34abdfe236296e7af8a356f9a83d94d79d4",
      "60f1ad3dda0b658954f1e26acd7e44a273e0a70a73327db33defa24daa59ac68",
      "5ea0113ab315a7170a57ea08623a01709cf52b00cf942d73d97197acb39af9ca",
      "4e1c47a6bf3d86cbbcb11dbdad932e0b9db8dc82a59bfbbb48b3fa6a185d4b19",
      "5ea0113ab315a7170a57ea08623a01709cf52b00cf942d73d97197acb39af9ca",
      "5ea0113ab315a7170a57ea08623a01709cf52b00cf942d73d97197acb39af9ca",
      "5ea0113ab315a7170a57ea08623a01709cf52b00cf942d73d97197acb39af9ca",
      "0ae72125e45bac9753bf6ff9ada5b34abdfe236296e7af8a356f9a83d94d79d4",
      "0ae72125e45bac9753bf6ff9ada5b34abdfe236296e7af8a356f9a83d94d79d4",
      "5ea0113ab315a7170a57ea08623a01709cf52b00cf942d73d97197acb39af9ca",
      "c189a43bbdf01f74e382fd07236313daa32a38be28e048d155bbb83b4bc3b120"
    ],
    "component": "cd2f977e04eb2b897fac6d5baea34425448b6da4f94b924935f172d74497ca80"
  }
};
const reportedImports = {"Historias":["OdontogramaEditor","Home","Users","ImageIcon","Save","X","User","ChevronDown","Activity","LayoutGrid","Edit","Eraser","DollarSign","Trash2","Search","Clipboard","Clock","Lock","Plus","Calendar","Check","CheckCircle","History","UploadCloud","RotateCcw","CreditCard","PenTool","ShieldAlert","Eye"],"MiPerfil":["Mail","Phone","MapPin"]};
const cleanedFiles = ['MiPerfil', 'Historias'];
const reviewedDeadHandlers = ["recargarOdontograma","abrirAuditoriaHC","handleGuardarDatosHC","handleToggleArchivadas","handleBorrarHistoria","handleReactivarHistoria","handleCaraClick","handleLimpiarOdontograma","handleBuscarPorDni","handleFileUpload","handleEliminarRadiografia","handleCrearTratamiento","handleEliminarEvolucion","handleAbonar","handleAgregarAdenda"];
// Authorized 4D/POST presentation changes have separate branch/AST assertions.
const protectedFiles = {
  "src/App.jsx": "98964588a8e207e6f0314d4d19e47b7b404db8aff348003a8d77a2f3be72e500",
  "src/pages/Pacientes.jsx": "93b9504e5e86bfbacdaa9a898db841ee5a4af2e51febaa8b3ac211ff230ac148",
  "src/pages/PacienteDetalle.jsx": "7e47e76e1f8504e3525ec93a75dd5c1d3dc5a0bb792546d805a5d32352b695c2",
  "src/components/OdontogramaEditor.jsx": "f58a62c5f7e599a45f685312c22638fb9f0d10368a0e16997a9bfe764152dc26",
  "src/components/Diente.jsx": "bdcc801c7dbe95873b9a1124f1073552260e8d50a3549e2a40ad8b60aab66084",
  "src/pages/MiPerfil.jsx": "c39920bbadbe58605e9e01fdc1904f4cfd0349c436837178955cb3dd25b67f90"
};

function source(file) {
  const text = readFileSync(new URL(`../src/pages/${file}.jsx`, import.meta.url), 'utf8');
  const linter = new Linter();
  const messages = linter.verify(text, {
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } }, rules: {},
  });
  assert.equal(messages.filter(message => message.fatal).length, 0, file);
  const ast = linter.getSourceCode().ast;
  const component = ast.body.find(node => node.type === 'VariableDeclaration' && node.declarations[0].id.name === file).declarations[0].init;
  const hash = node => createHash('sha256').update(text.slice(...node.range).replaceAll('\r\n', '\n')).digest('hex');
  const body = component.body.body;
  return { ast, component, hash, body, scopeManager: linter.getSourceCode().scopeManager };
}

test('4A reported unused imports are removed without deleting active imports', () => {
  for (const file of cleanedFiles) {
    const { ast } = source(file);
    const imports = ast.body.filter(node => node.type === 'ImportDeclaration').flatMap(node => node.specifiers.map(specifier => specifier.local.name));
    for (const name of reportedImports[file]) assert.ok(!imports.includes(name), name);
    if (file === 'Historias') for (const name of ['React','useState','useEffect','ClinicalImage','Diente','FirmaMiniBlock','ArrowLeft','FileText']) assert.ok(imports.includes(name), name);
    const signatureSource = readFileSync(new URL('../src/components/SignaturePad.jsx', import.meta.url), 'utf8');
    assert.match(signatureSource, /import React, \{ useState, useEffect, useRef \} from 'react'/);
  }
});

test('4A/POST Historias preserves the remaining live hook ordering and initializers', () => {
  const { body, hash } = source('Historias');
  const hooks = body.flatMap(node => node.type === 'VariableDeclaration' ? node.declarations.map(d => d.init) :
    node.type === 'ExpressionStatement' ? [node.expression] : [])
    .filter(node => node?.type === 'CallExpression' && /^use/.test(node.callee?.name || '')).map(hash);
  assert.deepEqual(hooks, baseline.Historias.hooks);
});

test('4A printable report, navigation and live loading effects remain byte-equivalent', () => {
  const { body, hash } = source('Historias');
  assert.equal(hash(body.find(node => node.type === 'IfStatement' && node.test.name === 'viewId')), baseline.Historias.report);
  const effects = body.filter(node => node.type === 'ExpressionStatement' && node.expression.callee?.name === 'useEffect').map(hash);
  assert.deepEqual(effects, baseline.Historias.effects);
});

test('4A reviewed unreachable legacy handlers and their references are absent', () => {
  const { body, hash, scopeManager } = source('Historias');
  const references = scopeManager.scopes.flatMap(scope => scope.references);
  for (const [name, fingerprint] of Object.entries(baseline.Historias.handlers)) {
    const declaration = body.find(node => node.type === 'VariableDeclaration' && node.declarations[0].id.name === name);
    if (reviewedDeadHandlers.includes(name)) {
      assert.equal(declaration, undefined, name);
      assert.ok(!references.some(reference => reference.identifier.name === name), name);
      continue;
    }
    assert.ok(declaration, name);
    assert.equal(hash(declaration), fingerprint, name);
  }
});

test('4A removal leaves current clinical controls, routes and profile unchanged', () => {
  for (const [path, fingerprint] of Object.entries(protectedFiles)) {
    const text = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8').replaceAll('\r\n', '\n');
    assert.equal(createHash('sha256').update(text).digest('hex'), fingerprint, path);
  }
});

test('4A MiPerfil component behavior remains byte-equivalent', () => {
  const { component, hash } = source('MiPerfil');
  assert.equal(hash(component), baseline.MiPerfil.component);
});

test('4A only reported non-effectful bindings are gone', () => {
  const text = readFileSync(new URL('../src/pages/Historias.jsx', import.meta.url), 'utf8');
  const linter = new Linter();
  linter.verify(text, { languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } }, rules: {} });
  const names = linter.getSourceCode().scopeManager.scopes.flatMap(scope => scope.variables.map(variable => variable.name));
  for (const name of ["esAdmin","miUserId","setSearchTerm","searchTerm","setSearchQuery","searchQuery","activeTab","setActiveTab","savingHC","cargandoHC","firmaDoctor","setTratamientoSearch","setAsignadosSearch","isDropdownOpen","setSelectedTool","setSelectedColor","setIsEraserMode","selectedImage","setSelectedImage","miFirma","miSello","showNuevoTratamiento","showAbonoModal","showHistorialModal","setShowHistorialModal","showAdendaModal","setSelectedEvolucion","showHCAuditModal","hcAuditLogs","getEstadoPagoGlobal","categoriasUnicas","asignadosFiltrados"]) assert.ok(!names.includes(name), name);
});
