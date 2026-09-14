import toast from 'react-hot-toast';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { pacientesService, historiasService, authService, API_URL } from '../services/api';
import { TRATAMIENTOS_DB } from '../utils/tratamientosDb';
import { Diente } from '../components/Diente';
import OdontogramaEditor from '../components/OdontogramaEditor';
import { User, ShieldAlert, Save, FileText, CreditCard, Edit, X, Calendar, Home, Activity, Clipboard, Plus, DollarSign, CheckCircle, Clock, Search, Trash2, Eye, ArrowLeft, LayoutGrid, Check, Lock, RotateCcw, History, Image as ImageIcon, UploadCloud, PenTool, ChevronDown, Eraser, Users } from 'lucide-react';

// ==========================================
// BASE DE DATOS EXCLUSIVA Y CATEGORIZADA (DR. MIGUEL)
// ==========================================


// ==========================================
// HELPERS
// ==========================================
const isPiezaInArcada = (num, arcadaName) => {
  if (arcadaName === 'Maxilar Superior Permanente') return num >= 11 && num <= 28;
  if (arcadaName === 'Maxilar Inferior Permanente') return num >= 31 && num <= 48;
  if (arcadaName === 'Maxilar Superior Deciduo') return num >= 51 && num <= 65;
  if (arcadaName === 'Maxilar Inferior Deciduo') return num >= 71 && num <= 85;
  return false;
};

// Evita crasheos de React convirtiendo cualquier dato a string en minúsculas
const safeString = (val) => String(val || '').toLowerCase();

// Fecha en zona horaria de Lima (UTC-5)
const fechaHoyLima = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

// Construye la URL de imagen correctamente
const getImageSrc = (rad) => {
  if (!rad) return '';
  if (rad.imageBase64) return rad.imageBase64;
  if (rad.url_archivo) return `${API_URL}${rad.url_archivo}`;
  return '';
};

// ==========================================
// COMPONENTE: PIZARRA DIGITAL (FIRMA)
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



const Historias = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('edit'); 
  const viewId = searchParams.get('view'); 
  const isCreating = searchParams.get('action') === 'create'; 

const doctorLogueado = localStorage.getItem('userFullName') || 'Usuario Desconocido';
  const userRol  = localStorage.getItem('userRol') || '';
  const esDoctor = userRol === 'Doctor';

  // Esta pantalla quedó reemplazada por Pacientes/PacienteDetalle. Solo se deja
  // viva la vista de reporte imprimible (?view=X) — cualquier otra forma de
  // llegar aquí redirige a la pantalla nueva correspondiente, para que nunca
  // quede accesible el diseño antiguo, aunque quede algún enlace suelto sin detectar.
  useEffect(() => {
    if (editId) { navigate(`/pacientes/${editId}`, { replace: true }); return; }
    if (isCreating) { navigate('/pacientes/nuevo', { replace: true }); return; }
    if (!viewId) { navigate('/pacientes', { replace: true }); return; }
  }, [editId, viewId, isCreating, navigate]);

  
  const esAdmin  = localStorage.getItem('isAdmin') === 'true';
  const miUserId = localStorage.getItem('userId') || '';
  
  const [historiasClinicas, setHistoriasClinicas] = useState([]);
  const [pacientesBD, setPacientesBD] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [mostrarArchivadas, setMostrarArchivadas] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [dniQuery, setDniQuery] = useState('');
  const [pacienteEncontrado, setPacienteEncontrado] = useState(null);
  const [activeTab, setActiveTab] = useState(esDoctor ? 'triaje' : 'evolucion');

  const [savingHC, setSavingHC] = useState(false);
  const [hcId, setHcId] = useState(null);
  const [cargandoHC, setCargandoHC] = useState(false);
  // ESTADOS DE HC
  const [triajeData, setTriajeData] = useState({ motivo: '', antecedentesMedicos: '', antecedentesQuirurgicos: '', antecedentesOdontologicos: '', presion: '', pulso: '', temperatura: '', fc: '', fr: '' });
  const [diagnosticoData, setDiagnosticoData] = useState({ diagnostico: '', planTratamiento: '', examenClinico: '' });
  const [evoluciones, setEvoluciones] = useState([]);
  const [radiografias, setRadiografias] = useState([]); 
  const [firmaPaciente, setFirmaPaciente] = useState(null); 
  const [firmaDoctor, setFirmaDoctor] = useState(null); 
  const [snapshot, setSnapshot] = useState(null);

  const [odontograma, setOdontograma] = useState({});
  const [tratamientosAsignados, setTratamientosAsignados] = useState([]);
  const [tratamientoSearch, setTratamientoSearch] = useState('');
  const [asignadosSearch, setAsignadosSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [selectedTool, setSelectedTool] = useState(TRATAMIENTOS_DB[0]);
  const [selectedColor, setSelectedColor] = useState('red');
  const [isEraserMode, setIsEraserMode] = useState(false);
  const dropdownRef = useRef(null);

  const [editEvoId, setEditEvoId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // ✅ NUEVO: firma y sello guardados del doctor logueado (para la pestaña de Firmas)
  const [miFirma, setMiFirma] = useState(null);
  const [miSello, setMiSello] = useState(null);

  useEffect(() => {
    if (!esDoctor) return;
    authService.getMe().then(({ data }) => {
      setMiFirma(data.usuario.firma_digital || null);
      setMiSello(data.usuario.sello_digital || null);
    }).catch(() => {});
  }, [esDoctor]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [showNuevoTratamiento, setShowNuevoTratamiento] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [showAdendaModal, setShowAdendaModal] = useState(false);
  const [formAdenda, setFormAdenda] = useState({ motivo: '', contenido: '' });
  const [selectedEvolucion, setSelectedEvolucion] = useState(null);
  const [formNuevoTratamiento, setFormNuevoTratamiento] = useState({ fecha: fechaHoyLima(), descripcion: '', costoTotal: '', abonoInicial: '', estadoClinico: '', costoLaboratorio: '' });
  const [formAbono, setFormAbono] = useState({ monto: '' });

  const [showHCAuditModal, setShowHCAuditModal] = useState(false);
  const [hcAuditLogs, setHCAuditLogs] = useState([]);

  // Cargar datos
  useEffect(() => {
    const cargarTodo = async () => {
      try {
        const [pacRes, hisRes] = await Promise.all([
          pacientesService.getAll(),
          historiasService.getAll()
        ]);
        setPacientesBD(pacRes.data.data || []);
        setHistoriasClinicas(hisRes.data.data || []);

        const targetId = editId || viewId;
        if (targetId) {
          const { data } = await historiasService.getByPaciente(targetId);
          if (data.ok) {
            const h = data.data;
            setHcId(h.id);
            setTriajeData({
              motivo: h.antecedentes?.motivo_consulta || '',
              antecedentesMedicos: h.antecedentes?.antecedentes_medicos || '',
              antecedentesQuirurgicos: h.antecedentes?.antecedentes_quirurgicos || '',
              antecedentesOdontologicos: h.antecedentes?.antecedentes_odontologicos || '',
              presion: h.triaje?.presion || '',
              pulso: h.triaje?.pulso || '',
              temperatura: h.triaje?.temperatura || '',
              fc: h.triaje?.fc || '',
              fr: h.triaje?.fr || '',
            });
            setDiagnosticoData({
              diagnostico: h.antecedentes?.diagnostico || '',
              planTratamiento: h.antecedentes?.plan_tratamiento || '',
              examenClinico: h.antecedentes?.examen_clinico || '',
            });

            // Reconstruir Odontograma
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
                if (i.cara === 'Toda la pieza') {
                  const tInfo = TRATAMIENTOS_DB.find(x => String(x.id) === i.estado_codigo);
                  objOdonto[i.pieza].status = { visual: tInfo?.visual, color: i.color, tratamientoId: i.estado_codigo };
                } else if (i.cara === 'Toda la arcada') {
                  const tInfo = TRATAMIENTOS_DB.find(x => String(x.id) === i.estado_codigo);
                  objOdonto[i.pieza].arcada = { visual: tInfo?.visual || 'fondo', color: i.color, tratamientoId: i.estado_codigo };
                } else {
                  objOdonto[i.pieza].caras[i.cara] = { color: i.color, tratamientoId: i.estado_codigo };
                }
              });
            }
            setOdontograma(objOdonto);
            setTratamientosAsignados(arrAsig);
            setEvoluciones((h.consultas || []).map(c => ({
              id: c.id, fecha: c.fecha_consulta, descripcion: c.descripcion,
            costoTotal: c.costo_total, pagos: c.pagos || [],
            estadoClinico: c.estado_clinico || '',
            costoLaboratorio: c.costo_laboratorio || 0,
            gananciaNeta: c.ganancia_neta_clinica || 0,
            comisionDoctor: c.comision_doctor || 0,
            bloqueada: !!c.bloqueada,
            adendas: c.adendas || [],
            doctorId: c.doctor_id || '',
            doctorNombre: c.doctor_nombre || '',
            })));
            setRadiografias(h.radiografias || []);
            setFirmaPaciente(h.firma?.firma_paciente_data || null);
            setFirmaDoctor(h.firma?.firma_doctor_data || null);

            setSnapshot({
              triaje: {
                motivo: h.antecedentes?.motivo_consulta || '',
                antecedentesMedicos: h.antecedentes?.antecedentes_medicos || '',
                antecedentesQuirurgicos: h.antecedentes?.antecedentes_quirurgicos || '',
                antecedentesOdontologicos: h.antecedentes?.antecedentes_odontologicos || '',
                presion: h.triaje?.presion || '',
                pulso: h.triaje?.pulso || '',
                temperatura: h.triaje?.temperatura || '',
                fc: h.triaje?.fc || '',
                fr: h.triaje?.fr || '',
              },
              diagnostico: {
                diagnostico: h.antecedentes?.diagnostico || '',
                planTratamiento: h.antecedentes?.plan_tratamiento || '',
                examenClinico: h.antecedentes?.examen_clinico || '',
              },
              odontograma: JSON.stringify(arrAsig), // Se guarda como texto para comparar rápido
              firmaPaciente: h.firma?.firma_paciente_data || null,
              firmaDoctor: h.firma?.firma_doctor_data || null
            })
            
          }
        }
      } catch (err) {
        if (!isCreating) toast.error('Error al cargar datos de la historia.');
      } finally {
        setCargandoHC(false);
      }
    };

    if (editId) setCargandoHC(true);
    cargarTodo();
  }, [editId, viewId, isCreating]);

  const recargarOdontograma = async () => {
    try {
      const { data } = await historiasService.getByPaciente(editId || viewId);
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
          if (i.cara === 'Toda la pieza') {
            const tInfo = TRATAMIENTOS_DB.find(x => String(x.id) === i.estado_codigo);
            objOdonto[i.pieza].status = { visual: tInfo?.visual, color: i.color, tratamientoId: i.estado_codigo };
          } else if (i.cara === 'Toda la arcada') {
            const tInfo = TRATAMIENTOS_DB.find(x => String(x.id) === i.estado_codigo);
            objOdonto[i.pieza].arcada = { visual: tInfo?.visual || 'fondo', color: i.color, tratamientoId: i.estado_codigo };
          } else {
            objOdonto[i.pieza].caras[i.cara] = { color: i.color, tratamientoId: i.estado_codigo };
          }
        });
      }
      setOdontograma(objOdonto);
      setTratamientosAsignados(arrAsig);
    } catch (err) {
      toast.error('Error al actualizar el odontograma.');
    }
  };

  const abrirAuditoriaHC = async (pacienteId) => {
    try {
      const { data } = await historiasService.getByPaciente(pacienteId);
      setHCAuditLogs(data.data?.auditoria || []);
      setShowHCAuditModal(true);
    } catch {
      toast.error('Error al cargar el historial de cambios.');
    }
  };

  const handleGuardarDatosHC = async () => {
    if (isCreating && !pacienteEncontrado) { toast.error('Vincule un paciente primero.'); return; }
    setSavingHC(true);
    try {
      let historiaId = hcId;

      // PASO 1: Crear historia si es nueva
      if (isCreating) {
        const { data } = await historiasService.crear({ paciente_id: pacienteEncontrado.id });
        historiaId = data.historiaId;
        setHcId(historiaId);
      }

        // PASO 2: ZONA CLÍNICA — solo el Doctor guarda estos datos (Con Auditoría Estricta)
      if (esDoctor) {
        // Analizamos si hubo cambios reales comparando con la foto inicial
        const triajeCambio = isCreating || JSON.stringify(triajeData) !== JSON.stringify(snapshot?.triaje);
        const diagCambio   = isCreating || JSON.stringify(diagnosticoData) !== JSON.stringify(snapshot?.diagnostico);
        const firmasCambio = isCreating || (firmaPaciente !== snapshot?.firmaPaciente);

        // 1. Solo actualiza antecedentes si cambió el Triaje o el Diagnóstico
        if (triajeCambio || diagCambio) {
          await historiasService.guardarAntecedentes(historiaId, {
            motivo_consulta:              triajeData.motivo,
            antecedentes_medicos:         triajeData.antecedentesMedicos,
            antecedentes_quirurgicos:     triajeData.antecedentesQuirurgicos,
            antecedentes_odontologicos:   triajeData.antecedentesOdontologicos,
            diagnostico:                  diagnosticoData.diagnostico,
            plan_tratamiento:             diagnosticoData.planTratamiento,
            examen_clinico:               diagnosticoData.examenClinico,
            presion:                      triajeData.presion,
            pulso:                        triajeData.pulso,
            temperatura:                  triajeData.temperatura,
            fc:                           triajeData.fc,
            fr:                           triajeData.fr,
          });
        }

        // El odontograma ya no se guarda aquí — cada diagnóstico/procedimiento
        // se firma y guarda solo, al instante, desde su propio botón "Guardar y Firmar".

        // 3. Solo actualiza firmas si alguien firmó de nuevo
            if (firmasCambio && firmaPaciente) {
             await historiasService.guardarFirmas(historiaId, {
              firma_paciente_data: firmaPaciente,
          });
        }
      }
      // PASO 3: ZONA ADMINISTRATIVA
      if (isCreating && evoluciones.length > 0) {
        for (const evo of evoluciones) {
          const totalPagado = (evo.pagos || []).reduce((s, p) => s + parseFloat(p.monto || 0), 0);
          await historiasService.agregarConsulta(historiaId, {
            descripcion:    evo.descripcion,
            costo_total:    evo.costoTotal,
            abono_inicial:  totalPagado,
            fecha_consulta: evo.fecha,
          });
        }
      }
      
      // PASO 4: Subir radiografías pendientes (Modo Borrador)
// PASO 4: Subir radiografías pendientes (Modo Borrador)
      // ZONA ADMINISTRATIVA: Doctor y Administradora pueden subir placas
      const pendientes = radiografias.filter(r => r.isPending);
      for (const rad of pendientes) {
        const formData = new FormData();
        formData.append('imagen', rad.file);
        formData.append('descripcion', rad.descripcion);
        await historiasService.subirRadiografia(historiaId, formData);
      }

      toast.success(esDoctor
        ? 'Historia clínica guardada exitosamente.'
        : 'Datos administrativos guardados exitosamente.'
      );
      navigate('/historias');

    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.mensaje || 'Error al guardar la historia clínica.');
    } finally {
      setSavingHC(false);
    }
    
  };

   const recargarListaHistorias = async (incluirArchivadas) => {
    try {
      const hisRes = await historiasService.getAll(undefined, incluirArchivadas ? 'true' : undefined);
      setHistoriasClinicas(hisRes.data.data || []);
    } catch (err) {
      toast.error('Error al cargar historias.');
    }
  };

  const handleToggleArchivadas = () => {
    const nuevo = !mostrarArchivadas;
    setMostrarArchivadas(nuevo);
    recargarListaHistorias(nuevo);
  };

  const handleBorrarHistoria = async (pacienteIdTarget) => {
    if (!window.confirm('¿Archivar esta Historia Clínica? Dejará de verse en la lista, pero sus datos quedan guardados. Podrás reactivarla luego con el botón "Mostrar archivadas".')) return;
    try {
      await historiasService.eliminar(pacienteIdTarget);
      await recargarListaHistorias(mostrarArchivadas);
      toast.success('Historia clínica archivada.');
    } catch (err) {
      toast.error('Error al archivar la historia clínica.');
    }
  };

  const handleReactivarHistoria = async (pacienteIdTarget) => {
    try {
      await historiasService.reactivar(pacienteIdTarget);
      await recargarListaHistorias(mostrarArchivadas);
      toast.success('Historia clínica reactivada.');
    } catch (err) {
      toast.error('Error al reactivar la historia clínica.');
    }
  };

  const handleEliminarTratamiento = (tratId) => {
    const trat = tratamientosAsignados.find(t => t.id === tratId);
    if (!trat) return;

    setTratamientosAsignados(prev => prev.filter(t => t.id !== tratId));
    
    if (trat.cara === 'Toda la arcada') {
      let arcadaTeeth = [];
      if (trat.pieza === 'Maxilar Superior Permanente') arcadaTeeth = [18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28];
      else if (trat.pieza === 'Maxilar Inferior Permanente') arcadaTeeth = [48,47,46,45,44,43,42,41, 31,32,33,34,35,36,37,38];
      else if (trat.pieza === 'Maxilar Superior Deciduo') arcadaTeeth = [55,54,53,52,51, 61,62,63,64,65];
      else if (trat.pieza === 'Maxilar Inferior Deciduo') arcadaTeeth = [85,84,83,82,81, 71,72,73,74,75];
      
      setOdontograma(prev => {
        const nuevoOdonto = { ...prev };
        arcadaTeeth.forEach(n => {
            if (nuevoOdonto[n]) nuevoOdonto[n] = { ...nuevoOdonto[n], arcada: null };
        });
        return nuevoOdonto;
      });
      return;
    }

    setOdontograma(prev => {
      const dActual = prev[trat.pieza] || { caras: {}, status: null };
      if (trat.cara === 'Toda la pieza') {
        return { ...prev, [trat.pieza]: { ...dActual, status: null } };
      } else {
        return { ...prev, [trat.pieza]: { ...dActual, caras: { ...dActual.caras, [trat.cara]: null } } };
      }
    });
  };

  const handleCaraClick = (dienteNum, cara) => {
    if (isEraserMode) {
      const tratCara = tratamientosAsignados.find(t => t.pieza === dienteNum && t.cara === cara);
      if (tratCara) { handleEliminarTratamiento(tratCara.id); return; }
      
      const tratDiente = tratamientosAsignados.find(t => t.pieza === dienteNum && t.cara === 'Toda la pieza');
      if (tratDiente) { handleEliminarTratamiento(tratDiente.id); return; }

      let arcadaName = '';
      if (dienteNum >= 11 && dienteNum <= 28) arcadaName = 'Maxilar Superior Permanente';
      else if (dienteNum >= 31 && dienteNum <= 48) arcadaName = 'Maxilar Inferior Permanente';
      else if (dienteNum >= 51 && dienteNum <= 65) arcadaName = 'Maxilar Superior Deciduo';
      else if (dienteNum >= 71 && dienteNum <= 85) arcadaName = 'Maxilar Inferior Deciduo';

      const tratArcada = tratamientosAsignados.find(t => t.pieza === arcadaName);
      if (tratArcada) { handleEliminarTratamiento(tratArcada.id); }
      return; 
    }

    if (!selectedTool) return;

    if (selectedTool.tipo === 'arcada') {
      let arcadaName = '';
      let arcadaTeeth = [];
      if (dienteNum >= 11 && dienteNum <= 28) { arcadaName = 'Maxilar Superior Permanente'; arcadaTeeth = [18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28]; }
      else if (dienteNum >= 31 && dienteNum <= 48) { arcadaName = 'Maxilar Inferior Permanente'; arcadaTeeth = [48,47,46,45,44,43,42,41, 31,32,33,34,35,36,37,38]; }
      else if (dienteNum >= 51 && dienteNum <= 65) { arcadaName = 'Maxilar Superior Deciduo'; arcadaTeeth = [55,54,53,52,51, 61,62,63,64,65]; }
      else if (dienteNum >= 71 && dienteNum <= 85) { arcadaName = 'Maxilar Inferior Deciduo'; arcadaTeeth = [85,84,83,82,81, 71,72,73,74,75]; }
      
      const isSame = tratamientosAsignados.some(t => t.pieza === arcadaName && t.tratamientoId === selectedTool.id && t.color === selectedColor);
      
      if (isSame) {
        setTratamientosAsignados(list => list.filter(t => !(t.pieza === arcadaName && t.tratamientoId === selectedTool.id)));
        setOdontograma(prev => {
          const nuevoOdonto = { ...prev };
          arcadaTeeth.forEach(n => { if (nuevoOdonto[n]) nuevoOdonto[n] = { ...nuevoOdonto[n], arcada: null }; });
          return nuevoOdonto;
        });
      } else {
        const nuevoTratamiento = { id: Date.now(), pieza: arcadaName, cara: 'Toda la arcada', tratamientoId: selectedTool.id, tratamientoNombre: selectedTool.nombre, color: selectedColor, fecha: new Date().toLocaleDateString('es-PE') };
        setTratamientosAsignados(list => [nuevoTratamiento, ...list.filter(t => t.pieza !== arcadaName)]);
        setOdontograma(prev => {
          const nuevoOdonto = { ...prev };
          arcadaTeeth.forEach(n => { nuevoOdonto[n] = { ...nuevoOdonto[n] || {caras:{}, status:null}, arcada: { visual: selectedTool.visual || 'fondo', color: selectedColor, tratamientoId: selectedTool.id } }; });
          return nuevoOdonto;
        });
      }
      return; 
    }

    setOdontograma(prev => {
      const dActual = prev[dienteNum] || { caras: {}, status: null, arcada: prev[dienteNum]?.arcada || null };
      
      if (selectedTool.tipo === 'diente') {
        const isSame = dActual.status?.tratamientoId === selectedTool.id && dActual.status?.color === selectedColor;
        if (isSame) {
          setTratamientosAsignados(list => list.filter(t => !(t.pieza === dienteNum && t.tratamientoId === selectedTool.id)));
          return { ...prev, [dienteNum]: { ...dActual, status: null } };
        } else {
          const nuevoTratamiento = { id: Date.now(), pieza: dienteNum, cara: 'Toda la pieza', tratamientoId: selectedTool.id, tratamientoNombre: selectedTool.nombre, color: selectedColor, fecha: new Date().toLocaleDateString('es-PE') };
          setTratamientosAsignados(list => [nuevoTratamiento, ...list.filter(t => t.pieza !== dienteNum || t.cara !== 'Toda la pieza')]);
          return { ...prev, [dienteNum]: { ...dActual, status: { visual: selectedTool.visual, color: selectedColor, tratamientoId: selectedTool.id } } };
        }
      } 
      
      if (selectedTool.tipo === 'cara') {
        const isSame = dActual.caras[cara]?.tratamientoId === selectedTool.id && dActual.caras[cara]?.color === selectedColor;
        if (isSame) {
          setTratamientosAsignados(list => list.filter(t => !(t.pieza === dienteNum && t.cara === cara && t.tratamientoId === selectedTool.id)));
          return { ...prev, [dienteNum]: { ...dActual, caras: { ...dActual.caras, [cara]: null } } };
        } else {
          const nuevoTratamiento = { id: Date.now(), pieza: dienteNum, cara: cara, tratamientoId: selectedTool.id, tratamientoNombre: selectedTool.nombre, color: selectedColor, fecha: new Date().toLocaleDateString('es-PE') };
          setTratamientosAsignados(list => [nuevoTratamiento, ...list.filter(t => !(t.pieza === dienteNum && t.cara === cara))]);
          return { ...prev, [dienteNum]: { ...dActual, caras: { ...dActual.caras, [cara]: { color: selectedColor, tratamientoId: selectedTool.id } } } };
        }
      }
      return prev;
    });
  };

  const handleLimpiarOdontograma = () => {
    if(!window.confirm('¿Estás seguro de limpiar todo el odontograma? Se borrarán todos los tratamientos asignados.')) return;
    setOdontograma({});
    setTratamientosAsignados([]);
  };

  const getAsignadosForPieza = (n) => {
    return tratamientosAsignados.filter(t =>
      String(t.pieza) === String(n) ||
      (t.cara === 'Toda la arcada' && isPiezaInArcada(n, t.pieza))
    );
  };

  const handleBuscarPorDni = (e) => {
    e.preventDefault();
    if (!dniQuery) return;
    const found = pacientesBD.find(p => String(p.dni) === dniQuery);
    if (!found) { toast.error('No se encontró el DNI en el sistema.'); return; }
    if (historiasClinicas.find(h => h.paciente_id === found.id)) { toast.error('Este paciente ya tiene una historia clínica registrada.'); return; }
    setPacienteEncontrado(found);
    setDniQuery('');
  };

const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Si la HC aún no está en MySQL, guardamos la foto en "memoria" (Modo Borrador)
    if (!hcId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRadiografias(prev => [...prev, {
          id: Date.now(), // ID temporal
          file: file, // Guardamos el archivo físico para enviarlo luego
          imageBase64: reader.result, // Para la vista previa
          descripcion: 'Placa Anexa',
          isPending: true // Bandera para saber que falta subir
        }]);
      };
      reader.readAsDataURL(file);
      toast.success('Placa en borrador. Se subirá al guardar la HC.');
      return;
    }

    // Si la HC ya existe, se sube directo a Node.js
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
    }
  };

const handleEliminarRadiografia = async (id) => {
    if (!window.confirm('¿Eliminar esta placa?')) return;
    
    // Si la placa solo estaba en memoria (borrador)
    const radToDelete = radiografias.find(r => r.id === id);
    if (radToDelete?.isPending) {
      setRadiografias(prev => prev.filter(r => r.id !== id));
      toast.success('Placa eliminada.');
      return;
    }

    // Si ya estaba guardada en MySQL
    try {
      await historiasService.eliminarRadiografia(id);
      setRadiografias(prev => prev.filter(r => r.id !== id));
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

    if (editEvoId) {
      if (hcId) {
        try {
          await historiasService.editarConsulta(editEvoId, {
            descripcion: formNuevoTratamiento.descripcion,
            costo_total: costo,
            fecha_consulta: formNuevoTratamiento.fecha,
          });
          const res = await historiasService.getByPaciente(editId || viewId);
          setEvoluciones((res.data.data.consultas || []).map(c => ({
            id: c.id, fecha: c.fecha_consulta, descripcion: c.descripcion,
            costoTotal: c.costo_total, pagos: c.pagos || [],
            estadoClinico: c.estado_clinico || '',
            costoLaboratorio: c.costo_laboratorio || 0,
            gananciaNeta: c.ganancia_neta_clinica || 0,
            comisionDoctor: c.comision_doctor || 0,
            bloqueada: !!c.bloqueada,
            adendas: c.adendas || [],
          })));
          toast.success('Tratamiento actualizado.');
       }   catch (err) {
          toast.error(err.response?.data?.mensaje || 'Error al actualizar.');
       }
      } else {
        setEvoluciones(evoluciones.map(evo => 
          evo.id === editEvoId 
            ? { ...evo, fecha: formNuevoTratamiento.fecha, descripcion: formNuevoTratamiento.descripcion, costoTotal: costo } 
            : evo
        ));
      }
    } else {
      const abono = parseFloat(formNuevoTratamiento.abonoInicial) || 0;
      if (abono > costo) { toast.error('El abono no puede exceder el costo total.'); return; }
      
      if (hcId) {
        try {
         await historiasService.agregarConsulta(hcId, {
            descripcion: formNuevoTratamiento.descripcion,
            costo_total: costo,
            abono_inicial: abono,
            fecha_consulta: formNuevoTratamiento.fecha,
            estado_clinico: formNuevoTratamiento.estadoClinico,
            costo_laboratorio: parseFloat(formNuevoTratamiento.costoLaboratorio) || 0,
          });
          const res = await historiasService.getByPaciente(editId || viewId);
          setEvoluciones((res.data.data.consultas || []).map(c => ({
            id: c.id, fecha: c.fecha_consulta, descripcion: c.descripcion,
            costoTotal: c.costo_total, pagos: c.pagos || [],
            estadoClinico: c.estado_clinico || '',
            costoLaboratorio: c.costo_laboratorio || 0,
            gananciaNeta: c.ganancia_neta_clinica || 0,
            comisionDoctor: c.comision_doctor || 0,
            bloqueada: !!c.bloqueada,
            adendas: c.adendas || [],
          })));
          toast.success('Tratamiento agregado.');
        } catch {
          toast.error('Error al agregar.');
        }
      } else {
        const nuevoRegistro = { id: Date.now(), fecha: formNuevoTratamiento.fecha, descripcion: formNuevoTratamiento.descripcion, costoTotal: costo, pagos: abono > 0 ? [{ id: Date.now(), fechaHora: new Date().toLocaleString('es-PE'), monto: abono }] : [] };
        setEvoluciones([nuevoRegistro, ...evoluciones]);
      }
    }

    setShowNuevoTratamiento(false);
    setEditEvoId(null);
    setFormNuevoTratamiento({ fecha: fechaHoyLima(), descripcion: '', costoTotal: '', abonoInicial: '', estadoClinico: '', costoLaboratorio: '' });
  };

  const handleEliminarEvolucion = async (id) => {
    if (!window.confirm('¿Estás seguro que deseas eliminar este tratamiento y todo su historial de pagos? Esta acción no se puede deshacer.')) return;
    
    if (hcId) {
      try {
        await historiasService.eliminarConsulta(id);
        setEvoluciones(evoluciones.filter(e => e.id !== id));
        toast.success('Tratamiento eliminado.');
      } catch (err) {
        toast.error(err.response?.data?.mensaje || 'Error al eliminar.');
      }
    } else {
      setEvoluciones(evoluciones.filter(e => e.id !== id));
    }
  };

  const handleAbonar = async (e) => {
    e.preventDefault();
    const abono = parseFloat(formAbono.monto);
    const resta = parseFloat(calcularResta(selectedEvolucion?.costoTotal, selectedEvolucion?.pagos));
    if (abono <= 0 || abono > resta) { toast.error('Monto inválido.'); return; }
    
    if (hcId) {
      try {
        await historiasService.registrarPago(selectedEvolucion.id, { monto: abono });
        const res = await historiasService.getByPaciente(editId || viewId);
        setEvoluciones((res.data.data.consultas || []).map(c => ({
          id: c.id, fecha: c.fecha_consulta, descripcion: c.descripcion,
            costoTotal: c.costo_total, pagos: c.pagos || [],
            estadoClinico: c.estado_clinico || '',
            costoLaboratorio: c.costo_laboratorio || 0,
            gananciaNeta: c.ganancia_neta_clinica || 0,
            comisionDoctor: c.comision_doctor || 0,
            bloqueada: !!c.bloqueada,
            adendas: c.adendas || [],
        })));
        toast.success('Abono registrado.');
      } catch {
        toast.error('Error al registrar abono.');
      }
    } else {
      setEvoluciones(evoluciones.map(evo => evo.id === selectedEvolucion.id ? { ...evo, pagos: [...(Array.isArray(evo.pagos) ? evo.pagos : []), { id: Date.now(), fechaHora: new Date().toLocaleString('es-PE'), monto: abono }] } : evo));
    }
    
   setShowAbonoModal(false);
      setFormAbono({ monto: '' });
    };

  const handleAgregarAdenda = async (e) => {
    e.preventDefault();
    if (!formAdenda.motivo || !formAdenda.contenido) {
      toast.error('Completa el motivo y la corrección.'); return;
    }
    try {
      await historiasService.agregarAdendaConsulta(selectedEvolucion.id, formAdenda);
      const res = await historiasService.getByPaciente(editId || viewId);
      setEvoluciones((res.data.data.consultas || []).map(c => ({
        id: c.id, fecha: c.fecha_consulta, descripcion: c.descripcion,
        costoTotal: c.costo_total, pagos: c.pagos || [],
        estadoClinico: c.estado_clinico || '',
        costoLaboratorio: c.costo_laboratorio || 0,
        gananciaNeta: c.ganancia_neta_clinica || 0,
        comisionDoctor: c.comision_doctor || 0,
        bloqueada: !!c.bloqueada,
        adendas: c.adendas || [],
      })));
      toast.success('Corrección agregada correctamente.');
      setShowAdendaModal(false);
      setFormAdenda({ motivo: '', contenido: '' });
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al agregar la corrección.');
    }
  };

  const getEstadoPagoGlobal = (historia) => {
    const totalTratamientos = parseFloat(historia.total_tratamientos || 0);
    const totalPagado = parseFloat(historia.total_pagado || 0);
    
    if (totalTratamientos === 0) return { text: 'Sin tratamientos', class: 'bg-slate-100 text-slate-500' };
    const deuda = totalTratamientos - totalPagado;
    
    return deuda > 0 
      ? { text: 'Falta Pagar', class: 'bg-red-100 text-red-700 border-red-200' } 
      : { text: 'Pagada', class: 'bg-green-100 text-green-700 border-green-200' };
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

  const tratamientosFiltrados = TRATAMIENTOS_DB.filter(t => safeString(t.nombre).includes(safeString(tratamientoSearch)));
  const categoriasUnicas = [...new Set(tratamientosFiltrados.map(t => t.categoria))];
  const asignadosFiltrados = (tratamientosAsignados || []).filter(t => safeString(t?.tratamientoNombre).includes(safeString(asignadosSearch)) || safeString(t?.pieza).includes(safeString(asignadosSearch)));

  if (isCreating || editId) {
    return null;
  }


  // =========================================================================
  // VISTA 2: REPORTE PROFESIONAL PARA IMPRESIÓN
  // =========================================================================
  if (viewId) {
    const pInfo = pacientesBD.find(p => String(p.id) === viewId) || {};
    const hInfo = historiasClinicas.find(h => String(h.paciente_id) === viewId) || {};
    const edad = calculateAge(pInfo.fecha_nacimiento);
    const hasRadiografias = radiografias.length > 0;

    const docNombre       = hInfo.creado_por_nombre   || doctorLogueado;
    const docEspecialidad = hInfo.doctor_especialidad || 'Odontología General';
    const docCop          = hInfo.doctor_cop ? `COP: ${hInfo.doctor_cop}` : '';

    const tratamientosAsignadosGuardados = tratamientosAsignados || [];

    const handleImprimir = () => {
      const docName = `${hInfo.nro_historia}_${pInfo.apellidos}_${pInfo.nombres}`.replace(/\s+/g, '_');
      document.title = docName;
      window.print();
      document.title = "Micodent";
    };
    
    return (
      <div className="animate-fade-in text-slate-800 max-w-4xl mx-auto pb-10 print:pb-0">
        
        <style>{`
          @page { margin: 8mm; size: A4 portrait; } 
          @media print { 
            body { -webkit-print-color-adjust: exact; background: white; margin: 0; padding: 0; } 
            nav { display: none !important; }
            .saltar-pagina { page-break-before: always !important; break-before: page !important; }
            .print-compact { margin-bottom: 0.25rem !important; }
            .hoja-impresion { padding: 0 !important; }
          }
        `}</style>
        
        <div className="flex items-center justify-between mb-6 print:hidden">
          <button onClick={() => navigate('/historias')} className="p-2 hover:bg-slate-200 rounded-full bg-slate-100 transition-colors"><ArrowLeft size={24} /></button>
          <button className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-700 shadow-lg flex items-center gap-2" onClick={handleImprimir}><FileText size={18}/> Imprimir Reporte</button>
        </div>

        <div className="bg-white p-10 rounded-none shadow-none print:w-[190mm] print:overflow-hidden mx-auto mb-10 print:mb-0 box-border hoja-impresion">
          
          <div className="hidden print:flex items-center gap-4 mb-4 print:mb-2 border-b-2 border-slate-800 pb-2">
            <img src="/logo.png" alt="Micodent" className="h-10 w-auto object-contain" />
            <div><h1 className="text-xl font-black text-slate-800 leading-tight tracking-widest uppercase">Micodent</h1><p className="text-[10px] text-clinical-600 uppercase font-black tracking-widest">Sede Jauja</p></div>
          </div>

          <div className="text-center border-b-2 border-slate-800 pb-2 mb-4 print:border-none print:mb-2">
            <h1 className="text-xl font-black uppercase tracking-widest text-slate-800">Historia Clínica Odontológica</h1>
            <p className="text-slate-500 font-bold tracking-widest text-xs">{hInfo.nro_historia || 'HC-XXXX'}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-4 print:mb-2 text-xs print:text-[9px] print:leading-tight">
            <div><span className="font-bold text-slate-500">Paciente:</span> <span className="font-black text-slate-800 text-sm print:text-[10px]">{pInfo.apellidos}, {pInfo.nombres}</span></div>
            <div className="text-right"><span className="font-bold text-slate-500">DNI:</span> <span className="font-black">{pInfo.dni}</span></div>
            <div><span className="font-bold text-slate-500">Edad y Sexo:</span> <span className="font-black">{edad} años • {pInfo.sexo === 'M' ? 'Masculino' : 'Femenino'}</span></div>
            <div className="text-right"><span className="font-bold text-slate-500">Celular:</span> <span className="font-black">{pInfo.celular}</span></div>
            <div><span className="font-bold text-slate-500">Fecha Nacimiento:</span> <span className="font-black">{pInfo.fecha_nacimiento}</span></div>
            <div className="text-right"><span className="font-bold text-slate-500">Apertura:</span> <span className="font-black">{hInfo.fecha_creacion}</span></div>
            <div className="col-span-2"><span className="font-bold text-slate-500">Domicilio:</span> <span className="font-black">{pInfo.domicilio}</span></div>
          </div>

          {pInfo.apoderado_nombre && (
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 mb-4 print:mb-2 text-[10px] print:text-[8px]">
              <p className="font-black text-slate-600 uppercase tracking-widest mb-1 border-b pb-0.5">Datos del Apoderado</p>
              <div className="grid grid-cols-3 gap-2">
                <div><span className="font-bold text-slate-500">Nombre:</span> <span className="font-black">{pInfo.apoderado_nombre}</span></div><div><span className="font-bold text-slate-500">Parentesco:</span> <span className="font-black">{pInfo.parentesco}</span></div><div><span className="font-bold text-slate-500">Celular:</span> <span className="font-black">{pInfo.apoderado_celular}</span></div>
              </div>
            </div>
          )}

          <div className="space-y-3 print:space-y-1">
            <ReportSection title="1. Triaje y Anamnesis">
              <div className="mb-1"><strong>Motivo:</strong> {triajeData.motivo || '---'}</div>
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 print:p-1 rounded-lg mb-2 print:mb-1 border border-slate-200 text-[10px] print:text-[8px]">
                <div><strong>Ant. Médicos:</strong> {triajeData.antecedentesMedicos || 'Ninguno'}</div><div><strong>Ant. Quirúrgicos:</strong> {triajeData.antecedentesQuirurgicos || 'Ninguno'}</div><div><strong>Ant. Odontológicos:</strong> {triajeData.antecedentesOdontologicos || 'Ninguno'}</div>
              </div>
              <div className="flex justify-between bg-slate-800 text-white p-2 print:p-1 rounded-lg text-[10px] print:text-[8px] font-bold">
                <span>P.A: {triajeData.presion || '-'} mmHg</span><span>Pulso: {triajeData.pulso || '-'} lpm</span><span>Temp: {triajeData.temperatura || '-'} °C</span><span>F.C: {triajeData.fc || '-'} lpm</span><span>F.R: {triajeData.fr || '-'} rpm</span>
              </div>
            </ReportSection>

            <ReportSection title="2. Diagnóstico y Plan">
              <div className="mb-0.5"><strong>Examen Clínico:</strong> {diagnosticoData.examenClinico || '---'}</div>
              <div className="mb-0.5"><strong>Diagnóstico:</strong> <span className="text-orange-700 font-bold">{diagnosticoData.diagnostico || '---'}</span></div>
              <div><strong>Plan:</strong> <span className="text-blue-700 font-bold">{diagnosticoData.planTratamiento || '---'}</span></div>
            </ReportSection>

                 <ReportSection title="3. Odontograma">
                  <p className="text-[9px] print:text-[7px] text-slate-500 text-center mb-2">
                    <span className="inline-flex items-center gap-1 mr-3"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> Diagnóstico registrado</span>
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> Procedimiento registrado</span>
                  </p>
                  <div className="flex justify-center mt-2 print:mt-1 mb-2">
                <div className="space-y-6 print:space-y-2 w-full">
                   <div className="flex justify-center gap-6 print:gap-3"><div className="flex gap-1.5 print:gap-0.5">{[18, 17, 16, 15, 14, 13, 12, 11].map(n => <Diente key={n} numero={n} datos={odontograma[n]} asignados={getAsignadosForPieza(n)} />)}</div><div className="flex gap-1.5 print:gap-0.5">{[21, 22, 23, 24, 25, 26, 27, 28].map(n => <Diente key={n} numero={n} datos={odontograma[n]} asignados={getAsignadosForPieza(n)} />)}</div></div>
                   <div className="flex justify-center gap-6 print:gap-3 opacity-80"><div className="flex gap-1.5 print:gap-0.5">{[55, 54, 53, 52, 51].map(n => <Diente key={n} numero={n} datos={odontograma[n]} asignados={getAsignadosForPieza(n)} />)}</div><div className="flex gap-1.5 print:gap-0.5">{[61, 62, 63, 64, 65].map(n => <Diente key={n} numero={n} datos={odontograma[n]} asignados={getAsignadosForPieza(n)} />)}</div></div>
                   <div className="flex justify-center gap-6 print:gap-3 opacity-80"><div className="flex gap-1.5 print:gap-0.5">{[85, 84, 83, 82, 81].map(n => <Diente key={n} numero={n} datos={odontograma[n]} asignados={getAsignadosForPieza(n)} />)}</div><div className="flex gap-1.5 print:gap-0.5">{[71, 72, 73, 74, 75].map(n => <Diente key={n} numero={n} datos={odontograma[n]} asignados={getAsignadosForPieza(n)} />)}</div></div>
                   <div className="flex justify-center gap-6 print:gap-3"><div className="flex gap-1.5 print:gap-0.5">{[48, 47, 46, 45, 44, 43, 42, 41].map(n => <Diente key={n} numero={n} datos={odontograma[n]} asignados={getAsignadosForPieza(n)} />)}</div><div className="flex gap-1.5 print:gap-0.5">{[31, 32, 33, 34, 35, 36, 37, 38].map(n => <Diente key={n} numero={n} datos={odontograma[n]} asignados={getAsignadosForPieza(n)} />)}</div></div>
                </div>
              </div>
            </ReportSection>

            {tratamientosAsignadosGuardados && tratamientosAsignadosGuardados.length > 0 && (
              <ReportSection title="4. Tratamientos Registrados en Odontograma">
                 <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    {tratamientosAsignadosGuardados.map(t => (
                      <div key={t.id} className="text-[9px] print:text-[7.5px] border-b border-slate-100 flex justify-between">
                         <span><strong>Pieza {t.pieza} {t.cara !== 'Toda la pieza' && t.cara !== 'Toda la arcada' ? `(${t.cara})` : ''}</strong>: {t.tratamientoNombre}</span>
                         <span className={t.color === 'blue' ? 'text-blue-600 font-bold' : 'text-red-600 font-bold'}>{t.color === 'blue' ? 'A Realizar' : 'Existente'}</span>
                      </div>
                    ))}
                 </div>
              </ReportSection>
            )}

            <ReportSection title="5. Resumen Financiero">
              <table className="w-full text-left text-[10px] print:text-[8px] border border-slate-200">
                <thead className="bg-slate-100"><tr><th className="p-1 border-b">Fecha</th><th className="p-1 border-b">Evolución</th><th className="p-1 border-b">Costo</th><th className="p-1 border-b">Pagado</th><th className="p-1 border-b text-orange-600">Resta</th></tr></thead>
                <tbody>
                  {evoluciones.length === 0 ? <tr><td colSpan="5" className="p-2 text-center text-slate-400">Sin tratamientos.</td></tr> : evoluciones.map(evo => {
                      const pagado = calcularTotalPagado(evo.pagos);
                      return (
                        <tr key={evo.id} className="border-b">
                          <td className="p-1 print:p-0.5 align-top">{evo.fecha}</td><td className="p-1 print:p-0.5">{evo.descripcion}</td>
                          <td className="p-1 print:p-0.5 font-bold align-top">S/ {parseFloat(evo.costoTotal).toFixed(2)}</td><td className="p-1 print:p-0.5 font-bold text-green-600 align-top">S/ {pagado.toFixed(2)}</td><td className="p-1 print:p-0.5 font-black text-orange-600 align-top">S/ {(parseFloat(evo.costoTotal || 0) - pagado).toFixed(2)}</td>
                        </tr>
                      );
                  })}
                </tbody>
              </table>
            </ReportSection>

            <div className="pt-6 mt-8 print:pt-2 print:mt-2 border-t-2 border-slate-200 print:break-inside-avoid">
              <div className="flex justify-between items-end px-12 print:px-6">
              <FirmaSelloBlock
                  firma={firmaPaciente}
                  nombre={`${pInfo.apellidos}, ${pInfo.nombres}`}
                  subtitulo={`DNI: ${pInfo.dni}`}
                  label="Firma del Paciente / Apoderado"
                />
                <FirmaSelloBlock
                  firma={hInfo.doctor_firma}
                  sello={hInfo.doctor_sello}
                  nombre={docNombre}
                  subtitulo={`${docEspecialidad} | ${docCop}`}
                  label="Firma y Sello del Médico Tratante"
                />
              </div>
            </div>
          </div>
        </div>

        {hasRadiografias && (
          <div className="saltar-pagina bg-white p-10 rounded-none shadow-none print:w-[190mm] print:h-auto mx-auto mt-10 print:mt-0 box-border hoja-impresion">
            <div className="hidden print:flex items-center gap-4 mb-4 border-b-2 border-slate-800 pb-2">
              <img src="/logo.png" alt="Micodent" className="h-10 w-auto object-contain" />
              <div><h1 className="text-xl font-black text-slate-800 leading-tight tracking-widest uppercase">Micodent</h1><p className="text-[10px] text-clinical-600 uppercase font-black tracking-widest">Placas Anexas</p></div>
            </div>
            <div className="text-center border-b-2 border-slate-800 pb-2 mb-6 print:border-none print:mb-4">
              <h1 className="text-xl font-black uppercase tracking-widest text-slate-800">Anexos Fotográficos y Radiográficos</h1>
              <p className="text-slate-500 font-bold tracking-widest text-xs mt-1">Paciente: {pInfo.apellidos}, {pInfo.nombres} | {hInfo.nro_historia}</p>
            </div>
            <div className="grid grid-cols-1 gap-8 mt-6">
              {radiografias.map((rad, idx) => (
                <div key={rad.id} className="border border-slate-300 rounded-xl overflow-hidden print:break-inside-avoid mb-4">
                  <div className="bg-black p-2 flex justify-center items-center h-64 print:h-[120mm]">
                    <img src={getImageSrc(rad)} alt={`Anexo ${idx+1}`} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="bg-slate-100 p-2 text-center border-t border-slate-300">
                    <p className="font-bold text-xs text-slate-800 uppercase tracking-widest">{rad.descripcion || `Imagen Anexa ${idx+1}`}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};
  
const FirmaSelloBlock = ({ firma, sello, nombre, subtitulo, label = 'Firma y Sello' }) => (
  <div className="flex flex-col items-center w-48 print:w-32">
    <div className="w-full h-10 print:h-8 flex items-end justify-center">
      {firma && <img src={firma} alt="Firma" className="max-h-full max-w-full object-contain" />}
    </div>
    {sello && (
      <div className="w-full h-14 print:h-10 flex items-center justify-center -mt-1">
        <img src={sello} alt="Sello" className="max-h-full max-w-full object-contain opacity-95" />
      </div>
    )}
    <div className="w-full border-t border-slate-800 pt-1.5 text-center mt-1">
      <p className="font-black text-clinical-700 text-[10px] print:text-[8px] uppercase truncate">{nombre}</p>
      {subtitulo && <p className="text-[9px] print:text-[7px] text-slate-500">{subtitulo}</p>}
      <p className="text-[8px] print:text-[6px] font-black text-slate-400 mt-1 uppercase">{label}</p>
    </div>
  </div>
);

const ReportSection = ({ title, children }) => (
  <div className="mb-4 print-compact"><h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px] mb-2 border-b-2 border-slate-200 pb-1">{title}</h3><div className="text-xs text-slate-700">{children}</div></div>
);

const TabBtn = ({ active, onClick, icon, label, color }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${active ? (color || 'bg-clinical-500 text-white shadow-lg shadow-clinical-100') : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}>
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

export default Historias;