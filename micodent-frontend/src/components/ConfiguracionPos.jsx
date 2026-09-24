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
    <button type="button" onClick={show} title="Configurar recargo POS" aria-label="Configurar recargo POS" className="inline-flex p-2 border rounded text-teal-700"><Settings2 size={18}/></button>
    {open && <div className="dialog-overlay fixed inset-0 bg-black/50 z-[200] p-4 flex items-center justify-center">
      <section role="dialog" aria-modal="true" aria-labelledby="pos-title" className="bg-white rounded-lg p-5 w-full max-w-sm text-slate-800">
        <header className="flex items-center justify-between mb-4"><h3 id="pos-title" className="font-bold text-lg">Recargo por tarjeta (POS)</h3><button type="button" aria-label="Cerrar configuración POS" onClick={()=>setOpen(false)}><X size={20}/></button></header>
        <form onSubmit={save} className="space-y-4">
          <label className="block text-sm">Porcentaje (%)<input type="number" min="0" max="100" step="0.01" required value={rate} onChange={e=>setRate(e.target.value)} className="mt-1 w-full p-2 border rounded"/></label>
          <p className="text-sm text-slate-600">Vigente para nuevos cobros. Los abonos anteriores conservan su recargo.</p>
          <button type="submit" disabled={busy} className="w-full p-2 rounded bg-teal-700 text-white disabled:opacity-50">{busy ? 'Guardando...' : 'Guardar porcentaje'}</button>
        </form>
      </section>
    </div>}
  </>;
}
