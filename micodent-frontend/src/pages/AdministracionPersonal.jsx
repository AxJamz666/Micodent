import { useState, useEffect, useRef } from 'react';
import {
  UserPlus, ShieldAlert, Edit, Trash2, Save, X,
  Eye, EyeOff, Search, KeyRound, ShieldCheck, Crown, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import { usuariosService } from '../services/api';
import { passwordPolicyError } from '../utils/passwordPolicy';
import { useSession } from '../services/browserSession';

// Etiquetas visuales por nivel
const NIVEL_CONFIG = {
  3: { label: 'SUPERADMIN', class: 'bg-slate-800 text-white border-slate-800' },
  2: { label: 'ADMIN',      class: 'bg-clinical-50 text-clinical-700 border-clinical-200' },
  1: { label: 'STAFF',      class: 'bg-slate-100 text-slate-600 border-slate-200'    },
};

const mensajeDesactivacion = (target, myId) => {
  if (target.nivel >= 3) return 'No se puede desactivar a un Superadministrador.';
  if (target.id === myId) return 'No puedes desactivar tu propio acceso.';
  if (!target.activo) return 'Este acceso ya esta desactivado.';
  return 'No puedes desactivar a un usuario de igual o mayor nivel.';
};

const TarjetaPersonal = ({ usuario: u, editingId, myNivel, myId, onEdit, onReset, onDeactivate }) => {
  const nivelCfg = NIVEL_CONFIG[u.nivel] || NIVEL_CONFIG[1];
  let userDetail;
  if (u.rol === 'Doctor') {
    const commissionText = u.comision_porcentaje ? u.comision_porcentaje + '%' : 'sin definir';
    userDetail = `COP: ${u.cop || 'S/N'} · Comisión: ${commissionText}`;
  } else {
    userDetail = `Cel: ${u.telefono || '-'}`;
  }
  return (
    <div data-user-id={u.id}
      className={`p-4 border rounded-2xl flex flex-col gap-3 transition-colors ${editingId===u.id?'border-clinical-500 bg-clinical-50':'bg-slate-50 hover:border-clinical-200'}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-slate-800 flex items-center gap-1.5">
            {u.nivel >= 3 && <Crown size={14} className="text-slate-600"/>}
            {u.nombre_completo}
          </p>
          {!u.activo && <p className="text-xs font-semibold text-red-700 mt-1">Acceso desactivado</p>}
          <p className="text-xs text-slate-500 mt-1">
            {userDetail}
          </p>
        </div>
        <span className={`text-[10px] font-black tracking-widest px-2 py-1 rounded-lg border ${nivelCfg.class}`}>
          {nivelCfg.label}
        </span>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-slate-200/60">
        <span className="text-xs text-slate-500 font-mono">ID: <b className="text-slate-700">{u.id}</b></span>
        <div className="flex gap-1.5">
          {(myNivel > (u.nivel||1) || u.id===myId) && (
            <button onClick={()=>onEdit(u)}
              className="ui-icon-button" title="Editar datos" aria-label={`Editar datos de ${u.nombre_completo}`}>
              <Edit size={15}/>
            </button>
          )}
          {myNivel > (u.nivel||1) && u.id!==myId && (
            <button onClick={()=>onReset(u)}
              className="ui-icon-button" title={u.activo ? 'Restablecer contraseña' : 'Reactivar acceso'} aria-label={`${u.activo ? 'Restablecer contraseña' : 'Reactivar acceso'} de ${u.nombre_completo}`}>
              {u.activo ? <KeyRound size={15}/> : <RotateCcw size={15}/>}
            </button>
          )}
          {u.activo && u.id !== myId && myNivel > (u.nivel || 1) && (
            <button onClick={()=>onDeactivate(u)}
              className="ui-icon-button text-red-700 hover:bg-red-50" title="Desactivar acceso" aria-label={`Desactivar acceso de ${u.nombre_completo}`}>
              <Trash2 size={15}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const FormularioPersonal = ({ editingId, myId, myNivel, formData, showPass, handleChange, handleSave, resetForm, setShowPass }) => (
    <div className="lg:col-span-7 h-fit rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
    <div className="flex justify-between items-center border-b pb-4 mb-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
        {editingId?<Edit size={22}/>:<UserPlus size={22}/>}
        {editingId?`Editando: ${editingId}`:'Registrar Nuevo Personal'}
      </h3>
      {editingId && (
        <button type="button" onClick={resetForm}
          className="text-xs flex items-center gap-1 font-bold text-slate-400 hover:text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
          <X size={14}/> Cancelar
        </button>
      )}
    </div>

    <form onSubmit={handleSave} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="personal-nombre" className="ui-field-label">Nombres y apellidos completos</label>
          <input id="personal-nombre" required name="nombre" value={formData.nombre} onChange={handleChange}
            className="ui-input"/>
        </div>
        <div>
          <label htmlFor="personal-trato" className="ui-field-label">Trato</label>
          <select id="personal-trato" name="gender" value={formData.gender} onChange={handleChange}
            className="ui-input">
            <option value="o">Masculino</option>
            <option value="a">Femenino</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="personal-dni" className="ui-field-label">DNI</label>
          <input id="personal-dni" required name="dni" value={formData.dni} onChange={handleChange} maxLength="8"
            className="ui-input" placeholder="8 dígitos"/>
        </div>
        <div>
          <label htmlFor="personal-telefono" className="ui-field-label">Celular</label>
          <input id="personal-telefono" required name="telefono" value={formData.telefono} onChange={handleChange} maxLength="9"
            className="ui-input" placeholder="9 dígitos"/>
        </div>
        <div>
          <label htmlFor="personal-email" className="ui-field-label">Email</label>
          <input id="personal-email" name="email" value={formData.email} onChange={handleChange} type="email"
            className="ui-input"/>
        </div>
      </div>

      <div>
        <label htmlFor="personal-direccion" className="ui-field-label">Dirección</label>
        <input id="personal-direccion" name="direccion" value={formData.direccion} onChange={handleChange}
          className="ui-input"/>
      </div>

      {/* Rol + Nivel + Especialidad */}
      <div className="grid grid-cols-1 gap-4 border-t border-slate-200 pt-5 md:grid-cols-3">
        <div>
          <label htmlFor="personal-rol" className="ui-field-label">Rol en clínica</label>
          <select id="personal-rol" name="rol" value={formData.rol} onChange={handleChange} disabled={editingId === myId}
            className="ui-input">
            <option value="Asistente">Asistente</option>
            <option value="Doctor">Doctor</option>
            <option value="Administradora">Administradora</option>
          </select>
        </div>

        {/* Solo Superadmins pueden asignar o editar el Nivel de Acceso (y no pueden modificarse a sí mismos aquí) */}
        {myNivel >= 3 && editingId !== myId && (
          <div>
            <label className="ui-field-label flex items-center gap-1">
              <Crown size={12}/> Nivel de acceso
            </label>
            <select name="nivel" value={formData.nivel} onChange={handleChange}
              className="ui-input">
              <option value={1}>Staff (nivel 1)</option>
              <option value={2}>Admin (nivel 2)</option>
            </select>
          </div>
        )}

        {formData.rol === 'Doctor' && (
          <>
            <div>
              <label htmlFor="personal-especialidad" className="ui-field-label">Especialidad</label>
              <input id="personal-especialidad" required name="especialidad" value={formData.especialidad} onChange={handleChange}
                placeholder="Ej. Ortodoncia"
                className="ui-input"/>
            </div>
                <div>
                  <label htmlFor="personal-cop" className="ui-field-label">Nro. COP</label>
                  <input id="personal-cop" required name="cop" value={formData.cop} onChange={handleChange} maxLength="6"
                    placeholder="Ej. 12345"
                    className="ui-input"/>
                </div>
                <div>
                  <label htmlFor="personal-comision" className="ui-field-label">% Comisión</label>
                  <input id="personal-comision" type="number" name="comision_porcentaje" value={formData.comision_porcentaje} onChange={handleChange}
                    min="0" max="100" step="0.01" placeholder="Ej. 40"
                    className="ui-input"/>
                </div>
          </>
        )}
      </div>

      {/* Credenciales */}
      <div className="grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
        <div>
          <label htmlFor="personal-id" className="ui-field-label">ID de acceso</label>
          <input id="personal-id" required disabled={!!editingId} name="id" value={formData.id} onChange={handleChange}
            placeholder="usuario123"
            className="ui-input font-mono disabled:cursor-not-allowed disabled:bg-slate-100"/>
          {editingId && <p className="text-[10px] text-slate-400 mt-1">El ID no se puede modificar.</p>}
        </div>
        {!editingId && <div>
          <label htmlFor="personal-password" className="ui-field-label">
            Contraseña inicial
          </label>
          <div className="relative">
            <input id="personal-password" required={!editingId} name="password" value={formData.password}
              onChange={handleChange} type={showPass?'text':'password'}
              placeholder="Mínimo 15 caracteres"
              className="ui-input pr-12"/>
            <button type="button" onClick={()=>setShowPass(!showPass)} aria-label={showPass ? 'Ocultar contraseña inicial' : 'Mostrar contraseña inicial'}
              className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-slate-500 hover:text-slate-700">
              {showPass?<EyeOff size={18}/>:<Eye size={18}/>}
            </button>
          </div>
        </div>}
      </div>

      <button type="submit" className="ui-button-primary w-full">
        <Save size={20}/> {editingId?'Guardar Cambios':'Registrar Personal'}
      </button>
    </form>
  </div>
);

const AdministracionPersonal = () => {
  const [users,      setUsers]      = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId,  setEditingId]  = useState(null);
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [reloadUsers, setReloadUsers] = useState(0);

  const [confirmModal, setConfirmModal] = useState({
    isOpen:false, title:'', message:'', onConfirm:null, type:'danger'
  });
  const [savingDeactivate, setSavingDeactivate] = useState(false);
  const deactivationInFlight = useRef(false);

  const [resetModal,    setResetModal]    = useState({ isOpen:false, targetUser:null, reactivate:false });
  const [resetPassForm, setResetPassForm] = useState({
    adminPassword:'', newPassword:'', confirmPassword:''
  });
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [showNewPass,   setShowNewPass]   = useState(false);
  const [showConfPass,  setShowConfPass]  = useState(false);
  const [savingReset,   setSavingReset]   = useState(false);

  const [formData, setFormData] = useState({
    id:'', password:'', rol:'Asistente', nombre:'', dni:'',
    telefono:'', email:'', especialidad:'', cop:'', direccion:'',
    gender:'o', nivel: 1, comision_porcentaje: '',
  });

  const { user } = useSession();
  const isAdmin = Boolean(user?.isAdmin);
  const myNivel = Number(user?.nivel) || 1;
  const myId = user?.id || '';

  const cargarUsuarios = () => {
    setLoading(true);
    setReloadUsers(value => value + 1);
  };

  useEffect(() => {
    let active = true;
    usuariosService.getAll()
      .then(({ data }) => {
        if (active) setUsers(Array.isArray(data.data) ? data.data : []);
      })
      .catch(() => { if (active) toast.error('Error al cargar el personal.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadUsers]);

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (['dni','telefono','cop'].includes(name))  value = value.replace(/\D/g,'');
    else if (name==='nombre') value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g,'');
    else if (name==='id')     value = value.replace(/[^a-zA-Z0-9]/g,'');
    else if (name==='nivel')  value = Number.parseInt(value);
    setFormData({ ...formData, [name]: value });
  };

   const resetForm = () => {
    setEditingId(null); setShowPass(false);
    setFormData({ id:'', password:'', rol:'Asistente', nombre:'', dni:'',
      telefono:'', email:'', especialidad:'', cop:'', direccion:'', gender:'o', nivel:1, comision_porcentaje:'' });
  };

  const buildNombreCompleto = (nombre, rol, gender) => {
    let prefix = 'Asist.';
    if (rol === 'Doctor') prefix = gender === 'o' ? 'Dr.' : 'Dra.';
    else if (rol === 'Administradora') prefix = 'Adm.';
    return { prefix, nombre_completo: `${prefix} ${nombre}` };
  };

  // ✅ FIX PUNTO 1: Eliminar prefijo acumulado al cargar para edición
  const stripPrefix = (nombreCompleto) => {
    const prefixes = ['Dr. ','Dra. ','Adm. ','Asist. '];
    let nombre = typeof nombreCompleto === 'string' ? nombreCompleto : '';
    prefixes.forEach(p => {
      if (nombre.startsWith(p)) nombre = nombre.slice(p.length);
    });
    return nombre.trim();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingId) {
      const policyError = passwordPolicyError(formData.password);
      if (policyError) { toast.error(policyError); return; }
    }
    try {
      const { prefix, nombre_completo } = buildNombreCompleto(
        formData.nombre, formData.rol, formData.gender
      );
      const payload = {
        ...formData,
        id:              formData.id.toLowerCase().trim(),
        nombre:          formData.nombre.split(' ')[0],
        nombre_completo,
        prefix,
        nivel:           Number.parseInt(formData.nivel) || 1,
        comision_porcentaje: formData.comision_porcentaje ? Number.parseFloat(formData.comision_porcentaje) : null,
      };
      if (editingId) {
        delete payload.password;
        await usuariosService.editar(editingId, payload);
        toast.success('Personal actualizado correctamente.');
      } else {
        await usuariosService.crear(payload);
        toast.success('Personal registrado exitosamente.');
      }
      resetForm(); cargarUsuarios();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al guardar.');
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      id:          user.id,
      password:    '',
      rol:         user.rol,
      // ✅ FIX: Cargar nombre sin prefijo para evitar acumulación
      nombre:      stripPrefix(user.nombre_completo),
      dni:         user.dni          || '',
      telefono:    user.telefono     || '',
      email:       user.email        || '',
      especialidad:user.especialidad || '',
      cop:         user.cop          || '',
      direccion:   user.direccion    || '',
      gender:      user.gender       || 'o',
      nivel:       user.nivel        || 1,
      comision_porcentaje: user.comision_porcentaje ?? '',
    });
    setShowPass(false);
  };

  // ✅ PUNTO 2: Lógica de eliminación basada en jerarquía de nivel
  const canManage = (targetUser) => targetUser.id !== myId && myNivel > (targetUser.nivel || 1);
  const canDeactivate = (targetUser) => targetUser.activo && canManage(targetUser);

  const handleDelete = (user) => {
    if (!canDeactivate(user)) {
      toast.error(mensajeDesactivacion(user, myId));
      return;
    }
    setConfirmModal({
      isOpen:true, type:'danger',
      title: '¿Desactivar acceso?',
      message: `Se desactivará el acceso de "${user.nombre_completo}" y se cerrarán sus sesiones. Su historial clínico y financiero se conservará.`,
      onConfirm: async () => {
        if (deactivationInFlight.current) return;
        deactivationInFlight.current = true;
        setSavingDeactivate(true);
        try {
          await usuariosService.eliminar(user.id);
          setConfirmModal(prev=>({...prev,isOpen:false}));
          toast.success('Acceso desactivado.'); cargarUsuarios();
        } catch (err) {
          toast.error(err.response?.data?.mensaje || 'Error al desactivar el acceso.');
        } finally {
          deactivationInFlight.current = false;
          setSavingDeactivate(false);
        }
      },
    });
  };

  const handleOpenReset = (user) => {
    if (!canManage(user)) {
      toast.error('No tienes permiso para gestionar el acceso de este usuario.'); return;
    }
    setResetModal({ isOpen:true, targetUser:user, reactivate:!user.activo });
    setResetPassForm({ adminPassword:'', newPassword:'', confirmPassword:'' });
    setShowAdminPass(false); setShowNewPass(false); setShowConfPass(false);
  };

  const closeCredentialModal = () => {
    setResetPassForm({ adminPassword:'', newPassword:'', confirmPassword:'' });
    setResetModal({ isOpen:false, targetUser:null, reactivate:false });
    setShowAdminPass(false); setShowNewPass(false); setShowConfPass(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (resetPassForm.newPassword !== resetPassForm.confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden.'); return;
    }
    const policyError = passwordPolicyError(resetPassForm.newPassword);
    if (policyError) { toast.error(policyError); return; }
    try {
      setSavingReset(true);
      const credentials = { nuevaPassword: resetPassForm.newPassword, adminPassword: resetPassForm.adminPassword };
      if (resetModal.reactivate) await usuariosService.reactivar(resetModal.targetUser.id, credentials);
      else await usuariosService.resetPassword({ targetUserId: resetModal.targetUser.id, ...credentials });
      closeCredentialModal();
      toast.success(resetModal.reactivate ? 'Acceso reactivado con contraseña nueva.' : 'Contraseña restablecida.');
      cargarUsuarios();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'No se pudo completar la operación.');
    } finally {
      setSavingReset(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="pt-20 text-center">
        <ShieldAlert size={64} className="text-red-400 mb-4 mx-auto"/>
        <h2 className="text-3xl font-bold text-slate-700">Acceso Denegado</h2>
        <p className="text-slate-500 mt-2">No tienes permisos para esta sección.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.rol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const credentialAction = resetModal.reactivate ? 'Reactivar acceso' : 'Restablecer contraseña';
  const renderPersonnelList = () => {
    if (loading) return <p className="text-center text-slate-400 py-10">Cargando...</p>;
    if (filteredUsers.length === 0) return <p className="text-center text-slate-400 py-10">Sin resultados.</p>;
    return <>{filteredUsers.map(u => (
      <TarjetaPersonal key={u.id} usuario={u} editingId={editingId}
        myNivel={myNivel} myId={myId} onEdit={handleEdit}
        onReset={handleOpenReset} onDeactivate={handleDelete} />
    ))}</>;
  };

  return (
    <div className="animate-fade-in text-slate-800 pb-10">

      <ConfirmModal
        isOpen={confirmModal.isOpen} title={confirmModal.title}
        message={confirmModal.message} type={confirmModal.type}
        confirmText="Sí, desactivar" cancelText="Cancelar"
        busy={savingDeactivate}
        onConfirm={confirmModal.onConfirm}
        onCancel={()=>setConfirmModal(prev=>({...prev,isOpen:false}))}
      />

      {/* Restablecimiento y reactivacion usan la misma verificacion administrativa. */}
      {resetModal.isOpen && (
        <div className="dialog-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">{resetModal.reactivate ? <RotateCcw size={20} className="text-clinical-600"/> : <KeyRound size={20} className="text-clinical-600"/>} {resetModal.reactivate ? 'Reactivar acceso' : 'Restablecer contraseña'}</h3>
              <button type="button" onClick={closeCredentialModal} disabled={savingReset} aria-label="Cerrar" className="ui-icon-button"><X size={18}/></button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-5">
              <div className="border-b border-slate-200 pb-4">
                <p className="text-xs font-medium text-slate-500">{resetModal.reactivate ? 'Reactivar cuenta' : 'Cuenta seleccionada'}</p>
                <p className="mt-1 break-words text-base font-semibold text-slate-800">{resetModal.targetUser?.nombre_completo}</p>
                <p className="mt-1 font-mono text-xs text-slate-500">ID: {resetModal.targetUser?.id}</p>
                {resetModal.reactivate && <p className="mt-2 text-xs text-slate-600">La contraseña anterior dejará de funcionar. Los registros históricos se conservarán.</p>}
              </div>
              <div>
                <label htmlFor="reset-admin-password" className="ui-field-label">Tu contraseña de administrador</label>
                <div className="relative">
                  <input required value={resetPassForm.adminPassword}
                    id="reset-admin-password" autoComplete="current-password"
                    onChange={e=>setResetPassForm({...resetPassForm,adminPassword:e.target.value})}
                    type={showAdminPass?'text':'password'}
                    className="ui-input pr-12"
                    placeholder="Tu contraseña actual"/>
                  <button type="button" aria-label={showAdminPass ? 'Ocultar contraseña de administrador' : 'Mostrar contraseña de administrador'} onClick={()=>setShowAdminPass(!showAdminPass)} className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-slate-500 hover:text-slate-700">
                    {showAdminPass?<EyeOff size={18}/>:<Eye size={18}/>}
                  </button>
                </div>
              </div>
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div>
                  <label htmlFor="reset-new-password" className="ui-field-label">Nueva contraseña para el usuario</label>
                  <div className="relative">
                    <input required value={resetPassForm.newPassword}
                      id="reset-new-password" autoComplete="new-password"
                      onChange={e=>setResetPassForm({...resetPassForm,newPassword:e.target.value})}
                      type={showNewPass?'text':'password'} minLength="15"
                      className="ui-input pr-12"
                      placeholder="Mínimo 15 caracteres"/>
                    <button type="button" aria-label={showNewPass ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'} onClick={()=>setShowNewPass(!showNewPass)} className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-slate-500 hover:text-slate-700">
                      {showNewPass?<EyeOff size={18}/>:<Eye size={18}/>}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="reset-confirm-password" className="ui-field-label">Confirmar nueva contraseña</label>
                  <div className="relative">
                    <input required value={resetPassForm.confirmPassword}
                      id="reset-confirm-password" autoComplete="new-password"
                      onChange={e=>setResetPassForm({...resetPassForm,confirmPassword:e.target.value})}
                      type={showConfPass?'text':'password'} minLength="15"
                      className="ui-input pr-12"/>
                    <button type="button" aria-label={showConfPass ? 'Ocultar confirmación' : 'Mostrar confirmación'} onClick={()=>setShowConfPass(!showConfPass)} className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-slate-500 hover:text-slate-700">
                      {showConfPass?<EyeOff size={18}/>:<Eye size={18}/>}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeCredentialModal} disabled={savingReset}
                  className="ui-button-secondary min-w-[90px] flex-none whitespace-nowrap">Cancelar</button>
                <button type="submit" disabled={savingReset}
                  className="ui-button-primary flex-[2]">
                  <ShieldCheck size={18}/> {savingReset ? 'Guardando...' : credentialAction}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-7">
        <h2 className="ui-page-title">Administración de personal</h2>
        <p className="ui-page-subtitle">Equipo clínico y administrativo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LISTA */}
        <div className="flex h-[360px] flex-col border-t border-slate-200 pt-4 lg:col-span-5 lg:h-[750px]">
          <h3 className="font-bold text-lg mb-4 border-b pb-3 flex items-center gap-2">
            <ShieldAlert size={20} className="text-slate-400"/> Personal
          </h3>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input type="text" placeholder="Buscar personal..." value={searchTerm}
              onChange={e=>setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-slate-50"/>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {renderPersonnelList()}
          </div>
        </div>

        {/* FORMULARIO */}
        <FormularioPersonal editingId={editingId} myId={myId} myNivel={myNivel}
          formData={formData} showPass={showPass} handleChange={handleChange}
          handleSave={handleSave} resetForm={resetForm} setShowPass={setShowPass} />

      </div>
    </div>
  );
};

export default AdministracionPersonal;
