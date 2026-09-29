import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { Home, Users, CalendarDays, UserCircle, LogOut, Settings, User, ChevronDown, TrendingUp } from 'lucide-react';
import { authService } from '../services/api';
import { browserSession } from '../services/browserSession';
import toast from 'react-hot-toast';

const MainLayout = () => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef(null);

  const shortName = localStorage.getItem('userNombre') || 'Usuario';
  const fullName = localStorage.getItem('userFullName') || 'Personal Clínico';
  const role = localStorage.getItem('userRol') || 'Personal';
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const epoch = browserSession.assertCurrent();
      await authService.logout();
      browserSession.end(epoch);
      navigate('/login', { replace: true });
    } catch (error) {
      if (error.response?.status !== 401 && error.code !== 'SESSION_CHANGED') {
        toast.error('No se pudo confirmar el cierre de sesión. Intenta nuevamente.');
      }
    } finally { setLoggingOut(false); }
  };

  return (
    <div className="micodent-app min-h-screen bg-[#f4f7f7] font-sans">
      <nav aria-label="Navegación principal" className="sticky top-0 z-50 flex min-h-16 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <img src="/logo.png" alt="" className="h-9 w-9 flex-shrink-0 object-contain" />
          <div className="hidden sm:block">
            <h1 className="text-base font-bold leading-tight text-slate-800">Micodent</h1>
            <p className="text-[11px] font-medium text-slate-500">Gestión odontológica</p>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-center gap-0.5 sm:gap-2">
        <NavLink to="/" aria-label="Inicio" className={({isActive}) => `flex min-h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold transition-colors sm:px-3 ${isActive ? 'bg-clinical-50 text-clinical-700' : 'text-slate-600 hover:bg-slate-50'}`}><Home size={18}/> <span className="hidden md:block">Inicio</span></NavLink>
        <NavLink to="/pacientes" aria-label="Pacientes" className={({isActive}) => `flex min-h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold transition-colors sm:px-3 ${isActive ? 'bg-clinical-50 text-clinical-700' : 'text-slate-600 hover:bg-slate-50'}`}><Users size={18}/> <span className="hidden md:block">Pacientes</span></NavLink>
        <NavLink to="/agenda" aria-label="Agenda" className={({isActive}) => `flex min-h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold transition-colors sm:px-3 ${isActive ? 'bg-clinical-50 text-clinical-700' : 'text-slate-600 hover:bg-slate-50'}`}><CalendarDays size={18}/> <span className="hidden md:block">Agenda</span></NavLink>
        </div>

        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button aria-label="Menú de perfil" aria-expanded={isProfileOpen} onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 transition-colors hover:bg-slate-50">
            <UserCircle size={24} className="text-clinical-600" />
            <span className="hidden max-w-28 truncate text-sm font-semibold text-slate-700 sm:block">{shortName}</span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 z-50 mt-2 w-[min(18rem,calc(100vw-1.5rem))] rounded-lg border border-slate-200 bg-white py-2 shadow-lg">
              <div className="mb-1 border-b border-slate-100 px-4 py-3">
                <p className="truncate text-sm font-semibold leading-tight text-slate-800">{fullName}</p>
                <p className="mt-1 text-xs text-slate-500">{role}</p>
              </div>

              <div className="px-2 space-y-1">
                {!isAdmin && role === 'Doctor' && <Link to="/produccion" onClick={() => setIsProfileOpen(false)} className="w-full px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50 rounded-xl flex items-center gap-3 font-bold"><TrendingUp size={18}/>Mi producción</Link>}
                <Link to="/perfil" onClick={() => setIsProfileOpen(false)} className="w-full px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50 rounded-xl flex items-center gap-3 font-bold transition-colors">
                  <User size={18} className="text-slate-400" /> Mi Perfil
                </Link>
                
                {isAdmin && (
                  <Link to="/administracion-personal" onClick={() => setIsProfileOpen(false)} className="w-full px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50 rounded-xl flex items-center gap-3 font-bold transition-colors">
                    <Settings size={18} className="text-slate-400" /> Administración de Personal
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/finanzas" onClick={() => setIsProfileOpen(false)} className="w-full px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50 rounded-xl flex items-center gap-3 font-bold transition-colors">
                    <TrendingUp size={18} className="text-slate-400" /> Dashboard Financiero
                  </Link>
                )}
              </div>

              <div className="px-2 mt-2 pt-2 border-t border-slate-100">
                <button onClick={handleLogout} disabled={loggingOut} className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 rounded-xl flex items-center gap-3 font-black transition-colors disabled:opacity-50">
                  <LogOut size={18} /> Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-6"><Outlet /></main>
    </div>
  );
};

export default MainLayout;
