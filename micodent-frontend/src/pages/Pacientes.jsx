import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Search, User, X, FolderOpen, Printer, Trash2, RotateCcw, ArrowUpDown, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import { pacientesService } from '../services/api';

const ESTADO_HC_CONFIG = {
  vacia:       { label: 'Vacía',       class: 'bg-slate-100 text-slate-500' },
  en_progreso: { label: 'En progreso', class: 'bg-amber-100 text-amber-700' },
  completa:    { label: 'Completa',    class: 'bg-green-100 text-green-700' },
};

const ORDEN_OPCIONES = [
  { key: 'reciente',   label: 'Más recientes primero' },
  { key: 'alfabetico', label: 'Nombre (A-Z)' },
  { key: 'modificado', label: 'Última modificación' },
  { key: 'edad',       label: 'Edad (mayor a menor)' },
  { key: 'estado_hc',  label: 'Estado de HC (vacías primero)' },
];

const Pacientes = () => {
  const navigate = useNavigate();
  const [pacientes,   setPacientes]   = useState([]);
  const [mostrarArchivados, setMostrarArchivados] = useState(false);
  const [orden, setOrden] = useState('reciente');
  const [ordenMenuAbierto, setOrdenMenuAbierto] = useState(false);
  const ordenDropdownRef = useRef(null);
  const [loading,     setLoading]     = useState(true);
  const [searchTerm,  setSearchTerm]  = useState('');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, title: '', message: '', onConfirm: null, type: 'danger'
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ordenDropdownRef.current && !ordenDropdownRef.current.contains(event.target)) {
        setOrdenMenuAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const calculateAge = (fecha) => {
    if (!fecha) return 0;
    const today     = new Date();
    const birthDate = new Date(fecha);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const cargarPacientes = useCallback(async () => {
    try {
      setLoading(true);
      const pacRes = await pacientesService.getAll(searchTerm || undefined, mostrarArchivados ? 'true' : undefined);
      const pacientesLista = pacRes.data?.data || pacRes.data || [];
      setPacientes(Array.isArray(pacientesLista) ? pacientesLista : []);
    } catch (err) {
      toast.error('Error al cargar pacientes.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, mostrarArchivados]);

  useEffect(() => {
    const delay = setTimeout(() => cargarPacientes(), 300);
    return () => clearTimeout(delay);
  }, [cargarPacientes]);
  const handleToggleArchivados = () => {
    setMostrarArchivados(!mostrarArchivados);
  };
  
  const handleDelete = (p) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: '¿Archivar paciente?',
      message: `Se archivará a "${p.apellidos}, ${p.nombres}" junto con su historia clínica. Podrás reactivarlo luego con "Mostrar archivados".`,
      onConfirm: async () => {
        try {
          await pacientesService.eliminar(p.id);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          toast.success('Paciente archivado correctamente.');
          cargarPacientes();
        } catch (err) {
          toast.error(err.response?.data?.mensaje || 'Error al archivar paciente.');
        }
      },
    });
  };

  const handleReactivar = async (p) => {
    try {
      await pacientesService.reactivar(p.id);
      toast.success('Paciente reactivado correctamente.');
      cargarPacientes();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al reactivar paciente.');
    }
  };

  const pacientesOrdenados = useMemo(() => {
    const arr = [...pacientes];
    switch (orden) {
      case 'alfabetico':
        arr.sort((a, b) => (a.apellidos || '').localeCompare(b.apellidos || ''));
        break;
      case 'modificado':
        arr.sort((a, b) => new Date(b.ultima_actividad) - new Date(a.ultima_actividad));
        break;
      case 'edad':
        arr.sort((a, b) => calculateAge(b.fecha_nacimiento) - calculateAge(a.fecha_nacimiento));
        break;
      case 'estado_hc': {
        const pesoEstado = { vacia: 0, en_progreso: 1, completa: 2 };
        arr.sort((a, b) => (pesoEstado[a.estado_hc] ?? 0) - (pesoEstado[b.estado_hc] ?? 0));
        break;
      }
      case 'reciente':
      default:
        // Ya viene ordenado por fecha de registro desde el backend
        break;
    }
    return arr;
  }, [pacientes, orden]);




  const ordenActualLabel = ORDEN_OPCIONES.find(o => o.key === orden)?.label || '';

  return (
    <div className="animate-fade-in text-slate-800 pb-10">
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText="Sí, archivar"
        cancelText="Cancelar"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Directorio de Pacientes</h2>
          <p className="text-slate-500">Cada paciente ya tiene su historia clínica lista — entra a su ficha para trabajarla.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleToggleArchivados} className={`px-4 py-3 rounded-2xl font-bold text-sm border transition-colors whitespace-nowrap ${mostrarArchivados ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
            {mostrarArchivados ? '✓ Mostrando archivados' : 'Mostrar archivados'}
          </button>
          <button
            onClick={() => navigate('/pacientes/nuevo')}
            className="bg-clinical-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-clinical-600 transition-all shadow-lg shadow-clinical-100 w-fit"
          >
            <UserPlus size={20} /> Registrar Paciente
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 flex-1">
          <Search className="text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por Nombre, DNI, HC o Celular..."
            className="w-full outline-none bg-transparent font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="relative" ref={ordenDropdownRef}>
          <button
            onClick={() => setOrdenMenuAbierto(prev => !prev)}
            className="h-full w-full md:w-auto px-4 py-4 md:py-0 bg-white rounded-2xl shadow-sm border border-slate-100 font-bold text-sm text-slate-600 hover:border-clinical-300 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <ArrowUpDown size={16} className="text-slate-400" />
            Ordenar por: <span className="text-clinical-600">{ordenActualLabel}</span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${ordenMenuAbierto ? 'rotate-180' : ''}`} />
          </button>

          {ordenMenuAbierto && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-20 animate-fade-in">
              {ORDEN_OPCIONES.map(op => (
                <button
                  key={op.key}
                  onClick={() => { setOrden(op.key); setOrdenMenuAbierto(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors ${orden === op.key ? 'text-clinical-600 font-bold' : 'text-slate-600'}`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-clinical-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : pacientesOrdenados.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <User size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">
            {searchTerm ? 'No se encontraron pacientes.' : 'Aún no hay pacientes registrados.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="p-4">Paciente</th>
                <th className="p-4">DNI</th>
                <th className="p-4">Celular</th>
                <th className="p-4">HC</th>
                <th className="p-4">Edad</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Últ. actividad</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pacientesOrdenados.map(p => {
                const estadoCfg = ESTADO_HC_CONFIG[p.estado_hc] || ESTADO_HC_CONFIG.vacia;
                return (
                  <tr
                    key={p.id}
                    onClick={() => p.activo && navigate(`/pacientes/${p.id}`)}
                    className={`transition-colors ${p.activo ? 'hover:bg-slate-50 cursor-pointer' : 'opacity-60'}`}
                  >
                    <td className="p-4 font-bold text-slate-800">{p.apellidos}, {p.nombres}</td>
                    <td className="p-4 text-slate-500">{p.dni}</td>
                    <td className="p-4 text-slate-500">{p.celular || '—'}</td>
                    <td className="p-4 text-slate-500 font-mono text-xs">{p.nro_historia || '—'}</td>
                    <td className="p-4 text-slate-500">{calculateAge(p.fecha_nacimiento)}</td>
                    <td className="p-4">
                      {p.activo ? (
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${estadoCfg.class}`}>{estadoCfg.label}</span>
                      ) : (
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest bg-slate-100 text-slate-500">Archivado</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 text-xs">{p.ultima_actividad ? String(p.ultima_actividad).substring(0, 10) : '—'}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {p.activo ? (
                          <>
                            <button onClick={() => navigate(`/pacientes/${p.id}`)} className="p-2 text-slate-400 hover:text-clinical-600 hover:bg-clinical-50 rounded-lg transition-colors" title="Abrir ficha">
                              <FolderOpen size={16} />
                            </button>
                            <button onClick={() => navigate(`/historias?view=${p.id}`)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver reporte">
                              <Printer size={16} />
                            </button>
                            <button onClick={() => handleDelete(p)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Archivar paciente">
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => handleReactivar(p)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Reactivar paciente">
                            <RotateCcw size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}


    </div>
  );
};

export default Pacientes;