import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate    = useNavigate();
  const [userId,    setUserId]    = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [isLoading, setIsLoading] = useState(false);

useEffect(() => {
    const token = localStorage.getItem('token');
    const nombre = localStorage.getItem('userNombre');

    if (token && nombre) {
      navigate('/');
    } else {

      localStorage.clear();
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await authService.login(
        userId.trim().toLowerCase(),
        password.trim()
      );
      if (data.ok) {
           localStorage.setItem('token',         data.token);
           localStorage.setItem('userNombre',    data.usuario.nombre);
           localStorage.setItem('userFullName',  data.usuario.fullName);
           localStorage.setItem('userRol',       data.usuario.rol);
           localStorage.setItem('userPrefix',    data.usuario.prefix  || '');
           localStorage.setItem('userGender',    data.usuario.gender  || 'o');
           localStorage.setItem('isAdmin',       data.usuario.isAdmin ? 'true' : 'false');
           localStorage.setItem('userId',        data.usuario.id);
           localStorage.setItem('userNivel',     String(data.usuario.nivel || 1));  // ✅ NUEVO
           localStorage.setItem('userEspecialidad', data.usuario.especialidad || '');
           localStorage.setItem('userCop',          data.usuario.cop          || '');
        toast.success(`Bienvenid${data.usuario.gender === 'a' ? 'a' : 'o'}, ${data.usuario.nombre}`);
        navigate('/');
      }
    } catch (error) {
      const mensaje = error.response?.data?.mensaje || 'Error de conexión con el servidor.';
      toast.error(mensaje);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Logo Micodent"
            className="h-20 mx-auto mb-4 object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h1 className="text-2xl font-bold text-slate-800">Micodent</h1>
          <p className="text-sm text-slate-500 font-medium">Clínica Odontológica Jauja</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">ID de Usuario</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input
                type="text"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-clinical-500 outline-none transition-all font-medium"
                placeholder="Ej. drmiguel"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Contraseña</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-clinical-500 outline-none transition-all font-medium"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-2xl text-white font-black shadow-lg transition-all ${
              isLoading
                ? 'bg-clinical-300 cursor-not-allowed'
                : 'bg-clinical-500 hover:bg-clinical-600 hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? 'Verificando...' : 'Entrar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;