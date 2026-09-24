const test=require('node:test');
const assert=require('node:assert/strict');
const { allocate,cents }=require('../../src/services/finanzas');
const json=require('../../src/utils/jsonFields');

test('cash commission and first-cost allocation',()=>{
  assert.deepEqual(allocate('120','0','25'),{costo:'0.00',base:'120.00',comision:'30.00',margen:'90.00'});
  assert.deepEqual(allocate('60','100','25'),{costo:'60.00',base:'0.00',comision:'0.00',margen:'0.00'});
  assert.deepEqual(allocate('80','40','25'),{costo:'40.00',base:'40.00',comision:'10.00',margen:'30.00'});
});
test('zero rate, 100%, and cents are deterministic',()=>{
  assert.equal(allocate('0.01','0','25').comision,'0.00');
});
test('reported rows: external recovery precedes commission and preserves each cent',()=>{
  assert.deepEqual(allocate('80','40','30'),{costo:'40.00',base:'40.00',comision:'12.00',margen:'28.00'});
  assert.deepEqual(allocate('80','70','30'),{costo:'70.00',base:'10.00',comision:'3.00',margen:'7.00'});
  assert.deepEqual(allocate('60','100','25'),{costo:'60.00',base:'0.00',comision:'0.00',margen:'0.00'});
  for(const paid of ['0.01','1.99','80','999.99']) for(const cost of ['0','0.01','40','1000']) for(const rate of ['0','25','30','33.33','100']) {
    const result=allocate(paid,cost,rate);
    assert.equal(cents(result.costo)+cents(result.comision)+cents(result.margen),cents(paid));
    assert.equal(cents(result.base),cents(paid)-cents(result.costo));
  }
});
test('amount validation rejects coercion, negative, exponent and overprecision',()=>{
  for(const n of [null,undefined,true,'','-1','NaN','Infinity','1.001','1e3'])assert.throws(()=>cents(n));
  assert.equal(allocate('120','0','0').comision,'0.00');
  assert.equal(allocate('120','0','100').margen,'0.00');
  assert.throws(()=>allocate('120','0','101'));
});
test('JSON objects, MariaDB text, double serialization and malformed legacy',()=>{
  for(const value of [{monto:340},'{"monto":340}',JSON.stringify('{"monto":340}')])assert.deepEqual(json.parse(value,{}),{monto:340});
  assert.deepEqual(json.parse('{broken',{}),{});
  const row=json.document({extraorales:'["panoramica"]',tomografias:JSON.stringify({opciones:JSON.stringify(['implantes'])}),intraorales:null});
  assert.deepEqual(row.extraorales,['panoramica']);assert.deepEqual(row.tomografias.opciones,['implantes']);assert.deepEqual(row.intraorales,{});
});
