function parse(value, fallback) {
  for (let n=0; typeof value === 'string' && n<3; n++) {
    try { value=JSON.parse(value); } catch { return fallback; }
  }
  return Array.isArray(fallback) ? (Array.isArray(value) ? value : fallback)
    : (value && typeof value === 'object' && !Array.isArray(value) ? value : fallback);
}
function document(row) {
  const out = { ...row };
  for (const key of ['extraorales','piezas_tomografia','periapicales_piezas','modelos_estudio','medicamentos']) if (key in out) out[key]=parse(out[key],[]);
  for (const key of ['tomografias','fotografias','intraorales']) if (key in out) out[key]=parse(out[key],{});
  if (out.tomografias) out.tomografias.opciones=parse(out.tomografias.opciones,[]);
  return out;
}
module.exports = { parse, document };
