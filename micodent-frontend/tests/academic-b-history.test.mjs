import test from 'node:test';
import assert from 'node:assert/strict';
import { React, render, cleanup, fireEvent, screen, within, waitFor, disposeRuntime } from './helpers/component-runtime.mjs';
import { pacientesService, historiasService, fixture } from './helpers/component-boundaries.mjs';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import toast from 'react-hot-toast';
const { default: Historias } = await import('../src/pages/Historias.jsx');
test.afterEach(cleanup); test.after(disposeRuntime);
const mount = query => render(React.createElement(MemoryRouter, { initialEntries: [`/historias${query}`] },
  React.createElement(Routes, null,
    React.createElement(Route, { path: '/historias', element: React.createElement(Historias) }),
    ...['/pacientes', '/pacientes/nuevo', '/pacientes/41'].map(path =>
      React.createElement(Route, { key: path, path, element: React.createElement('p', null, `Destination ${path}`) })))));

test('ACA-B-F26 clinical report renders existing history, protects printing and redirects legacy entry points', async t => {
  localStorage.clear(); fixture.status = 'ready';
  const errors = [], titles = [];
  t.mock.method(toast, 'error', value => errors.push(value));
  t.mock.method(window, 'print', () => titles.push(document.title));
  const imageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Image');
  Object.defineProperty(globalThis, 'Image', { configurable: true, value: window.Image });
  t.after(() => imageDescriptor ? Object.defineProperty(globalThis, 'Image', imageDescriptor) : delete globalThis.Image);
  pacientesService.getAll = async () => ({ data: { data: [{ id: 41, nombres: 'Paciente', apellidos: 'Sintetico',
    dni: '00000001', fecha_nacimiento: '2000-01-01', sexo: 'M', apoderado_nombre: 'Apoderado sintetico' }] } });
  historiasService.getAll = async () => ({ data: { data: [{ paciente_id: 41, nro_historia: 'HC-QA-41', creado_por_nombre: 'Doctor historico' }] } });
  let fail = false;
  historiasService.getByPaciente = async id => {
    assert.equal(id, '41');
    if (fail) throw new Error('Private diagnostic');
    return { data: { ok: true, data: {
      antecedentes: { motivo_consulta: 'Motivo sintetico', diagnostico: 'Diagnostico sintetico', plan_tratamiento: 'Plan sintetico' },
      triaje: { presion: '120/80', pulso: '70' },
      odontograma: [{ id: 51, pieza: 11, cara: 'Toda la pieza', estado_codigo: '1', estado_nombre: 'Estado sintetico', color: 'blue' }],
      consultas: [{ id: 71, fecha_consulta: '2026-10-03', descripcion: 'Tratamiento sintetico', costo_total: '380.00', pagos: [{ monto: '80.00' }, { monto: '60.00' }] }],
      radiografias: [{ id: 81, descripcion: 'Anexo sintetico', imageBase64: 'data:image/png;base64,AA==' }],
      firma: { firma_paciente_data: 'data:image/png;base64,AQ==' },
    } } };
  };
  mount('?view=41');
  await screen.findByText('Tratamiento sintetico');
  assert.ok(screen.getByText('HC-QA-41'));
  assert.ok(screen.getByText('Motivo sintetico'));
  assert.ok(screen.getByText('Diagnostico sintetico'));
  assert.ok(screen.getByText('Plan sintetico'));
  assert.ok(screen.getByText('Apoderado sintetico'));
  assert.equal(screen.getByAltText('Firma').getAttribute('src'), 'data:image/png;base64,AQ==');
  assert.match(screen.getByText('Estado sintetico', { exact: false }).textContent, /Pieza 11/);
  const row = screen.getByText('Tratamiento sintetico').closest('tr');
  for (const value of ['S/ 380.00', 'S/ 140.00', 'S/ 240.00']) assert.ok(within(row).getByText(value));
  const image = await screen.findByAltText('Anexo 1');
  fireEvent.click(screen.getByRole('button', { name: 'Imprimir Reporte' }));
  assert.equal(titles.length, 0);
  assert.ok(errors.some(value => /Espera a que terminen/.test(value)));
  fireEvent.error(image);
  fireEvent.click(screen.getByRole('button', { name: 'Imprimir Reporte' }));
  assert.equal(titles.length, 0);
  assert.ok(errors.some(value => /no se pudieron cargar/.test(value)));
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar carga' }));
  fireEvent.load(await screen.findByAltText('Anexo 1'));
  fireEvent.click(screen.getByRole('button', { name: 'Imprimir Reporte' }));
  assert.deepEqual(titles, ['HC-QA-41_Sintetico_Paciente']);
  assert.equal(document.title, 'Micodent');
  cleanup(); fail = true; mount('?view=41');
  await waitFor(() => assert.ok(errors.includes('Error al cargar datos de la historia.')));
  assert.ok(!document.body.textContent.includes('Private diagnostic'));
  fail = false;
  for (const [query, target] of [['?edit=41', '/pacientes/41'], ['?action=create', '/pacientes/nuevo'], ['', '/pacientes']]) {
    cleanup(); mount(query); await screen.findByText(`Destination ${target}`);
    assert.ok(!screen.queryByRole('button', { name: 'Imprimir Reporte' }));
  }
});
