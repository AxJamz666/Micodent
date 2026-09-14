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
    const cargar = async () => {
      try {
        setLoading(true);
        const [statsRes, ultimasRes, deudoresRes, citasHoyRes, doctoresRes] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getUltimasHistorias(),
          dashboardService.getDeudores(),
          dashboardService.getCitasHoy(),
          usuariosService.getDoctores(),
        ]);
        setStats(statsRes.data.data);
        setUltimas(ultimasRes.data.data  || []);
        setDeudores(deudoresRes.data.data || []);
        setCitasHoy(citasHoyRes.data.data || []);
        setDoctoresAgenda(doctoresRes.data.data || []);
      } catch (err) {
        toast.error('Error al cargar el dashboard.');
      } finally {
        setLoading(false);
      }
    };
    cargar();
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
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-800">
          Bienvenid{gender === 'a' ? 'a' : 'o'}, {prefix} {nombre}
        </h1>
        <p className="text-slate-500 mt-1 font-medium capitalize">
          {new Date().toLocaleDateString('es-ES', {
            weekday:'long', year:'numeric', month:'long', day:'numeric'
          })}
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
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
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-10">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <CalendarDays size={18} className="text-clinical-500"/> Citas de Hoy
          </h3>
          <button onClick={() => navigate('/agenda')} className="text-xs font-bold text-clinical-600 hover:underline">
            Ver Agenda
          </button>
        </div>
        <div className="p-5">
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
      </div>

      {/* PANELES INFERIORES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Últimas Historias */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Clock size={18} className="text-clinical-500"/> Últimas Historias Aperturadas
            </h3>
            <button onClick={() => navigate('/pacientes')}
                className="text-xs font-bold text-clinical-600 hover:underline">
                Ver todas
              </button>
          </div>
          <div className="p-5">
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
        </div>

        {/* Deudores */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500"/> Tratamientos por Cancelar
            </h3>
            <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
              {deudores.length} deudor{deudores.length !== 1 ? 'es' : ''}
            </span>
          </div>
          <div className="p-5 max-h-[300px] overflow-y-auto">
            {deudores.length === 0
              ? <p className="text-sm text-slate-400 text-center py-6">Sin deudas pendientes 🎉</p>
              : <div className="space-y-3">
                  {deudores.map((d, i) => (
                    <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                      <div>
                        <p className="font-bold text-sm text-slate-800">{d.apellidos}, {d.nombres}</p>
                        <p className="text-xs font-black text-red-500">Debe: S/ {parseFloat(d.deuda_total).toFixed(2)}</p>
                      </div>
                      <button
                  onClick={() => navigate(`/pacientes/${d.id}?tab=evolucion`)}
                  className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap">
                  Ir a Pagos
                </button>
                    </div>
                  ))}
                </div>
            }
          </div>

        </div>
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
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:-translate-y-1 transition-transform">
    <div className={`p-4 rounded-2xl ${color}`}>{icon}</div>
    <div>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
  </div>
);

const AccesoRapido = ({ onClick, icon, title, desc, secondary }) => (
  <button onClick={onClick}
    className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-clinical-500 hover:shadow-md transition-all group w-full">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-full transition-colors ${secondary ? 'bg-slate-50 text-slate-600 group-hover:bg-clinical-500 group-hover:text-white' : 'bg-clinical-50 text-clinical-600 group-hover:bg-clinical-500 group-hover:text-white'}`}>
        {icon}
      </div>
      <div className="text-left">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-slate-500 text-sm">{desc}</p>
      </div>
    </div>
    <ChevronRight className="text-slate-300 group-hover:text-clinical-500 transition-colors"/>
  </button>
);

export default Dashboard;