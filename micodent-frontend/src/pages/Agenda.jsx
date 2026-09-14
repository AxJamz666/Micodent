import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import { citasService, usuariosService } from '../services/api';
import { formatearFechaISO, obtenerDiasDeSemana, obtenerDiasGrillaMes } from '../utils/agendaUtils';
import AgendaDia from '../components/AgendaDia';
import AgendaSemana from '../components/AgendaSemana';
import AgendaMes from '../components/AgendaMes';
import CitaModal from '../components/CitaModal';

const Agenda = () => {
  const [vista, setVista] = useState('dia');
  const [fechaActual, setFechaActual] = useState(new Date());
  const [doctores, setDoctores] = useState([]);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [prefill, setPrefill] = useState(null);

  const cargarDoctores = useCallback(async () => {
    try {
      const { data } = await usuariosService.getDoctores();
      setDoctores(data.data || []);
    } catch {
      toast.error('Error al cargar la lista de doctores.');
    }
  }, []);

  const cargarCitas = useCallback(async () => {
    try {
      setLoading(true);
      let desde, hasta;
      if (vista === 'dia') {
        desde = hasta = formatearFechaISO(fechaActual);
      } else if (vista === 'semana') {
        const dias = obtenerDiasDeSemana(fechaActual);
        desde = formatearFechaISO(dias[0]);
        hasta = formatearFechaISO(dias[6]);
      } else {
        const dias = obtenerDiasGrillaMes(fechaActual);
        desde = formatearFechaISO(dias[0]);
        hasta = formatearFechaISO(dias[dias.length - 1]);
      }
      const { data } = await citasService.getAll(desde, hasta);
      setCitas(data.data || []);
    } catch {
      toast.error('Error al cargar las citas.');
    } finally {
      setLoading(false);
    }
  }, [fechaActual, vista]);

  useEffect(() => { cargarDoctores(); }, [cargarDoctores]);
  useEffect(() => { cargarCitas(); }, [cargarCitas]);

  const navegar = (delta) => {
    setFechaActual(prev => {
      const nueva = new Date(prev);
      if (vista === 'dia') nueva.setDate(nueva.getDate() + delta);
      else if (vista === 'semana') nueva.setDate(nueva.getDate() + delta * 7);
      else nueva.setMonth(nueva.getMonth() + delta);
      return nueva;
    });
  };

  const irAHoy = () => setFechaActual(new Date());

  const saltarADia = (fecha) => {
    setFechaActual(fecha);
    setVista('dia');
  };

  const abrirNuevaCita = () => {
    setCitaSeleccionada(null);
    setPrefill({ fecha: formatearFechaISO(fechaActual) });
    setShowModal(true);
  };

  const handleSlotClick = (doctorId, hora) => {
    setCitaSeleccionada(null);
    setPrefill({ doctor_id: doctorId, hora_inicio: hora, fecha: formatearFechaISO(fechaActual) });
    setShowModal(true);
  };

  const handleCitaClick = (cita) => {
    setCitaSeleccionada(cita);
    setPrefill(null);
    setShowModal(true);
  };

  const tituloHeader = () => {
    if (vista === 'dia') {
      return fechaActual.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    if (vista === 'semana') {
      const dias = obtenerDiasDeSemana(fechaActual);
      const inicio = dias[0];
      const fin = dias[6];
      const mismoMes = inicio.getMonth() === fin.getMonth();
      return `${inicio.toLocaleDateString('es-PE', mismoMes ? { day: 'numeric' } : { day: 'numeric', month: 'short' })} – ${fin.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return fechaActual.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="animate-fade-in text-slate-800 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2"><CalendarDays size={30} className="text-clinical-600"/> Agenda de Citas</h2>
          <p className="text-slate-500 mt-1 font-medium capitalize">{tituloHeader()}</p>
        </div>
        <button onClick={abrirNuevaCita} className="bg-clinical-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-clinical-600 transition-all shadow-lg shadow-clinical-100 w-fit">
          <Plus size={20}/> Nueva Cita
        </button>
      </div>

      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navegar(-1)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500"><ChevronLeft size={20}/></button>
          <button onClick={irAHoy} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-colors">Hoy</button>
          <button onClick={() => navegar(1)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500"><ChevronRight size={20}/></button>
        </div>
        <div className="flex gap-1 bg-slate-50 p-1 rounded-xl">
          {[{ v: 'dia', l: 'Día' }, { v: 'semana', l: 'Semana' }, { v: 'mes', l: 'Mes' }].map(op => (
            <button key={op.v} onClick={() => setVista(op.v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${vista === op.v ? 'bg-white shadow-sm text-clinical-600' : 'text-slate-400 hover:text-slate-600'}`}>
              {op.l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-clinical-500 border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : vista === 'dia' ? (
        <AgendaDia doctores={doctores} citas={citas} onSlotClick={handleSlotClick} onCitaClick={handleCitaClick} />
      ) : vista === 'semana' ? (
        <AgendaSemana fechaActual={fechaActual} citas={citas} onDiaClick={saltarADia} onCitaClick={handleCitaClick} />
      ) : (
        <AgendaMes fechaActual={fechaActual} citas={citas} onDiaClick={saltarADia} />
      )}

      <CitaModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onGuardado={cargarCitas}
        doctores={doctores}
        citaExistente={citaSeleccionada}
        prefill={prefill}
      />
    </div>
  );
};

export default Agenda;