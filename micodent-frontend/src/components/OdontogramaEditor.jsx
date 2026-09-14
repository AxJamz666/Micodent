import React, { useState } from 'react';
import { Lock, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { historiasService } from '../services/api';
import { TRATAMIENTOS_DB } from '../utils/tratamientosDb';
import { Diente } from './Diente';

const ARCADAS = [
  { nombre: 'Maxilar Superior Permanente', piezas: [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28] },
  { nombre: 'Maxilar Inferior Permanente', piezas: [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38] },
  { nombre: 'Maxilar Superior Deciduo', piezas: [55,54,53,52,51,61,62,63,64,65] },
  { nombre: 'Maxilar Inferior Deciduo', piezas: [85,84,83,82,81,71,72,73,74,75] },
];
const arcadaDePieza = (numero) => ARCADAS.find(a => a.piezas.includes(numero))?.nombre || null;

const CampoTexto = ({ label, value, onChange, rows = 2 }) => (
  <div>
    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</label>
    <textarea rows={rows} className="w-full px-4 py-3 border rounded-2xl outline-none focus:border-clinical-500 resize-none bg-white border-slate-200" value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

// Panel reutilizable — se usa dos veces (izquierda = diagnóstico azul, derecha = procedimiento rojo)
const PanelOdontograma = ({ lado, color, label, historiaId, piezaActiva, registros, onGuardado, miUserId }) => {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [tratamientoElegidoId, setTratamientoElegidoId] = useState('');
  const [notas, setNotas] = useState('');
  const [confirmarArcada, setConfirmarArcada] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [adendaAbiertaId, setAdendaAbiertaId] = useState(null);
  const [adendaMotivo, setAdendaMotivo] = useState('');
  const [adendaContenido, setAdendaContenido] = useState('');
  const [eliminarAbiertoId, setEliminarAbiertoId] = useState(null);
  const [eliminarMotivo, setEliminarMotivo] = useState('');
  const [eliminando, setEliminando] = useState(false);

  React.useEffect(() => {
    setMostrarForm(false); setTratamientoElegidoId(''); setNotas('');
    setConfirmarArcada(null); setAdendaAbiertaId(null);
    setEliminarAbiertoId(null); setEliminarMotivo('');
  }, [piezaActiva]);

  const listaTratamientos = TRATAMIENTOS_DB.filter(t =>
    lado === 'diagnostico' ? t.categoria === 'Diagnósticos Iniciales' : t.categoria !== 'Diagnósticos Iniciales'
  );

  const headerBg = color === 'blue' ? 'bg-blue-600' : 'bg-red-600';
  const chipBg = color === 'blue' ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100';
  const btnBg = color === 'blue' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-red-100 text-red-700 hover:bg-red-200';
  const submitBg = color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700';

  if (piezaActiva === null) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden w-52 flex-shrink-0">
        <div className={`p-4 text-white ${headerBg}`}><h3 className="font-bold text-sm">{label}</h3></div>
        <div className="p-6 text-center">
          <p className="text-xs text-slate-400">Selecciona una pieza en el gráfico para ver su {label.toLowerCase()}.</p>
        </div>
      </div>
    );
  }

  const ejecutarGuardado = async (tratamiento, piezaFinal, caraFinal) => {
    try {
      setGuardando(true);
      await historiasService.agregarItemOdontograma(historiaId, {
        pieza: String(piezaFinal), cara: caraFinal,
        estado_codigo: String(tratamiento.id), estado_nombre: tratamiento.nombre,
        color, notas: notas || null,
      });
      toast.success('Registrado y firmado correctamente.');
      await onGuardado();
      setMostrarForm(false); setTratamientoElegidoId(''); setNotas(''); setConfirmarArcada(null);
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al registrar.');
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarNuevo = (e) => {
    e.preventDefault();
    const tratamiento = TRATAMIENTOS_DB.find(t => String(t.id) === String(tratamientoElegidoId));
    if (!tratamiento) { toast.error('Selecciona una opción de la lista.'); return; }

    const esClickIndividual = typeof piezaActiva === 'number';

    if (tratamiento.tipo === 'arcada' && esClickIndividual) {
      const nombreArcada = arcadaDePieza(piezaActiva);
      if (!nombreArcada) { toast.error('No se pudo identificar la arcada de esta pieza.'); return; }
      setConfirmarArcada({ tratamiento, nombreArcada });
      return;
    }

    ejecutarGuardado(tratamiento, piezaActiva, esClickIndividual ? 'Toda la pieza' : 'Toda la arcada');
  };

  const handleAgregarAdenda = async (itemId) => {
    if (!adendaMotivo || !adendaContenido) { toast.error('Completa el motivo y la corrección.'); return; }
    try {
      await historiasService.agregarAdendaOdontograma(itemId, { motivo: adendaMotivo, contenido: adendaContenido });
      toast.success('Corrección agregada.');
      await onGuardado();
      setAdendaAbiertaId(null); setAdendaMotivo(''); setAdendaContenido('');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al agregar la corrección.');
    }
  };

  const handleEliminar = async (itemId) => {
    if (!eliminarMotivo) { toast.error('Indica el motivo de la eliminación.'); return; }
    try {
      setEliminando(true);
      await historiasService.eliminarItemOdontograma(itemId, eliminarMotivo);
      toast.success('Registro eliminado.');
      await onGuardado();
      setEliminarAbiertoId(null); setEliminarMotivo('');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al eliminar.');
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden w-52 flex-shrink-0 flex flex-col max-h-[600px]">
      <div className={`p-4 text-white ${headerBg}`}>
        <h3 className="font-bold text-sm">
          {typeof piezaActiva === 'number' ? `Pieza ${piezaActiva}` : piezaActiva} — {label}
        </h3>
      </div>
      <div className="p-3 overflow-y-auto space-y-3 flex-1">
        {registros.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Sin {label.toLowerCase()} registrado.</p>
        ) : (
          registros.map(item => (
            <div key={item.id} className={`p-3 rounded-2xl border ${chipBg}`}>
              <div className="flex justify-between items-start mb-1 gap-1">
                <p className="text-[10px] font-bold text-slate-500">{item.registrado_por_nombre || '—'} · {item.fecha}</p>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {item.bloqueada && item.registrado_por === miUserId && (!item.adendas || item.adendas.length === 0) && eliminarAbiertoId !== item.id && (
                    <button onClick={() => { setEliminarAbiertoId(item.id); setEliminarMotivo(''); }} className="text-slate-400 hover:text-red-600" title="Eliminar por error de pieza">
                      <Trash2 size={13} />
                    </button>
                  )}
                  {item.bloqueada && <Lock size={13} className="text-slate-400" />}
                </div>
              </div>
              <p className="text-sm font-bold text-slate-800">{item.tratamientoNombre}</p>
              {item.notas && <p className="text-xs text-slate-600 mt-1">{item.notas}</p>}

              {eliminarAbiertoId === item.id && (
                <div className="mt-2 pt-2 border-t border-red-200 space-y-2">
                  <CampoTexto label="Motivo de la eliminación" value={eliminarMotivo} onChange={setEliminarMotivo} />
                  <div className="flex gap-2">
                    <button onClick={() => setEliminarAbiertoId(null)} className="flex-1 py-2 bg-white text-slate-600 rounded-xl font-bold text-xs border border-slate-200">Cancelar</button>
                    <button onClick={() => handleEliminar(item.id)} disabled={eliminando} className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold text-xs disabled:opacity-50">
                      {eliminando ? 'Eliminando...' : 'Confirmar Eliminación'}
                    </button>
                  </div>
                </div>
              )}

              {item.adendas && item.adendas.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200 space-y-2">
                  {item.adendas.map(ad => (
                    <div key={ad.id} className="bg-amber-50 border border-amber-100 rounded-xl p-2">
                      <p className="text-[9px] font-bold text-amber-700">{ad.usuario_nombre} · {ad.creado_en}</p>
                      <p className="text-[9px] text-slate-500 italic">Motivo: {ad.motivo}</p>
                      <p className="text-xs text-slate-700">{ad.contenido}</p>
                    </div>
                  ))}
                </div>
              )}

              {item.bloqueada && (
                adendaAbiertaId === item.id ? (
                  <div className="mt-2 pt-2 border-t border-slate-200 space-y-2">
                    <CampoTexto label="Motivo de la corrección" value={adendaMotivo} onChange={setAdendaMotivo} />
                    <CampoTexto label="Corrección" value={adendaContenido} onChange={setAdendaContenido} />
                    <div className="flex gap-2">
                      <button onClick={() => setAdendaAbiertaId(null)} className="flex-1 py-2 bg-white text-slate-600 rounded-xl font-bold text-xs border border-slate-200">Cancelar</button>
                      <button onClick={() => handleAgregarAdenda(item.id)} className="flex-[2] py-2 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-700 transition-colors">Guardar Corrección</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setAdendaAbiertaId(item.id); setAdendaMotivo(''); setAdendaContenido(''); }} className="mt-2 text-[10px] font-bold text-slate-500 hover:text-clinical-600 underline">
                    Agregar corrección
                  </button>
                )
              )}
            </div>
          ))
        )}

        {!mostrarForm ? (
          <button onClick={() => setMostrarForm(true)} className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors ${btnBg}`}>
            <Plus size={14}/> Nuevo {label.toLowerCase()}
          </button>
        ) : confirmarArcada ? (
          <div className="p-3 rounded-2xl border border-amber-200 bg-amber-50 space-y-3">
            <p className="text-xs font-bold text-amber-800">{confirmarArcada.tratamiento.nombre}</p>
            <p className="text-[10px] text-amber-700">Se aplicará a toda la arcada ({confirmarArcada.nombreArcada}, 16 piezas), no solo a esta pieza.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmarArcada(null)} className="flex-1 py-2 bg-white text-slate-600 rounded-xl font-bold text-xs border border-slate-200">Cancelar</button>
              <button disabled={guardando} onClick={() => ejecutarGuardado(confirmarArcada.tratamiento, confirmarArcada.nombreArcada, 'Toda la arcada')} className="flex-1 py-2 bg-amber-500 text-white rounded-xl font-bold text-xs disabled:opacity-50">
                {guardando ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGuardarNuevo} className="p-3 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</label>
              <select required value={tratamientoElegidoId} onChange={e => setTratamientoElegidoId(e.target.value)} className="w-full px-3 py-2 border rounded-xl outline-none focus:border-clinical-500 bg-white text-sm font-medium">
                <option value="">Selecciona de la lista...</option>
                {listaTratamientos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <CampoTexto label="Detalles (opcional)" value={notas} onChange={setNotas} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setMostrarForm(false)} className="flex-1 py-2 bg-white text-slate-600 rounded-xl font-bold text-xs border border-slate-200">Cancelar</button>
              <button type="submit" disabled={guardando} className={`flex-[2] py-2 text-white rounded-xl font-bold text-xs disabled:opacity-50 ${submitBg}`}>
                {guardando ? 'Guardando...' : 'Guardar y Firmar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const OdontogramaEditor = ({ historiaId, odontogramaVisual, tratamientosAsignados, onGuardado, miUserId }) => {
  const [piezaActiva, setPiezaActiva] = useState(null);

  const getAsignadosParaPieza = (piezaOClave) => {
    return tratamientosAsignados.filter(t =>
      String(t.pieza) === String(piezaOClave) ||
      (typeof piezaOClave === 'number' && t.cara === 'Toda la arcada' && ARCADAS.find(a => a.nombre === t.pieza)?.piezas.includes(piezaOClave))
    );
  };

  const registrosDeEstaPieza = (color) =>
    piezaActiva === null ? [] : getAsignadosParaPieza(piezaActiva).filter(t => t.color === color);

  const filaDientes = (numeros) => (
    <div className="flex gap-1">
      {numeros.map(n => (
        <Diente key={n} numero={n} datos={odontogramaVisual[n]}
          asignados={getAsignadosParaPieza(n)}
          onToothClick={setPiezaActiva} seleccionado={piezaActiva === n} />
      ))}
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest bg-red-50 text-red-700 border-2 border-red-100 text-center">
          🔴 Diagnóstico
        </div>
        <p className="text-xs text-slate-400 font-medium text-center px-2">
          Toca cualquier pieza, o el título de una arcada, para ver y registrar.
        </p>
        <div className="flex-1 w-full px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest bg-blue-50 text-blue-700 border-2 border-blue-100 text-center">
          🔵 Procedimiento
        </div>
      </div>

      <div className="flex flex-row gap-2 items-start">
        <PanelOdontograma lado="diagnostico" color="red" label="Diagnóstico" historiaId={historiaId} piezaActiva={piezaActiva} registros={registrosDeEstaPieza('red')} onGuardado={onGuardado} miUserId={miUserId} />

        <div className="flex-1 min-w-0 bg-slate-50 p-2 rounded-3xl border border-slate-200 shadow-inner overflow-x-auto">
          <div className="space-y-6 pb-2 px-1 flex flex-col items-center">
            <div className="space-y-3 w-full">
              <button onClick={() => setPiezaActiva('Maxilar Superior Permanente')} className="w-full text-center font-black text-slate-400 hover:text-clinical-600 text-[10px] uppercase tracking-[0.2em] transition-colors">
                Permanentes Superiores · toca aquí para toda la arcada
              </button>
              <div className="flex justify-center gap-2">
                <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">{filaDientes([18,17,16,15,14,13,12,11])}</div>
                <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">{filaDientes([21,22,23,24,25,26,27,28])}</div>
              </div>
            </div>

            <div className="space-y-3 w-full opacity-90">
              <p className="text-center font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Deciduos (Niños)</p>
              <div className="flex justify-center gap-2">
                <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200">{filaDientes([55,54,53,52,51])}</div>
                <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200">{filaDientes([61,62,63,64,65])}</div>
              </div>
              <div className="flex justify-center gap-2">
                <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200">{filaDientes([85,84,83,82,81])}</div>
                <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200">{filaDientes([71,72,73,74,75])}</div>
              </div>
            </div>

            <div className="space-y-3 w-full">
              <div className="flex justify-center gap-2">
                <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">{filaDientes([48,47,46,45,44,43,42,41])}</div>
                <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">{filaDientes([31,32,33,34,35,36,37,38])}</div>
              </div>
              <button onClick={() => setPiezaActiva('Maxilar Inferior Permanente')} className="w-full text-center font-black text-slate-400 hover:text-clinical-600 text-[10px] uppercase tracking-[0.2em] transition-colors">
                Permanentes Inferiores · toca aquí para toda la arcada
              </button>
            </div>
          </div>
        </div>

       <PanelOdontograma lado="procedimiento" color="blue" label="Procedimiento" historiaId={historiaId} piezaActiva={piezaActiva} registros={registrosDeEstaPieza('blue')} onGuardado={onGuardado} miUserId={miUserId} />
      </div>
    </div>
  );
};

export default OdontogramaEditor;