export function jsonValue(value, fallback) {
  for (let depth = 0; typeof value === 'string' && depth < 3; depth++) {
    try { value = JSON.parse(value); } catch { return fallback; }
  }
  if (Array.isArray(fallback)) return Array.isArray(value) ? value : fallback;
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
}

const arrays = new Set(['extraorales', 'piezas_tomografia', 'periapicales_piezas', 'modelos_estudio', 'medicamentos']);
const objects = new Set(['tomografias', 'fotografias', 'intraorales', 'detalle_json']);
export function normalizeResponse(value) {
  if (Array.isArray(value)) return value.map(normalizeResponse);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (arrays.has(key)) item = jsonValue(item, []);
    if (objects.has(key)) item = jsonValue(item, {});
    if (['anulada', 'bloqueada', 'is_admin', 'isAdmin', 'activo'].includes(key)) item = item === true || Number(item) === 1;
    return [key, normalizeResponse(item)];
  }));
}

export const money = value => `S/ ${Number.isFinite(Number(value)) ? Number(value).toFixed(2) : '0.00'}`;
const labels = { monto: 'Monto', categoria: 'Categoría', descripcion: 'Descripción', fecha: 'Fecha',
  gasto_id: 'Gasto', consulta_id: 'Tratamiento', pago_id: 'Abono', doctor_id: 'Doctor',
  porcentaje: 'Porcentaje aplicado', comision: 'Comisión', costo_aplicado: 'Costo externo aplicado',
  margen: 'Margen de la clínica', motivo: 'Motivo', antes: 'Anterior', despues: 'Actual' };
export function activityFields(value) {
  const obj = jsonValue(value, {});
  const human = item => item == null ? 'Sin dato' : typeof item === 'object'
    ? Object.entries(item).map(([k, v]) => `${labels[k] || k.replaceAll('_', ' ')}: ${human(v)}`).join('; ')
    : String(item);
  return Object.entries(obj).filter(([k]) => !/^\d+$/.test(k)).map(([key, val]) => [
    labels[key] || key.replaceAll('_', ' '),
    /^(monto|comision|costo_aplicado|margen|recargo_pos)$/.test(key) ? money(val) : human(val),
  ]);
}
