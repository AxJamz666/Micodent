import { useId, useState } from 'react';
import { Plus, X, Printer, FileSignature, RefreshCw, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { historiasService } from '../services/api';
import FirmaMiniBlock from './FirmaMiniBlock';
import PrintPortal from './PrintPortal';
import ModalDialog from './ModalDialog';
import DocumentActions from './DocumentActions';
import { printDocument } from '../utils/printDocument';

const CampoTexto = ({ label, value, onChange, rows = 3, required = true }) => {
  const id = useId();
  return <div>
    <label htmlFor={id} className="ui-field-label">{label}</label>
    <textarea id={id} required={required} rows={rows} className="ui-input resize-none" value={value} onChange={e => onChange(e.target.value)} />
  </div>;
};

const RecetarioTab = ({ historiaId, recetas, onGuardado, pacienteInfo, esDoctor }) => {
  const [showNueva, setShowNueva] = useState(false);
  const [formReceta, setFormReceta] = useState({ rp: '', indicaciones: '' });
  const [guardando, setGuardando] = useState(false);
  const [selectedReceta, setSelectedReceta] = useState(null);
  const [imprimiendo, setImprimiendo] = useState(false);
  const imprimir = async () => {
    setImprimiendo(true);
    try { await printDocument('.receta-print-area'); }
    catch (error) { toast.error(error.message); }
    finally { setImprimiendo(false); }
  };

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
          <button onClick={() => setShowNueva(true)} className="ui-button-primary">
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
                <DocumentActions hasHistory={receta.reemplaza_a} canCorrect={esDoctor}
                  onShowHistory={() => setHistorialReceta(receta)}
                  onCorrect={() => abrirReemitir(receta)}
                  onPreview={() => setSelectedReceta(receta)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {showNueva && (
        <ModalDialog aria-label="Nueva Receta" onRequestClose={() => setShowNueva(false)} closeDisabled={guardando} className="dialog-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl animate-pop-in overflow-hidden">
            <div className="ui-dialog-header">
              <h3 className="font-semibold text-base">Nueva Receta</h3>
              <button onClick={() => setShowNueva(false)} className="ui-dialog-close" aria-label="Cerrar"><X size={18}/></button>
            </div>
            <form onSubmit={handleCrearReceta} className="p-6 space-y-5">
              <CampoTexto label="Rp:" value={formReceta.rp} onChange={v => setFormReceta({...formReceta, rp: v})} rows={4} />
              <CampoTexto label="Indicaciones" value={formReceta.indicaciones} onChange={v => setFormReceta({...formReceta, indicaciones: v})} rows={3} required={false} />
              <button type="submit" disabled={guardando} className="ui-button-primary w-full">
                {guardando ? 'Guardando y firmando...' : 'Guardar y Firmar'}
              </button>
            </form>
          </div>
        </ModalDialog>
      )}

      {recetaAReemitir && (
        <ModalDialog aria-label="Corregir Receta" onRequestClose={() => setRecetaAReemitir(null)} closeDisabled={reemitiendo} className="dialog-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl animate-pop-in overflow-hidden">
            <div className="ui-dialog-header">
              <h3 className="font-semibold text-base flex items-center gap-2"><RefreshCw size={18}/> Corregir Receta</h3>
              <button onClick={() => setRecetaAReemitir(null)} className="ui-dialog-close" aria-label="Cerrar"><X size={18}/></button>
            </div>
            <form onSubmit={handleReemitir} className="p-6 space-y-5">
              <div className="ui-dialog-note">
                <p>La receta original quedará <strong>anulada</strong> (no se podrá imprimir) y se emitirá esta versión como una receta nueva y firmada.</p>
              </div>
              <CampoTexto label="Motivo de la corrección" value={formReemitir.motivo} onChange={v => setFormReemitir({...formReemitir, motivo: v})} rows={2} />
              <CampoTexto label="Rp: (corregido)" value={formReemitir.rp} onChange={v => setFormReemitir({...formReemitir, rp: v})} rows={4} />
              <CampoTexto label="Indicaciones (corregidas)" value={formReemitir.indicaciones} onChange={v => setFormReemitir({...formReemitir, indicaciones: v})} rows={3} required={false} />
              <div className="flex gap-2">
                <button type="button" onClick={() => setRecetaAReemitir(null)} className="ui-button-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={reemitiendo} className="ui-button-primary flex-[2]">
                  {reemitiendo ? 'Guardando...' : 'Anular y Emitir Corregida'}
                </button>
              </div>
            </form>
          </div>
        </ModalDialog>
      )}

      {historialReceta && (
        <ModalDialog aria-label="Historial de esta Receta" onRequestClose={() => setHistorialReceta(null)} className="dialog-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl animate-pop-in overflow-hidden flex flex-col max-h-[85vh]">
            <div className="ui-dialog-header">
              <h3 className="font-semibold text-base flex items-center gap-2"><History size={18}/> Historial de esta Receta</h3>
              <button onClick={() => setHistorialReceta(null)} className="ui-dialog-close" aria-label="Cerrar"><X size={18}/></button>
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
        </ModalDialog>
      )}

      {selectedReceta && (
        <PrintPortal>
        <div className="dialog-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
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
                  subtitulo={[selectedReceta.doctor_especialidad, selectedReceta.doctor_cop && `COP ${selectedReceta.doctor_cop}`].filter(Boolean).join(' · ')}
                />
              </div>

              <div className="border-t border-slate-200 pt-3 text-center text-[9px] text-slate-500 space-y-0.5">
                <p>Sede Jauja: Jr. Bolívar 1137 · Citas 943 070 949</p>
                <p>Sede Lima: Av. Universitaria 691 SMP - Of. 202 · Citas 992 556 314</p>
                <p className="pt-1 text-slate-400">{selectedReceta.fecha}</p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 print:hidden">
              <button disabled={imprimiendo} onClick={imprimir} className="w-full py-3 bg-clinical-500 text-white rounded-xl font-bold hover:bg-clinical-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
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

export default RecetarioTab;
