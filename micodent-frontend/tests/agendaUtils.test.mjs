import test from 'node:test';
import assert from 'node:assert/strict';
import { formatearFechaISO, obtenerDiasGrillaMes } from '../src/utils/agendaUtils.js';

test('month grid advances by local calendar days through leap February', () => {
  const dias = obtenerDiasGrillaMes(new Date(2024, 1, 15));
  assert.equal(dias.length, 35);
  assert.equal(formatearFechaISO(dias[0]), '2024-01-29');
  assert.equal(formatearFechaISO(dias.at(-1)), '2024-03-03');
  for (let i = 1; i < dias.length; i++) {
    const siguiente = new Date(dias[i - 1]);
    siguiente.setDate(siguiente.getDate() + 1);
    assert.equal(formatearFechaISO(dias[i]), formatearFechaISO(siguiente));
  }
});

test('month grid spans complete weeks at year boundary', () => {
  const dias = obtenerDiasGrillaMes(new Date(2026, 11, 15));
  assert.equal(formatearFechaISO(dias[0]), '2026-11-30');
  assert.equal(formatearFechaISO(dias.at(-1)), '2027-01-03');
  assert.equal(dias.length, 35);
});

test('month grid includes all six weeks when required', () => {
  const dias = obtenerDiasGrillaMes(new Date(2026, 2, 15));
  assert.equal(dias.length, 42);
  assert.equal(formatearFechaISO(dias[0]), '2026-02-23');
  assert.equal(formatearFechaISO(dias.at(-1)), '2026-04-05');
});
