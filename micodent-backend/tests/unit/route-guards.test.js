const test = require('node:test');
const assert = require('node:assert/strict');

Object.assign(process.env, {
  DB_NAME: 'micodent_dev',
  DB_HOST: '127.0.0.1',
  DB_PORT: '1',
  DB_USER: 'dev_micodent',
  DB_PASSWORD: '<synthetic>',
  JWT_SECRET: '<synthetic-test-key-not-for-use-0000000000>',
});

const { verificarToken, soloAdmin, soloDoctor } = require('../../src/middleware/auth');
const usuarios = require('../../src/routes/usuarios.routes');
const gastos = require('../../src/routes/gastos.routes');
const dashboard = require('../../src/routes/dashboard.routes');
const historias = require('../../src/routes/historias.routes');

function routes(router) {
  const entries = new Map();
  for (const layer of router.stack) {
    if (!layer.route) continue;
    const methods = Object.keys(layer.route.methods);
    assert.equal(methods.length, 1);
    const key = `${methods[0].toUpperCase()} ${layer.route.path}`;
    assert.equal(entries.has(key), false, `Duplicate route: ${key}`);
    entries.set(key, layer.route.stack.map(entry => entry.handle));
  }
  return entries;
}

test('personnel routes require authentication, with administration on account management', () => {
  const entries = routes(usuarios);
  const selfService = new Set(['GET /doctores', 'PUT /cambiar-password', 'PUT /mi-firma-sello']);
  for (const [key, handlers] of entries) {
    assert.equal(handlers[0], verificarToken, key);
    if (!selfService.has(key)) assert.equal(handlers[1], soloAdmin, key);
  }
  assert.deepEqual(new Set([...entries.keys()].filter(key => !selfService.has(key))), new Set([
    'GET /', 'POST /', 'POST /reset-password', 'POST /:id/reactivar',
    'PUT /:id', 'DELETE /:id',
  ]));
  for (const key of ['PUT /cambiar-password', 'POST /reset-password', 'POST /:id/reactivar']) {
    assert.equal(entries.get(key).length, key === 'PUT /cambiar-password' ? 3 : 4, key);
  }
});

test('expense routes and sensitive dashboard routes retain their guards', () => {
  const expenseRoutes = routes(gastos);
  assert.ok(expenseRoutes.size > 0);
  for (const [key, handlers] of expenseRoutes) {
    assert.equal(handlers[0], verificarToken, key);
    assert.equal(handlers[1], soloAdmin, key);
  }
  const dashboardRoutes = routes(dashboard);
  for (const [key, handlers] of dashboardRoutes) assert.equal(handlers[0], verificarToken, key);
  assert.equal(dashboardRoutes.get('GET /financiero')[1], soloAdmin);
  assert.equal(dashboardRoutes.get('PUT /configuracion-pos')[1], soloAdmin);
});

test('clinical routes retain authentication and their existing doctor/admin boundaries', () => {
  const entries = routes(historias);
  const doctorOnly = new Set([
    'POST /:historiaId/consultas', 'PUT /consultas/:id', 'DELETE /consultas/:id',
    'POST /consultas/:id/adendas', 'PUT /:historiaId/antecedentes',
    'POST /:historiaId/odontograma-items', 'POST /odontograma-items/:id/adendas',
    'POST /:historiaId/recetas', 'POST /recetas/:id/reemitir',
    'POST /:historiaId/ordenes-radiografia', 'POST /ordenes-radiografia/:id/reemitir',
    'DELETE /odontograma-items/:id', 'PUT /:historiaId/firmas',
  ]);
  const adminOnly = new Set([
    'POST /pagos/:pagoId/anular', 'POST /consultas/:consultaId/conciliar-costos',
    'POST /radiografias/:id/restaurar',
  ]);
  const authenticated = new Set([
    'GET /radiografias/:id/archivo', 'GET /', 'GET /paciente/:pacienteId',
    'POST /consultas/:consultaId/pagos', 'GET /:historiaId/radiografias',
    'POST /:historiaId/radiografias', 'DELETE /radiografias/:id',
    'DELETE /paciente/:pacienteId', 'PUT /paciente/:pacienteId/reactivar',
    'GET /centros-referencia',
  ]);
  assert.deepEqual(new Set(entries.keys()), new Set([...doctorOnly, ...adminOnly, ...authenticated]));
  for (const [key, handlers] of entries) {
    assert.equal(handlers[0], verificarToken, key);
    if (doctorOnly.has(key)) assert.equal(handlers[1], soloDoctor, key);
    if (adminOnly.has(key)) assert.equal(handlers[1], soloAdmin, key);
  }
});
