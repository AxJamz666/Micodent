import React from 'react';
import { ESTADO_CITA_CONFIG, obtenerDiasGrillaMes, formatearFechaISO, formatearHora12h } from '../utils/agendaUtils';

const AgendaMes = ({ fechaActual, citas, onDiaClick }) => {
  const dias = obtenerDiasGrillaMes(fechaActual);
  const mesActual = fechaActual.getMonth();
  const hoyISO = formatearFechaISO(new Date());

  const citasDelDia = (diaISO) => citas.filter(c => c.fecha === diaISO).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="grid grid-cols-7 border-b border-slate-100">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
          <div key={d} className="py-3 text-center text-xs font-semibold text-slate-600">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {dias.map(dia => {
          const diaISO = formatearFechaISO(dia);
          const esDelMes = dia.getMonth() === mesActual;
          const esHoy = diaISO === hoyISO;
          const citasDia = citasDelDia(diaISO);
          const visibles = citasDia.slice(0, 3);
          const restantes = citasDia.length - visibles.length;
          const dayTextColor = esDelMes ? 'text-slate-700' : 'text-slate-300';

          return (
            <button
              key={diaISO}
              onClick={() => onDiaClick(dia)}
              aria-label={`${dia.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })}: ${citasDia.length} citas`}
              className={`flex min-h-[72px] flex-col border-b border-r border-slate-100 p-1 text-left transition-colors hover:bg-slate-50 sm:min-h-[110px] sm:p-2 ${!esDelMes ? 'bg-slate-50/50' : ''}`}
            >
              <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${esHoy ? 'bg-clinical-500 text-white' : dayTextColor}`}>
                {dia.getDate()}
              </span>
              {citasDia.length > 0 && <span className="mt-1 text-xs font-semibold text-clinical-700 sm:hidden">{citasDia.length} citas</span>}
              <div className="mt-1 hidden flex-1 space-y-0.5 overflow-hidden sm:block">
                {visibles.map(c => {
                  const cfg = ESTADO_CITA_CONFIG[c.estado] || ESTADO_CITA_CONFIG.agendada;
                  const nombreMostrar = c.paciente_nombres ? `${c.paciente_apellidos}, ${c.paciente_nombres}` : c.nombre_contacto;
                  return (
                    <p key={c.id} className={`text-[9px] font-bold truncate px-1 py-0.5 rounded ${cfg.bg} ${cfg.text} ${c.estado === 'cancelada' ? 'line-through opacity-60' : ''}`}>
                      {formatearHora12h(c.hora_inicio)} {nombreMostrar}
                    </p>
                  );
                })}
                {restantes > 0 && (
                  <p className="text-[9px] font-bold text-clinical-600 px-1">+{restantes} más</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AgendaMes;
