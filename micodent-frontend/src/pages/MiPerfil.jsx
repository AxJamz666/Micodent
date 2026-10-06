import React, { useState, useEffect } from 'react';
import {
  User, ShieldCheck, KeyRound,
  Eye, EyeOff, Info, RefreshCw,
  Briefcase, CreditCard, IdCard, PenTool, UploadCloud, Save
} from 'lucide-react';
import { authService, usuariosService } from '../services/api';
import toast from 'react-hot-toast';
import SignaturePad from '../components/SignaturePad';
import { useNavigate } from 'react-router-dom';
import { browserSession } from '../services/browserSession';
import { passwordPolicyError } from '../utils/passwordPolicy';

// ==========================================
// PIZARRA DIGITAL PARA DIBUJAR LA FIRMA
// ==========================================

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
    } catch {
      // Failed persistence keeps the edited assets for retry and uses the existing fixed error notice.
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
  const sexo = userData?.gender === 'a' ? 'Femenino' : 'Masculino';

  return (
    <div className="animate-fade-in text-slate-800 pb-10 max-w-7xl mx-auto">
      <div className="mb-7">
        <h2 className="ui-page-title">Mi perfil</h2>
        <p className="ui-page-subtitle">Datos institucionales y acceso.</p>
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
        {/* ── TARJETA DE IDENTIDAD ── */}
        <div className="lg:col-span-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-clinical-50 text-clinical-600">
                <User size={26} strokeWidth={1.7} />
              </div>
              <div className="min-w-0">
                <h3 className="break-words text-base font-semibold text-slate-800">{userData?.nombre_completo}</h3>
                <p className="mt-1 text-xs text-slate-500">{userData?.is_admin ? 'Administrador' : userData?.rol}</p>
              </div>
            </div>
            <div className="space-y-4 pt-5">
                <MiniField icon={<IdCard size={14}/>}    label="ID de Acceso"
                  value={localStorage.getItem('userId')} mono />
                <MiniField icon={<User size={14}/>}      label="Sexo"
                  value={sexo} />
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

        {/* ── COLUMNA DERECHA ── */}
        <div className="lg:col-span-8 space-y-6">
          {/* DATOS INSTITUCIONALES */}
          <section className="border-b border-slate-200 pb-7">
            <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-800">
              <User size={20} className="text-slate-400" /> Datos Institucionales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReadField label="Nombre Completo"    value={userData?.nombre_completo} />
              <ReadField label="DNI"                value={userData?.dni}          empty="No registrado" />
              <ReadField label="Rol en la Clínica"  value={userData?.rol} />
              <ReadField label="Sexo"               value={sexo} />
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
            <div className="mt-5 flex items-center gap-2 text-slate-500">
              <Info size={14} className="text-slate-400 flex-shrink-0" />
              <p className="text-xs">
                Para modificar cualquier dato institucional, solicítalo al Administrador del sistema.
              </p>
            </div>
          </section>

          {/* ✅ NUEVO: FIRMA Y SELLO DIGITAL (solo Doctor) */}
          {esDoctor && (
            <section className="border-b border-slate-200 pb-7">
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
                        Reemplazar sello{' '}
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
            </section>
          )}

          {/* CAMBIO DE CONTRASEÑA PROPIO */}
          <section className="pb-4">
            <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-800">
              <KeyRound size={20} className="text-clinical-600" /> Cambiar mi contraseña
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Solo tú puedes cambiar tu propia contraseña. El administrador puede reseteártela desde Administración de Personal si la olvidas.
            </p>

            <form onSubmit={savePassword} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label htmlFor="profile-current-password" className="ui-field-label">
                    Contraseña actual
                  </label>
                  <div className="relative md:max-w-sm">
                    <input required name="currentPass" value={securityForm.currentPass}
                      id="profile-current-password" autoComplete="current-password"
                      onChange={handleSecurityChange}
                      type={showCurrent?'text':'password'}
                      className="ui-input pr-12"
                    />
                    <button type="button" onClick={()=>setShowCurrent(!showCurrent)}
                      aria-label={showCurrent ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
                      className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-slate-500 hover:text-slate-700">
                      {showCurrent ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-new-password" className="ui-field-label">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input required name="newPass" value={securityForm.newPass}
                      id="profile-new-password" autoComplete="new-password"
                      onChange={handleSecurityChange}
                      type={showNew?'text':'password'} minLength="15"
                      className="ui-input pr-12"
                    />
                    <button type="button" onClick={()=>setShowNew(!showNew)}
                      aria-label={showNew ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                      className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-slate-500 hover:text-slate-700">
                      {showNew ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-confirm-password" className="ui-field-label">
                    Confirmar nueva contraseña
                  </label>
                  <div className="relative">
                    <input required name="confirmPass" value={securityForm.confirmPass}
                      id="profile-confirm-password" autoComplete="new-password"
                      onChange={handleSecurityChange}
                      type={showConfirm?'text':'password'} minLength="15"
                      className="ui-input pr-12"
                    />
                    <button type="button" onClick={()=>setShowConfirm(!showConfirm)}
                      aria-label={showConfirm ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                      className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-slate-500 hover:text-slate-700">
                      {showConfirm ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={savingPass}
                  className="ui-button-primary">
                  <ShieldCheck size={18}/>
                  {savingPass ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

const MiniField = ({ icon, label, value, mono, color }) => (
  <div>
    <p className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500">
      {icon} {label}
    </p>
    <p className={`break-words text-sm font-semibold ${color||'text-slate-700'} ${mono?'font-mono text-xs':''}`}>
      {value || '—'}
    </p>
  </div>
);

const ReadField = ({ label, value, empty='—', highlight }) => (
  <div>
    <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
    <p className={`min-h-6 break-words text-sm font-semibold ${highlight ? 'text-clinical-700' : 'text-slate-700'}`}>
      {value || empty}
    </p>
  </div>
);

export default MiPerfil;
