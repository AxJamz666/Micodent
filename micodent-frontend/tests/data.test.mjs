import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeResponse,activityFields,money} from '../src/utils/data.js';

test('activity never enumerates JSON characters',()=>{
  const record={monto:340,categoria:'materiales'};
  for(const input of [record,JSON.stringify(record),JSON.stringify(JSON.stringify(record))])
    assert.deepEqual(activityFields(input),[['Monto','S/ 340.00'],['Categoría','materiales']]);
  assert.deepEqual(activityFields('{broken'),[]);
});
test('Rx JSON and boolean strings have stable shapes',()=>{
  const row=normalizeResponse({extraorales:'["panoramica"]',tomografias:'{"opciones":["implantes"]}',anulada:'0'});
  assert.deepEqual(row.extraorales,['panoramica']);assert.equal(row.anulada,false);
  assert.deepEqual(row.tomografias.opciones,['implantes']);
});
test('DECIMAL strings format without toFixed type errors',()=>{
  assert.equal(money('80.50'),'S/ 80.50');assert.equal(money(null),'S/ 0.00');assert.equal(money('bad'),'S/ 0.00');
});
