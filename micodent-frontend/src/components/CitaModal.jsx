import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search, Check, Ban, UserX, RotateCcw, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { pacientesService, citasService } from '../services/api';
import { generarSlotsHorario, formatearHora12h, ESTADO_CITA_CONFIG } from '../utils/agendaUtils';

const DURACIONES = [
  { valor: 30, label: '30 min' },
  { valor: 60, label: '1 hora' },
  { valor: 90, label: '1h 30' },
  { valor: 120, label: '2 horas' },
];

const SLOTS = generarSlotsHorario();

const CitaModal = ({ isOpen, onClose, onGuardado, doctores, citaExistente, prefill }) => {
  const navigate = useNavigate();
  const esEdicion = !!citaExistente;

  const [form, setForm] = useState({
    paciente_id: null,
    nombre_contacto: '', celular_contacto: '', motivo_consulta: '',
    doctor_id: '', fecha: '', hora_inicio: '', duracion_minutos: 30,
  });
  const [pacienteVinculado, setPacienteVinculado] = useState(null);
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (citaExistente) {
      setForm({
        paciente_id: citaExistente.paciente_id || null,
        nombre_contacto: citaExistente.nombre_contacto || '',
        celular_contacto: citaExistente.celular_contacto || '',
        motivo_consulta: citaExistente.motivo_consulta || '',
        doctor_id: citaExistente.doctor_id || '',
        fecha: citaExistente.fecha || '',
        hora_inicio: String(citaExistente.hora_inicio || '').substring(0, 5),
        duracion_minutos: citaExistente.duracion_minutos || 30,
      });
      setPacienteVinculado(
        citaExistente.paciente_id
          ? { nombre: `${citaExistente.paciente_apellidos || ''}, ${citaExistente.paciente_nombres || ''}` }
          : null
      );
    } else {
      setForm({
        paciente_id: null, nombre_contacto: '', celular_contacto: '', motivo_consulta: '',
        doctor_id: prefill?.doctor_id || '', fecha: prefill?.fecha || '',
        hora_inicio: prefill?.hora_inicio || '', duracion_minutos: 30,
      });
      setPacienteVinculado(null);
    }
    setBusquedaPaciente('');
    setResultadosBusqueda([]);
  }, [isOpen, citaExistente, prefill]);

  useEffect(() => {
    if (!busquedaPaciente || busquedaPaciente.length < 2) { setResultadosBusqueda([]); return; }
    const delay = setTimeout(async () => {
      try {
        const { data } = await pacientesService.getAll(busquedaPaciente);
        setResultadosBusqueda((data.data || []).slice(0, 6));
      } catch {
        setResultadosBusqueda([]);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [busquedaPaciente]);

  const seleccionarPaciente = (p) => {
    setForm(prev => ({ ...prev, paciente_id: p.id, nombre_contacto: `${p.apellidos}, ${p.nombres}`, celular_contacto: p.celular || '' }));
    setPacienteVinculado({ nombre: `${p.apellidos}, ${p.nombres}` });
    setBusquedaPaciente('');
    setResultadosBusqueda([]);
  };

  const desvincularPaciente = () => {
    setForm(prev => ({ ...prev, paciente_id: null }));
    setPacienteVinculado(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre_contacto || !form.celular_contacto || !form.doctor_id || !form.fecha || !form.hora_inicio) {
      toast.error('Completa todos los campos obligatorios.'); return;
    }
    try {
      setGuardando(true);
      if (esEdicion) {
        await citasService.editar(citaExistente.id, form);
        toast.success('Cita actualizada correctamente.');
      } else {
        await citasService.crear(form);
        toast.success('Cita agendada correctamente.');
      }
      await onGuardado();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al guardar la cita.');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (nuevoEstado) => {
    try {
      setCambiandoEstado(true);
      await citasService.actualizarEstado(citaExistente.id, nuevoEstado);
      toast.success('Estado actualizado.');
      await onGuardado();
      onClose();
    } catch (err) {
      toast.error('Error al actualizar el estado.');
    } finally {
      setCambiandoEstado(false);
    }
  };

  if (!isOpen) return null;
  const estadoCfg = esEdicion ? ESTADO_CITA_CONFIG[citaExistente.estado] : null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl animate-pop-in overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-clinical-600 p-5 text-white flex justify-between items-center flex-shrink-0">
          <h3 className="font-bold text-lg">{esEdicion ? 'Detalle de la Cita' : 'Nueva Cita'}</h3>
          <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20}/></button>
        </div>

        {esEdicion && (
          <div className={`px-5 py-3 flex items-center justify-between flex-shrink-0 flex-wrap gap-2 ${estadoCfg.bg}`}>
            <span className={`text-xs font-black uppercase tracking-widest ${estadoCfg.text}`}>{estadoCfg.label}</span>
            {citaExistente.estado === 'agendada' ? (
              <div className="flex gap-1.5">
                <button type="button" disabled={cambiandoEstado} onClick={() => cambiarEstado('atendida')} className="text-[11px] font-bold bg-green-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-green-700 flex items-center gap-1"><Check size={12}/> Atendida</button>
                <button type="button" disabled={cambiandoEstado} onClick={() => cambiarEstado('no_asistio')} className="text-[11px] font-bold bg-red-500 text-white px-2.5 py-1.5 rounded-lg hover:bg-red-600 flex items-center gap-1"><UserX size={12}/> No Asistió</button>
                <button type="button" disabled={cambiandoEstado} onClick={() => cambiarEstado('cancelada')} className="text-[11px] font-bold bg-slate-500 text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-600 flex items-center gap-1"><Ban size={12}/> Cancelar</button>
              </div>
            ) : (
              <button type="button" disabled={cambiandoEstado} onClick={() => cambiarEstado('agendada')} className="text-[11px] font-bold bg-white/80 text-slate-700 px-2.5 py-1.5 rounded-lg hover:bg-white flex items-center gap-1"><RotateCcw size={12}/> Revertir a Agendada</button>
            )}
          </div>
        )}

        {esEdicion && citaExistente.estado === 'atendida' && citaExistente.paciente_id && (
          <div className="px-5 py-3 bg-green-50 border-b border-green-100 flex-shrink-0">
            <button type="button" onClick={() => navigate(`/pacientes/${citaExistente.paciente_id}?tab=evolucion`)} className="w-full text-sm font-bold text-green-700 hover:text-green-800 flex items-center justify-center gap-2">
              Ir a su Historia Clínica (Evolución) <ArrowRight size={14}/>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Paciente (opcional, buscar existente)</label>
            {pacienteVinculado ? (
              <div className="flex items-center justify-between bg-clinical-50 border border-clinical-100 px-4 py-2.5 rounded-xl">
                <span className="text-sm font-bold text-clinical-700">{pacienteVinculado.nombre}</span>
                <button type="button" onClick={desvincularPaciente} className="text-xs text-slate-400 hover:text-red-500 font-bold">Quitar</button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                <input type="text" value={busquedaPaciente} onChange={e => setBusquedaPaciente(e.target.value)}
                  placeholder="Buscar por nombre o DNI..."
                  className="w-full pl-9 pr-3 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-slate-50 text-sm" />
                {resultadosBusqueda.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                    {resultadosBusqueda.map(p => (
                      <button key={p.id} type="button" onClick={() => seleccionarPaciente(p)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0">
                        <span className="font-bold text-slate-700">{p.apellidos}, {p.nombres}</span>
                        <span className="text-xs text-slate-400 ml-2">DNI {p.dni}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nombre de Contacto</label>
              <input required value={form.nombre_contacto} onChange={e => setForm(prev => ({ ...prev, nombre_contacto: e.target.value }))}
                className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-white border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Celular</label>
              <input required value={form.celular_contacto} onChange={e => setForm(prev => ({ ...prev, celular_contacto: e.target.value.replace(/\D/g, '') }))} maxLength={9}
                className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-white border-slate-200 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Motivo de Consulta</label>
            <textarea rows={2} value={form.motivo_consulta} onChange={e => setForm(prev => ({ ...prev, motivo_consulta: e.target.value }))}
              className="w-full px-4 py-3 border rounded-2xl outline-none focus:border-clinical-500 resize-none bg-white border-slate-200 text-sm" />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Doctor</label>
            <select required value={form.doctor_id} onChange={e => setForm(prev => ({ ...prev, doctor_id: e.target.value }))}
              className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-white text-sm">
              <option value="">Selecciona un doctor...</option>
              {doctores.map(d => <option key={d.id} value={d.id}>{d.nombre_completo}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Fecha</label>
              <input required type="date" value={form.fecha} onChange={e => setForm(prev => ({ ...prev, fecha: e.target.value }))}
                className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-white border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Hora de Inicio</label>
              <select required value={form.hora_inicio} onChange={e => setForm(prev => ({ ...prev, hora_inicio: e.target.value }))}
                className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-white text-sm">
                <option value="">Elige...</option>
                {SLOTS.map(s => <option key={s} value={s}>{formatearHora12h(s)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Duración</label>
            <div className="flex gap-2">
              {DURACIONES.map(d => (
                <button key={d.valor} type="button" onClick={() => setForm(prev => ({ ...prev, duracion_minutos: d.valor }))}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-colors ${form.duracion_minutos === d.valor ? 'bg-clinical-50 border-clinical-300 text-clinical-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={guardando} className="w-full py-4 bg-clinical-500 text-white rounded-xl font-bold hover:bg-clinical-600 shadow-lg transition-all disabled:opacity-50">
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Agendar Cita'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CitaModal;