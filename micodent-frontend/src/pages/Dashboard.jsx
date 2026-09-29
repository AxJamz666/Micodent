import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Users, AlertTriangle, FileText,
  Clock, UserPlus, FilePlus, ChevronRight, CalendarDays
} from 'lucide-react';
import { dashboardService, usuariosService } from '../services/api';
import { formatearHora12h, ESTADO_CITA_CONFIG } from '../utils/agendaUtils';
import CitaModal from '../components/CitaModal';
import toast from 'react-hot-toast';
import { money } from '../utils/data';
import { FINANCE_EVENT } from '../utils/financeEvents';

const Dashboard = () => {
  const navigate = useNavigate();
  const nombre   = localStorage.getItem('userNombre')  || 'Usuario';
  const prefix   = localStorage.getItem('userPrefix')  || '';
  const gender   = localStorage.getItem('userGender')  || 'o';

  const [stats,    setStats]    = useState(null);
  const [ultimas,  setUltimas]  = useState([]);
  const [deudores, setDeudores] = useState([]);
  const [citasHoy, setCitasHoy] = useState([]);
  const [doctoresAgenda, setDoctoresAgenda] = useState([]);
  const [showCitaModal, setShowCitaModal] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    let active = true, sequence = 0;
    const cargar = async () => {
      const current = ++sequence;
      try {
        const [statsRes, ultimasRes, deudoresRes, citasHoyRes, doctoresRes] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getUltimasHistorias(),
          dashboardService.getDeudores(),
          dashboardService.getCitasHoy(),
          usuariosService.getDoctores(),
        ]);
        if (!active || current !== sequence) return;
        setStats(statsRes.data.data);
        setUltimas(ultimasRes.data.data  || []);
        setDeudores(deudoresRes.data.data || []);
        setCitasHoy(citasHoyRes.data.data || []);
        setDoctoresAgenda(doctoresRes.data.data || []);
      } catch {
        if (active && current === sequence) toast.error('Error al actualizar el inicio.');
      } finally {
        if (active && current === sequence) setLoading(false);
      }
    };
    cargar();
    const refresh = event => { if (event?.type !== 'storage' || event.key === FINANCE_EVENT) cargar(); };
    const visible = () => { if (document.visibilityState === 'visible') cargar(); };
    window.addEventListener(FINANCE_EVENT,refresh); window.addEventListener('storage',refresh); window.addEventListener('focus',refresh);
    document.addEventListener('visibilitychange',visible);
    const timer = setInterval(visible,30000);
    return () => { active = false; clearInterval(timer); window.removeEventListener(FINANCE_EVENT,refresh); window.removeEventListener('storage',refresh); window.removeEventListener('focus',refresh); document.removeEventListener('visibilitychange',visible); };
  }, []);

  const recargarCitasHoy = async () => {
    try {
      const { data } = await dashboardService.getCitasHoy();
      setCitasHoy(data.data || []);
    } catch {
      toast.error('Error al actualizar las citas.');
    }
  };

  const abrirCita = (cita) => {
    setCitaSeleccionada(cita);
    setShowCitaModal(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-clinical-500 border-t-transparent rounded-full animate-spin"/>
        <p className="text-slate-500 font-medium">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in text-slate-800 max-w-7xl mx-auto pb-10">

      {/* CABECERA */}
      <div className="mb-7">
        <h1 className="ui-page-title">
          Bienvenid{gender === 'a' ? 'a' : 'o'}, {prefix} {nombre}
        </h1>
        <p className="ui-page-subtitle capitalize">
          {new Date().toLocaleDateString('es-ES', {
            weekday:'long', year:'numeric', month:'long', day:'numeric'
          })}
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="mb-8 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          color="bg-green-100 text-green-600"
          icon={<TrendingUp size={28}/>}
          label="Ingresos Hoy"
          value={`S/ ${parseFloat(stats?.ingresosHoy || 0).toFixed(2)}`}
        />
        <KpiCard
          color="bg-orange-100 text-orange-600"
          icon={<Users size={28}/>}
          label="Sin Historia"
          value={stats?.sinHistoria ?? 0}
        />
        <KpiCard
          color="bg-red-100 text-red-600"
          icon={<AlertTriangle size={28}/>}
          label="Deudores"
          value={stats?.deudores ?? 0}
        />
        <KpiCard
          color="bg-blue-100 text-blue-600"
          icon={<FileText size={28}/>}
          label="Historias Activas"
          value={stats?.totalHistorias ?? 0}
        />
      </div>

      {/* ACCESOS RÁPIDOS */}
      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2">
        <AccesoRapido
          onClick={() => navigate('/pacientes')}
          icon={<UserPlus size={24}/>}
          title="Gestión de Pacientes"
          desc="Registrar nuevo paciente o buscar pacientes"
        />
        <AccesoRapido
          onClick={() => navigate('/pacientes/nuevo')}
          icon={<FilePlus size={24}/>}
          title="Nuevo Paciente"
          desc="Registrar paciente y abrir su historia clínica"
          secondary
        />
      </div>

      {/* CITAS DE HOY */}
      <section className="mb-8 border-t border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <CalendarDays size={18} className="text-clinical-500"/> Citas de Hoy
          </h3>
          <button onClick={() => navigate('/agenda')} className="text-xs font-bold text-clinical-600 hover:underline">
            Ver Agenda
          </button>
        </div>
        <div className="p-4">
          {citasHoy.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No hay citas programadas para hoy.</p>
          ) : (
            <div className="space-y-2">
              {citasHoy.map((c) => {
                const cfg = ESTADO_CITA_CONFIG[c.estado] || ESTADO_CITA_CONFIG.agendada;
                const nombreMostrar = c.paciente_nombres ? `${c.paciente_apellidos}, ${c.paciente_nombres}` : c.nombre_contacto;
                return (
                  <button key={c.id} onClick={() => abrirCita(c)} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 text-left">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-black px-2 py-1 rounded-lg ${cfg.bg} ${cfg.text}`}>{formatearHora12h(c.hora_inicio)}</span>
                      <div>
                        <p className="font-bold text-sm text-slate-800">{nombreMostrar}</p>
                        <p className="text-xs text-slate-400">{c.doctor_nombre}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* PANELES INFERIORES */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Últimas Historias */}
        <section className="border-t border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Clock size={18} className="text-clinical-500"/> Últimas Historias Aperturadas
            </h3>
            <button onClick={() => navigate('/pacientes')}
                className="text-xs font-bold text-clinical-600 hover:underline">
                Ver todas
              </button>
          </div>
          <div className="p-4">
            {ultimas.length === 0
              ? <p className="text-sm text-slate-400 text-center py-6">No hay historias registradas aún.</p>
              : <div className="space-y-3">
                  {ultimas.map((h, i) => (
                    <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                      <div>
                        <p className="font-bold text-sm text-slate-800">{h.apellidos}, {h.nombres}</p>
                        <p className="text-xs text-slate-400">{h.nro_historia} • {h.fecha_creacion}</p>
                      </div>
                      <button
                  onClick={() => navigate(`/pacientes/${h.paciente_id}`)}
                  className="text-xs font-bold text-clinical-600 bg-clinical-50 px-3 py-1.5 rounded-lg hover:bg-clinical-100 transition-colors whitespace-nowrap">
                  Abrir HC
                </button>
                    </div>
                  ))}
                </div>
            }
          </div>
        </section>

        {/* Deudores */}
        <section className="border-t border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500"/> Tratamientos por Cancelar
            </h3>
            <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
              {deudores.length} paciente{deudores.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="max-h-[520px] overflow-y-auto p-4">
            {deudores.length === 0
              ? <p className="text-sm text-slate-400 text-center py-6">Sin deudas pendientes.</p>
              : <div className="divide-y divide-slate-200">
                  {deudores.map(d => (
                    <section key={d.id} data-patient-debt={d.id} className="py-4 first:pt-0">
                      <header className="sticky top-0 bg-white z-10 py-2 flex items-start justify-between gap-3 flex-wrap mb-3">
                        <div><p className="font-bold text-sm">{d.apellidos}, {d.nombres}</p><p className="text-sm text-red-700">Pendiente: {money(d.deuda_total)}</p></div>
                        <button onClick={()=>navigate(`/pacientes/${d.id}?tab=evolucion`)} className="text-sm font-semibold text-teal-700 underline">Ir a pagos</button>
                      </header>
                      <ul className="divide-y divide-slate-100">
                        {d.tratamientos?.map(t=><li key={t.id} data-pending-treatment={t.id} className="py-3 text-sm">
                          <div className="flex justify-between gap-3"><span className="min-w-0 break-words font-medium">{t.descripcion}</span><strong className="text-red-700 whitespace-nowrap">{money(t.pendiente)}</strong></div>
                          <p className="text-xs text-slate-500 mt-1">{String(t.fecha).slice(0,10)} · Costo: {money(t.costo_total)} · A cuenta: {money(t.pagado)}</p>
                        </li>)}
                      </ul>
                    </section>
                  ))}
                </div>
            }
          </div>

        </section>
      </div>

      <CitaModal
        isOpen={showCitaModal}
        onClose={() => setShowCitaModal(false)}
        onGuardado={recargarCitasHoy}
        doctores={doctoresAgenda}
        citaExistente={citaSeleccionada}
        prefill={null}
      />
    </div>
  );
};

const KpiCard = ({ color, icon, label, value }) => (
  <div className="flex min-h-28 flex-col items-start gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${color}`}>{icon}</div>
    <div className="min-w-0">
      <p className="mb-1 text-xs font-medium text-slate-600">{label}</p>
      <p className="break-words text-xl font-semibold tabular-nums text-slate-800">{value}</p>
    </div>
  </div>
);

const AccesoRapido = ({ onClick, icon, title, desc, secondary }) => (
  <button onClick={onClick}
    className="group flex w-full items-center justify-between border-b border-slate-200 bg-white px-4 py-4 text-left transition-colors hover:bg-slate-50">
    <div className="flex items-center gap-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${secondary ? 'bg-slate-100 text-slate-600' : 'bg-clinical-50 text-clinical-600'}`}>
        {icon}
      </div>
      <div className="text-left">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <p className="text-slate-500 text-sm">{desc}</p>
      </div>
    </div>
    <ChevronRight className="text-slate-300 group-hover:text-clinical-500 transition-colors"/>
  </button>
);

export default Dashboard;
