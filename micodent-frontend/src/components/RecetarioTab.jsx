import React, { useState } from 'react';
import { Plus, X, Lock, Printer, FileSignature, RefreshCw, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { historiasService } from '../services/api';
import FirmaMiniBlock from './FirmaMiniBlock';

const CampoTexto = ({ label, value, onChange, rows = 3, required = true }) => (
  <div>
    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</label>
    <textarea required={required} rows={rows} className="w-full px-4 py-3 border rounded-2xl outline-none focus:border-clinical-500 resize-none bg-white border-slate-200" value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

const RecetarioTab = ({ historiaId, recetas, onGuardado, pacienteInfo, esDoctor }) => {
  const [showNueva, setShowNueva] = useState(false);
  const [formReceta, setFormReceta] = useState({ rp: '', indicaciones: '' });
  const [guardando, setGuardando] = useState(false);
  const [selectedReceta, setSelectedReceta] = useState(null);

  const [recetaAReemitir, setRecetaAReemitir] = useState(null);
  const [formReemitir, setFormReemitir] = useState({ motivo: '', rp: '', indicaciones: '' });
  const [reemitiendo, setReemitiendo] = useState(false);

  const [historialReceta, setHistorialReceta] = useState(null);

  const handleCrearReceta = async (e) => {
    e.preventDefault();
    if (!formReceta.rp) { toast.error('El campo Rp es obligatorio.'); return; }
    try {
      setGuardando(true);
      await historiasService.agregarReceta(historiaId, formReceta);
      toast.success('Receta emitida y firmada correctamente.');
      await onGuardado();
      setShowNueva(false);
      setFormReceta({ rp: '', indicaciones: '' });
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al emitir la receta.');
    } finally {
      setGuardando(false);
    }
  };

  const abrirReemitir = (receta) => {
    setRecetaAReemitir(receta);
    setFormReemitir({ motivo: '', rp: receta.rp, indicaciones: receta.indicaciones || '' });
  };

  const handleReemitir = async (e) => {
    e.preventDefault();
    if (!formReemitir.motivo || !formReemitir.rp) {
      toast.error('Completa el motivo y el Rp corregido.'); return;
    }
    try {
      setReemitiendo(true);
      await historiasService.reemitirReceta(recetaAReemitir.id, formReemitir);
      toast.success('Receta anterior anulada. Versión corregida emitida y firmada.');
      await onGuardado();
      setRecetaAReemitir(null);
      setFormReemitir({ motivo: '', rp: '', indicaciones: '' });
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al reemitir la receta.');
    } finally {
      setReemitiendo(false);
    }
  };

  // Arma la cadena completa (de la mas antigua a la actual) siguiendo reemplaza_a hacia atras
  const construirCadena = (receta) => {
    const cadena = [receta];
    let actual = receta;
    while (actual.reemplaza_a) {
      const anterior = recetas.find(r => r.id === actual.reemplaza_a);
      if (!anterior) break;
      cadena.unshift(anterior);
      actual = anterior;
    }
    return cadena;
  };

  const recetasVigentes = recetas.filter(r => !r.anulada);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h3 className="font-bold text-xl flex items-center gap-2 text-clinical-600"><FileSignature size={24}/> Recetario</h3>
        {esDoctor && (
          <button onClick={() => setShowNueva(true)} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-700 shadow-md transition-all">
            <Plus size={18}/> Nueva Receta
          </button>
        )}
      </div>

      {recetasVigentes.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
          <FileSignature size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium text-sm">Aún no se han emitido recetas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recetasVigentes.map(receta => (
            <div key={receta.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-500">Dr(a). {receta.doctor_nombre} · {receta.firmado_en || receta.fecha}</p>
                  <p className="text-sm text-slate-800 mt-1 line-clamp-1">{receta.rp}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {receta.reemplaza_a && (
                    <button onClick={() => setHistorialReceta(receta)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Historial de correcciones">
                      <History size={16}/>
                    </button>
                  )}
                  {esDoctor && (
                    <button onClick={() => abrirReemitir(receta)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Corregir (anula esta y emite una nueva)">
                      <RefreshCw size={16}/>
                    </button>
                  )}
                  <button onClick={() => setSelectedReceta(receta)} className="p-2 text-slate-400 hover:text-clinical-600 hover:bg-clinical-50 rounded-lg transition-colors" title="Ver / Imprimir">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl animate-pop-in overflow-hidden">
            <div className="bg-slate-800 p-5 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">Nueva Receta</h3>
              <button onClick={() => setShowNueva(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleCrearReceta} className="p-6 space-y-5">
              <CampoTexto label="Rp:" value={formReceta.rp} onChange={v => setFormReceta({...formReceta, rp: v})} rows={4} />
              <CampoTexto label="Indicaciones" value={formReceta.indicaciones} onChange={v => setFormReceta({...formReceta, indicaciones: v})} rows={3} required={false} />
              <button type="submit" disabled={guardando} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 shadow-lg transition-all disabled:opacity-50">
                {guardando ? 'Guardando y firmando...' : 'Guardar y Firmar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {recetaAReemitir && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl animate-pop-in overflow-hidden">
            <div className="bg-amber-500 p-5 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2"><RefreshCw size={18}/> Corregir Receta</h3>
              <button onClick={() => setRecetaAReemitir(null)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleReemitir} className="p-6 space-y-5">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl">
                <p className="text-xs text-amber-800">La receta original quedará <strong>anulada</strong> (no se podrá imprimir) y se emitirá esta versión como una receta nueva y firmada.</p>
              </div>
              <CampoTexto label="Motivo de la corrección" value={formReemitir.motivo} onChange={v => setFormReemitir({...formReemitir, motivo: v})} rows={2} />
              <CampoTexto label="Rp: (corregido)" value={formReemitir.rp} onChange={v => setFormReemitir({...formReemitir, rp: v})} rows={4} />
              <CampoTexto label="Indicaciones (corregidas)" value={formReemitir.indicaciones} onChange={v => setFormReemitir({...formReemitir, indicaciones: v})} rows={3} required={false} />
              <div className="flex gap-2">
                <button type="button" onClick={() => setRecetaAReemitir(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
                <button type="submit" disabled={reemitiendo} className="flex-[2] py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 shadow-lg transition-all disabled:opacity-50">
                  {reemitiendo ? 'Guardando...' : 'Anular y Emitir Corregida'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historialReceta && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl animate-pop-in overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-800 p-5 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2"><History size={20}/> Historial de esta Receta</h3>
              <button onClick={() => setHistorialReceta(null)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              <div className="space-y-6 border-l-2 border-slate-300 ml-4 pl-6 relative">
                {construirCadena(historialReceta).map((v, i, arr) => {
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
                      <p className="text-xs font-black text-slate-400 uppercase mb-1">Rp:</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap mb-2">{v.rp}</p>
                      {v.indicaciones && (
                        <>
                          <p className="text-xs font-black text-slate-400 uppercase mb-1">Indicaciones:</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap mb-2">{v.indicaciones}</p>
                        </>
                      )}
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

      {selectedReceta && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <style>{`
            @page { margin: 0; }
            @media print {
              body * { visibility: hidden; }
              .receta-print-area, .receta-print-area * { visibility: visible; }
              .receta-print-area { position: fixed; top: 0; left: 0; width: 100%; }
            }
          `}</style>
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl animate-pop-in overflow-hidden">
            <div className="bg-clinical-600 p-5 text-white flex justify-between items-center print:hidden">
              <h3 className="font-bold text-lg">Vista previa de Receta</h3>
              <button onClick={() => setSelectedReceta(null)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20}/></button>
            </div>

            <div className="receta-print-area p-8">
              <div className="text-center border-b-2 border-clinical-600 pb-3 mb-5">
                <p className="text-2xl font-black text-clinical-700 tracking-wide">MICODENT</p>
                <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">Especialidades Odontológicas</p>
              </div>

              <p className="text-sm mb-5"><span className="font-bold">Nombre:</span> {pacienteInfo?.apellidos}, {pacienteInfo?.nombres}</p>

              <div className="grid grid-cols-2 gap-6 mb-5">
                <div>
                  <p className="text-xs font-black text-slate-500 uppercase mb-2">Rp:</p>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{selectedReceta.rp}</p>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-500 uppercase mb-2">Indicaciones:</p>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{selectedReceta.indicaciones || '—'}</p>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 text-right italic mb-6">No acepte el cambio de su receta</p>

              <div className="flex justify-center mb-4">
                <FirmaMiniBlock
                  firma={selectedReceta.doctor_firma}
                  sello={selectedReceta.doctor_sello}
                  nombre={selectedReceta.doctor_nombre}
                  subtitulo={selectedReceta.doctor_especialidad ? `${selectedReceta.doctor_especialidad} · COP ${selectedReceta.doctor_cop || ''}` : ''}
                />
              </div>

              <div className="border-t border-slate-200 pt-3 text-center text-[9px] text-slate-500 space-y-0.5">
                <p>Sede Jauja: Jr. Bolívar 1137 · Citas 943 070 949</p>
                <p>Sede Lima: Av. Universitaria 691 SMP - Of. 202 · Citas 992 556 314</p>
                <p className="pt-1 text-slate-400">{selectedReceta.fecha}</p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 print:hidden">
              <button onClick={() => window.print()} className="w-full py-3 bg-clinical-500 text-white rounded-xl font-bold hover:bg-clinical-600 transition-colors flex items-center justify-center gap-2">
                <Printer size={18}/> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecetarioTab;