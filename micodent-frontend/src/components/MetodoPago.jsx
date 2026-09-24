import { money } from '../utils/data';

export default function MetodoPago({ value = 'Efectivo', onChange, monto, config }) {
  const cents = Math.round((Number(monto) || 0) * 100);
  const surcharge = config ? Math.round(cents * Math.round(Number(config.porcentaje) * 100) / 10000) : 0;
  return <fieldset className="space-y-2">
    <legend className="text-sm font-semibold mb-2">Método de pago</legend>
    <div className="flex gap-2">
      {['Efectivo','Tarjeta'].map(method => <button key={method} type="button" aria-pressed={value === method}
        onClick={() => onChange(method)} className={`flex-1 p-2 border rounded text-sm font-semibold ${value === method ? 'bg-teal-50 border-teal-500 text-teal-800' : 'border-slate-300'}`}>
        {method === 'Tarjeta' ? 'Tarjeta (POS)' : method}
      </button>)}
    </div>
    {value === 'Tarjeta' && (config ? <div className="bg-amber-50 p-3 rounded text-sm" data-pos-preview>
      <p>Recargo POS ({Number(config.porcentaje).toFixed(2)}%): {money(surcharge / 100)}</p>
      <p className="font-bold">Total a cobrar: {money((cents + surcharge) / 100)}</p>
    </div> : <p role="status" className="text-sm text-amber-800">Recargo no disponible. Cierra y vuelve a abrir el formulario.</p>)}
  </fieldset>;
}
