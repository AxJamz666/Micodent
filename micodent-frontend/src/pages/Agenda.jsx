import { useState, useEffect, useCallback, useRef } from 'react';
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
  const requestId = useRef(0);

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
    const current = ++requestId.current;
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
      if (current === requestId.current) setCitas(data.data || []);
    } catch {
      if (current === requestId.current) {
        setCitas([]);
        toast.error('Error al cargar las citas.');
      }
    } finally {
      if (current === requestId.current) setLoading(false);
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
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="ui-page-title flex items-center gap-2"><CalendarDays size={22} className="text-clinical-600"/> Agenda de Citas</h2>
          <p className="ui-page-subtitle capitalize">{tituloHeader()}</p>
        </div>
        <button onClick={abrirNuevaCita} className="ui-button-primary w-fit">
          <Plus size={18}/> Nueva cita
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navegar(-1)} aria-label="Período anterior" className="ui-icon-button"><ChevronLeft size={19}/></button>
          <button onClick={irAHoy} className="ui-button-secondary">Hoy</button>
          <button onClick={() => navegar(1)} aria-label="Período siguiente" className="ui-icon-button"><ChevronRight size={19}/></button>
        </div>
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {[{ v: 'dia', l: 'Día' }, { v: 'semana', l: 'Semana' }, { v: 'mes', l: 'Mes' }].map(op => (
            <button key={op.v} onClick={() => setVista(op.v)} aria-pressed={vista === op.v}
              className={`min-h-9 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${vista === op.v ? 'bg-clinical-50 text-clinical-700' : 'text-slate-600 hover:bg-slate-50'}`}>
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
