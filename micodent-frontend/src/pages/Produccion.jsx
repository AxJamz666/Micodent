import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { money } from '../utils/data';
import { FINANCE_EVENT } from '../utils/financeEvents';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
const financialMoney = value => value === null ? 'Por conciliar' : money(value);
export default function Produccion({ embedded = false }) {
  const [desde, setDesde] = useState(today), [hasta, setHasta] = useState(today);
  const [doctor, setDoctor] = useState(''), [page, setPage] = useState(1), [revision, setRevision] = useState(0);
  const [result, setResult] = useState({ key: '', data: null, error: '' });
  const requestKey = JSON.stringify([desde, hasta, doctor, page, revision]);
  const loading = result.key !== requestKey;
  const data = loading ? null : result.data, error = loading ? '' : result.error;
  const admin = localStorage.getItem('isAdmin') === 'true';
  useEffect(() => {
    const refresh = event => {
      if (event?.type === 'storage' && event.key !== FINANCE_EVENT) return;
      setRevision(n => n + 1);
    };
    const visibleRefresh = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('focus', refresh); window.addEventListener('storage', refresh); window.addEventListener(FINANCE_EVENT, refresh);
    document.addEventListener('visibilitychange', visibleRefresh);
    const timer = setInterval(visibleRefresh, 30000);
    return () => {
      window.removeEventListener('focus', refresh); window.removeEventListener('storage', refresh); window.removeEventListener(FINANCE_EVENT, refresh);
      document.removeEventListener('visibilitychange', visibleRefresh); clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    api.get('/dashboard/produccion', { params: { desde, hasta, doctor, page }, signal: controller.signal })
      .then(r => setResult({ key: requestKey, data: r.data.data, error: '' }))
      .catch(e => { if (!controller.signal.aborted) setResult({ key: requestKey, data: null, error: e.response?.data?.mensaje || 'No se pudo cargar la producción.' }); });
    return () => controller.abort();
  }, [desde, hasta, doctor, page, revision, requestKey]);
  const period = value => {
    const end = today(), date = new Date(`${end}T12:00:00Z`);
    if (value === 'week') date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    if (value === 'month') date.setUTCDate(1);
    setDesde(date.toISOString().slice(0, 10)); setHasta(end); setPage(1);
  };
  const totals = data?.totales || {};
  return <section className="space-y-5 pb-8">
    <header className="flex justify-between items-center gap-4"><h1 className={`${embedded ? 'text-xl' : 'text-2xl'} font-bold`}>{admin ? 'Producción y comisiones por personal' : 'Mi producción'}</h1>
      <button title="Actualizar" aria-label="Actualizar" className="p-2 border rounded" onClick={() => setRevision(n => n + 1)}><RefreshCw size={20}/></button></header>
    <div className="flex flex-wrap gap-3 items-end border-b pb-4">
      {admin && <label className="text-sm">Doctor<select className="block border rounded p-2 max-w-full" value={doctor} onChange={e => { setDoctor(e.target.value); setPage(1); }}>
        <option value="">Todos los doctores</option>{result.data?.doctores?.map(d => <option key={d.id} value={d.id}>{d.nombre_completo}{!d.activo ? ' (inactivo)' : ''}</option>)}</select></label>}
      <label className="text-sm">Período<select className="block border rounded p-2" defaultValue="today" onChange={e => { if (e.target.value !== 'custom') period(e.target.value); }}>
        <option value="today">Hoy</option><option value="week">Esta semana</option><option value="month">Este mes</option><option value="custom">Personalizado</option></select></label>
      <label className="text-sm">Desde<input aria-label="Desde" className="block border rounded p-2" type="date" value={desde} onChange={e => { setDesde(e.target.value); setPage(1); }}/></label>
      <label className="text-sm">Hasta<input aria-label="Hasta" className="block border rounded p-2" type="date" value={hasta} onChange={e => { setHasta(e.target.value); setPage(1); }}/></label>
    </div>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {loading && <p role="status">Cargando producción...</p>}
    {!error && <>
      <dl className="grid grid-cols-2 lg:grid-cols-5 gap-4 border-b pb-5">
        {[['Facturado en el período', totals.facturado], ['Total a cuenta', totals.cobrado], ['Comisiones', totals.comision], ...(admin ? [['Costos externos descontados', totals.costo_externo], ['Ganancia clínica', totals.margen]] : [])].map(([label, value]) => <div key={label} title={label === 'Ganancia clínica' ? 'Después de costos externos y comisiones; antes de gastos operativos.' : undefined}><dt className="text-sm text-slate-600">{label}</dt><dd className="text-xl font-semibold mt-1">{loading ? '...' : financialMoney(value)}</dd></div>)}
      </dl>
      <div className="overflow-x-auto border rounded"><table data-production-table className={`w-full text-sm whitespace-nowrap tabular-nums ${admin ? 'min-w-[1100px]' : 'min-w-[800px]'}`}>
        <thead className="bg-slate-100 whitespace-normal"><tr>{['Fecha', ...(admin ? ['Profesional'] : []), 'Paciente', 'Tratamiento', 'Costo total', 'A cuenta', ...(admin ? ['Costo externo descontado'] : []), '% aplicado', 'Comisión', ...(admin ? ['Ganancia clínica'] : [])].map(x => <th key={x} scope="col" className={`p-3 align-bottom min-w-24 max-w-36 ${['Fecha','Profesional','Paciente','Tratamiento'].includes(x) ? 'text-left' : 'text-right'}`}>{x}</th>)}</tr></thead>
        <tbody>{data?.rows?.map(row => <tr key={`${row.consulta_id}-${row.pago_id}`} className="border-t">
          <td className="p-2">{row.fecha}</td>{admin && <td className="p-2 whitespace-normal min-w-24 max-w-36">{row.doctor_nombre || 'Sin asignar'}</td>}<td className="p-2 whitespace-normal min-w-24 max-w-36">{row.paciente}</td><td className="p-2 whitespace-normal min-w-40 max-w-48">{row.descripcion}{row.regla?.startsWith('legacy_') && <span className="block text-xs text-amber-800">{row.regla === 'legacy_pendiente' ? 'Costos históricos por conciliar' : 'Comisión histórica conservada'}</span>}</td>
          <td className="p-3 text-right">{money(row.costo_total)}</td><td className="p-3 text-right">{money(row.abonado)}</td>
          {admin && <td className="p-3 text-right">{financialMoney(row.costo_externo)}</td>}
          <td className="p-3 text-right">{row.porcentaje == null ? 'Sin registro' : `${row.porcentaje}%`}</td><td className="p-3 text-right">{money(row.comision)}{admin && row.regla === 'costo_primero_v1' && <small className="block text-slate-500">Base: {money(Number(row.abonado) - Number(row.costo_externo))}</small>}</td>
          {admin && <td className="p-3 text-right">{financialMoney(row.margen)}</td>}
        </tr>)}{!data?.rows?.length && <tr><td colSpan={admin ? 10 : 7} className="p-8 text-center text-slate-500">{loading ? 'Cargando movimientos...' : 'Sin movimientos en este período.'}</td></tr>}</tbody>
      </table></div>
      <footer className="flex justify-end items-center gap-3"><button aria-label="Página anterior" title="Página anterior" disabled={page <= 1} className="p-2 border rounded disabled:opacity-40" onClick={() => setPage(p => p-1)}><ChevronLeft size={18}/></button>
        <span className="text-sm">{page} / {data?.pages || 1}</span><button aria-label="Página siguiente" title="Página siguiente" disabled={page >= (data?.pages || 1)} className="p-2 border rounded disabled:opacity-40" onClick={() => setPage(p => p+1)}><ChevronRight size={18}/></button></footer>
    </>}
  </section>;
}
