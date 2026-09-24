import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TrendingUp, Users, DollarSign, Wallet, Percent, Plus, X, Trash2, Edit, Package, AlertTriangle, RotateCcw, History } from 'lucide-react';
import ConfiguracionPos from '../components/ConfiguracionPos';
import toast from 'react-hot-toast';
import { activityFields, money } from '../utils/data';
import { FINANCE_EVENT } from '../utils/financeEvents';
import Produccion from './Produccion';
import { dashboardService, gastosService, laboratorioService, usuariosService, auditoriaService } from '../services/api';

const formatearFechaISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const FinanzasDashboard = () => {
  const hoy = formatearFechaISO(new Date());
  const [desde, setDesde] = useState(hoy);
  const [hasta, setHasta] = useState(hoy);
  const [doctorFiltro, setDoctorFiltro] = useState('todos');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorResumen, setErrorResumen] = useState('');

  const [vista, setVista] = useState(() => new URLSearchParams(window.location.search).get('vista') === 'produccion' ? 'produccion' : 'resumen');

  const [gastos, setGastos] = useState([]);
  const [showGastoModal, setShowGastoModal] = useState(false);
  const [editGastoId, setEditGastoId] = useState(null);
  const [formGasto, setFormGasto] = useState({ categoria: 'luz', descripcion: '', monto: '', fecha_pago: hoy, mes_consumo: '' });
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroUsuario, setFiltroUsuario] = useState('todos');

  const [vistaLab, setVistaLab] = useState('pendientes');
  const [trabajosLab, setTrabajosLab] = useState([]);
  const [pagandoLabId, setPagandoLabId] = useState(null);
  const [montoPagoLab, setMontoPagoLab] = useState('');

  const [doctoresLista, setDoctoresLista] = useState([]);
  const [showPenalidadModal, setShowPenalidadModal] = useState(false);
  const [formPenalidad, setFormPenalidad] = useState({ doctor_id: '', monto: '', motivo: '', fecha: hoy });

  const [mesGlobal, setMesGlobal] = useState('');

  const [showAuditoriaModal, setShowAuditoriaModal] = useState(false);
  const [auditoriaLogs, setAuditoriaLogs] = useState([]);
  const requests = useRef({ resumen: 0, gastos: 0, laboratorio: 0, auditoria: 0 });

  const cargar = useCallback(async () => {
    const sequence = ++requests.current.resumen;
    try {
      setLoading(true);
      const { data } = await dashboardService.getFinanciero(desde, hasta);
      if (sequence === requests.current.resumen) { setData(data.data); setErrorResumen(''); }
    } catch {
      if (sequence === requests.current.resumen) setErrorResumen('No se pudo actualizar el resumen. Los importes mostrados pueden estar desactualizados.');
    } finally {
      if (sequence === requests.current.resumen) setLoading(false);
    }
  }, [desde, hasta]);

  useEffect(() => { cargar(); }, [cargar]);

  const setRangoRapido = (dias) => {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - (dias - 1));
    setDesde(formatearFechaISO(inicio));
    setHasta(formatearFechaISO(fin));
  };

  const handleSeleccionarMes = (valor) => {
    setMesGlobal(valor);
    if (!valor) return;
    const [anio, mes] = valor.split('-').map(Number);
    const primerDia = new Date(anio, mes - 1, 1);
    const ultimoDia = new Date(anio, mes, 0);
    setDesde(formatearFechaISO(primerDia));
    setHasta(formatearFechaISO(ultimoDia));
  };

  const CATEGORIAS_GASTO = [
    { v: 'luz', l: 'Luz' },
    { v: 'agua', l: 'Agua' },
    { v: 'internet', l: 'Internet' },
    { v: 'alquiler', l: 'Alquiler' },
    { v: 'materiales', l: 'Materiales Odontológicos' },
    { v: 'sueldos', l: 'Sueldos Personal' },
    { v: 'imprevistos', l: 'Gastos Imprevistos' },
  ];
  const CATEGORIAS_CON_MES_CONSUMO = ['luz', 'agua', 'internet', 'alquiler'];

  const cargarGastos = useCallback(async () => {
    const sequence = ++requests.current.gastos;
    try {
      const { data } = await gastosService.getAll(desde, hasta);
      if (sequence === requests.current.gastos) setGastos(data.data || []);
    } catch {
      if (sequence === requests.current.gastos) toast.error('Error al cargar los gastos.');
    }
  }, [desde, hasta]);

  const cargarTrabajosLab = useCallback(async () => {
    const sequence = ++requests.current.laboratorio;
    try {
      const { data } = await laboratorioService.getTrabajos(vistaLab === 'pagados' ? 'pagado' : 'pendiente');
      if (sequence === requests.current.laboratorio) setTrabajosLab(data.data || []);
    } catch {
      if (sequence === requests.current.laboratorio) toast.error('Error al cargar los trabajos de laboratorio.');
    }
  }, [vistaLab]);

  const cargarAuditoria = useCallback(async () => {
    const sequence = ++requests.current.auditoria;
    try {
      const { data } = await auditoriaService.getFinanciera();
      if (sequence === requests.current.auditoria) setAuditoriaLogs(data.data || []);
    } catch { toast.error('Error al cargar el registro de actividad.'); }
  }, []);

  useEffect(() => {
    const refresh = event => {
      if (event?.type === 'storage' && event.key !== FINANCE_EVENT) return;
      cargar(); cargarGastos(); cargarTrabajosLab();
      if (showAuditoriaModal) cargarAuditoria();
    };
    const visibleRefresh = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener(FINANCE_EVENT, refresh);
    document.addEventListener('visibilitychange', visibleRefresh);
    const timer = setInterval(visibleRefresh, 30000);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener(FINANCE_EVENT, refresh);
      document.removeEventListener('visibilitychange', visibleRefresh);
      clearInterval(timer);
    };
  }, [cargar, cargarGastos, cargarTrabajosLab, cargarAuditoria, showAuditoriaModal]);

  useEffect(() => { cargarGastos(); }, [cargarGastos]);
  useEffect(() => { cargarTrabajosLab(); }, [cargarTrabajosLab]);
  useEffect(() => {
    usuariosService.getDoctores().then(({ data }) => setDoctoresLista(data.data || [])).catch(() => {});
  }, []);

  const usuariosEnGastos = React.useMemo(() => {
    const mapa = new Map();
    gastos.forEach(g => { if (g.registrado_por && !mapa.has(g.registrado_por)) mapa.set(g.registrado_por, g.registrado_por_nombre); });
    return Array.from(mapa, ([id, nombre]) => ({ id, nombre }));
  }, [gastos]);

  const gastosFiltrados = React.useMemo(() => {
    return gastos.filter(g =>
      (filtroEstado === 'todos' || g.estado === filtroEstado) &&
      (filtroCategoria === 'todas' || g.categoria === filtroCategoria) &&
      (filtroUsuario === 'todos' || g.registrado_por === filtroUsuario)
    );
  }, [gastos, filtroEstado, filtroCategoria, filtroUsuario]);

  const abrirNuevoGasto = () => {
    setEditGastoId(null);
    setFormGasto({ categoria: 'luz', descripcion: '', monto: '', fecha_pago: hoy, mes_consumo: '' });
    setShowGastoModal(true);
  };

  const abrirEditarGasto = (g) => {
    setEditGastoId(g.id);
    setFormGasto({ categoria: g.categoria, descripcion: g.descripcion || '', monto: g.monto, fecha_pago: String(g.fecha_pago).substring(0, 10), mes_consumo: g.mes_consumo || '' });
    setShowGastoModal(true);
  };

  const handleGuardarGasto = async (e) => {
    e.preventDefault();
    try {
      if (editGastoId) {
        await gastosService.editar(editGastoId, formGasto);
        toast.success('Gasto actualizado.');
      } else {
        await gastosService.crear(formGasto);
        toast.success('Gasto registrado.');
      }
      setShowGastoModal(false);
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al guardar el gasto.');
    }
  };

  const handleEliminarGasto = async (id) => {
    if (!window.confirm('¿Anular este gasto? No se borra: queda marcado como anulado y no se suma a los totales, pero puedes reactivarlo luego.')) return;
    try {
      await gastosService.eliminar(id);
      toast.success('Gasto anulado.');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al anular el gasto.');
    }
  };

  const handleReactivarGasto = async (id) => {
    try {
      await gastosService.reactivar(id);
      toast.success('Gasto reactivado.');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al reactivar el gasto.');
    }
  };

  const handlePagarLaboratorio = async (trabajoId) => {
    const monto = parseFloat(montoPagoLab);
    if (!monto || monto <= 0) { toast.error('Ingresa un monto válido.'); return; }
    try {
      await laboratorioService.registrarPago(trabajoId, { monto });
      toast.success('Pago a laboratorio registrado.');
      setPagandoLabId(null);
      setMontoPagoLab('');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al registrar el pago.');
    }
  };

  const handleCrearPenalidad = async (e) => {
    e.preventDefault();
    try {
      await gastosService.crearPenalidad(formPenalidad);
      toast.success('Penalidad registrada.');
      setShowPenalidadModal(false);
      setFormPenalidad({ doctor_id: '', monto: '', motivo: '', fecha: hoy });
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al registrar la penalidad.');
    }
  };

  const abrirAuditoria = async () => {
    setShowAuditoriaModal(true);
    await cargarAuditoria();
  };

  const filasFiltradas = data?.porDoctor?.filter(d => doctorFiltro === 'todos' || d.doctor_id === doctorFiltro) || [];

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-clinical-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium">Cargando reporte financiero...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in text-slate-800 pb-10 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2"><TrendingUp size={30} className="text-clinical-600"/> Dashboard Financiero</h2>
          <p className="text-slate-500 mt-1">Consolidado de producción y cobros de la clínica, por doctor.</p>
        </div>
        <button onClick={abrirAuditoria} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-200 transition-colors border border-slate-200 w-fit">
          <History size={16}/> Registro de Actividad
        </button>
      </div>

      {vista !== 'produccion' && <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row md:items-end gap-4 flex-wrap">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Desde</label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-slate-50 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hasta</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-slate-50 text-sm" />
        </div>
        <div className="flex gap-1.5 items-center flex-wrap">
          <button onClick={() => setRangoRapido(1)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors">Hoy</button>
          <input type="month" value={mesGlobal} onChange={e => handleSeleccionarMes(e.target.value)}
            title="Elegir mes completo" className="px-3 py-2 border rounded-xl outline-none focus:border-clinical-500 bg-slate-50 border-slate-200 text-xs font-bold text-slate-600" />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Doctor</label>
          <select value={doctorFiltro} onChange={e => setDoctorFiltro(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-slate-50 text-sm">
            <option value="todos">Todos los doctores</option>
            {data?.porDoctor?.map(d => <option key={d.doctor_id} value={d.doctor_id}>{d.doctor_nombre}</option>)}
          </select>
        </div>
      </div>}

      <div className="flex flex-wrap gap-2 mb-6 bg-slate-50 p-1 rounded-2xl w-fit max-w-full">
        {[{ v: 'resumen', l: 'Resumen', icon: <TrendingUp size={16}/> }, { v: 'gastos', l: 'Gastos', icon: <Wallet size={16}/> }, { v: 'laboratorio', l: 'Laboratorio', icon: <Package size={16}/> }, { v: 'produccion', l: 'Producción y comisiones por personal', icon: <Users size={16}/> }].map(op => (
          <button key={op.v} aria-pressed={vista === op.v} onClick={() => setVista(op.v)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${vista === op.v ? 'bg-white shadow-sm text-clinical-600' : 'text-slate-500 hover:text-slate-700'}`}>
            {op.icon} {op.l}
          </button>
        ))}
      </div>

      {vista === 'produccion' && <Produccion embedded />}

      {vista === 'resumen' && (
        <>
          {errorResumen && <p role="alert" className="mb-4 text-red-700">{errorResumen} <button className="underline" onClick={cargar}>Reintentar</button></p>}
          <section aria-label="Movimientos de caja" className="mb-8">
            <h3 className="text-lg font-bold mb-3">Movimientos de caja del período</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard color="bg-teal-100 text-teal-700" icon={<DollarSign size={22}/>} label="Entradas registradas" value={data?.caja ? money(data.caja.ingresos) : 'No disponible'} />
              <KpiCard color="bg-amber-100 text-amber-700" icon={<Package size={22}/>} label="Pagos a laboratorio" value={data?.caja ? money(data.caja.pagosLaboratorio) : 'No disponible'} />
              <KpiCard color="bg-red-100 text-red-700" icon={<Wallet size={22}/>} label="Gastos pagados" value={data?.caja ? money(data.caja.gastosOperativos) : 'No disponible'} />
              <KpiCard color="bg-green-100 text-green-700" icon={<TrendingUp size={22}/>} label="Flujo neto registrado" value={data?.caja ? money(data.caja.flujoNeto) : 'No disponible'} />
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap"><p className="text-xs text-slate-500">Recargos de tarjeta incluidos: {money(data?.caja?.recargosTarjeta)}. Flujo del período, sin saldo inicial ni pagos no registrados.</p><ConfiguracionPos/></div>
          </section>
          <h3 className="text-lg font-bold mb-3">Resultado de producción</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <KpiCard color="bg-purple-100 text-purple-600" icon={<Percent size={22}/>} label="Comisiones generadas" value={`S/ ${parseFloat(data?.totales?.totalComisionBruta || 0).toFixed(2)}`} />
            <KpiCard color="bg-orange-100 text-orange-600" icon={<Wallet size={22}/>} label="Costos externos aplicados" value={data?.totales?.movimientosPorConciliar ? 'Por conciliar' : `S/ ${parseFloat(data?.totales?.costosExternosAplicados || 0).toFixed(2)}`} />
            <KpiCard color={parseFloat(data?.totales?.gananciaNetaReal || 0) >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} icon={<TrendingUp size={22}/>} label="Resultado tras costos y gastos" value={data?.totales?.movimientosPorConciliar ? 'Por conciliar' : `S/ ${parseFloat(data?.totales?.gananciaNetaReal || 0).toFixed(2)}`} />
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
            <div className="p-4 border-b text-sm">Costo de tratamientos registrados en el período: <strong>{money(data?.totales?.totalFacturado)}</strong></div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="p-4">Doctor</th>
                  <th className="p-4 text-center">Pacientes</th>
                  <th className="p-4 text-right">Cobrado</th>
                  <th className="p-4 text-right">Comisión Bruta</th>
                  <th className="p-4 text-right">Penalidades</th>
                  <th className="p-4 text-right">Comisión Neta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filasFiltradas.length === 0 ? (
                  <tr><td colSpan="6" className="p-12 text-center text-slate-400 font-medium">No hay actividad registrada en este rango.</td></tr>
                ) : (
                  filasFiltradas.map(d => (
                    <tr key={d.doctor_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-800">{d.doctor_nombre}</td>
                      <td className="p-4 text-center text-slate-600">
                        <span className="inline-flex items-center gap-1"><Users size={13} className="text-slate-400"/> {d.pacientes_atendidos}</span>
                      </td>
                      <td className="p-4 text-right font-bold text-slate-800">S/ {parseFloat(d.total_cobrado).toFixed(2)}</td>
                      <td className="p-4 text-right text-purple-600">S/ {parseFloat(d.comision_bruta).toFixed(2)}</td>
                      <td className="p-4 text-right text-red-500">{parseFloat(d.penalidades) > 0 ? `- S/ ${parseFloat(d.penalidades).toFixed(2)}` : '—'}</td>
                      <td className="p-4 text-right font-bold text-clinical-600">S/ {parseFloat(d.comision_neta).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-4">
            <button onClick={() => setShowPenalidadModal(true)} className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-100 transition-colors border border-red-100">
              <AlertTriangle size={16}/> Registrar Penalidad a Doctor
            </button>
          </div>
        </>
      )}

      {vista === 'gastos' && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-xl text-slate-800">Gastos Operativos</h3>
              <p className="text-sm text-slate-500">Del {desde} al {hasta} — luz, agua, internet, alquiler, materiales, sueldos e imprevistos.</p>
            </div>
            <button onClick={abrirNuevoGasto} className="px-6 py-2.5 bg-clinical-500 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-clinical-600 shadow-md transition-all">
              <Plus size={18}/> Nuevo Gasto
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            {CATEGORIAS_GASTO.map(cat => {
              const total = gastos.filter(g => g.categoria === cat.v && g.estado === 'activo').reduce((sum, g) => sum + parseFloat(g.monto), 0);
              return (
                <div key={cat.v} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{cat.l}</p>
                  <p className="text-sm font-black text-slate-800">S/ {total.toFixed(2)}</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="px-3 py-2 border rounded-xl text-xs font-bold bg-white border-slate-200">
              <option value="todos">Todos los estados</option>
              <option value="activo">Solo activos</option>
              <option value="anulado">Solo anulados</option>
            </select>
            <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="px-3 py-2 border rounded-xl text-xs font-bold bg-white border-slate-200">
              <option value="todas">Todas las categorías</option>
              {CATEGORIAS_GASTO.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
            </select>
            <select value={filtroUsuario} onChange={e => setFiltroUsuario(e.target.value)} className="px-3 py-2 border rounded-xl text-xs font-bold bg-white border-slate-200">
              <option value="todos">Todos los usuarios</option>
              {usuariosEnGastos.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Descripción</th>
                  <th className="p-4">Mes Consumo</th>
                  <th className="p-4 text-right">Monto</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {gastosFiltrados.length === 0 ? (
                  <tr><td colSpan="6" className="p-12 text-center text-slate-400 font-medium">No hay gastos que coincidan con los filtros.</td></tr>
                ) : (
                  gastosFiltrados.map(g => (
                    <tr key={g.id} className={`transition-colors ${g.estado === 'anulado' ? 'bg-red-50/40' : 'hover:bg-slate-50/50'}`}>
                      <td className={`p-4 font-bold ${g.estado === 'anulado' ? 'line-through text-red-400' : 'text-slate-500'}`}>{String(g.fecha_pago).substring(0, 10)}</td>
                      <td className={`p-4 ${g.estado === 'anulado' ? 'line-through text-red-400' : 'text-slate-700'}`}>{CATEGORIAS_GASTO.find(c => c.v === g.categoria)?.l || g.categoria}</td>
                      <td className={`p-4 ${g.estado === 'anulado' ? 'line-through text-red-400' : 'text-slate-500'}`}>{g.descripcion || '—'}</td>
                      <td className="p-4 text-slate-500 text-xs font-mono">{g.mes_consumo || '—'}</td>
                      <td className={`p-4 text-right font-bold ${g.estado === 'anulado' ? 'line-through text-red-400' : 'text-slate-800'}`}>S/ {parseFloat(g.monto).toFixed(2)}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {g.estado === 'anulado' ? (
                            <button onClick={() => handleReactivarGasto(g.id)} className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-all" title="Reactivar"><RotateCcw size={14}/></button>
                          ) : (
                            <>
                              <button onClick={() => abrirEditarGasto(g)} className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-all" title="Editar"><Edit size={14}/></button>
                              <button onClick={() => handleEliminarGasto(g.id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all" title="Anular"><Trash2 size={14}/></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {vista === 'laboratorio' && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-xl text-slate-800">Laboratorio Externo</h3>
              <p className="text-sm text-slate-500">Trabajos de laboratorio, sin importar el mes en que se registró el tratamiento.</p>
            </div>
            <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl w-fit">
              {[{ v: 'pendientes', l: 'Pendientes' }, { v: 'pagados', l: 'Historial Pagado' }].map(op => (
                <button key={op.v} onClick={() => setVistaLab(op.v)}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors ${vistaLab === op.v ? 'bg-white shadow-sm text-clinical-600' : 'text-slate-500 hover:text-slate-700'}`}>
                  {op.l}
                </button>
              ))}
            </div>
          </div>

          {trabajosLab.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
              <Package size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium text-sm">
                {vistaLab === 'pagados' ? 'Aún no hay trabajos completamente pagados.' : 'No hay pagos pendientes a laboratorios. 🎉'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {trabajosLab.map(t => (
                <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start gap-3 flex-wrap">
                    <div>
                      <p className="font-bold text-slate-800">{t.nombre_laboratorio}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{t.apellidos}, {t.nombres} · HC {t.nro_historia}{t.descripcion ? ` · ${t.descripcion}` : ''}</p>
                      <div className="flex gap-4 mt-2 text-xs">
                        <span className="text-slate-500">Total: <b className="text-slate-700">S/ {parseFloat(t.monto_total).toFixed(2)}</b></span>
                        <span className="text-green-600">Pagado: <b>S/ {parseFloat(t.total_pagado).toFixed(2)}</b></span>
                        {vistaLab === 'pendientes' && <span className="text-red-600">Pendiente: <b>S/ {t.saldo_pendiente.toFixed(2)}</b></span>}
                      </div>
                    </div>
                    {vistaLab === 'pagados' ? (
                      <span className="px-3 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-bold border border-green-100">
                        Pagado completo{t.ultima_fecha_pago ? ` · ${String(t.ultima_fecha_pago).substring(0, 10)}` : ''}
                      </span>
                    ) : pagandoLabId === t.id ? (
                      <div className="flex items-center gap-2">
                        <input type="text" autoFocus placeholder="Monto" value={montoPagoLab}
                          onChange={e => setMontoPagoLab(e.target.value.replace(/[^0-9.]/g, ''))}
                          className="w-28 px-3 py-2 border rounded-xl outline-none focus:border-clinical-500 bg-slate-50 text-sm" />
                        <button onClick={() => handlePagarLaboratorio(t.id)} className="px-3 py-2 bg-clinical-500 text-white rounded-xl text-xs font-bold hover:bg-clinical-600">Confirmar</button>
                        <button onClick={() => { setPagandoLabId(null); setMontoPagoLab(''); }} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200">Cancelar</button>
                      </div>
                    ) : (
                      <button onClick={() => { setPagandoLabId(t.id); setMontoPagoLab(''); }} className="px-4 py-2 bg-clinical-50 text-clinical-700 rounded-xl text-xs font-bold hover:bg-clinical-100 border border-clinical-100">
                        Registrar Pago
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showGastoModal && (
        <div className="dialog-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl animate-pop-in overflow-hidden">
            <div className="bg-slate-800 p-5 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">{editGastoId ? 'Editar Gasto' : 'Nuevo Gasto'}</h3>
              <button onClick={() => setShowGastoModal(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleGuardarGasto} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Categoría</label>
                <select value={formGasto.categoria} onChange={e => setFormGasto({...formGasto, categoria: e.target.value, mes_consumo: CATEGORIAS_CON_MES_CONSUMO.includes(e.target.value) ? formGasto.mes_consumo : ''})}
                  className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-white text-sm">
                  {CATEGORIAS_GASTO.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                </select>
              </div>
              {CATEGORIAS_CON_MES_CONSUMO.includes(formGasto.categoria) && (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Mes de Consumo (opcional)</label>
                  <input type="month" value={formGasto.mes_consumo || ''} onChange={e => setFormGasto({...formGasto, mes_consumo: e.target.value})}
                    className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-white border-slate-200 text-sm" />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Descripción (opcional)</label>
                <input value={formGasto.descripcion} onChange={e => setFormGasto({...formGasto, descripcion: e.target.value})}
                  className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-white border-slate-200 text-sm" placeholder="Ej. Recibo Luz Sur - Marzo" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Monto (S/)</label>
                  <input value={formGasto.monto} onChange={e => setFormGasto({...formGasto, monto: e.target.value.replace(/[^0-9.]/g, '')})}
                    className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-white border-slate-200 text-sm" placeholder="0.00" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Fecha de Pago</label>
                  <input type="date" value={formGasto.fecha_pago} onChange={e => setFormGasto({...formGasto, fecha_pago: e.target.value})}
                    className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-white border-slate-200 text-sm" required />
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-clinical-500 text-white rounded-xl font-bold hover:bg-clinical-600 shadow-lg transition-all">
                {editGastoId ? 'Guardar Cambios' : 'Registrar Gasto'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showPenalidadModal && (
        <div className="dialog-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl animate-pop-in overflow-hidden">
            <div className="bg-red-600 p-5 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2"><AlertTriangle size={20}/> Registrar Penalidad</h3>
              <button onClick={() => setShowPenalidadModal(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleCrearPenalidad} className="p-6 space-y-5">
              <p className="text-xs text-slate-500 bg-red-50 border border-red-100 p-3 rounded-xl">Se descontará de la comisión neta del doctor en el periodo — por ejemplo, un rehacimiento de laboratorio por error clínico.</p>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Doctor</label>
                <select required value={formPenalidad.doctor_id} onChange={e => setFormPenalidad({...formPenalidad, doctor_id: e.target.value})}
                  className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-white text-sm">
                  <option value="">Selecciona un doctor...</option>
                  {doctoresLista.map(d => <option key={d.id} value={d.id}>{d.nombre_completo}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Monto (S/)</label>
                  <input required value={formPenalidad.monto} onChange={e => setFormPenalidad({...formPenalidad, monto: e.target.value.replace(/[^0-9.]/g, '')})}
                    className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-red-400 bg-white border-slate-200 text-sm" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Fecha</label>
                  <input type="date" value={formPenalidad.fecha} onChange={e => setFormPenalidad({...formPenalidad, fecha: e.target.value})}
                    className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-red-400 bg-white border-slate-200 text-sm" required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Motivo</label>
                <textarea required rows={2} value={formPenalidad.motivo} onChange={e => setFormPenalidad({...formPenalidad, motivo: e.target.value})}
                  className="w-full px-4 py-3 border rounded-2xl outline-none focus:border-red-400 resize-none bg-white border-slate-200 text-sm" placeholder="Ej. Rehacimiento de corona por error de toma de molde" />
              </div>
              <button type="submit" className="w-full py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg transition-all">Registrar Penalidad</button>
            </form>
          </div>
        </div>
      )}

      {showAuditoriaModal && (
        <div className="dialog-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl animate-pop-in overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-800 p-5 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2"><History size={20}/> Registro de Actividad Financiera</h3>
              <button onClick={() => setShowAuditoriaModal(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              {auditoriaLogs.length === 0 ? (
                <p className="text-center text-slate-500 py-10 font-medium">Aún no hay actividad registrada.</p>
              ) : (
                <div className="space-y-4 border-l-2 border-slate-300 ml-4 pl-6 relative">
                  {auditoriaLogs.map(log => (
                    <div key={log.id} className="relative bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="absolute -left-[32px] top-4 bg-clinical-500 w-4 h-4 rounded-full border-[3px] border-slate-50 shadow-sm"></div>
                      <div className="flex justify-between items-start mb-2 gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">{log.usuario_nombre}</span>
                          <span className="text-[10px] font-black uppercase px-2 py-1 rounded bg-clinical-50 text-clinical-600 border border-clinical-100">{log.modulo}</span>
                        </div>
                        <span className="text-xs text-slate-400 font-bold whitespace-nowrap">{log.fecha} · {log.hora}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700 mb-1">{log.accion}</p>
                      {log.detalle_json && (
                        <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2 mt-1 space-y-0.5">
                          {activityFields(log.detalle_json).map(([k, v]) => (
                            <p key={k}><span className="font-bold">{k}:</span> {v}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const KpiCard = ({ color, icon, label, value }) => (
  <div data-financial-kpi={label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${color}`}>{icon}</div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
    <p className="text-lg font-black text-slate-800">{value}</p>
  </div>
);

export default FinanzasDashboard;
