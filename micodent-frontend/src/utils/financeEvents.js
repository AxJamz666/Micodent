export const FINANCE_EVENT = 'micodent-finanzas-updated';

export function isFinancialMutation(config = {}) {
  if (!['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) return false;
  return /^\/(?:gastos|laboratorio)(?:\/|$)|^\/historias\/(?:\d+\/consultas|consultas\/|pagos\/)|^\/usuarios(?:\/|$)|^\/dashboard\/configuracion-pos$/.test(config.url || '');
}

export function notifyFinanceChange() {
  try { localStorage.setItem(FINANCE_EVENT, `${Date.now()}-${crypto.randomUUID()}`); }
  catch { /* A browser storage restriction must not turn a successful payment into an error. */ }
  window.dispatchEvent(new Event(FINANCE_EVENT));
}
