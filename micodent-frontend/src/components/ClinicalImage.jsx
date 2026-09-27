import { useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useSession } from '../services/browserSession';

export default function ClinicalImage({ record, alt, className }) {
  const { status } = useSession();
  const [attempt, setAttempt] = useState(0);
  const [asset, setAsset] = useState(null);
  const id = record?.id;
  const inline = !record?.url_archivo && /^data:image\/(png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(record?.imageBase64 || '')
    ? record.imageBase64 : null;
  useEffect(() => {
    if (status !== 'ready') return;
    const controller = new AbortController();
    let active = true, url;
    const update = value => { if (active) setAsset({ id, inline, ...value }); };
    update({ state: 'loading' });
    if (inline) update({ state: 'decoding', url: inline });
    else api.get(`/historias/radiografias/${encodeURIComponent(id)}/archivo`, {
      responseType: 'blob', signal: controller.signal, timeout: 30000,
    }).then(({ data }) => {
      if (!active) return;
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'].includes(data.type)) throw Error('UNSUPPORTED_CLINICAL_FILE');
      url = URL.createObjectURL(data);
      update({ state: data.type === 'application/pdf' ? 'attachment' : 'decoding', url });
    }).catch(() => update({ state: 'error' }));
    return () => { active = false; controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [id, inline, status, attempt]);
  if (status !== 'ready') return null;
  const current = asset?.id === id && asset?.inline === inline ? asset : null;
  const state = current?.state || 'loading';
  return <span data-clinical-state={state} className="contents">
    {state === 'loading' && <span role="status" className="p-3 text-sm text-slate-400">Cargando archivo...</span>}
    {state === 'error' && <span role="alert" className="p-3 text-center text-sm text-slate-500">
      Archivo no disponible.
      <button type="button" title="Reintentar carga" aria-label="Reintentar carga" className="ml-2 p-2" onClick={e => { e.stopPropagation(); setAttempt(v => v + 1); }}><RefreshCw size={16}/></button>
    </span>}
    {state === 'attachment' && <a href={current.url} download={`anexo-${id}.pdf`} onClick={e => e.stopPropagation()}
      className="inline-flex items-center gap-2 p-3 text-teal-500"><Download size={18}/> Descargar PDF</a>}
    {['decoding', 'ready'].includes(state) && <img src={current.url} alt={alt} className={className}
      onLoad={() => setAsset(value => value === current ? { ...value, state: 'ready' } : value)}
      onError={() => setAsset(value => value === current ? { ...value, state: 'error' } : value)}/>}
  </span>;
}
