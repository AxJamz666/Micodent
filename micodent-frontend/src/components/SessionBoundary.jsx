import { useEffect, useRef } from 'react';
import { LoaderCircle, LockKeyhole, RefreshCw } from 'lucide-react';
import { browserSession, useSession } from '../services/browserSession';
import { authService } from '../services/api';

export default function SessionBoundary({ children }) {
  const { status, user } = useSession();
  const action = useRef(null);
  const locked = status === 'changed' || status === 'expired';
  const blocked = locked || status === 'checking' || status === 'unavailable';

  useEffect(() => {
    const storage = event => {
      if (event.storageArea === localStorage) browserSession.checkStorage(event);
    };
    const focus = () => browserSession.checkStorage();
    window.addEventListener('storage', storage);
    window.addEventListener('focus', focus);
    document.addEventListener('visibilitychange', focus);
    focus();
    return () => {
      window.removeEventListener('storage', storage);
      window.removeEventListener('focus', focus);
      document.removeEventListener('visibilitychange', focus);
    };
  }, []);

  useEffect(() => {
    if (status !== 'checking') return;
    let active = true;
    let token;
    try { token = browserSession.assertCurrent(); } catch { return; }
    authService.getMe().then(({ data }) => {
      if (active) browserSession.verified(data.usuario, token);
    }).catch(() => {
      if (active && browserSession.getSnapshot().status === 'checking') {
        try { browserSession.unavailable(token); } catch { /* Another tab already locked this session. */ }
      }
    });
    return () => { active = false; };
  }, [status]);

  useEffect(() => { if (blocked) action.current?.focus(); }, [blocked, status]);

  const checking = status === 'checking';
  const title = checking ? 'Verificando sesion' : status === 'unavailable' ? 'No se pudo verificar la sesion'
    : status === 'expired' ? 'Sesion finalizada' : 'La sesion cambio en otra pestana';
  return (
    <>
      {/* Keep drafts in memory, but hide and disable the previous identity's UI. */}
      <div hidden={blocked} inert={blocked}>{(user || !blocked) && children}</div>
      {blocked && <section className="fixed inset-0 z-[100000] bg-gray-50 flex items-center justify-center p-6 overflow-y-auto"
        role="alertdialog" aria-modal="true" aria-labelledby="session-title" aria-describedby="session-description">
        <div className="w-full max-w-md text-center space-y-5">
          {checking ? <LoaderCircle aria-hidden="true" className="mx-auto animate-spin text-clinical-600" size={32} />
            : <LockKeyhole aria-hidden="true" className="mx-auto text-clinical-600" size={32} />}
          <h1 id="session-title" className="text-xl font-bold text-gray-900">{title}</h1>
          <p id="session-description" className="text-sm leading-6 text-gray-700">
            {checking ? 'Espera un momento.' : status === 'unavailable'
              ? 'No se cerro tu sesion. Comprueba la conexion e intenta nuevamente.'
              : 'Esta pestana esta bloqueada. Al continuar se descartara lo que no hayas guardado en ella.'}
          </p>
          {!checking && <button ref={action} type="button"
            onClick={() => locked ? window.location.assign('/login') : browserSession.retry()}
            className="inline-flex max-w-full items-center justify-center gap-2 rounded-lg bg-clinical-600 px-5 py-3 text-sm font-semibold text-white hover:bg-clinical-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-clinical-600">
            <RefreshCw size={18} aria-hidden="true" />{locked ? 'Continuar al acceso' : 'Reintentar'}
          </button>}
        </div>
      </section>}
    </>
  );
}
