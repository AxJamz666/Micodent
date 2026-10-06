import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { pacientesService, historiasService, authService } from '../services/api';
import ClinicalImage from '../components/ClinicalImage';
import { TRATAMIENTOS_DB } from '../utils/tratamientosDb';
import { Diente } from '../components/Diente';
import FirmaMiniBlock from '../components/FirmaMiniBlock';
import { FileText, ArrowLeft } from 'lucide-react';

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

const subirRadiografiasPendientes = async (historiaId, radiografias) => {
  for (const rad of radiografias.filter(r => r.isPending)) {
    const formData = new FormData();
    formData.append('imagen', rad.file);
    formData.append('descripcion', rad.descripcion);
    await historiasService.subirRadiografia(historiaId, formData);
  }
};


// ==========================================
// COMPONENTE: PIZARRA DIGITAL (FIRMA)
// ==========================================



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
    if (!viewId) { navigate('/pacientes', { replace: true }); }
  }, [editId, viewId, isCreating, navigate]);

  
  
  const [historiasClinicas, setHistoriasClinicas] = useState([]);
  const [pacientesBD, setPacientesBD] = useState([]);

  // ESTADOS DE HC
  const [triajeData, setTriajeData] = useState({ motivo: '', antecedentesMedicos: '', antecedentesQuirurgicos: '', antecedentesOdontologicos: '', presion: '', pulso: '', temperatura: '', fc: '', fr: '' });
  const [diagnosticoData, setDiagnosticoData] = useState({ diagnostico: '', planTratamiento: '', examenClinico: '' });
  const [evoluciones, setEvoluciones] = useState([]);
  const [radiografias, setRadiografias] = useState([]); 
  const [firmaPaciente, setFirmaPaciente] = useState(null); 

  const [odontograma, setOdontograma] = useState({});
  const [tratamientosAsignados, setTratamientosAsignados] = useState([]);
  



  useEffect(() => {
    if (!esDoctor) return;
    authService.getMe().catch(() => {});
  }, [esDoctor]);




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

            
          }
        }
      } catch {
        // Keep the fixed loading notice: API exception details must not enter the clinical UI.
        if (!isCreating) toast.error('Error al cargar datos de la historia.');
      }
    };

    cargarTodo();
  }, [editId, viewId, isCreating]);














  const getAsignadosForPieza = (n) => {
    return tratamientosAsignados.filter(t =>
      String(t.pieza) === String(n) ||
      (t.cara === 'Toda la arcada' && isPiezaInArcada(n, t.pieza))
    );
  };




  const calcularTotalPagado = (pagos) => Array.isArray(pagos) ? pagos.reduce((sum, p) => sum + Number.parseFloat(p?.monto || 0), 0) : 0;







  const calculateAge = (fecha) => {
    if (!fecha) return 0;
    const today = new Date(); 
    const birthDate = new Date(fecha);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };


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
      if (document.querySelector('.hoja-impresion [data-clinical-state="error"]')) {
        toast.error('Hay anexos que no se pudieron cargar. Reintenta antes de imprimir.'); return;
      }
      if (document.querySelector('.hoja-impresion [data-clinical-state="loading"], .hoja-impresion [data-clinical-state="decoding"]')) {
        toast.error('Espera a que terminen de cargar los anexos antes de imprimir.'); return;
      }
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
                          <td className="p-1 print:p-0.5 font-bold align-top">S/ {Number.parseFloat(evo.costoTotal).toFixed(2)}</td><td className="p-1 print:p-0.5 font-bold text-green-600 align-top">S/ {pagado.toFixed(2)}</td><td className="p-1 print:p-0.5 font-black text-orange-600 align-top">S/ {(Number.parseFloat(evo.costoTotal || 0) - pagado).toFixed(2)}</td>
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
                    <ClinicalImage record={rad} alt={`Anexo ${idx+1}`} className="max-h-full max-w-full object-contain" />
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
  
const FirmaSelloBlock = props => <FirmaMiniBlock {...props} />;

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


export default Historias;
