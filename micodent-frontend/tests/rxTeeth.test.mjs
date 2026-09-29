import test from 'node:test';
import assert from 'node:assert/strict';
import { selectedRxTeeth, TOOTH_ROWS } from '../src/utils/rxTeeth.js';

test('RX print chart includes tomography, periapical and overlapping teeth', () => {
  assert.deepEqual(selectedRxTeeth({
    piezas_tomografia: [18, '55', 11],
    periapicales_piezas: ['11', 48],
  }), [
    { number: 18, type: 'T' },
    { number: 11, type: 'T/P' },
    { number: 55, type: 'T' },
    { number: 48, type: 'P' },
  ]);
});

test('RX print chart ignores invalid data and has one tile per valid tooth', () => {
  assert.equal(new Set(TOOTH_ROWS.flat()).size, 52);
  assert.deepEqual(selectedRxTeeth({ piezas_tomografia: [18, 18, 99, null, 'x'] }), [
    { number: 18, type: 'T' },
  ]);
  assert.deepEqual(selectedRxTeeth(null), []);
});
