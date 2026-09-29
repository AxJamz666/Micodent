import { useState, useRef } from 'react';
import { Settings2, X } from 'lucide-react';
import { dashboardService } from '../services/api';
import toast from 'react-hot-toast';

export default function ConfiguracionPos() {
  const [open,setOpen] = useState(false), [config,setConfig] = useState(null), [rate,setRate] = useState('');
  const [busy,setBusy] = useState(false), lock = useRef(false);
  const show = async () => {
    try { const {data} = await dashboardService.getPos(); setConfig(data.data); setRate(data.data.porcentaje); setOpen(true); }
    catch { toast.error('No se pudo consultar el recargo POS.'); }
  };
  const save = async event => {
    event.preventDefault(); if (lock.current) return;
    lock.current = true; setBusy(true);
    try {
      await dashboardService.setPos({porcentaje:rate,revision:config.revision});
      toast.success('Recargo guardado para nuevos cobros.'); setOpen(false);
    } catch(error) { toast.error(error.response?.data?.mensaje || 'No se pudo guardar el recargo.'); }
    finally { lock.current = false; setBusy(false); }
  };
  return <>
    <button type="button" onClick={show} title="Configurar recargo POS" aria-label="Configurar recargo POS" className="ui-icon-button"><Settings2 size={18}/></button>
    {open && <div className="dialog-overlay fixed inset-0 bg-black/50 z-[200] p-4 flex items-center justify-center">
      <section role="dialog" aria-modal="true" aria-labelledby="pos-title" className="w-full max-w-sm overflow-hidden rounded-lg bg-white text-slate-800">
        <header className="ui-dialog-header"><h3 id="pos-title" className="text-base font-semibold">Recargo por tarjeta (POS)</h3><button type="button" className="ui-dialog-close" aria-label="Cerrar configuración POS" onClick={()=>setOpen(false)}><X size={18}/></button></header>
        <form onSubmit={save} className="space-y-4 p-5">
          <label className="ui-field-label">Porcentaje (%)<input type="number" min="0" max="100" step="0.01" required value={rate} onChange={e=>setRate(e.target.value)} className="ui-input mt-1"/></label>
          <p className="text-sm text-slate-600">Vigente para nuevos cobros. Los abonos anteriores conservan su recargo.</p>
          <button type="submit" disabled={busy} className="ui-button-primary w-full">{busy ? 'Guardando...' : 'Guardar porcentaje'}</button>
        </form>
      </section>
    </div>}
  </>;
}
