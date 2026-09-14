import React from 'react';
import { ESTADO_CITA_CONFIG, obtenerDiasGrillaMes, formatearFechaISO, formatearHora12h } from '../utils/agendaUtils';

const AgendaMes = ({ fechaActual, citas, onDiaClick }) => {
  const dias = obtenerDiasGrillaMes(fechaActual);
  const mesActual = fechaActual.getMonth();
  const hoyISO = formatearFechaISO(new Date());

  const citasDelDia = (diaISO) => citas.filter(c => c.fecha === diaISO).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-100">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
          <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase py-3">{d}</div>
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

          return (
            <button
              key={diaISO}
              onClick={() => onDiaClick(dia)}
              className={`min-h-[110px] p-2 border-b border-r border-slate-50 text-left hover:bg-slate-50 transition-colors flex flex-col ${!esDelMes ? 'bg-slate-50/50' : ''}`}
            >
              <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${esHoy ? 'bg-clinical-500 text-white' : esDelMes ? 'text-slate-700' : 'text-slate-300'}`}>
                {dia.getDate()}
              </span>
              <div className="mt-1 space-y-0.5 overflow-hidden flex-1">
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