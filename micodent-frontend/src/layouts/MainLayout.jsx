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
      const token = browserSession.assertCurrent();
      await authService.logout();
      browserSession.end(token);
      navigate('/login', { replace: true });
    } catch (error) {
      if (error.response?.status !== 401 && error.code !== 'SESSION_CHANGED') {
        toast.error('No se pudo confirmar el cierre de sesión. Intenta nuevamente.');
      }
    } finally { setLoggingOut(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Micodent" className="h-10 w-auto object-contain" />
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Micodent</h1>
            <p className="text-[10px] text-clinical-600 uppercase font-black tracking-widest">Sede Jauja</p>
          </div>
        </div>

        <div className="flex gap-2">
        <NavLink to="/" className={({isActive}) => `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-clinical-50 text-clinical-600' : 'text-slate-500 hover:bg-slate-50'}`}><Home size={18}/> <span className="hidden lg:block">Inicio</span></NavLink>
        <NavLink to="/pacientes" className={({isActive}) => `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-clinical-50 text-clinical-600' : 'text-slate-500 hover:bg-slate-50'}`}><Users size={18}/> <span className="hidden lg:block">Pacientes</span></NavLink>
        <NavLink to="/agenda" className={({isActive}) => `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-clinical-50 text-clinical-600' : 'text-slate-500 hover:bg-slate-50'}`}><CalendarDays size={18}/> <span className="hidden lg:block">Agenda</span></NavLink>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 border border-slate-200 rounded-2xl py-1.5 px-2 hover:bg-slate-50 transition-all bg-white shadow-sm">
            <div className="bg-clinical-500 text-white p-1 rounded-xl"><UserCircle size={24} /></div>
            <span className="text-sm font-bold text-slate-700 hidden sm:block">{shortName}</span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 py-3 animate-fade-in z-50">
              <div className="px-5 py-4 border-b border-slate-100 mb-2">
                <p className="text-sm font-black text-slate-800 leading-tight">{fullName}</p>
                <p className="text-[10px] text-clinical-600 mt-1 uppercase font-black tracking-widest">{role}</p>
              </div>

              <div className="px-2 space-y-1">
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
      <main className="max-w-7xl mx-auto p-6"><Outlet /></main>
    </div>
  );
};

export default MainLayout;
