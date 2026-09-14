import React from 'react';

const FILAS = [
  [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28],
  [55,54,53,52,51,61,62,63,64,65],
  [85,84,83,82,81,71,72,73,74,75],
  [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38],
];

const PiezaSelector = ({ seleccionadas, onChange }) => {
  const toggle = (n) => {
    if (seleccionadas.includes(n)) onChange(seleccionadas.filter(p => p !== n));
    else onChange([...seleccionadas, n]);
  };

  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 overflow-x-auto">
      {FILAS.map((fila, i) => (
        <div key={i} className={`flex gap-1 justify-center flex-wrap ${i === 1 || i === 2 ? 'opacity-70' : ''}`}>
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