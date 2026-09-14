import React from 'react';
import { generarSlotsHorario, horaAMinutos, formatearHora12h, ESTADO_CITA_CONFIG, obtenerDiasDeSemana, formatearFechaISO, asignarCarriles } from '../utils/agendaUtils';

const ALTURA_SLOT = 40;

const AgendaSemana = ({ fechaActual, citas, onDiaClick, onCitaClick }) => {
  const slots = generarSlotsHorario();
  const dias = obtenerDiasDeSemana(fechaActual);
  const hoyISO = formatearFechaISO(new Date());

  const citasDelDia = (diaISO) => citas.filter(c => c.fecha === diaISO);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
      <div className="flex" style={{ minWidth: '900px' }}>
        <div className="w-16 flex-shrink-0 border-r border-slate-100">
          <div className="h-16 border-b border-slate-100"></div>
          {slots.map(s => (
            <div key={s} style={{ height: ALTURA_SLOT }} className="text-[9px] text-slate-400 font-bold text-right pr-2 pt-0.5 border-b border-slate-50">
              {s.endsWith(':00') ? formatearHora12h(s) : ''}
            </div>
          ))}
        </div>

        {dias.map(dia => {
          const diaISO = formatearFechaISO(dia);
          const esHoy = diaISO === hoyISO;
          const citasConCarril = asignarCarriles(citasDelDia(diaISO));

          return (
            <div key={diaISO} className="flex-1 min-w-[120px] border-r border-slate-100 last:border-r-0">
              <button onClick={() => onDiaClick(dia)} className={`w-full h-16 border-b border-slate-100 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors ${esHoy ? 'bg-clinical-50' : ''}`}>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{dia.toLocaleDateString('es-PE', { weekday: 'short' })}</span>
                <span className={`text-lg font-black ${esHoy ? 'text-clinical-600' : 'text-slate-700'}`}>{dia.getDate()}</span>
              </button>

              <div className="relative">
                {slots.map(s => (
                  <div key={s} onClick={() => onDiaClick(dia)} style={{ height: ALTURA_SLOT }} className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer"></div>
                ))}

                {citasConCarril.map(cita => {
                  const inicioMin = horaAMinutos(cita.hora_inicio);
                  const top = ((inicioMin - 8 * 60) / 30) * ALTURA_SLOT;
                  const height = Math.max((cita.duracion_minutos / 30) * ALTURA_SLOT - 2, 16);
                  const anchoPct = 100 / cita.totalCarriles;
                  const leftPct = anchoPct * cita.carril;
                  const cfg = ESTADO_CITA_CONFIG[cita.estado] || ESTADO_CITA_CONFIG.agendada;
                  const nombreMostrar = cita.paciente_nombres ? `${cita.paciente_apellidos}, ${cita.paciente_nombres}` : cita.nombre_contacto;
                  return (
                    <button
                      key={cita.id}
                      onClick={(e) => { e.stopPropagation(); onCitaClick(cita); }}
                      style={{ top, height, left: `${leftPct}%`, width: `${anchoPct}%` }}
                      className={`absolute rounded border-l-2 px-1 py-0.5 text-left overflow-hidden ${cfg.bg} ${cfg.border} ${cita.estado === 'cancelada' ? 'opacity-50' : ''}`}
                    >
                      <p className={`text-[9px] font-black truncate leading-tight ${cfg.text}`}>{nombreMostrar}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgendaSemana;