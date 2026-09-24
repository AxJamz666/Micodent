import { useState, useEffect } from 'react';
import { Plus, X, Lock, Printer, FileText, RefreshCw, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { historiasService } from '../services/api';
import PiezaSelector from './PiezaSelector';
import FirmaMiniBlock from './FirmaMiniBlock';
import PrintPortal from './PrintPortal';
import { printDocument } from '../utils/printDocument';

const EXTRAORALES_OPCIONES = [
  { key: 'panoramica', label: 'Panorámica' },
  { key: 'lateral', label: 'Lateral (cefalométrica)' },
  { key: 'frontal', label: 'Frontal' },
  { key: 'atm', label: 'ATM' },
  { key: 'cefalometrico_unmsn', label: 'Análisis cefalométrico UNMSN (Steiner/Mc Namara/Holdaway - USP)' },
  { key: 'carpal', label: 'Carpal' },
  { key: 'steiner_solo', label: 'Steiner sólo' },
  { key: 'jarabak', label: 'Jarabak' },
  { key: 'rickets_resumido', label: 'Rickets resumido' },
  { key: 'rickets_completo', label: 'Rickets completo' },
  { key: 'maduracion_nolla', label: 'Maduración dental según Nolla' },
  { key: 'vias_aereas_fujioka', label: 'Análisis de vías aéreas (de Fujioka)' },
  { key: 'edad_osea_fishman', label: 'Edad ósea según Fishman (11-17 años)' },
  { key: 'edad_osea_greulich', label: 'Edad ósea según Greulich (0-18 años)' },
];

const TOMOGRAFIAS_OPCIONES = [
  { key: 'tercer_molar_impactado', label: 'Localizar tercer molar impactado' },
  { key: 'canino_incisivo_impactado', label: 'Localizar canino/incisivo impactado' },
  { key: 'implantes', label: 'Para implantes (señale pieza)' },
  { key: 'endodoncia', label: 'Para endodoncia (señale pieza)' },
  { key: 'marpe_sutura_palatina', label: 'MARPE y estudio de sutura palatina' },
  { key: 'atm_bilateral', label: 'ATM bilateral' },
  { key: 'hueso_alveolar', label: 'Análisis de hueso alveolar (señale pieza)' },
  { key: 'fracturas_maxilares', label: 'Fracturas maxilares' },
  { key: 'fractura_dental', label: 'Fractura dental' },
  { key: 'tumores_maxilares', label: 'Tumores en maxilares' },
];

const MODELOS_ESTUDIO_OPCIONES = [
  { key: 'moyer', label: 'Análisis de Moyer', categoria: 'Dentición Mixta' },
  { key: 'nance', label: 'Análisis de Nance', categoria: 'Dentición Mixta' },
  { key: 'discrepancia_dental', label: 'Análisis de discrepancia dental', categoria: 'Dentición Permanente' },
  { key: 'bolton', label: 'Análisis de Bolton (masa dentaria)', categoria: 'Dentición Permanente' },
];

const initialFormState = () => ({
  tipo_solicitud: 'rx_informe',
  motivo: '',
  envio_virtual: 'ninguno',
  extraorales: [],
  tomografias: { formato_entrega: 'informe_video_dvd', opciones: [] },
  piezas_tomografia: [],
  fotografias: { solicitada: false, color_fondo: '', analisis_facial: false },
  intraorales: { oclusal_superior: false, oclusal_inferior: false, bitewing_molares: false, bitewing_premolares: false, periapicales: false },
  periapicales_piezas: [],
  modelos_estudio: [],
});

const CheckboxOpcion = ({ label, checked, onChange }) => (
  <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer py-0.5">
    <input type="checkbox" checked={checked} onChange={onChange} className="mt-0.5 rounded border-slate-300 text-clinical-600 focus:ring-clinical-500 flex-shrink-0" />
    <span>{label}</span>
  </label>
);

const calcularEdad = (fecha) => {
  if (!fecha) return '';
  const today = new Date();
  const birthDate = new Date(fecha);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const FormularioOrden = ({ form, setForm }) => {
  const toggleArray = (campo, key) => {
    setForm(prev => ({
      ...prev,
      [campo]: prev[campo].includes(key) ? prev[campo].filter(k => k !== key) : [...prev[campo], key]
    }));
  };

  const toggleTomografiaOpcion = (key) => {
    setForm(prev => ({
      ...prev,
      tomografias: {
        ...prev.tomografias,
        opciones: prev.tomografias.opciones.includes(key)
          ? prev.tomografias.opciones.filter(k => k !== key)
          : [...prev.tomografias.opciones, key]
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo de Solicitud</label>
          <div className="flex gap-2">
            {[{ v: 'rx_informe', l: 'Rx + Informe' }, { v: 'todo_virtual', l: 'Todo Virtual' }].map(op => (
              <button key={op.v} type="button" onClick={() => setForm(prev => ({ ...prev, tipo_solicitud: op.v }))}
                className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors ${form.tipo_solicitud === op.v ? 'bg-clinical-50 border-clinical-300 text-clinical-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                {op.l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Envío Virtual</label>
          <select value={form.envio_virtual} onChange={e => setForm(prev => ({ ...prev, envio_virtual: e.target.value }))}
            className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-white text-sm h-[42px]">
            <option value="ninguno">Ninguno</option>
            <option value="whatsapp">Whatsapp</option>
            <option value="correo">Correo</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Motivo de la Radiografía</label>
        <textarea rows={2} value={form.motivo} onChange={e => setForm(prev => ({ ...prev, motivo: e.target.value }))}
          className="w-full px-4 py-3 border rounded-2xl outline-none focus:border-clinical-500 resize-none bg-white border-slate-200" />
      </div>

      <div className="border border-slate-200 rounded-2xl p-5">
        <p className="font-bold text-sm text-slate-700 mb-3">Radiografías Extraorales</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          {EXTRAORALES_OPCIONES.map(op => (
            <CheckboxOpcion key={op.key} label={op.label} checked={form.extraorales.includes(op.key)} onChange={() => toggleArray('extraorales', op.key)} />
          ))}
        </div>
      </div>

      <div className="border border-slate-200 rounded-2xl p-5">
        <p className="font-bold text-sm text-slate-700 mb-3">Tomografías Volumétricas (cone beam)</p>
        <div className="flex gap-2 mb-4">
          {[{ v: 'informe_video_dvd', l: 'Informe + Video + DVD' }, { v: 'solo_dvd_usb', l: 'Solo DVD - USB' }].map(op => (
            <button key={op.v} type="button" onClick={() => setForm(prev => ({ ...prev, tomografias: { ...prev.tomografias, formato_entrega: op.v } }))}
              className={`flex-1 px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${form.tomografias.formato_entrega === op.v ? 'bg-clinical-50 border-clinical-300 text-clinical-700' : 'border-slate-200 text-slate-500'}`}>
              {op.l}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 mb-4">
          {TOMOGRAFIAS_OPCIONES.map(op => (
            <CheckboxOpcion key={op.key} label={op.label} checked={form.tomografias.opciones.includes(op.key)} onChange={() => toggleTomografiaOpcion(op.key)} />
          ))}
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Piezas señaladas (si aplica)</p>
        <PiezaSelector seleccionadas={form.piezas_tomografia} onChange={(v) => setForm(prev => ({ ...prev, piezas_tomografia: v }))} />
      </div>

      <div className="border border-slate-200 rounded-2xl p-5">
        <p className="font-bold text-sm text-slate-700 mb-3">Fotografías</p>
        <CheckboxOpcion label="Extraorales e Intraorales" checked={form.fotografias.solicitada} onChange={() => setForm(prev => ({ ...prev, fotografias: { ...prev.fotografias, solicitada: !prev.fotografias.solicitada } }))} />
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase">Color de fondo:</span>
          {['azul', 'gris', 'blanco'].map(color => (
            <label key={color} className="flex items-center gap-1.5 text-sm capitalize cursor-pointer">
              <input type="radio" checked={form.fotografias.color_fondo === color} onChange={() => setForm(prev => ({ ...prev, fotografias: { ...prev.fotografias, color_fondo: color } }))} />
              {color}
            </label>
          ))}
        </div>
        <div className="mt-3">
          <CheckboxOpcion label="Análisis Facial (perfil, sonrisa, tercios faciales)" checked={form.fotografias.analisis_facial} onChange={() => setForm(prev => ({ ...prev, fotografias: { ...prev.fotografias, analisis_facial: !prev.fotografias.analisis_facial } }))} />
        </div>
      </div>

      <div className="border border-slate-200 rounded-2xl p-5">
        <p className="font-bold text-sm text-slate-700 mb-3">Radiografías Intraorales</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Rx Oclusales</p>
            <CheckboxOpcion label="Superior" checked={form.intraorales.oclusal_superior} onChange={() => setForm(prev => ({ ...prev, intraorales: { ...prev.intraorales, oclusal_superior: !prev.intraorales.oclusal_superior } }))} />
            <CheckboxOpcion label="Inferior" checked={form.intraorales.oclusal_inferior} onChange={() => setForm(prev => ({ ...prev, intraorales: { ...prev.intraorales, oclusal_inferior: !prev.intraorales.oclusal_inferior } }))} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Rx Bitewing</p>
            <CheckboxOpcion label="Molares" checked={form.intraorales.bitewing_molares} onChange={() => setForm(prev => ({ ...prev, intraorales: { ...prev.intraorales, bitewing_molares: !prev.intraorales.bitewing_molares } }))} />
            <CheckboxOpcion label="Premolares" checked={form.intraorales.bitewing_premolares} onChange={() => setForm(prev => ({ ...prev, intraorales: { ...prev.intraorales, bitewing_premolares: !prev.intraorales.bitewing_premolares } }))} />
          </div>
        </div>
        <CheckboxOpcion label="Radiografías Periapicales (señale piezas)" checked={form.intraorales.periapicales} onChange={() => setForm(prev => ({ ...prev, intraorales: { ...prev.intraorales, periapicales: !prev.intraorales.periapicales } }))} />
        {form.intraorales.periapicales && (
          <div className="mt-3">
            <PiezaSelector seleccionadas={form.periapicales_piezas} onChange={(v) => setForm(prev => ({ ...prev, periapicales_piezas: v }))} />
          </div>
        )}
      </div>

      <div className="border border-slate-200 rounded-2xl p-5">
        <p className="font-bold text-sm text-slate-700 mb-3">Modelos de Estudio</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Dentición Mixta</p>
            {MODELOS_ESTUDIO_OPCIONES.filter(o => o.categoria === 'Dentición Mixta').map(op => (
              <CheckboxOpcion key={op.key} label={op.label} checked={form.modelos_estudio.includes(op.key)} onChange={() => toggleArray('modelos_estudio', op.key)} />
            ))}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Dentición Permanente</p>
            {MODELOS_ESTUDIO_OPCIONES.filter(o => o.categoria === 'Dentición Permanente').map(op => (
              <CheckboxOpcion key={op.key} label={op.label} checked={form.modelos_estudio.includes(op.key)} onChange={() => toggleArray('modelos_estudio', op.key)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const OrdenRadiografiaTab = ({ historiaId, ordenes, onGuardado, pacienteInfo, esDoctor }) => {
  const [centros, setCentros] = useState([]);
  const [centrosEstado, setCentrosEstado] = useState('loading');
  const [imprimiendo, setImprimiendo] = useState(false);
  const cargarCentros = () => {
    historiasService.getCentrosReferencia().then(({ data }) => {
      const rows = Array.isArray(data.data) ? data.data : [];
      setCentros(rows);
      setCentrosEstado(rows.length >= 2 && rows.every(c => c.mapa_imagen_url) ? 'ready' : 'missing');
    }).catch(() => setCentrosEstado('error'));
  };
  const imprimir = async () => {
    if (centrosEstado !== 'ready') return;
    setImprimiendo(true);
    try { await printDocument('.orden-print-area'); }
    catch (error) { toast.error(error.message); }
    finally { setImprimiendo(false); }
  };
  const [showNueva, setShowNueva] = useState(false);
  const [form, setForm] = useState(initialFormState());
  const [guardando, setGuardando] = useState(false);

  const [ordenAReemitir, setOrdenAReemitir] = useState(null);
  const [motivoReemitir, setMotivoReemitir] = useState('');
  const [reemitiendo, setReemitiendo] = useState(false);

  const [selectedOrden, setSelectedOrden] = useState(null);
  const [historialOrden, setHistorialOrden] = useState(null);

  useEffect(() => {
    // Se usan para el pie de la impresión: ambos centros de referencia salen siempre,
    // el paciente elige a cuál ir — no se elige uno al crear la orden.
    cargarCentros();
  }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      await historiasService.agregarOrdenRadiografia(historiaId, form);
      toast.success('Orden emitida y firmada correctamente.');
      await onGuardado();
      setShowNueva(false);
      setForm(initialFormState());
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al emitir la orden.');
    } finally {
      setGuardando(false);
    }
  };

  const abrirReemitir = (orden) => {
    setOrdenAReemitir(orden);
    setMotivoReemitir('');
    setForm({
      tipo_solicitud: orden.tipo_solicitud,
      motivo: orden.motivo || '',
      envio_virtual: orden.envio_virtual,
      extraorales: orden.extraorales || [],
      tomografias: orden.tomografias || { formato_entrega: 'informe_video_dvd', opciones: [] },
      piezas_tomografia: orden.piezas_tomografia || [],
      fotografias: orden.fotografias || { solicitada: false, color_fondo: '', analisis_facial: false },
      intraorales: orden.intraorales || { oclusal_superior: false, oclusal_inferior: false, bitewing_molares: false, bitewing_premolares: false, periapicales: false },
      periapicales_piezas: orden.periapicales_piezas || [],
      modelos_estudio: orden.modelos_estudio || [],
    });
  };

  const handleReemitir = async (e) => {
    e.preventDefault();
    if (!motivoReemitir) { toast.error('Indica el motivo de la corrección.'); return; }
    try {
      setReemitiendo(true);
      await historiasService.reemitirOrdenRadiografia(ordenAReemitir.id, {
        motivo: motivoReemitir,
        tipo_solicitud: form.tipo_solicitud,
        motivo_radiografia: form.motivo,
        envio_virtual: form.envio_virtual,
        extraorales: form.extraorales,
        tomografias: form.tomografias,
        piezas_tomografia: form.piezas_tomografia,
        fotografias: form.fotografias,
        intraorales: form.intraorales,
        periapicales_piezas: form.periapicales_piezas,
        modelos_estudio: form.modelos_estudio,
      });
      toast.success('Orden anterior anulada. Versión corregida emitida y firmada.');
      await onGuardado();
      setOrdenAReemitir(null);
      setForm(initialFormState());
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al reemitir la orden.');
    } finally {
      setReemitiendo(false);
    }
  };

  const construirCadena = (orden) => {
    const cadena = [orden];
    let actual = orden;
    while (actual.reemplaza_a) {
      const anterior = ordenes.find(o => o.id === actual.reemplaza_a);
      if (!anterior) break;
      cadena.unshift(anterior);
      actual = anterior;
    }
    return cadena;
  };

  const ordenesVigentes = ordenes.filter(o => !o.anulada);

  const listaSeleccionados = (orden, catalogo, campo) => (orden[campo] || []).map(k => catalogo.find(o => o.key === k)?.label || k);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h3 className="font-bold text-xl flex items-center gap-2 text-clinical-600"><FileText size={24}/> Órdenes de Radiografía</h3>
        {esDoctor && (
          <button onClick={() => { setForm(initialFormState()); setShowNueva(true); }} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-700 shadow-md transition-all">
            <Plus size={18}/> Nueva Orden
          </button>
        )}
      </div>

      {ordenesVigentes.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
          <FileText size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium text-sm">Aún no se han emitido órdenes de radiografía.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ordenesVigentes.map(orden => (
            <div key={orden.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-500">Dr(a). {orden.doctor_nombre} · {orden.firmado_en || orden.fecha}</p>
                  <p className="text-sm text-slate-800 mt-1">{orden.tipo_solicitud === 'todo_virtual' ? 'Todo Virtual' : 'Rx + Informe'}</p>
                  {orden.motivo && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{orden.motivo}</p>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {orden.reemplaza_a && (
                    <button onClick={() => setHistorialOrden(orden)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Historial de correcciones">
                      <History size={16}/>
                    </button>
                  )}
                  {esDoctor && (
                    <button onClick={() => abrirReemitir(orden)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Corregir (anula esta y emite una nueva)">
                      <RefreshCw size={16}/>
                    </button>
                  )}
                  <button onClick={() => setSelectedOrden(orden)} className="p-2 text-slate-400 hover:text-clinical-600 hover:bg-clinical-50 rounded-lg transition-colors" title="Ver / Imprimir">
                    <Printer size={16}/>
                  </button>
                  <Lock size={14} className="text-slate-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNueva && (
        <div className="dialog-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl animate-pop-in overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-800 p-5 text-white flex justify-between items-center flex-shrink-0">
              <h3 className="font-bold text-lg">Nueva Orden de Radiografía</h3>
              <button onClick={() => setShowNueva(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleCrear} className="p-6 overflow-y-auto flex-1">
              <FormularioOrden form={form} setForm={setForm} />
              <button type="submit" disabled={guardando} className="w-full mt-6 py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 shadow-lg transition-all disabled:opacity-50">
                {guardando ? 'Guardando y firmando...' : 'Guardar y Firmar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {ordenAReemitir && (
        <div className="dialog-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl animate-pop-in overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-amber-500 p-5 text-white flex justify-between items-center flex-shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-2"><RefreshCw size={18}/> Corregir Orden</h3>
              <button onClick={() => setOrdenAReemitir(null)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleReemitir} className="p-6 overflow-y-auto flex-1 space-y-5">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl">
                <p className="text-xs text-amber-800">La orden original quedará <strong>anulada</strong> (no se podrá imprimir) y se emitirá esta versión como una orden nueva y firmada.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Motivo de la corrección</label>
                <textarea required rows={2} value={motivoReemitir} onChange={e => setMotivoReemitir(e.target.value)}
                  className="w-full px-4 py-3 border rounded-2xl outline-none focus:border-amber-500 resize-none bg-white border-slate-200" />
              </div>
              <FormularioOrden form={form} setForm={setForm} />
              <button type="submit" disabled={reemitiendo} className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 shadow-lg transition-all disabled:opacity-50">
                {reemitiendo ? 'Guardando...' : 'Anular y Emitir Corregida'}
              </button>
            </form>
          </div>
        </div>
      )}

      {historialOrden && (
        <div className="dialog-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl animate-pop-in overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-800 p-5 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2"><History size={20}/> Historial de esta Orden</h3>
              <button onClick={() => setHistorialOrden(null)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              <div className="space-y-6 border-l-2 border-slate-300 ml-4 pl-6 relative">
                {construirCadena(historialOrden).map((v, i, arr) => {
                  const esActual = i === arr.length - 1;
                  return (
                    <div key={v.id} className={`relative bg-white p-4 rounded-xl border shadow-sm ${esActual ? 'border-green-200' : 'border-slate-200'}`}>
                      <div className={`absolute -left-[32px] top-4 w-4 h-4 rounded-full border-[3px] border-slate-50 shadow-sm ${esActual ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <span className="text-xs font-bold text-slate-600">Dr(a). {v.doctor_nombre} · {v.firmado_en || v.fecha}</span>
                        {esActual ? (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-green-100 text-green-700 tracking-widest flex-shrink-0">Vigente</span>
                        ) : (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-red-100 text-red-600 tracking-widest flex-shrink-0">Anulada</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700">{v.tipo_solicitud === 'todo_virtual' ? 'Todo Virtual' : 'Rx + Informe'}</p>
                      {v.motivo && <p className="text-xs text-slate-500 mt-1">{v.motivo}</p>}
                      {!esActual && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <p className="text-[11px] font-bold text-slate-500">Anulada por {v.anulada_por_nombre} · {v.anulada_en}</p>
                          <p className="text-xs text-slate-500 italic">Motivo: {v.motivo_anulacion}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedOrden && (
        <PrintPortal>
        <div className="dialog-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <style>{`
            @page { margin: 0; }
            @media print {
              body * { visibility: hidden; }
              .orden-print-area, .orden-print-area * { visibility: visible; }
              .orden-print-area { position: fixed; top: 0; left: 0; width: 100%; }
            }
          `}</style>
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl animate-pop-in overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-clinical-600 p-5 text-white flex justify-between items-center print:hidden flex-shrink-0">
              <h3 className="font-bold text-lg">Vista previa de Orden</h3>
              <button onClick={() => setSelectedOrden(null)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20}/></button>
            </div>

            <div className="orden-print-area p-8 overflow-y-auto flex-1 text-sm">
              <div className="text-center border-b-2 border-clinical-600 pb-3 mb-5">
                <p className="text-2xl font-black text-clinical-700 tracking-wide">MICODENT</p>
                <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">Solicitud de Radiografía</p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-5 text-xs">
                <p><span className="font-bold">Paciente:</span> {pacienteInfo?.apellidos}, {pacienteInfo?.nombres}</p>
                <p><span className="font-bold">Edad:</span> {calcularEdad(pacienteInfo?.fecha_nacimiento)} años</p>
                <p><span className="font-bold">DNI:</span> {pacienteInfo?.dni}</p>
                <p><span className="font-bold">Celular:</span> {pacienteInfo?.celular}</p>
                <p className="col-span-2"><span className="font-bold">Tipo de solicitud:</span> {selectedOrden.tipo_solicitud === 'todo_virtual' ? 'Todo Virtual' : 'Rx + Informe'}{selectedOrden.envio_virtual !== 'ninguno' && ` · Envío: ${selectedOrden.envio_virtual}`}</p>
                {selectedOrden.motivo && <p className="col-span-2"><span className="font-bold">Motivo:</span> {selectedOrden.motivo}</p>}
              </div>

              <div className="space-y-3 mb-5">
                {selectedOrden.extraorales?.length > 0 && (
                  <div>
                    <p className="text-xs font-black text-clinical-700 uppercase mb-1">Radiografías Extraorales</p>
                    <p className="text-xs text-slate-700">{listaSeleccionados(selectedOrden, EXTRAORALES_OPCIONES, 'extraorales').join(' · ')}</p>
                  </div>
                )}
                {selectedOrden.tomografias?.opciones?.length > 0 && (
                  <div>
                    <p className="text-xs font-black text-clinical-700 uppercase mb-1">Tomografías Volumétricas</p>
                    <p className="text-xs text-slate-700">
                      {selectedOrden.tomografias.opciones.map(k => TOMOGRAFIAS_OPCIONES.find(o => o.key === k)?.label || k).join(' · ')}
                      {' '}({selectedOrden.tomografias.formato_entrega === 'solo_dvd_usb' ? 'Solo DVD-USB' : 'Informe + Video + DVD'})
                    </p>
                    {selectedOrden.piezas_tomografia?.length > 0 && <p className="text-xs text-slate-500 italic">Piezas señaladas: {selectedOrden.piezas_tomografia.join(', ')}</p>}
                  </div>
                )}
                {selectedOrden.fotografias?.solicitada && (
                  <div>
                    <p className="text-xs font-black text-clinical-700 uppercase mb-1">Fotografías</p>
                    <p className="text-xs text-slate-700">
                      Extraorales e intraorales{selectedOrden.fotografias.color_fondo && ` · Fondo ${selectedOrden.fotografias.color_fondo}`}{selectedOrden.fotografias.analisis_facial && ' · Análisis facial'}
                    </p>
                  </div>
                )}
                {(selectedOrden.intraorales?.oclusal_superior || selectedOrden.intraorales?.oclusal_inferior || selectedOrden.intraorales?.bitewing_molares || selectedOrden.intraorales?.bitewing_premolares || selectedOrden.intraorales?.periapicales) && (
                  <div>
                    <p className="text-xs font-black text-clinical-700 uppercase mb-1">Radiografías Intraorales</p>
                    <p className="text-xs text-slate-700">
                      {[
                        selectedOrden.intraorales.oclusal_superior && 'Oclusal superior',
                        selectedOrden.intraorales.oclusal_inferior && 'Oclusal inferior',
                        selectedOrden.intraorales.bitewing_molares && 'Bitewing molares',
                        selectedOrden.intraorales.bitewing_premolares && 'Bitewing premolares',
                        selectedOrden.intraorales.periapicales && 'Periapicales',
                      ].filter(Boolean).join(' · ')}
                    </p>
                    {selectedOrden.periapicales_piezas?.length > 0 && <p className="text-xs text-slate-500 italic">Piezas señaladas: {selectedOrden.periapicales_piezas.join(', ')}</p>}
                  </div>
                )}
                {selectedOrden.modelos_estudio?.length > 0 && (
                  <div>
                    <p className="text-xs font-black text-clinical-700 uppercase mb-1">Modelos de Estudio</p>
                    <p className="text-xs text-slate-700">{listaSeleccionados(selectedOrden, MODELOS_ESTUDIO_OPCIONES, 'modelos_estudio').join(' · ')}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-center mb-5">
                <FirmaMiniBlock
                  firma={selectedOrden.doctor_firma}
                  sello={selectedOrden.doctor_sello}
                  nombre={selectedOrden.doctor_nombre}
                  subtitulo={[selectedOrden.doctor_especialidad, selectedOrden.doctor_cop && `COP ${selectedOrden.doctor_cop}`].filter(Boolean).join(' · ')}
                />
              </div>

              <div className="border-t border-slate-200 pt-4">
                <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Centros de Referencia — Radiología</p>
                {centrosEstado !== 'ready' && <div role="alert" className="mb-3 text-sm text-red-700 print:hidden">
                  {centrosEstado === 'loading' ? 'Cargando los mapas de referencia...' : 'Faltan los mapas de los dos locales o no se pudieron cargar. No se imprimirá una orden incompleta.'}
                  {centrosEstado !== 'loading' && <button type="button" onClick={() => { setCentrosEstado('loading'); cargarCentros(); }} className="underline ml-2">Reintentar</button>}
                </div>}
                <div className="grid grid-cols-2 gap-4">
                  {centros.map(centro => (
                    <div key={`info-${centro.id}`} className="rx-reference text-center text-[9px] text-slate-500 space-y-1">
                      <p className="font-bold text-slate-600">{centro.nombre} — {centro.sede}</p>
                      <p>{centro.direccion}</p>
                      {centro.celular && <p>Cel. {centro.celular}</p>}
                      {centro.mapa_imagen_url && (
                        <img src={centro.mapa_imagen_url} alt={`Mapa ${centro.sede}`} className="mx-auto max-w-full max-h-40 object-contain mt-1" />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-center text-[9px] text-slate-400 pt-2">{selectedOrden.fecha}</p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 print:hidden flex-shrink-0">
              <button disabled={imprimiendo || centrosEstado !== 'ready'} onClick={imprimir} className="w-full py-3 bg-clinical-500 text-white rounded-xl font-bold hover:bg-clinical-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                <Printer size={18}/> {imprimiendo ? 'Preparando impresión...' : 'Imprimir'}
              </button>
            </div>
          </div>
        </div>
        </PrintPortal>
      )}
    </div>
  );
};

export default OrdenRadiografiaTab;
