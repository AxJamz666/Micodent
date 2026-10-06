function parse(value, fallback) {
  for (let n=0; typeof value === 'string' && n<3; n++) {
    try { value=JSON.parse(value); } catch { return fallback; }
  }
  if (Array.isArray(fallback)) {
    if (Array.isArray(value)) return value;
    return fallback;
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  return fallback;
}
function document(row) {
  const out = { ...row };
  for (const key of ['extraorales','piezas_tomografia','periapicales_piezas','modelos_estudio','medicamentos']) if (key in out) out[key]=parse(out[key],[]);
  for (const key of ['tomografias','fotografias','intraorales']) if (key in out) out[key]=parse(out[key],{});
  if (out.tomografias) out.tomografias.opciones=parse(out.tomografias.opciones,[]);
  return out;
}
module.exports = { parse, document };
