import React from 'react';
import { generarSlotsHorario, horaAMinutos, formatearHora12h, ESTADO_CITA_CONFIG } from '../utils/agendaUtils';

const ALTURA_SLOT = 56;

const AgendaDia = ({ doctores, citas, onSlotClick, onCitaClick }) => {
  const slots = generarSlotsHorario();

  const citasDeDoctor = (doctorId) => citas.filter(c => c.doctor_id === doctorId);

  const ocupaSlot = (doctorId, slotHora) => {
    return citasDeDoctor(doctorId).some(c => {
      const inicio = horaAMinutos(c.hora_inicio);
      const fin = inicio + c.duracion_minutos;
      const slotMin = horaAMinutos(slotHora);
      return slotMin >= inicio && slotMin < fin;
    });
  };

  if (doctores.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-100">
        <p className="font-medium">No hay doctores activos para mostrar en la agenda.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
      <div className="grid" style={{ gridTemplateColumns: `80px repeat(${doctores.length}, minmax(220px, 1fr))`, minWidth: `${80 + doctores.length * 220}px` }}>
        <div className="border-r border-slate-100">
          <div className="h-12 border-b border-slate-100"></div>
          {slots.map(s => (
            <div key={s} style={{ height: ALTURA_SLOT }} className="text-[10px] text-slate-400 font-bold text-right pr-2 pt-1 border-b border-slate-50">
              {s.endsWith(':00') ? formatearHora12h(s) : ''}
            </div>
          ))}
        </div>

        {doctores.map(doc => (
          <div key={doc.id} className="border-r border-slate-100 last:border-r-0">
            <div className="h-12 border-b border-slate-100 flex items-center justify-center px-2">
              <span className="text-sm font-bold text-slate-700 truncate">{doc.nombre_completo}</span>
            </div>

            <div className="relative">
              {slots.map(s => (
                <div
                  key={s}
                  onClick={() => { if (!ocupaSlot(doc.id, s)) onSlotClick(doc.id, s); }}
                  style={{ height: ALTURA_SLOT }}
                  className={`border-b border-slate-50 ${!ocupaSlot(doc.id, s) ? 'hover:bg-clinical-50/50 cursor-pointer' : ''}`}
                ></div>
              ))}

              {citasDeDoctor(doc.id).map(cita => {
                const inicioMin = horaAMinutos(cita.hora_inicio);
                const top = ((inicioMin - 8 * 60) / 30) * ALTURA_SLOT;
                const height = (cita.duracion_minutos / 30) * ALTURA_SLOT - 3;
                const cfg = ESTADO_CITA_CONFIG[cita.estado] || ESTADO_CITA_CONFIG.agendada;
                const nombreMostrar = cita.paciente_nombres ? `${cita.paciente_apellidos}, ${cita.paciente_nombres}` : cita.nombre_contacto;
                return (
                  <button
                    key={cita.id}
                    onClick={() => onCitaClick(cita)}
                    style={{ top, height, left: 4, right: 4 }}
                    className={`absolute rounded-lg border-l-4 px-2 py-1 text-left overflow-hidden shadow-sm ${cfg.bg} ${cfg.border} ${cita.estado === 'cancelada' ? 'opacity-60' : ''}`}
                  >
                    <p className={`text-[11px] font-black truncate ${cfg.text}`}>{formatearHora12h(cita.hora_inicio)}</p>
                    <p className={`text-xs font-bold truncate ${cfg.text}`}>{nombreMostrar}</p>
                    {height > 40 && cita.motivo_consulta && (
                      <p className={`text-[10px] truncate opacity-75 ${cfg.text}`}>{cita.motivo_consulta}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgendaDia;