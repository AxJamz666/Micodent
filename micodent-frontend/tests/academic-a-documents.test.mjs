import test from 'node:test';
import assert from 'node:assert/strict';
import { React, render, cleanup, fireEvent, screen, within, waitFor, disposeRuntime } from './helpers/component-runtime.mjs';
import { historiasService } from './helpers/component-boundaries.mjs';
import toast from 'react-hot-toast';
const { default: OrdenRadiografiaTab } = await import('../src/components/OrdenRadiografiaTab.jsx');
const { default: RecetarioTab } = await import('../src/components/RecetarioTab.jsx');
test.afterEach(cleanup); test.after(disposeRuntime);
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9yQAAAAASUVORK5CYII=';
const pacienteInfo = { apellidos: 'Sintetico', nombres: 'Paciente', dni: '00000001', fecha_nacimiento: '2000-01-01' };
function property(t, target, name, descriptor) {
  const original = Object.getOwnPropertyDescriptor(target, name);
  Object.defineProperty(target, name, { configurable: true, ...descriptor });
  t.after(() => original ? Object.defineProperty(target, name, original) : delete target[name]);
}
function printing(t) {
  const state = { printed: 0, decoded: [], failDecode: false, errors: [] };
  property(t, globalThis, 'Image', { value: window.Image });
  property(t, globalThis, 'requestAnimationFrame', { value: callback => { queueMicrotask(callback); return 1; } });
  property(t, window.HTMLImageElement.prototype, 'naturalWidth', { get: () => 1 });
  property(t, window.HTMLImageElement.prototype, 'decode', { value: async function () {
    state.decoded.push(this.getAttribute('src'));
    if (state.failDecode) throw new Error('SYNTHETIC_IMAGE_FAILURE');
  } });
  t.mock.method(window, 'print', () => { state.printed++; });
  t.mock.method(toast, 'error', error => state.errors.push(error));
  return state;
}

test('ACA-A-F22 retroactive: Rx preview/print contain deduplicated selected teeth and two maps; empty/missing maps guards', async t => {
  const state = printing(t);
  let centers = [{ id: 1, nombre: 'Centro Huancayo', sede: 'Huancayo', direccion: 'Direccion ficticia A', mapa_imagen_url: png },
    { id: 2, nombre: 'San Carlos', sede: 'San Carlos', direccion: 'Direccion ficticia B', mapa_imagen_url: png }];
  historiasService.getCentrosReferencia = async () => ({ data: { data: centers } });
  const order = { id: 71, fecha: '2026-10-03', doctor_nombre: 'Doctor historico', tipo_solicitud: 'todo_virtual',
    envio_virtual: 'correo', motivo: 'Motivo RX sintetico', extraorales: ['panoramica'],
    tomografias: { formato_entrega: 'solo_dvd_usb', opciones: ['implantes'] }, piezas_tomografia: [11, '11', 21],
    intraorales: { periapicales: true }, periapicales_piezas: [11, 12, 12], modelos_estudio: [], anulada: false };
  const mountOrder = value => render(React.createElement(OrdenRadiografiaTab, { historiaId: 7, ordenes: [value],
    onGuardado: async () => {}, pacienteInfo, esDoctor: false }));
  mountOrder(order);
  assert.equal(document.querySelector('.orden-print-area'), null); assert.equal(state.printed, 0);
  fireEvent.click(screen.getByTitle('Ver / Imprimir'));
  const area = document.querySelector('.orden-print-area');
  await waitFor(() => assert.ok(!screen.getByRole('button', { name: 'Imprimir', exact: true }).disabled));
  assert.ok(within(area).getByText('Motivo RX sintetico'));
  assert.match(area.textContent, /Todo Virtual.*correo/); assert.match(area.textContent, /Solo DVD-USB/);
  assert.ok(within(area).getByText('Panor\u00e1mica'));
  const chart = within(area).getByRole('region', { name: 'Odontograma de piezas solicitadas' });
  assert.equal(chart.querySelectorAll('.rx-tooth-selected').length, 3);
  assert.equal(chart.querySelectorAll('[data-rx-piece="11"]').length, 1);
  assert.equal(chart.querySelector('[data-rx-piece="11"] strong').textContent, 'T/P');
  assert.equal(chart.querySelector('[data-rx-piece="12"] strong').textContent, 'P');
  assert.equal(chart.querySelector('[data-rx-piece="21"] strong').textContent, 'T');
  assert.ok(within(area).getByAltText('Mapa Huancayo')); assert.ok(within(area).getByAltText('Mapa San Carlos'));
  assert.equal(state.printed, 0);
  fireEvent.click(screen.getByRole('button', { name: 'Imprimir', exact: true }));
  await waitFor(() => assert.equal(state.printed, 1)); assert.equal(state.decoded.length, 2);
  cleanup();
  mountOrder({ ...order, piezas_tomografia: [], periapicales_piezas: [] });
  fireEvent.click(screen.getByTitle('Ver / Imprimir'));
  assert.ok(!screen.queryByRole('region', { name: 'Odontograma de piezas solicitadas' }));
  cleanup(); centers = centers.slice(0, 1);
  mountOrder(order); fireEvent.click(screen.getByTitle('Ver / Imprimir'));
  await screen.findByText(/Faltan los mapas de los dos locales/);
  assert.ok(screen.getByRole('button', { name: 'Imprimir', exact: true }).disabled);
  fireEvent.click(screen.getByRole('button', { name: 'Imprimir', exact: true })); assert.equal(state.printed, 1);
});

test('ACA-A-F23 retroactive: historical prescription/signature, PNG replaces fallback, order and print/image failure', async t => {
  const state = printing(t);
  const recipe = { id: 91, fecha: '2026-10-03', rp: 'Rp historico sintetico', indicaciones: 'Indicacion historica',
    doctor_nombre: 'Doctor historico', doctor_especialidad: 'Especialidad sintetica', doctor_cop: '0000',
    doctor_firma: png, doctor_sello: png, anulada: false };
  const mountRecipe = value => render(React.createElement(RecetarioTab, { historiaId: 7,
    recetas: [{ ...recipe, id: 90, rp: 'Receta anulada ficticia', anulada: true }, value],
    onGuardado: async () => {}, pacienteInfo, esDoctor: false }));
  mountRecipe(recipe);
  assert.ok(!screen.queryByText('Receta anulada ficticia'));
  assert.equal(document.querySelector('.receta-print-area'), null);
  fireEvent.click(screen.getByTitle('Ver / Imprimir'));
  const area = document.querySelector('.receta-print-area');
  assert.ok(within(area).getByText('Rp historico sintetico')); assert.ok(within(area).getByText('Indicacion historica'));
  const signature = within(area).getByAltText('Firma'), stamp = within(area).getByAltText('Sello');
  assert.equal(signature.getAttribute('src'), png); assert.equal(stamp.getAttribute('src'), png);
  assert.ok(signature.compareDocumentPosition(stamp) & Node.DOCUMENT_POSITION_FOLLOWING);
  assert.ok(!area.querySelector('[data-stamp-fallback]')); assert.equal(state.printed, 0);
  fireEvent.click(screen.getByRole('button', { name: 'Imprimir', exact: true }));
  await waitFor(() => assert.equal(state.printed, 1)); assert.equal(state.decoded.length, 2);
  state.failDecode = true;
  fireEvent.click(screen.getByRole('button', { name: 'Imprimir', exact: true }));
  await waitFor(() => assert.equal(state.errors.length, 1)); assert.equal(state.printed, 1);
  assert.match(state.errors[0], /No se pudieron cargar todas las imagenes/);
  assert.ok(!screen.getByRole('button', { name: 'Imprimir', exact: true }).disabled);
  cleanup(); mountRecipe({ ...recipe, doctor_sello: null });
  fireEvent.click(screen.getByTitle('Ver / Imprimir'));
  const fallback = document.querySelector('.receta-print-area [data-stamp-fallback]');
  assert.ok(within(fallback).getByText('Doctor historico')); assert.match(fallback.textContent, /COP 0000/);
  assert.ok(!within(document.querySelector('.receta-print-area')).queryByAltText('Sello'));
  assert.ok(screen.getByAltText('Firma').compareDocumentPosition(fallback) & Node.DOCUMENT_POSITION_FOLLOWING);
});
