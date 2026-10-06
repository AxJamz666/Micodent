import { TOOTH_ROWS } from '../utils/rxTeeth';

const PiezaSelector = ({ seleccionadas, onChange }) => {
  const toggle = (n) => {
    if (seleccionadas.includes(n)) onChange(seleccionadas.filter(p => p !== n));
    else onChange([...seleccionadas, n]);
  };

  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 overflow-x-auto">
      {TOOTH_ROWS.map((fila, i) => (
        <div key={fila.join('-')} className={`flex gap-1 justify-center flex-wrap ${i === 1 || i === 2 ? 'opacity-70' : ''}`}>
          {fila.map(n => (
            <button
              key={n}
              type="button"
              onClick={() => toggle(n)}
              className={`w-8 h-8 rounded-lg border text-xs font-bold transition-colors flex-shrink-0 ${
                seleccionadas.includes(n)
                  ? 'bg-clinical-500 text-white border-clinical-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-clinical-300'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default PiezaSelector;
