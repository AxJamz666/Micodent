import React, { useState, useEffect, useRef } from 'react';
import {
  User, Phone, Mail, ShieldCheck, KeyRound,
  Eye, EyeOff, Info, RefreshCw, MapPin,
  Briefcase, CreditCard, IdCard, PenTool, UploadCloud, Save
} from 'lucide-react';
import { authService, usuariosService } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { browserSession } from '../services/browserSession';
import { passwordPolicyError } from '../utils/passwordPolicy';

// ==========================================
// PIZARRA DIGITAL PARA DIBUJAR LA FIRMA
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

const MiPerfil = () => {
  const navigate = useNavigate();
  const [userData,    setUserData]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [savingPass,  setSavingPass]  = useState(false);
  const [securityForm, setSecurityForm] = useState({
    currentPass: '', newPass: '', confirmPass: ''
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ✅ NUEVO: firma y sello del doctor
  const [firmaDigital,   setFirmaDigital]   = useState(null);
  const [selloDigital,   setSelloDigital]   = useState(null);
  const [guardandoFirma, setGuardandoFirma] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const { data } = await authService.getMe();
        setUserData(data.usuario);
        setFirmaDigital(data.usuario.firma_digital || null);
        setSelloDigital(data.usuario.sello_digital || null);
      } catch {
        toast.error('No se pudo cargar el perfil.');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const handleSecurityChange = (e) =>
    setSecurityForm({ ...securityForm, [e.target.name]: e.target.value });

  const savePassword = async (e) => {
    e.preventDefault();
    if (securityForm.newPass !== securityForm.confirmPass) {
      toast.error('Las contraseñas nuevas no coinciden.'); return;
    }
    const policyError = passwordPolicyError(securityForm.newPass);
    if (policyError) { toast.error(policyError); return; }
    try {
      const epoch = browserSession.assertCurrent();
      setSavingPass(true);
      await usuariosService.cambiarPassword({
        passwordActual: securityForm.currentPass,
        passwordNuevo:  securityForm.newPass,
      });
      setSecurityForm({ currentPass:'', newPass:'', confirmPass:'' });
      setShowCurrent(false); setShowNew(false); setShowConfirm(false);
      toast.success('Contraseña actualizada. Inicia sesión nuevamente.');
      browserSession.end(epoch);
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al cambiar contraseña.');
    } finally {
      setSavingPass(false);
    }
  };

  // ✅ NUEVO: sube la foto del sello y la achica automáticamente (max 400px de ancho)
  const handleSelloUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 400;
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setSelloDigital(canvas.toDataURL('image/png'));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // ✅ NUEVO: guarda firma y sello en el backend
  const guardarFirmaSello = async () => {
    try {
      setGuardandoFirma(true);
      await usuariosService.actualizarFirmaSello({
        firma_digital: firmaDigital,
        sello_digital: selloDigital,
      });
      toast.success('Firma y sello guardados correctamente.');
    } catch (err) {
      toast.error('Error al guardar firma y sello.');
    } finally {
      setGuardandoFirma(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <RefreshCw size={32} className="text-clinical-500 animate-spin" />
        <p className="text-slate-500 font-medium">Cargando perfil...</p>
      </div>
    );
  }

  const esDoctor = userData?.rol === 'Doctor';

  return (
    <div className="animate-fade-in text-slate-800 pb-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Mi Perfil</h2>
        <p className="text-slate-500 mt-1">Consulta tus datos institucionales y gestiona tu contraseña de acceso.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── TARJETA DE IDENTIDAD ── */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-clinical-500 h-28 w-full relative">
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage:'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize:'10px 10px' }} />
            </div>
            <div className="px-6 pb-8 text-center -mt-14 relative z-10">
              <div className="bg-white p-2 rounded-full inline-block mb-3 shadow-md border border-slate-50">
                <div className="bg-clinical-50 p-5 rounded-full text-clinical-600">
                  <User size={56} strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-800 leading-tight">
                {userData?.nombre_completo}
              </h3>
              <span className={`inline-block mt-3 text-[10px] font-black tracking-widest px-4 py-1.5 rounded-lg border ${
                userData?.is_admin
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                {userData?.is_admin ? 'ADMINISTRADOR' : (userData?.rol||'').toUpperCase()}
              </span>

              <div className="mt-8 space-y-3 text-left border-t border-slate-100 pt-6">
                <MiniField icon={<IdCard size={14}/>}    label="ID de Acceso"
                  value={localStorage.getItem('userId')} mono />
                <MiniField icon={<User size={14}/>}      label="Sexo"
                  value={userData?.gender==='a'?'Femenino':'Masculino'} />
                {esDoctor && userData?.especialidad && (
                  <MiniField icon={<Briefcase size={14}/>} label="Especialidad"
                    value={userData.especialidad} color="text-clinical-700" />
                )}
                {esDoctor && userData?.cop && (
                  <MiniField icon={<CreditCard size={14}/>} label="COP"
                    value={userData.cop} color="text-clinical-700" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── COLUMNA DERECHA ── */}
        <div className="lg:col-span-8 space-y-6">
          {/* DATOS INSTITUCIONALES */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-slate-100 px-4 py-2 rounded-bl-3xl flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Solo lectura</span>
            </div>
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 border-b pb-3">
              <User size={20} className="text-slate-400" /> Datos Institucionales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReadField label="Nombre Completo"    value={userData?.nombre_completo} />
              <ReadField label="DNI"                value={userData?.dni}          empty="No registrado" />
              <ReadField label="Rol en la Clínica"  value={userData?.rol} />
              <ReadField label="Sexo"               value={userData?.gender==='a'?'Femenino':'Masculino'} />
              {esDoctor && <>
                <ReadField label="Especialidad Médica" value={userData?.especialidad} empty="No registrada" highlight />
                <ReadField label="Nro. COP"             value={userData?.cop}          empty="No registrado" highlight />
              </>}
              <ReadField label="Teléfono"   value={userData?.telefono}  empty="No registrado" />
              <ReadField label="Email"      value={userData?.email}     empty="No registrado" />
              <div className="md:col-span-2">
                <ReadField label="Dirección" value={userData?.direccion} empty="No registrada" />
              </div>
            </div>
            <div className="mt-5 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
              <Info size={14} className="text-slate-400 flex-shrink-0" />
              <p className="text-xs text-slate-400 font-medium">
                Para modificar cualquier dato institucional, solicítalo al Administrador del sistema.
              </p>
            </div>
          </div>

          {/* ✅ NUEVO: FIRMA Y SELLO DIGITAL (solo Doctor) */}
          {esDoctor && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2 border-b pb-3">
                <PenTool size={20} className="text-clinical-600" /> Firma y Sello Digital
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Se estamparán automáticamente en cada Evolución, Odontograma, Receta y Orden que firmes — ya no necesitas firmar en papel.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col items-center">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Tu firma</p>
                  <SignaturePad onEnd={setFirmaDigital} initialImage={firmaDigital} />
                </div>

                <div className="flex flex-col items-center">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Tu sello</p>
                  {selloDigital ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={selloDigital} alt="Sello" className="h-28 object-contain border border-slate-200 rounded-xl bg-white p-2" />
                      <label className="text-xs font-bold text-clinical-600 hover:text-clinical-700 cursor-pointer underline">
                        Reemplazar sello
                        <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleSelloUpload} />
                      </label>
                      <button type="button" onClick={() => setSelloDigital(null)} className="text-sm text-red-700 underline">Eliminar sello</button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 w-full h-[120px] border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <UploadCloud size={24} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-500">Subir foto de tu sello</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleSelloUpload} />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button onClick={guardarFirmaSello} disabled={guardandoFirma}
                  className="px-8 py-3 bg-clinical-500 text-white rounded-xl font-bold hover:bg-clinical-600 transition-all flex items-center gap-2 shadow-md disabled:opacity-50">
                  <Save size={18}/> {guardandoFirma ? 'Guardando...' : 'Guardar Firma y Sello'}
                </button>
              </div>
            </div>
          )}

          {/* CAMBIO DE CONTRASEÑA PROPIO */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2 border-b pb-3">
              <KeyRound size={20} className="text-amber-500" /> Cambiar Mi Contraseña
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Solo tú puedes cambiar tu propia contraseña. El administrador puede reseteártela desde Administración de Personal si la olvidas.
            </p>

            <form onSubmit={savePassword} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    Contraseña Actual
                  </label>
                  <div className="relative md:w-1/2">
                    <input required name="currentPass" value={securityForm.currentPass}
                      onChange={handleSecurityChange}
                      type={showCurrent?'text':'password'}
                      className="w-full pr-12 px-4 py-3 border border-amber-200 rounded-xl outline-none focus:border-amber-500 bg-amber-50 font-medium"
                    />
                    <button type="button" onClick={()=>setShowCurrent(!showCurrent)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                      {showCurrent ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input required name="newPass" value={securityForm.newPass}
                      onChange={handleSecurityChange}
                      type={showNew?'text':'password'} minLength="15"
                      className="w-full pr-12 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-clinical-500 bg-slate-50 font-medium"
                    />
                    <button type="button" onClick={()=>setShowNew(!showNew)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                      {showNew ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input required name="confirmPass" value={securityForm.confirmPass}
                      onChange={handleSecurityChange}
                      type={showConfirm?'text':'password'} minLength="15"
                      className="w-full pr-12 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-clinical-500 bg-slate-50 font-medium"
                    />
                    <button type="button" onClick={()=>setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                      {showConfirm ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={savingPass}
                  className="px-8 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all flex items-center gap-2 shadow-md shadow-amber-200 disabled:opacity-50">
                  <ShieldCheck size={18}/>
                  {savingPass ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const MiniField = ({ icon, label, value, mono, color }) => (
  <div>
    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-1 flex items-center gap-1">
      {icon} {label}
    </p>
    <p className={`font-bold text-sm bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 ${color||'text-slate-700'} ${mono?'font-mono text-xs':''}`}>
      {value || '—'}
    </p>
  </div>
);

const ReadField = ({ label, value, empty='—', highlight }) => (
  <div>
    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">{label}</p>
    <p className={`font-bold text-sm px-4 py-2.5 rounded-xl border ${
      highlight
        ? 'bg-clinical-50 text-clinical-700 border-clinical-100'
        : 'bg-slate-50 text-slate-700 border-slate-100'
    }`}>
      {value || empty}
    </p>
  </div>
);

export default MiPerfil;
