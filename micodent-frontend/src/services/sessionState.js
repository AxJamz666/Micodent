import { clearMatchingSession, clearSession } from './session.js';

export function sessionChangedError() {
  return Object.assign(new Error('La sesion de esta pestana ya no esta disponible.'), { code: 'SESSION_CHANGED' });
}

export function sessionProfile(usuario) {
  if (!usuario || typeof usuario.id !== 'string' || !usuario.id || typeof usuario.nombre !== 'string') {
    throw new Error('INVALID_SESSION_PROFILE');
  }
  return {
    id: usuario.id, nombre: usuario.nombre, fullName: usuario.nombre_completo || usuario.nombre,
    rol: usuario.rol || '', prefix: usuario.prefix || '', gender: usuario.gender || 'o',
    isAdmin: usuario.is_admin === true || usuario.is_admin === 1,
    nivel: usuario.nivel || 1, especialidad: usuario.especialidad || '', cop: usuario.cop || '',
  };
}

function cacheProfile(user, storage) {
  const fields = { userId: user.id, userNombre: user.nombre, userFullName: user.fullName,
    userRol: user.rol, userPrefix: user.prefix, userGender: user.gender,
    isAdmin: user.isAdmin, userNivel: user.nivel, userEspecialidad: user.especialidad, userCop: user.cop };
  for (const [key, value] of Object.entries(fields)) storage.setItem(key, String(value));
}

// A tab keeps its original credential. It must never adopt another tab's login
// while clinical forms from the previous identity are still mounted.
export function createSessionState(storage) {
  let token = storage.getItem('token');
  let snapshot = { status: token ? 'checking' : 'anonymous', user: null };
  const listeners = new Set();
  const publish = (status, user = snapshot.user) => {
    snapshot = { status, user };
    for (const listener of listeners) listener();
  };
  const isLocked = () => ['changed', 'expired'].includes(snapshot.status);
  const lock = () => { if (!isLocked()) publish('changed'); };
  const assertCurrent = (expected = token) => {
    if (isLocked() || expected !== token || storage.getItem('token') !== token) {
      lock();
      throw sessionChangedError();
    }
    return token;
  };
  return {
    getSnapshot: () => snapshot,
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); },
    assertCurrent,
    checkStorage: event => {
      if (event && event.key !== null && event.key !== 'token') return;
      if ((event?.key === 'token' && event.newValue !== token) || storage.getItem('token') !== token) lock();
    },
    requestToken: login => {
      assertCurrent();
      if (login ? snapshot.status !== 'anonymous' : !token) throw sessionChangedError();
      if (!login && !['checking', 'ready'].includes(snapshot.status)) throw sessionChangedError();
      return token;
    },
    acceptLogin: (newToken, expected) => {
      assertCurrent(expected);
      if (snapshot.status !== 'anonymous' || typeof newToken !== 'string' || !newToken) throw sessionChangedError();
      clearSession(storage);
      storage.setItem('token', newToken);
      token = newToken;
      publish('checking', null);
    },
    verified: (usuario, expected) => {
      assertCurrent(expected);
      const user = sessionProfile(usuario);
      cacheProfile(user, storage);
      publish('ready', user);
    },
    unavailable: expected => {
      assertCurrent(expected);
      publish('unavailable');
    },
    retry: () => { assertCurrent(); publish('checking'); },
    expire: expected => {
      assertCurrent(expected);
      clearMatchingSession(expected, storage);
      publish('expired');
    },
    end: expected => {
      assertCurrent(expected);
      clearMatchingSession(expected, storage);
      token = null;
      publish('anonymous', null);
    },
  };
}
