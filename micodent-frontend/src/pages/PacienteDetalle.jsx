import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User, ArrowLeft, Printer, History, Activity, FileText, ShieldAlert,
  Image as ImageIcon, CreditCard, PenTool, Save, Plus, X, Calendar,
  Check, Clock, Trash2, Edit, Lock, UploadCloud, Baby, FileSignature
} from 'lucide-react';
import toast from 'react-hot-toast';
import { pacientesService, historiasService, authService, API_URL } from '../services/api';
import OdontogramaEditor from '../components/OdontogramaEditor';
import RecetarioTab from '../components/RecetarioTab';
import OrdenRadiografiaTab from '../components/OrdenRadiografiaTab';

const ESTADO_HC_CONFIG = {
  vacia:       { label: 'Vacía',       class: 'bg-slate-100 text-slate-500' },
  en_progreso: { label: 'En progreso', class: 'bg-amber-100 text-amber-700' },
  completa:    { label: 'Completa',    class: 'bg-green-100 text-green-700' },
};

const fechaHoyLima = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

const getImageSrc = (rad) => {
  if (!rad) return '';
  if (rad.imageBase64) return rad.imageBase64;
  if (rad.url_archivo) return `${API_URL}${rad.url_archivo}`;
  return '';
};

const calculateAge = (fecha) => {
  if (!fecha) return 0;
  const today = new Date();
  const birthDate = new Date(fecha);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

// ==========================================
// PIZARRA DIGITAL — firma del paciente
// ==========================================
const SignaturePad = ({ onEnd, initialImage }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (initialImage) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = initialImage;
    }
  }, [initialImage]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0].clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0].clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      onEnd(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clearPad = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onEnd(null);
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <canvas
        ref={canvasRef}
        width={350}
        height={120}
        className="bg-white border-2 border-dashed border-slate-300 rounded-xl cursor-crosshair touch-none shadow-inner max-w-full"
        onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
        onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
      />
      <button type="button" onClick={clearPad} className="text-xs font-bold text-red-500 hover:text-red-700 underline">Borrar y firmar de nuevo</button>
    </div>
  );
};

const PacienteDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const esNuevo = !id;
  

  const userRol  = localStorage.getItem('userRol') || '';
  const esDoctor = userRol === 'Doctor';
  const esAdmin  = localStorage.getItem('isAdmin') === 'true';
  const miUserId = localStorage.getItem('userId') || '';

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'datosPersonales');
  const [savingHC, setSavingHC] = useState(false);

  const [pacienteInfo, setPacienteInfo] = useState(null);
  const [hcId, setHcId] = useState(null);
  const [nroHistoria, setNroHistoria] = useState('');

  // Datos personales
  const [formPersonal, setFormPersonal] = useState({
    dni: '', nombres: '', apellidos: '', sexo: 'M', fechaNacimiento: '',
    domicilio: '', celular: '', apoderadoNombre: '', apoderadoParentesco: '', apoderadoCelular: ''
  });
  const [snapshotPersonal, setSnapshotPersonal] = useState(null);
  const [savingPersonal, setSavingPersonal] = useState(false);
  
  // Triaje / Diagnóstico
  const [triajeData, setTriajeData] = useState({ motivo: '', antecedentesMedicos: '', antecedentesQuirurgicos: '', antecedentesOdontologicos: '', presion: '', pulso: '', temperatura: '', fc: '', fr: '' });
  const [diagnosticoData, setDiagnosticoData] = useState({ diagnostico: '', planTratamiento: '', examenClinico: '' });
  const [snapshot, setSnapshot] = useState(null);

  // Odontograma
  const [odontograma, setOdontograma] = useState({});
  const [tratamientosAsignados, setTratamientosAsignados] = useState([]);

  // Radiografías
  const [radiografias, setRadiografias] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  // Recetario
  const [recetas, setRecetas] = useState([]);

  // Ordenes de Radiografia
  const [ordenes, setOrdenes] = useState([]);
  // Evolución
  const [evoluciones, setEvoluciones] = useState([]);
  const [showNuevoTratamiento, setShowNuevoTratamiento] = useState(false);
  const [editEvoId, setEditEvoId] = useState(null);
  const [formNuevoTratamiento, setFormNuevoTratamiento] = useState({ fecha: fechaHoyLima(), descripcion: '', costoTotal: '', abonoInicial: '', estadoClinico: '', tipoComision: 'estandar', cantidadRadiografias: 1, nombreLaboratorio: '', montoLaboratorio: '' });
  const [showAbonoModal, setShowAbonoModal] = useState(false);
    const [formAbono, setFormAbono] = useState({ monto: '', metodo: 'Efectivo' });
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [selectedEvolucion, setSelectedEvolucion] = useState(null);
  const [showAdendaModal, setShowAdendaModal] = useState(false);
  const [formAdenda, setFormAdenda] = useState({ motivo: '', contenido: '' });

  // Firmas
  const [firmaPaciente, setFirmaPaciente] = useState(null);
  const [miFirma, setMiFirma] = useState(null);
  const [miSello, setMiSello] = useState(null);

  // Historial de Cambios (clínico)
  const [showHCAuditModal, setShowHCAuditModal] = useState(false);
  const [hcAuditLogs, setHCAuditLogs] = useState([]);

  useEffect(() => {
    if (esNuevo) { setLoading(false); return; }

    const cargarTodo = async () => {
      try {
        setLoading(true);
        const [pacRes, hisRes] = await Promise.all([
          pacientesService.getById(id),
          historiasService.getByPaciente(id),
        ]);

        const p = pacRes.data.data;
        setPacienteInfo(p);
        const datosPersonalesIniciales = {
          dni: p.dni || '', nombres: p.nombres || '', apellidos: p.apellidos || '',
          sexo: p.sexo || 'M', fechaNacimiento: p.fecha_nacimiento ? String(p.fecha_nacimiento).substring(0, 10) : '',
          domicilio: p.domicilio || '', celular: p.celular || '',
          apoderadoNombre: p.apoderado_nombre || '', apoderadoParentesco: p.parentesco || '', apoderadoCelular: p.apoderado_celular || '',
        };
        setFormPersonal(datosPersonalesIniciales);
        setSnapshotPersonal(datosPersonalesIniciales);

        if (hisRes.data.ok) {
          const h = hisRes.data.data;
          setHcId(h.id);
          setNroHistoria(h.nro_historia);

          const triaje = {
            motivo: h.antecedentes?.motivo_consulta || '',
            antecedentesMedicos: h.antecedentes?.antecedentes_medicos || '',
            antecedentesQuirurgicos: h.antecedentes?.antecedentes_quirurgicos || '',
            antecedentesOdontologicos: h.antecedentes?.antecedentes_odontologicos || '',
            presion: h.triaje?.presion || '', pulso: h.triaje?.pulso || '',
            temperatura: h.triaje?.temperatura || '', fc: h.triaje?.fc || '', fr: h.triaje?.fr || '',
          };
          const diagnostico = {
            diagnostico: h.antecedentes?.diagnostico || '',
            planTratamiento: h.antecedentes?.plan_tratamiento || '',
            examenClinico: h.antecedentes?.examen_clinico || '',
          };
          setTriajeData(triaje);
          setDiagnosticoData(diagnostico);

          const objOdonto = {};
          const arrAsig = [];
          if (h.odontograma) {
            h.odontograma.forEach(i => {
              arrAsig.push({
                id: i.id, pieza: i.pieza, cara: i.cara,
                tratamientoId: i.estado_codigo, tratamientoNombre: i.estado_nombre, color: i.color,
                notas: i.notas || '', bloqueada: !!i.bloqueada,
                registrado_por: i.registrado_por || '',
                registrado_por_nombre: i.registrado_por_nombre || '', fecha: i.fecha_registro,
                adendas: i.adendas || [],
              });
              if (!objOdonto[i.pieza]) objOdonto[i.pieza] = { caras: {}, status: null, arcada: null };
            });
          }
          setOdontograma(objOdonto);
          setTratamientosAsignados(arrAsig);

          setEvoluciones((h.consultas || []).map(c => ({
            id: c.id, fecha: c.fecha_consulta, descripcion: c.descripcion,
            costoTotal: c.costo_total, pagos: c.pagos || [],
            estadoClinico: c.estado_clinico || '',
            tipoComision: c.tipo_comision || 'estandar',
            cantidadRadiografias: c.cantidad_radiografias || 0,
            bloqueada: !!c.bloqueada,
            adendas: c.adendas || [],
            doctorId: c.doctor_id || '',
            doctorNombre: c.doctor_nombre || '',
          })));

          setRadiografias(h.radiografias || []);
          setRecetas((h.recetas || []).map(r => ({ ...r, anulada: !!r.anulada })));
          setOrdenes((h.ordenes || []).map(o => ({ ...o, anulada: !!o.anulada })));
          setFirmaPaciente(h.firma?.firma_paciente_data || null);
          setSnapshot({ triaje, diagnostico, firmaPaciente: h.firma?.firma_paciente_data || null });
        }
      } catch (err) {
        toast.error('Error al cargar los datos del paciente.');
      } finally {
        setLoading(false);
      }
    };
    cargarTodo();
  }, [id, esNuevo]);

  useEffect(() => {
    if (!esDoctor) return;
    authService.getMe().then(({ data }) => {
      setMiFirma(data.usuario.firma_digital || null);
      setMiSello(data.usuario.sello_digital || null);
    }).catch(() => {});
  }, [esDoctor]);

  const recargarOdontograma = async () => {
    try {
      const { data } = await historiasService.getByPaciente(id);
      if (!data.ok) return;
      const h = data.data;
      const objOdonto = {};
      const arrAsig = [];
      if (h.odontograma) {
        h.odontograma.forEach(i => {
          arrAsig.push({
            id: i.id, pieza: i.pieza, cara: i.cara,
            tratamientoId: i.estado_codigo, tratamientoNombre: i.estado_nombre, color: i.color,
            notas: i.notas || '', bloqueada: !!i.bloqueada,
            registrado_por: i.registrado_por || '',
            registrado_por_nombre: i.registrado_por_nombre || '', fecha: i.fecha_registro,
            adendas: i.adendas || [],
          });
          if (!objOdonto[i.pieza]) objOdonto[i.pieza] = { caras: {}, status: null, arcada: null };
        });
      }
      setOdontograma(objOdonto);
      setTratamientosAsignados(arrAsig);
    } catch (err) {
      toast.error('Error al actualizar el odontograma.');
    }
  };

  const recargarEvoluciones = async () => {
    try {
      const { data } = await historiasService.getByPaciente(id);
      if (!data.ok) return;
      const h = data.data;
      setEvoluciones((h.consultas || []).map(c => ({
        id: c.id, fecha: c.fecha_consulta, descripcion: c.descripcion,
        costoTotal: c.costo_total, pagos: c.pagos || [],
        estadoClinico: c.estado_clinico || '',
        tipoComision: c.tipo_comision || 'estandar',
        cantidadRadiografias: c.cantidad_radiografias || 0,
        bloqueada: !!c.bloqueada,
        adendas: c.adendas || [],
        doctorId: c.doctor_id || '',
        doctorNombre: c.doctor_nombre || '',
      })));
    } catch (err) {
      toast.error('Error al actualizar las evoluciones.');
    }
  };

  const recargarRecetas = async () => {
    try {
      const { data } = await historiasService.getByPaciente(id);
      if (!data.ok) return;
      setRecetas((data.data.recetas || []).map(r => ({ ...r, anulada: !!r.anulada })));
    } catch (err) {
      toast.error('Error al actualizar las recetas.');
    }
  };

  const recargarOrdenes = async () => {
    try {
      const { data } = await historiasService.getByPaciente(id);
      if (!data.ok) return;
      setOrdenes((data.data.ordenes || []).map(o => ({ ...o, anulada: !!o.anulada })));
    } catch (err) {
      toast.error('Error al actualizar las órdenes.');
    }
  };

  const handleChangePersonal = (e) => {
    let { name, value } = e.target;
    if (['dni', 'celular', 'apoderadoCelular'].includes(name)) value = value.replace(/\D/g, '');
    else if (['nombres', 'apellidos', 'apoderadoParentesco'].includes(name)) value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    setFormPersonal({ ...formPersonal, [name]: value });
  };

  const handleGuardarDatosPersonales = async (e) => {
    e.preventDefault();
    setSavingPersonal(true);
    try {
      const payload = {
        dni: formPersonal.dni, nombres: formPersonal.nombres, apellidos: formPersonal.apellidos,
        sexo: formPersonal.sexo, fecha_nacimiento: formPersonal.fechaNacimiento,
        domicilio: formPersonal.domicilio, celular: formPersonal.celular,
        apoderado_nombre: formPersonal.apoderadoNombre, parentesco: formPersonal.apoderadoParentesco,
        apoderado_celular: formPersonal.apoderadoCelular,
      };

      if (esNuevo) {
        const { data } = await pacientesService.crear(payload);
        toast.success('Paciente registrado. Continúa llenando su historia.');
        navigate(`/pacientes/${data.id}`, { replace: true });
        return;
      }

      const nombresCampos = {
        dni: 'DNI', nombres: 'Nombres', apellidos: 'Apellidos', sexo: 'Sexo',
        fechaNacimiento: 'Fecha de Nac.', domicilio: 'Domicilio', celular: 'Celular',
        apoderadoNombre: 'Apoderado', apoderadoParentesco: 'Parentesco', apoderadoCelular: 'Celular Apoderado'
      };
      let cambios = [];
      for (const key in formPersonal) {
        if (formPersonal[key] !== snapshotPersonal[key]) {
          const viejo = snapshotPersonal[key] || '(vacío)';
          const nuevo = formPersonal[key] || '(vacío)';
          cambios.push(`${nombresCampos[key]}: "${viejo}" ➔ "${nuevo}"`);
        }
      }
      const textoCambios = cambios.length > 0 ? cambios.join(', ') : null;

      await pacientesService.editar(id, { ...payload, cambios_detectados: textoCambios });
      toast.success(textoCambios ? 'Datos actualizados y auditados.' : 'Guardado sin modificaciones.');
      navigate('/pacientes');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al guardar los datos del paciente.');
    } finally {
      setSavingPersonal(false);
    }
  };

  const abrirAuditoriaHC = async () => {
    try {
      const [hisRes, pacRes] = await Promise.all([
        historiasService.getByPaciente(id),
        pacientesService.getAuditoria(id),
      ]);
      const logsClinicos   = (hisRes.data.data?.auditoria || []).map(l => ({ ...l, origen: 'clinico' }));
      const logsPersonales = (pacRes.data.data || []).map(l => ({ ...l, origen: 'personal' }));
      const combinados = [...logsClinicos, ...logsPersonales].sort(
        (a, b) => new Date(String(b.creado_en).replace(' ', 'T')) - new Date(String(a.creado_en).replace(' ', 'T'))
      );
      setHCAuditLogs(combinados);
      setShowHCAuditModal(true);
    } catch {
      toast.error('Error al cargar el historial de cambios.');
    }
  };

  const handleGuardarDatosHC = async () => {
    setSavingHC(true);
    try {
      const triajeCambio = JSON.stringify(triajeData) !== JSON.stringify(snapshot?.triaje);
      const diagCambio   = JSON.stringify(diagnosticoData) !== JSON.stringify(snapshot?.diagnostico);
      const firmasCambio = firmaPaciente !== snapshot?.firmaPaciente;

      if (triajeCambio || diagCambio) {
        await historiasService.guardarAntecedentes(hcId, {
          motivo_consulta: triajeData.motivo,
          antecedentes_medicos: triajeData.antecedentesMedicos,
          antecedentes_quirurgicos: triajeData.antecedentesQuirurgicos,
          antecedentes_odontologicos: triajeData.antecedentesOdontologicos,
          diagnostico: diagnosticoData.diagnostico,
          plan_tratamiento: diagnosticoData.planTratamiento,
          examen_clinico: diagnosticoData.examenClinico,
          presion: triajeData.presion, pulso: triajeData.pulso,
          temperatura: triajeData.temperatura, fc: triajeData.fc, fr: triajeData.fr,
        });
      }

      if (firmasCambio && firmaPaciente) {
        await historiasService.guardarFirmas(hcId, { firma_paciente_data: firmaPaciente });
      }

      setSnapshot({ triaje: triajeData, diagnostico: diagnosticoData, firmaPaciente });
      toast.success('Cambios guardados correctamente.');
      navigate('/pacientes');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al guardar los cambios.');
    } finally {
      setSavingHC(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || subiendoImagen) return;
    setSubiendoImagen(true);
    const formData = new FormData();
    formData.append('imagen', file);
    formData.append('descripcion', 'Placa Anexa');
    try {
      const { data } = await historiasService.subirRadiografia(hcId, formData);
      if (data.ok) {
        toast.success('Imagen subida');
        const res = await historiasService.getRadiografias(hcId);
        setRadiografias(res.data.data);
      }
    } catch (err) {
      toast.error('Error al subir imagen.');
    } finally {
      setSubiendoImagen(false);
    }
  };

  const handleEliminarRadiografia = async (radId) => {
    if (!window.confirm('¿Eliminar esta placa?')) return;
    try {
      await historiasService.eliminarRadiografia(radId);
      setRadiografias(prev => prev.filter(r => r.id !== radId));
      toast.success('Placa eliminada.');
    } catch (err) {
      toast.error('Error al eliminar placa.');
    }
  };

  const calcularTotalPagado = (pagos) => Array.isArray(pagos) ? pagos.reduce((sum, p) => sum + parseFloat(p?.monto || 0), 0) : 0;
  const calcularResta = (costoTotal, pagos) => (parseFloat(costoTotal || 0) - calcularTotalPagado(pagos)).toFixed(2);

  const handleCrearTratamiento = async (e) => {
    e.preventDefault();
    const costo = parseFloat(formNuevoTratamiento.costoTotal) || 0;
    try {
      if (editEvoId) {
        await historiasService.editarConsulta(editEvoId, {
          descripcion: formNuevoTratamiento.descripcion,
          costo_total: costo,
          fecha_consulta: formNuevoTratamiento.fecha,
        });
        toast.success('Tratamiento actualizado.');
      } else {
        const abono = parseFloat(formNuevoTratamiento.abonoInicial) || 0;
        if (abono > costo) { toast.error('El abono no puede exceder el costo total.'); return; }
        await historiasService.agregarConsulta(hcId, {
          descripcion: formNuevoTratamiento.descripcion,
          costo_total: costo,
          abono_inicial: abono,
          fecha_consulta: formNuevoTratamiento.fecha,
          estado_clinico: formNuevoTratamiento.estadoClinico,
          tipo_comision: formNuevoTratamiento.tipoComision,
          cantidad_radiografias: formNuevoTratamiento.tipoComision === 'endodoncia' ? (parseInt(formNuevoTratamiento.cantidadRadiografias) || 0) : 0,
          laboratorio: formNuevoTratamiento.tipoComision === 'rehabilitacion'
            ? { nombre_laboratorio: formNuevoTratamiento.nombreLaboratorio, monto_total: parseFloat(formNuevoTratamiento.montoLaboratorio) || 0 }
            : null,
        });
        toast.success('Evolución registrada y firmada.');
      }
      await recargarEvoluciones();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al guardar.');
    }
    setShowNuevoTratamiento(false);
    setEditEvoId(null);
    setFormNuevoTratamiento({ fecha: fechaHoyLima(), descripcion: '', costoTotal: '', abonoInicial: '', estadoClinico: '', tipoComision: 'estandar', cantidadRadiografias: 1, nombreLaboratorio: '', montoLaboratorio: '' });
  };

  const handleEliminarEvolucion = async (evoId) => {
    if (!window.confirm('¿Estás seguro que deseas eliminar este tratamiento y todo su historial de pagos?')) return;
    try {
      await historiasService.eliminarConsulta(evoId);
      await recargarEvoluciones();
      toast.success('Tratamiento eliminado.');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al eliminar.');
    }
  };

  const handleAbonar = async (e) => {
    e.preventDefault();
    const abono = parseFloat(formAbono.monto);
    const resta = parseFloat(calcularResta(selectedEvolucion?.costoTotal, selectedEvolucion?.pagos));
    if (abono <= 0 || abono > resta) { toast.error('Monto inválido.'); return; }
    try {
      await historiasService.registrarPago(selectedEvolucion.id, { monto: abono, metodo_pago: formAbono.metodo });
      await recargarEvoluciones();
      toast.success('Abono registrado.');
    } catch (err) {
      toast.error('Error al registrar abono.');
    }
    setShowAbonoModal(false);
    setFormAbono({ monto: '', metodo: 'Efectivo' });
  };

  const handleAgregarAdenda = async (e) => {
    e.preventDefault();
    if (!formAdenda.motivo || !formAdenda.contenido) {
      toast.error('Completa el motivo y la corrección.'); return;
    }
    try {
      await historiasService.agregarAdendaConsulta(selectedEvolucion.id, formAdenda);
      await recargarEvoluciones();
      toast.success('Corrección agregada correctamente.');
      setShowAdendaModal(false);
      setFormAdenda({ motivo: '', contenido: '' });
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al agregar la corrección.');
    }
  };

  const estadoHC = (() => {
    const tieneAntecedentes = !!(triajeData.motivo || diagnosticoData.diagnostico);
    const tieneOdonto = tratamientosAsignados.length > 0;
    const tieneEvolucion = evoluciones.length > 0;
    if (tieneAntecedentes && tieneOdonto && tieneEvolucion) return 'completa';
    if (tieneAntecedentes || tieneOdonto || tieneEvolucion) return 'en_progreso';
    return 'vacia';
  })();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-clinical-500 border-t-transparent rounded-full animate-spin"/>
        <p className="text-slate-500 font-medium">Cargando ficha del paciente...</p>
      </div>
    );
  }

  const estadoCfg = ESTADO_HC_CONFIG[estadoHC];

  return (
    <div className="animate-fade-in text-slate-800 max-w-[1400px] mx-auto pb-10">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6 sticky top-[72px] z-30 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/pacientes')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><ArrowLeft size={24} /></button>
          <div className="bg-clinical-50 p-4 rounded-full text-clinical-600"><User size={32}/></div>
          <div>
            {esNuevo ? (
              <h2 className="text-2xl font-bold">Registrar Nuevo Paciente</h2>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{pacienteInfo?.apellidos}, {pacienteInfo?.nombres}</h2>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${estadoCfg.class}`}>{estadoCfg.label}</span>
                </div>
                <p className="text-sm text-slate-500">DNI: {pacienteInfo?.dni} | HC: <span className="font-bold text-clinical-600">{nroHistoria}</span></p>
              </>
            )}
          </div>
        </div>
        {!esNuevo && (
          <div className="flex gap-2">
            <button onClick={() => navigate(`/historias?view=${id}`)} className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-100 transition-all border border-blue-100">
              <Printer size={18}/> Imprimir Reporte
            </button>
            <button onClick={abrirAuditoriaHC} className="bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-all border border-slate-200">
              <History size={18}/> Historial de Cambios
            </button>
          </div>
        )}
      </div>

      {!esNuevo && (
        <div className="flex w-full justify-between gap-1.5 mb-6">
          <TabBtn active={activeTab==='datosPersonales'} onClick={()=>setActiveTab('datosPersonales')} icon={<User size={16}/>} label="Datos Personales"/>
          {esDoctor && <TabBtn active={activeTab==='triaje'}        onClick={()=>setActiveTab('triaje')}        icon={<Activity size={16}/>}    label="Triaje y Antecedentes"/>}
          {esDoctor && <TabBtn active={activeTab==='diagnostico'}   onClick={()=>setActiveTab('diagnostico')}   icon={<FileText size={16}/>}    label="Diagnóstico y Plan"/>}
          {esDoctor && <TabBtn active={activeTab==='odontograma'}   onClick={()=>setActiveTab('odontograma')}   icon={<ShieldAlert size={16}/>} label="Odontograma"/>}
          <TabBtn active={activeTab==='radiografias'}  onClick={()=>setActiveTab('radiografias')}  icon={<ImageIcon size={16}/>}   label="Radiografías"/>
          <TabBtn active={activeTab==='evolucion'}     onClick={()=>setActiveTab('evolucion')}     icon={<CreditCard size={16}/>}  label="Evolución"/>
          <TabBtn active={activeTab==='recetario'}     onClick={()=>setActiveTab('recetario')}     icon={<FileSignature size={16}/>} label="Recetario"/>
          <TabBtn active={activeTab==='ordenesRx'}     onClick={()=>setActiveTab('ordenesRx')}     icon={<FileText size={16}/>}    label="Órdenes Rx"/>
          {esDoctor && <TabBtn active={activeTab==='consentimiento'}onClick={()=>setActiveTab('consentimiento')}icon={<PenTool size={16}/>}     label="Firmas"/>}
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">

        {activeTab === 'datosPersonales' && (
          <div className="animate-fade-in">
            <div className="border-b pb-4 mb-6">
              <h3 className="font-bold text-xl flex items-center gap-2 text-slate-800"><User size={24}/> Datos Personales</h3>
            </div>
            <form onSubmit={handleGuardarDatosPersonales} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">DNI</label>
                  <input required name="dni" value={formPersonal.dni} onChange={handleChangePersonal} maxLength="8"
                    className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Celular</label>
                  <input required name="celular" value={formPersonal.celular} onChange={handleChangePersonal} maxLength="9"
                    className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nombres</label>
                  <input required name="nombres" value={formPersonal.nombres} onChange={handleChangePersonal}
                    className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Apellidos</label>
                  <input required name="apellidos" value={formPersonal.apellidos} onChange={handleChangePersonal}
                    className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Nacimiento</label>
                  <input required type="date" name="fechaNacimiento" value={formPersonal.fechaNacimiento} onChange={handleChangePersonal}
                    min="1900-01-01" max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Sexo</label>
                  <select name="sexo" value={formPersonal.sexo} onChange={handleChangePersonal}
                    className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-slate-50">
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Domicilio Actual</label>
                  <input required name="domicilio" value={formPersonal.domicilio} onChange={handleChangePersonal}
                    className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-slate-50" />
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Baby size={14} /> Apoderado (Opcional)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 mb-1">Nombre Completo</label>
                    <input name="apoderadoNombre" value={formPersonal.apoderadoNombre} onChange={handleChangePersonal}
                      className="w-full px-4 py-2 border rounded-xl outline-none focus:border-clinical-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Parentesco</label>
                    <input name="apoderadoParentesco" value={formPersonal.apoderadoParentesco} onChange={handleChangePersonal}
                      className="w-full px-4 py-2 border rounded-xl outline-none focus:border-clinical-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Celular</label>
                    <input name="apoderadoCelular" value={formPersonal.apoderadoCelular} onChange={handleChangePersonal} maxLength="9"
                      className="w-full px-4 py-2 border rounded-xl outline-none focus:border-clinical-500 bg-white" />
                  </div>
                </div>
              </div>

              <div className="bg-clinical-50 p-8 rounded-3xl border border-clinical-100 mt-4 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-inner">
                <div>
                  <h4 className="font-bold text-clinical-800 text-lg">{esNuevo ? 'Registrar Paciente' : 'Guardar Datos Personales'}</h4>
                  <p className="text-sm text-clinical-600">{esNuevo ? 'Crea al paciente y su historia clínica, lista para seguir llenando.' : 'Guarda los cambios en la información del paciente y su apoderado.'}</p>
                </div>
                <button type="submit" disabled={savingPersonal}
                  className="bg-clinical-500 text-white px-10 py-4 rounded-2xl font-black text-xl flex items-center gap-3 hover:bg-clinical-600 hover:-translate-y-1 shadow-xl shadow-clinical-200 transition-all w-full sm:w-auto justify-center disabled:opacity-60 disabled:translate-y-0">
                  <Save size={28}/>
                  {savingPersonal ? 'Guardando...' : esNuevo ? 'REGISTRAR PACIENTE' : 'GUARDAR CAMBIOS'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'triaje' && (
          <div className="animate-fade-in space-y-8">
            <Field label="Motivo de Consulta" value={triajeData.motivo} onChange={v => setTriajeData({...triajeData, motivo: v})} isTextArea rows="2" />
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-5 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <p className="font-black text-slate-600 text-xs uppercase tracking-widest">Antecedentes</p>
                <Field label="Médicos / Alergias" value={triajeData.antecedentesMedicos} onChange={v => setTriajeData({...triajeData, antecedentesMedicos: v})} isTextArea rows="2" />
                <Field label="Quirúrgicos" value={triajeData.antecedentesQuirurgicos} onChange={v => setTriajeData({...triajeData, antecedentesQuirurgicos: v})} isTextArea rows="2" />
                <Field label="Odontológicos" value={triajeData.antecedentesOdontologicos} onChange={v => setTriajeData({...triajeData, antecedentesOdontologicos: v})} isTextArea rows="2" />
              </div>
              <div className="bg-clinical-50/50 p-6 rounded-3xl border border-clinical-100 space-y-5 h-fit">
                <p className="font-black text-clinical-700 text-xs uppercase tracking-widest">Signos Vitales</p>
                <InputV label="P.A. (Presión Arterial)" value={triajeData.presion} onChange={v => setTriajeData({...triajeData, presion: v})} unit="mmHg" format="pa" />
                <InputV label="PULSO" value={triajeData.pulso} onChange={v => setTriajeData({...triajeData, pulso: v})} unit="lpm" format="num" />
                <InputV label="TEMPERATURA" value={triajeData.temperatura} onChange={v => setTriajeData({...triajeData, temperatura: v})} unit="°C" format="dec" />
                <InputV label="F.C." value={triajeData.fc} onChange={v => setTriajeData({...triajeData, fc: v})} unit="lpm" format="num" />
                <InputV label="F.R." value={triajeData.fr} onChange={v => setTriajeData({...triajeData, fr: v})} unit="rpm" format="num" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'diagnostico' && (
          <div className="animate-fade-in space-y-6">
            <Field label="Examen Clínico General" value={diagnosticoData.examenClinico} onChange={v => setDiagnosticoData({...diagnosticoData, examenClinico: v})} isTextArea rows="3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Diagnóstico" value={diagnosticoData.diagnostico} onChange={v => setDiagnosticoData({...diagnosticoData, diagnostico: v})} isTextArea rows="4" color="bg-orange-50/50 border-orange-100 focus:border-orange-400" />
              <Field label="Plan de Tratamiento" value={diagnosticoData.planTratamiento} onChange={v => setDiagnosticoData({...diagnosticoData, planTratamiento: v})} isTextArea rows="4" color="bg-blue-50/50 border-blue-100 focus:border-blue-400" />
            </div>
          </div>
        )}

        {activeTab === 'odontograma' && (
          <div className="animate-fade-in">
            <div className="flex justify-end mb-4">
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-lg border border-green-100 inline-flex items-center gap-1">
                <Check size={12}/> Cada diagnóstico y procedimiento se guarda y firma al instante
              </span>
            </div>
            <OdontogramaEditor
              historiaId={hcId}
              odontogramaVisual={odontograma}
              tratamientosAsignados={tratamientosAsignados}
              onGuardado={recargarOdontograma}
              miUserId={miUserId}
            />
          </div>
        )}

        {activeTab === 'radiografias' && (
          <div className="animate-fade-in space-y-6">
            <div className="border-b pb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-xl flex items-center gap-2 text-purple-600"><ImageIcon size={24}/> Placas y Anexos Fotográficos</h3>
                <label className={`cursor-pointer px-6 py-2.5 bg-clinical-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-clinical-700 shadow-md transition-all ${subiendoImagen ? 'opacity-50 pointer-events-none' : ''}`}>
                  <UploadCloud size={18}/> {subiendoImagen ? 'Subiendo...' : 'Subir Imagen'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={subiendoImagen} />
                </label>
              </div>
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-lg border border-green-100 inline-flex items-center gap-1">
                <Check size={12}/> Cada imagen se guarda al subirla
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {radiografias.length === 0 ? (
                <div className="col-span-2 text-center py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                  <ImageIcon size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 font-bold">No hay placas registradas.</p>
                </div>
              ) : (
                radiografias.map(rad => (
                  <div key={rad.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden group">
                    <div className="relative h-64 bg-black flex items-center justify-center cursor-pointer" onClick={() => setSelectedImage(rad)}>
                      <img src={getImageSrc(rad)} alt="Placa" className="max-h-full max-w-full object-contain" />
                      <button onClick={(e) => { e.stopPropagation(); handleEliminarRadiografia(rad.id); }} className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                    </div>
                    <div className="p-4 bg-slate-50">
                      <input type="text" placeholder="Ej. Radiografía Panorámica Inicial..." className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-clinical-500 text-sm font-bold text-slate-700" value={rad.descripcion} onChange={(e) => setRadiografias(prev => prev.map(r => r.id === rad.id ? { ...r, descripcion: e.target.value } : r))} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'evolucion' && (
          <div className="animate-fade-in space-y-6">
            <div className="border-b pb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-xl flex items-center gap-2 text-clinical-600"><CreditCard size={24}/> Evolución y Finanzas</h3>
                {esDoctor && <button onClick={() => { setEditEvoId(null); setShowNuevoTratamiento(true); }} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-700 shadow-md transition-all"><Plus size={18}/> Nuevo Tratamiento</button>}
              </div>
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-lg border border-green-100 inline-flex items-center gap-1">
                <Check size={12}/> Cada tratamiento se guarda y firma al crearlo
              </span>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-100 mb-8">
              <table className="w-full text-left bg-white text-sm">
                <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest">
                  <tr><th className="p-4 border-b border-slate-100">Fecha</th><th className="p-4 border-b border-slate-100">Tratamiento</th><th className="p-4 border-b border-slate-100 text-right">Total</th><th className="p-4 border-b border-slate-100 text-right text-orange-500">Resta</th><th className="p-4 border-b border-slate-100 text-center">Estado</th><th className="p-4 border-b border-slate-100 text-center">Acciones</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {evoluciones.length === 0 ? (
                    <tr><td colSpan="6" className="p-12 text-center text-slate-400 font-medium">Aún no hay tratamientos registrados.</td></tr>
                  ) : (
                    evoluciones.map(evo => {
                      const resta = calcularResta(evo.costoTotal, evo.pagos);
                      const isCancelado = parseFloat(resta) <= 0;
                      return (
                        <tr key={evo.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-bold text-slate-500">{evo.fecha}</td>
                          <td className="p-4 text-slate-700">
                            {evo.descripcion}
                            {evo.tipoComision !== 'estandar' && (
                              <span className={`ml-2 text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${evo.tipoComision === 'rehabilitacion' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                                {evo.tipoComision === 'rehabilitacion' ? 'Rehabilitación' : 'Endodoncia'}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right font-black text-slate-800">S/ {parseFloat(evo.costoTotal).toFixed(2)}</td>
                          <td className="p-4 text-right font-black text-orange-600">S/ {resta}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${isCancelado ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                              {isCancelado ? <><Check size={12}/> Cancelado</> : <><Clock size={12}/> Pendiente</>}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => { setSelectedEvolucion(evo); setShowHistorialModal(true); }} className="px-2 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-bold flex items-center gap-1 transition-all text-[10px]" title="Ver Historial"><Calendar size={12}/> Historial</button>
                              {!isCancelado && <button onClick={() => { setSelectedEvolucion(evo); setShowAbonoModal(true); }} className="px-2 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg font-bold flex items-center gap-1 transition-all text-[10px]" title="Abonar"><CreditCard size={12}/> Abonar</button>}
                              {esDoctor && (evo.bloqueada
                                ? <button onClick={() => { setSelectedEvolucion(evo); setShowAdendaModal(true); }} className="p-1.5 text-slate-400 hover:text-clinical-600 hover:bg-slate-100 rounded-lg transition-all" title="Evolución firmada — clic para agregar una corrección"><Lock size={14}/></button>
                                : <>
                                    <button onClick={() => { setEditEvoId(evo.id); setFormNuevoTratamiento({ fecha: evo.fecha, descripcion: evo.descripcion, costoTotal: evo.costoTotal, abonoInicial: '', estadoClinico: '' }); setShowNuevoTratamiento(true); }} className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-all" title="Editar"><Edit size={14}/></button>
                                    <button onClick={() => handleEliminarEvolucion(evo.id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all" title="Eliminar"><Trash2 size={14}/></button>
                                  </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
 
        {activeTab === 'recetario' && (
          <RecetarioTab
            historiaId={hcId}
            recetas={recetas}
            onGuardado={recargarRecetas}
            pacienteInfo={pacienteInfo}
            esDoctor={esDoctor}
          />
        )}

        {activeTab === 'ordenesRx' && (
          <OrdenRadiografiaTab
            historiaId={hcId}
            ordenes={ordenes}
            onGuardado={recargarOrdenes}
            pacienteInfo={pacienteInfo}
            esDoctor={esDoctor}
          />
        )}

        {activeTab === 'consentimiento' && (
          <div className="animate-fade-in space-y-6">
            <div className="border-b pb-4">
              <h3 className="font-bold text-xl flex items-center gap-2 text-slate-800"><PenTool size={24}/> Consentimiento Informado y Firmas</h3>
              <p className="text-slate-500 text-sm mt-1">Autorización formal del paciente y validación del médico tratante.</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <p className="text-sm font-medium text-slate-700 leading-relaxed text-justify mb-6">
                Yo, <strong>{pacienteInfo?.apellidos}, {pacienteInfo?.nombres}</strong> identificado con DNI N° <strong>{pacienteInfo?.dni}</strong>, declaro haber sido informado(a) de manera clara sobre mi diagnóstico y el plan de tratamiento. Otorgo mi consentimiento libre y voluntario para la ejecución del tratamiento indicado.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="font-black text-slate-600 text-xs uppercase tracking-widest mb-3 text-center">Firma del Paciente / Apoderado</p>
                  <SignaturePad onEnd={setFirmaPaciente} initialImage={firmaPaciente} />
                </div>
                <div className="flex flex-col items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="font-black text-slate-600 text-xs uppercase tracking-widest mb-3 text-center">Firma y Sello del Médico Tratante</p>
                  {miFirma ? (
                    <div className="flex flex-col items-center">
                      <div className="w-full h-14 flex items-end justify-center">
                        <img src={miFirma} alt="Firma" className="max-h-full max-w-full object-contain" />
                      </div>
                      {miSello && (
                        <div className="w-full h-20 flex items-center justify-center -mt-2">
                          <img src={miSello} alt="Sello" className="max-h-full max-w-full object-contain opacity-95" />
                        </div>
                      )}
                      <p className="text-[10px] text-slate-400 text-center mt-2">Se completa sola al guardar — para cambiarla, ve a <span className="font-bold text-clinical-600">Mi Perfil</span>.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                      <p className="text-xs text-slate-500">Aún no has guardado tu firma y sello.</p>
                      <button type="button" onClick={() => navigate('/perfil')} className="text-xs font-bold text-white bg-clinical-500 hover:bg-clinical-600 px-4 py-2 rounded-xl transition-colors">Configurarlos en Mi Perfil</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {esDoctor && ['triaje','diagnostico','consentimiento'].includes(activeTab) && (
          <div className="bg-clinical-50 p-8 rounded-3xl border border-clinical-100 mt-10 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-inner">
            <div><h4 className="font-bold text-clinical-800 text-lg">Guardar Cambios Clínicos</h4><p className="text-sm text-clinical-600">Guarda los datos médicos y las firmas de esta pestaña.</p></div>
            <button onClick={handleGuardarDatosHC} disabled={savingHC} className="bg-clinical-500 text-white px-10 py-4 rounded-2xl font-black text-xl flex items-center gap-3 hover:bg-clinical-600 hover:-translate-y-1 shadow-xl shadow-clinical-200 transition-all w-full sm:w-auto justify-center disabled:opacity-60 disabled:translate-y-0">
              <Save size={28}/>
              {savingHC ? 'Guardando...' : 'GUARDAR CAMBIOS'}
            </button>
          </div>
        )}
      </div>

      {/* MODAL: NUEVO / EDITAR TRATAMIENTO */}
      {showNuevoTratamiento && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl animate-pop-in overflow-hidden">
            <div className="bg-slate-800 p-5 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">{editEvoId ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}</h3>
              <button onClick={() => { setShowNuevoTratamiento(false); setEditEvoId(null); setFormNuevoTratamiento({ fecha: fechaHoyLima(), descripcion: '', costoTotal: '', abonoInicial: '', estadoClinico: '', tipoComision: 'estandar', cantidadRadiografias: 1, nombreLaboratorio: '', montoLaboratorio: '' }); }} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleCrearTratamiento} className="p-6 space-y-5">
              <InputV label="Fecha de Inicio" type="date" value={formNuevoTratamiento.fecha} onChange={v => setFormNuevoTratamiento({...formNuevoTratamiento, fecha: v})} />
              <Field label="Descripción del Tratamiento" value={formNuevoTratamiento.descripcion} onChange={v => setFormNuevoTratamiento({...formNuevoTratamiento, descripcion: v})} isTextArea rows="2" />
              {!editEvoId && (
                <>
                  <Field label="Estado Clínico (cómo encontraste al paciente hoy)" value={formNuevoTratamiento.estadoClinico} onChange={v => setFormNuevoTratamiento({...formNuevoTratamiento, estadoClinico: v})} isTextArea rows="2" />
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tipo de Tratamiento (para el cálculo de comisión)</label>
                    <div className="flex gap-2">
                      {[{ v: 'estandar', l: 'Estándar' }, { v: 'rehabilitacion', l: 'Rehabilitación' }, { v: 'endodoncia', l: 'Endodoncia' }].map(op => (
                        <button key={op.v} type="button" onClick={() => setFormNuevoTratamiento({...formNuevoTratamiento, tipoComision: op.v})}
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-colors ${formNuevoTratamiento.tipoComision === op.v ? 'bg-clinical-50 border-clinical-300 text-clinical-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                          {op.l}
                        </button>
                      ))}
                    </div>
                  </div>
                  {formNuevoTratamiento.tipoComision === 'endodoncia' && (
                    <InputV label="Cantidad de Radiografías" placeholder="1" format="num" value={formNuevoTratamiento.cantidadRadiografias} onChange={v => setFormNuevoTratamiento({...formNuevoTratamiento, cantidadRadiografias: v})} />
                  )}
                  {formNuevoTratamiento.tipoComision === 'rehabilitacion' && (
                    <div className="grid grid-cols-2 gap-4 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Nombre del Laboratorio</label>
                        <input value={formNuevoTratamiento.nombreLaboratorio} onChange={e => setFormNuevoTratamiento({...formNuevoTratamiento, nombreLaboratorio: e.target.value})}
                          className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-orange-400 bg-white border-orange-200 text-sm" placeholder="Ej. Laboratorio Dental Center" />
                      </div>
                      <InputV label="Costo Laboratorio (S/)" placeholder="0.00" format="dec" value={formNuevoTratamiento.montoLaboratorio} onChange={v => setFormNuevoTratamiento({...formNuevoTratamiento, montoLaboratorio: v})} />
                      <p className="col-span-2 text-[10px] text-orange-700 italic">Si aún no tienes el costo exacto, puedes dejarlo en blanco — pero la comisión del doctor se calculará sin descuento de laboratorio hasta que lo completes (por ahora, solo se puede agregar en la creación del tratamiento).</p>
                    </div>
                  )}
                </>
              )}
              <div className={`grid ${editEvoId ? 'grid-cols-1' : 'grid-cols-2'} gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100`}>
                <InputV label="Costo Total (S/)" placeholder="0.00" format="dec" value={formNuevoTratamiento.costoTotal} onChange={v => setFormNuevoTratamiento({...formNuevoTratamiento, costoTotal: v})} />
                {!editEvoId && (
                  <InputV label="Abono Inicial (S/)" placeholder="0.00 (opcional)" format="dec" required={false} value={formNuevoTratamiento.abonoInicial} onChange={v => setFormNuevoTratamiento({...formNuevoTratamiento, abonoInicial: v})} />
                )}
              </div>
              <button type="submit" className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 shadow-lg transition-all">{editEvoId ? 'Guardar Cambios' : 'Guardar y Firmar'}</button>
            </form>
          </div>
        </div>
      )}

      {showAbonoModal && selectedEvolucion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-pop-in overflow-hidden">
            <div className="bg-green-600 p-5 text-white flex justify-between items-center"><h3 className="font-bold text-lg">Registrar Abono</h3><button onClick={() => setShowAbonoModal(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20}/></button></div>
            <form onSubmit={handleAbonar} className="p-6 space-y-5">
              <div className="text-center bg-green-50 p-5 rounded-2xl border border-green-100"><p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Deuda Restante</p><p className="text-4xl font-black text-green-700">S/ {calcularResta(selectedEvolucion.costoTotal, selectedEvolucion.pagos)}</p></div>
              <InputV label="Monto a Abonar (S/)" placeholder="0.00" format="dec" value={formAbono.monto} onChange={v => setFormAbono({...formAbono, monto: v})} />
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Método de Pago</label>
                <div className="flex gap-2">
                  {[{ v: 'Efectivo', l: 'Efectivo' }, { v: 'Tarjeta', l: 'Tarjeta (POS)' }].map(op => (
                    <button key={op.v} type="button" onClick={() => setFormAbono({...formAbono, metodo: op.v})}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-colors ${formAbono.metodo === op.v ? 'bg-green-50 border-green-300 text-green-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                      {op.l}
                    </button>
                  ))}
                </div>
              </div>
              {formAbono.metodo === 'Tarjeta' && parseFloat(formAbono.monto) > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Se cobrará en la tarjeta (incluye 4% recargo POS)</p>
                  <p className="text-lg font-black text-amber-800">S/ {(parseFloat(formAbono.monto) * 1.04).toFixed(2)}</p>
                </div>
              )}
              <button type="submit" className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all">Confirmar Abono</button>
            </form>
          </div>
        </div>
      )}

      {showAdendaModal && selectedEvolucion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl animate-pop-in overflow-hidden">
            <div className="bg-slate-800 p-5 text-white flex justify-between items-center"><h3 className="font-bold text-lg flex items-center gap-2"><Lock size={18}/> Agregar Corrección</h3><button onClick={() => setShowAdendaModal(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20}/></button></div>
            <form onSubmit={handleAgregarAdenda} className="p-6 space-y-5">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Evolución original (no se modifica)</p>
                <p className="text-sm text-slate-700">{selectedEvolucion.descripcion}</p>
              </div>
              <Field label="Motivo de la corrección" value={formAdenda.motivo} onChange={v => setFormAdenda({...formAdenda, motivo: v})} isTextArea rows="2" />
              <Field label="Corrección" value={formAdenda.contenido} onChange={v => setFormAdenda({...formAdenda, contenido: v})} isTextArea rows="3" />
              <button type="submit" className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 shadow-lg transition-all">Guardar Corrección</button>
            </form>
          </div>
        </div>
      )}

      {showHistorialModal && selectedEvolucion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl animate-pop-in overflow-hidden">
            <div className="bg-blue-600 p-5 text-white flex justify-between items-center"><h3 className="font-bold text-lg flex items-center gap-2"><Calendar size={20}/> Historial y Correcciones</h3><button onClick={() => setShowHistorialModal(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20}/></button></div>
            <div className="p-6 max-h-96 overflow-y-auto space-y-3">
              <div className="bg-clinical-50 p-4 rounded-2xl border border-clinical-100">
                <p className="text-xs font-black text-clinical-700 uppercase tracking-widest mb-2">Detalle Clínico</p>
                <p className="text-sm text-slate-700"><span className="font-bold">Doctor:</span> {selectedEvolucion.doctorNombre || '—'}</p>
                {selectedEvolucion.estadoClinico && <p className="text-sm text-slate-700 mt-1"><span className="font-bold">Estado clínico:</span> {selectedEvolucion.estadoClinico}</p>}
                {(esAdmin || selectedEvolucion.doctorId === miUserId) && (
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-clinical-200">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Total Cobrado</p>
                      <p className="text-sm font-black text-slate-700">S/ {calcularTotalPagado(selectedEvolucion.pagos).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Comisión Generada</p>
                      <p className="text-sm font-black text-clinical-600">S/ {(selectedEvolucion.pagos || []).reduce((sum, p) => sum + parseFloat(p.comision_generada || 0), 0).toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
              {(!selectedEvolucion.pagos || selectedEvolucion.pagos.length === 0) ? (
                <p className="text-center text-sm text-slate-400 py-6 font-medium">Aún no hay abonos registrados.</p>
              ) : (
                selectedEvolucion.pagos.map((pago, index) => (
                  <div key={pago.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-2xl bg-white shadow-sm">
                    <div className="flex gap-3 items-center">
                      <div className="bg-green-100 p-2 rounded-full text-green-600"><Check size={16}/></div>
                      <div>
                        <p className="font-bold text-slate-700 text-sm">Abono #{index + 1}</p>
                        <p className="text-xs text-slate-400">{pago.fechaHora}</p>
                      </div>
                    </div>
                    <p className="font-black text-green-600 text-lg">S/ {parseFloat(pago.monto).toFixed(2)}</p>
                  </div>
                ))
              )}
              {selectedEvolucion.adendas && selectedEvolucion.adendas.length > 0 && (
                <div className="pt-4 mt-4 border-t border-slate-200">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Correcciones</p>
                  <div className="space-y-3">
                    {selectedEvolucion.adendas.map((adenda) => (
                      <div key={adenda.id} className="p-4 border border-amber-100 rounded-2xl bg-amber-50">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-amber-700">{adenda.usuario_nombre}</span>
                          <span className="text-xs text-slate-400">{adenda.creado_en}</span>
                        </div>
                        <p className="text-xs text-slate-500 italic mb-1">Motivo: {adenda.motivo}</p>
                        <p className="text-sm text-slate-700">{adenda.contenido}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showHCAuditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl animate-pop-in overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-800 p-5 text-white flex justify-between items-center"><h3 className="font-bold text-lg flex items-center gap-2"><History size={20}/> Historial de Cambios</h3><button onClick={() => setShowHCAuditModal(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20}/></button></div>
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              <p className="font-bold text-slate-700 mb-6">Documento: <span className="text-clinical-600 font-black">{nroHistoria}</span></p>
              {hcAuditLogs.length === 0 ? (
                <p className="text-center text-slate-500 py-10 font-medium">No hay registros de cambios para esta HC.</p>
              ) : (
                <div className="space-y-6 border-l-2 border-slate-300 ml-4 pl-6 relative">
                  {hcAuditLogs.map((log) => (
                    <div key={`${log.origen}-${log.id}`} className="relative bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="absolute -left-[32px] top-4 bg-clinical-500 w-4 h-4 rounded-full border-[3px] border-slate-50 shadow-sm"></div>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-block bg-slate-100 text-slate-600 text-[10px] font-black uppercase px-2 py-1 rounded border border-slate-200">👤 {log.usuario_nombre}</span>
                          <span className={`inline-block text-[10px] font-black uppercase px-2 py-1 rounded border ${log.origen === 'personal' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-clinical-50 text-clinical-600 border-clinical-100'}`}>
                            {log.origen === 'personal' ? 'Datos personales' : 'Clínico'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-bold whitespace-nowrap">{log.fecha_accion} a las {log.hora_accion}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed text-pretty">{log.accion}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-5xl flex justify-center items-center">
            <button onClick={() => setSelectedImage(null)} className="absolute -top-12 right-0 text-slate-400 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-xl backdrop-blur-md"><X size={32} /></button>
            <img src={getImageSrc(selectedImage)} alt="Radiografía ampliada" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
};

const TabBtn = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl font-bold text-[10px] xl:text-[11px] transition-all whitespace-nowrap ${active ? 'bg-clinical-500 text-white shadow-md shadow-clinical-100' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}>
    {icon} {label}
  </button>
);

const Field = ({ label, value, onChange, isTextArea, rows=3, color }) => (
  <div>
    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</label>
    {isTextArea ? (
      <textarea rows={rows} className={`w-full px-4 py-3 border rounded-2xl outline-none focus:border-clinical-500 resize-none ${color || 'bg-white border-slate-200'}`} value={value} onChange={e => onChange(e.target.value)} />
    ) : (
      <input className={`w-full px-4 py-3 border rounded-2xl outline-none focus:border-clinical-500 ${color || 'bg-white border-slate-200'}`} value={value} onChange={e => onChange(e.target.value)} />
    )}
  </div>
);

const InputV = ({ label, placeholder, value, onChange, unit, format, type="text", required=true }) => {
  const handleChange = (e) => {
    let val = e.target.value || '';
    if (format === 'pa') val = val.replace(/[^0-9/]/g, '');
    else if (format === 'num') val = val.replace(/[^0-9]/g, '');
    else if (format === 'dec') val = val.replace(/[^0-9.]/g, '');
    onChange(val);
  };
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</label>
      <div className="relative">
        <input type={type} placeholder={placeholder} required={required} className={`w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-white font-medium ${unit ? 'pr-12' : ''}`} value={value} onChange={handleChange} />
        {unit && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">{unit}</span>}
      </div>
    </div>
  );
};

export default PacienteDetalle;