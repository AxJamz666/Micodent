import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus, ShieldAlert, Edit, Trash2, Save, X,
  Eye, EyeOff, Search, KeyRound, ShieldCheck, Crown
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import { usuariosService } from '../services/api';

// Etiquetas visuales por nivel
const NIVEL_CONFIG = {
  3: { label: 'SUPERADMIN', class: 'bg-purple-100 text-purple-700 border-purple-200' },
  2: { label: 'ADMIN',      class: 'bg-blue-100 text-blue-700 border-blue-200'       },
  1: { label: 'STAFF',      class: 'bg-slate-100 text-slate-600 border-slate-200'    },
};

const AdministracionPersonal = () => {
  const [users,      setUsers]      = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId,  setEditingId]  = useState(null);
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(true);

  const [confirmModal, setConfirmModal] = useState({
    isOpen:false, title:'', message:'', onConfirm:null, type:'danger'
  });

  const [resetModal,    setResetModal]    = useState({ isOpen:false, targetUser:null });
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

  // Datos del usuario logueado
  const isAdmin     = localStorage.getItem('isAdmin') === 'true';
  const myNivel     = parseInt(localStorage.getItem('userNivel') || '1');
  const myId        = localStorage.getItem('userId') || '';

  const cargarUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await usuariosService.getAll();
      setUsers(Array.isArray(data.data) ? data.data : []);
    } catch {
      toast.error('Error al cargar el personal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarUsuarios(); }, [cargarUsuarios]);

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (['dni','telefono','cop'].includes(name))  value = value.replace(/\D/g,'');
    else if (name==='nombre') value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g,'');
    else if (name==='id')     value = value.replace(/[^a-zA-Z0-9]/g,'');
    else if (name==='nivel')  value = parseInt(value);
    setFormData({ ...formData, [name]: value });
  };

   const resetForm = () => {
    setEditingId(null); setShowPass(false);
    setFormData({ id:'', password:'', rol:'Asistente', nombre:'', dni:'',
      telefono:'', email:'', especialidad:'', cop:'', direccion:'', gender:'o', nivel:1, comision_porcentaje:'' });
  };

  const buildNombreCompleto = (nombre, rol, gender) => {
    const prefix =
      rol === 'Doctor'         ? (gender==='o' ? 'Dr.' : 'Dra.') :
      rol === 'Administradora' ? 'Adm.' : 'Asist.';
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
        nivel:           parseInt(formData.nivel) || 1,
        comision_porcentaje: formData.comision_porcentaje ? parseFloat(formData.comision_porcentaje) : null,
      };
      if (editingId) {
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
  const canDelete = (targetUser) => {
    if (targetUser.id === myId) return false;              // No autoeliminar
    return myNivel > (targetUser.nivel || 1);              // Solo nivel inferior
  };

  const handleDelete = (user) => {
    if (!canDelete(user)) {
      toast.error(
        user.nivel >= 3
          ? 'No se puede eliminar a un Superadministrador.'
          : user.id === myId
            ? 'No puedes eliminar tu propio acceso.'
            : 'No puedes eliminar a un usuario de igual o mayor nivel.'
      );
      return;
    }
    setConfirmModal({
      isOpen:true, type: user.nivel >= 2 ? 'warning' : 'danger',
      title: '¿Eliminar acceso?',
      message: `Se eliminará permanentemente el acceso de "${user.nombre_completo}". Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          await usuariosService.eliminar(user.id);
          setConfirmModal(prev=>({...prev,isOpen:false}));
          toast.success('Acceso eliminado.'); cargarUsuarios();
        } catch (err) {
          toast.error(err.response?.data?.mensaje || 'Error al eliminar.');
        }
      },
    });
  };

  const handleOpenReset = (user) => {
    if (!canDelete(user)) { // misma lógica: solo puedes resetear a quienes puedes eliminar
      toast.error('No tienes permiso para resetear la contraseña de este usuario.'); return;
    }
    setResetModal({ isOpen:true, targetUser:user });
    setResetPassForm({ adminPassword:'', newPassword:'', confirmPassword:'' });
    setShowAdminPass(false); setShowNewPass(false); setShowConfPass(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (resetPassForm.newPassword !== resetPassForm.confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden.'); return;
    }
    if (resetPassForm.newPassword.length < 6) {
      toast.error('Mínimo 6 caracteres.'); return;
    }
    try {
      setSavingReset(true);
      await usuariosService.resetPassword({
        targetUserId:  resetModal.targetUser.id,
        nuevaPassword: resetPassForm.newPassword,
        adminPassword: resetPassForm.adminPassword,
      });
      setResetModal({ isOpen:false, targetUser:null });
      toast.success(`Contraseña de "${resetModal.targetUser.nombre_completo}" reseteada. 🔐`);
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al resetear.');
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

  return (
    <div className="animate-fade-in text-slate-800 pb-10">

      <ConfirmModal
        isOpen={confirmModal.isOpen} title={confirmModal.title}
        message={confirmModal.message} type={confirmModal.type}
        confirmText="Sí, eliminar" cancelText="Cancelar"
        onConfirm={confirmModal.onConfirm}
        onCancel={()=>setConfirmModal(prev=>({...prev,isOpen:false}))}
      />

      {/* MODAL RESET CONTRASEÑA */}
      {resetModal.isOpen && (
        <div className="dialog-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-pop-in">
            <div className="bg-amber-500 p-5 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2"><KeyRound size={20}/> Resetear Contraseña</h3>
              <button onClick={()=>setResetModal({isOpen:false,targetUser:null})} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-5">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                <p className="text-sm font-bold text-amber-800">Reseteando contraseña de:</p>
                <p className="text-lg font-black text-amber-900 mt-1">{resetModal.targetUser?.nombre_completo}</p>
                <p className="text-xs text-amber-700 mt-1 font-mono">ID: {resetModal.targetUser?.id}</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tu contraseña de administrador</label>
                <div className="relative">
                  <input required value={resetPassForm.adminPassword}
                    onChange={e=>setResetPassForm({...resetPassForm,adminPassword:e.target.value})}
                    type={showAdminPass?'text':'password'}
                    className="w-full pr-12 px-4 py-3 border border-red-200 rounded-xl outline-none focus:border-red-400 bg-red-50 font-medium"
                    placeholder="Tu contraseña actual"/>
                  <button type="button" onClick={()=>setShowAdminPass(!showAdminPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                    {showAdminPass?<EyeOff size={18}/>:<Eye size={18}/>}
                  </button>
                </div>
              </div>
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nueva contraseña para el usuario</label>
                  <div className="relative">
                    <input required value={resetPassForm.newPassword}
                      onChange={e=>setResetPassForm({...resetPassForm,newPassword:e.target.value})}
                      type={showNewPass?'text':'password'} minLength="6"
                      className="w-full pr-12 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-clinical-500 bg-slate-50 font-medium"
                      placeholder="Mínimo 6 caracteres"/>
                    <button type="button" onClick={()=>setShowNewPass(!showNewPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                      {showNewPass?<EyeOff size={18}/>:<Eye size={18}/>}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Confirmar nueva contraseña</label>
                  <div className="relative">
                    <input required value={resetPassForm.confirmPassword}
                      onChange={e=>setResetPassForm({...resetPassForm,confirmPassword:e.target.value})}
                      type={showConfPass?'text':'password'} minLength="6"
                      className="w-full pr-12 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-clinical-500 bg-slate-50 font-medium"/>
                    <button type="button" onClick={()=>setShowConfPass(!showConfPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                      {showConfPass?<EyeOff size={18}/>:<Eye size={18}/>}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setResetModal({isOpen:false,targetUser:null})}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
                <button type="submit" disabled={savingReset}
                  className="flex-[2] py-3 bg-amber-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors shadow-lg disabled:opacity-50">
                  <ShieldCheck size={18}/> {savingReset?'Reseteando...':'Resetear Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Administración de Personal</h2>
        <p className="text-slate-500 mt-1">Gestión del equipo clínico y administrativo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LISTA */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[750px]">
          <h3 className="font-bold text-lg mb-4 border-b pb-3 flex items-center gap-2">
            <ShieldAlert size={20} className="text-slate-400"/> Personal Activo
          </h3>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input type="text" placeholder="Buscar personal..." value={searchTerm}
              onChange={e=>setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-slate-50"/>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {loading
              ? <p className="text-center text-slate-400 py-10">Cargando...</p>
              : filteredUsers.length===0
                ? <p className="text-center text-slate-400 py-10">Sin resultados.</p>
                : filteredUsers.map(u => {
                    const nivelCfg = NIVEL_CONFIG[u.nivel] || NIVEL_CONFIG[1];
                    return (
                      <div key={u.id}
                        className={`p-4 border rounded-2xl flex flex-col gap-3 transition-colors ${editingId===u.id?'border-clinical-500 bg-clinical-50':'bg-slate-50 hover:border-clinical-200'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-800 flex items-center gap-1.5">
                              {u.nivel >= 3 && <Crown size={14} className="text-purple-500"/>}
                              {u.nombre_completo}
                            </p>
                          <p className="text-xs text-slate-500 mt-1">
                          {u.rol==='Doctor'?`COP: ${u.cop||'S/N'} · Comisión: ${u.comision_porcentaje ? u.comision_porcentaje+'%' : 'sin definir'}`:`Cel: ${u.telefono||'-'}`}
                        </p>
                          </div>
                          <span className={`text-[10px] font-black tracking-widest px-2 py-1 rounded-lg border ${nivelCfg.class}`}>
                            {nivelCfg.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-200/60">
                          <span className="text-xs text-slate-500 font-mono">ID: <b className="text-slate-700">{u.id}</b></span>
                          <div className="flex gap-1.5">
                            {/* Editar: solo si mi nivel > su nivel, o es mi propio perfil */}
                            {(myNivel > (u.nivel||1) || u.id===myId) && (
                              <button onClick={()=>handleEdit(u)}
                                className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors" title="Editar datos">
                                <Edit size={15}/>
                              </button>
                            )}
                            {/* Resetear contraseña */}
                            {myNivel > (u.nivel||1) && u.id!==myId && (
                              <button onClick={()=>handleOpenReset(u)}
                                className="p-1.5 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors" title="Resetear contraseña">
                                <KeyRound size={15}/>
                              </button>
                            )}
                            {/* Eliminar: solo si puedo según jerarquía */}
                            {canDelete(u) && (
                              <button onClick={()=>handleDelete(u)}
                                className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors" title="Eliminar">
                                <Trash2 size={15}/>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
            }
          </div>
        </div>

        {/* FORMULARIO */}
        <div className="lg:col-span-7 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-fit">
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <h3 className="font-bold text-xl flex items-center gap-2 text-clinical-600">
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
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombres y Apellidos Completos</label>
                <input required name="nombre" value={formData.nombre} onChange={handleChange}
                  className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-slate-50 focus:bg-white"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Trato</label>
                <select name="gender" value={formData.gender} onChange={handleChange}
                  className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-slate-50">
                  <option value="o">Masculino</option>
                  <option value="a">Femenino</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">DNI</label>
                <input required name="dni" value={formData.dni} onChange={handleChange} maxLength="8"
                  className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-slate-50" placeholder="8 dígitos"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Celular</label>
                <input required name="telefono" value={formData.telefono} onChange={handleChange} maxLength="9"
                  className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-slate-50" placeholder="9 dígitos"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                <input name="email" value={formData.email} onChange={handleChange} type="email"
                  className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-slate-50"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dirección</label>
              <input name="direccion" value={formData.direccion} onChange={handleChange}
                className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-slate-50"/>
            </div>

            {/* Rol + Nivel + Especialidad */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl border border-slate-100 bg-clinical-50/40">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Rol en Clínica</label>
                <select name="rol" value={formData.rol} onChange={handleChange}
                  className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-white">
                  <option value="Asistente">Asistente</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Administradora">Administradora</option>
                </select>
              </div>

              {/* Solo Superadmins pueden asignar o editar el Nivel de Acceso (y no pueden modificarse a sí mismos aquí) */}
              {myNivel >= 3 && editingId !== myId && (
                <div>
                  <label className="block text-xs font-bold text-purple-600 uppercase mb-1 flex items-center gap-1">
                    <Crown size={12}/> Nivel de Acceso
                  </label>
                  <select name="nivel" value={formData.nivel} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-purple-200 rounded-xl outline-none focus:border-purple-400 bg-white">
                    <option value={1}>Staff (nivel 1)</option>
                    <option value={2}>Admin (nivel 2)</option>
                  </select>
                </div>
              )}

              {formData.rol === 'Doctor' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-clinical-600 uppercase mb-1">Especialidad</label>
                    <input required name="especialidad" value={formData.especialidad} onChange={handleChange}
                      placeholder="Ej. Ortodoncia"
                      className="w-full px-4 py-2.5 border border-clinical-200 rounded-xl outline-none focus:border-clinical-500 bg-white"/>
                  </div>
                      <div>
                        <label className="block text-xs font-bold text-clinical-600 uppercase mb-1">Nro. COP</label>
                        <input required name="cop" value={formData.cop} onChange={handleChange} maxLength="6"
                          placeholder="Ej. 12345"
                          className="w-full px-4 py-2.5 border border-clinical-200 rounded-xl outline-none focus:border-clinical-500 bg-white"/>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-clinical-600 uppercase mb-1">% Comisión</label>
                        <input type="number" name="comision_porcentaje" value={formData.comision_porcentaje} onChange={handleChange}
                          min="0" max="100" step="0.01" placeholder="Ej. 40"
                          className="w-full px-4 py-2.5 border border-clinical-200 rounded-xl outline-none focus:border-clinical-500 bg-white"/>
                      </div>
                </>
              )}
            </div>

            {/* Credenciales */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ID de Acceso</label>
                <input required disabled={!!editingId} name="id" value={formData.id} onChange={handleChange}
                  placeholder="usuario123"
                  className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-mono"/>
                {editingId && <p className="text-[10px] text-slate-400 mt-1">El ID no se puede modificar.</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  {editingId?'Contraseña (vacío = sin cambios)':'Contraseña Inicial'}
                </label>
                <div className="relative">
                  <input required={!editingId} name="password" value={formData.password}
                    onChange={handleChange} type={showPass?'text':'password'}
                    placeholder={editingId?'Dejar vacío = sin cambios':'Mínimo 6 caracteres'}
                    className="w-full pl-4 pr-12 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-slate-50"/>
                  <button type="button" onClick={()=>setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                    {showPass?<EyeOff size={18}/>:<Eye size={18}/>}
                  </button>
                </div>
                {editingId && (
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <KeyRound size={10}/> Usa el ícono 🔑 de la lista para resetear la contraseña.
                  </p>
                )}
              </div>
            </div>

            <button type="submit"
              className="w-full py-4 bg-clinical-500 text-white rounded-2xl font-bold hover:bg-clinical-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-clinical-100">
              <Save size={20}/> {editingId?'Guardar Cambios':'Registrar Personal'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AdministracionPersonal;
