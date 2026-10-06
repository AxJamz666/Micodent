import { money } from '../utils/data';

export default function MetodoPago({ value = 'Efectivo', onChange, monto, config }) {
  const cents = Math.round((Number(monto) || 0) * 100);
  const surcharge = config ? Math.round(cents * Math.round(Number(config.porcentaje) * 100) / 10000) : 0;
  return <fieldset className="space-y-2">
    <legend className="ui-field-label">Método de pago</legend>
    <div className="flex gap-2">
      {['Efectivo','Tarjeta'].map(method => <button key={method} type="button" aria-pressed={value === method}
        onClick={() => onChange(method)} className={`min-h-10 flex-1 rounded-lg border p-2 text-sm font-semibold ${value === method ? 'border-clinical-600 bg-clinical-50 text-clinical-700' : 'border-slate-300 bg-white text-slate-600'}`}>
        {method === 'Tarjeta' ? 'Tarjeta (POS)' : method}
      </button>)}
    </div>
    {value === 'Tarjeta' && (config ? <div className="border-l-2 border-amber-600 bg-amber-50 p-3 text-sm" data-pos-preview>
      <p>Recargo POS ({Number(config.porcentaje).toFixed(2)}%): {money(surcharge / 100)}</p>
      <p className="font-bold">Total a cobrar: {money((cents + surcharge) / 100)}</p>
    </div> : <output className="block text-sm text-amber-800">Recargo no disponible. Cierra y vuelve a abrir el formulario.</output>)}
  </fieldset>;
}
