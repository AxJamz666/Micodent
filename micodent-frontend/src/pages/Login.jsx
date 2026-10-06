import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/api';
import toast from 'react-hot-toast';
import { browserSession, useSession } from '../services/browserSession';

const Login = () => {
  const navigate    = useNavigate();
  const { status } = useSession();
  const [userId,    setUserId]    = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === 'ready') navigate('/', { replace: true });
  }, [navigate, status]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const expectedEpoch = browserSession.assertCurrent();
      const { data } = await authService.login(
        userId.trim().toLowerCase(),
        password
      );
      if (data.ok) {
        browserSession.acceptLogin(data.sesion, expectedEpoch);
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
    <div className="flex min-h-screen items-center justify-center bg-[#f4f7f7] p-4 font-sans">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 text-center">
          <img
            src="/logo.png"
            alt=""
            className="mx-auto mb-4 h-14 w-14 object-contain"
          />
          <h1 className="text-2xl font-bold text-slate-800">Micodent</h1>
          <p className="mt-1 text-sm text-slate-500">Acceso al sistema clínico</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="login-user" className="ui-field-label">ID de usuario</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input
                type="text"
                id="login-user"
                autoComplete="username"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="ui-input pl-12"
                placeholder="Ej. drmiguel"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="ui-field-label">Contraseña</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                id="login-password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="ui-input pl-12 pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShowPass(!showPass)}
                className="absolute inset-y-0 right-0 flex min-w-10 items-center justify-center text-slate-500 hover:text-slate-700"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="ui-button-primary w-full"
          >
            {isLoading ? 'Verificando...' : 'Entrar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
