import React from 'react';

export const Diente = ({ numero, datos, asignados, onToothClick, seleccionado }) => {
  const tieneDiagnostico = (asignados || []).some(a => a.color === 'red');
  const tieneProcedimiento = (asignados || []).some(a => a.color === 'blue');

  return (
    <div className="flex flex-col items-center relative">
      <span className="text-[11px] font-black text-slate-700 mb-1.5 print:text-[8px] print:mb-0.5">{numero}</span>

      <div
        onClick={onToothClick ? () => onToothClick(numero) : undefined}
        className={`relative w-9 h-9 print:w-[28px] print:h-[28px] rounded-lg print:rounded border-2 print:border border-slate-200 transition-all ${seleccionado ? 'ring-2 ring-clinical-500 ring-offset-1' : ''} ${onToothClick ? 'cursor-pointer hover:ring-2 hover:ring-clinical-300' : ''}`}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm print:drop-shadow-none pointer-events-none" strokeWidth="3" strokeLinejoin="round">
          <path d="M 5 5 L 95 5 L 75 25 L 25 25 Z" className="fill-white stroke-slate-300" />
          <path d="M 95 5 L 95 95 L 75 75 L 75 25 Z" className="fill-white stroke-slate-300" />
          <path d="M 5 95 L 95 95 L 75 75 L 25 75 Z" className="fill-white stroke-slate-300" />
          <path d="M 5 5 L 25 25 L 25 75 L 5 95 Z" className="fill-white stroke-slate-300" />
          <rect x="25" y="25" width="50" height="50" rx="6" className="fill-white stroke-slate-300" />
        </svg>
      </div>

      <div className="flex gap-1 mt-1.5 h-2 print:h-1.5 print:mt-1">
        {tieneDiagnostico && <span className="w-2 h-2 print:w-1.5 print:h-1.5 rounded-full bg-red-500" title="Tiene diagnóstico"></span>}
        {tieneProcedimiento && <span className="w-2 h-2 print:w-1.5 print:h-1.5 rounded-full bg-blue-500" title="Tiene procedimiento"></span>}
      </div>
    </div>
  );
};