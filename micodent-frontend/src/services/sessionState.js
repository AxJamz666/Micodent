import { clearSession } from './session.js';

export const SESSION_EVENT_KEY = 'micodentSessionEvent';

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

// The cookie is inaccessible to JavaScript. Only a non-authenticating identity
// marker is shared; the backend also binds every operation to that identity.
export function createSessionState(storage, nonce = () => crypto.randomUUID()) {
  storage.removeItem('token');
  let epoch = storage.getItem(SESSION_EVENT_KEY);
  let session = null;
  let snapshot = { status: 'checking', user: null };
  const listeners = new Set();
  const publish = (status, user = snapshot.user) => {
    snapshot = { status, user };
    for (const listener of listeners) listener();
  };
  const isLocked = () => ['changed', 'expired'].includes(snapshot.status);
  const lock = () => { if (!isLocked()) publish('changed'); };
  const assertCurrent = (expected = epoch) => {
    if (storage.getItem(SESSION_EVENT_KEY) !== epoch) {
      lock();
      throw sessionChangedError();
    }
    if (isLocked() || expected !== epoch) throw sessionChangedError();
    return epoch;
  };
  const validSession = value => {
    if (!value || typeof value.id !== 'string' || typeof value.csrf !== 'string'
        || !/^[a-f0-9]{64}$/.test(value.id) || !/^[a-f0-9]{64}$/.test(value.csrf)) throw Error('INVALID_SESSION_CONTEXT');
    return { id: value.id, csrf: value.csrf };
  };
  const announce = value => {
    storage.setItem(SESSION_EVENT_KEY, value);
    epoch = value;
  };
  const forget = () => {
    clearSession(storage);
    session = null;
    if (epoch && !epoch.startsWith('signed-out:')) announce('signed-out:' + nonce());
  };
  return {
    getSnapshot: () => snapshot,
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); },
    assertCurrent,
    checkStorage: event => {
      if (event && event.key !== null && event.key !== SESSION_EVENT_KEY) return;
      if ((event?.key === SESSION_EVENT_KEY && event.newValue !== epoch) || storage.getItem(SESSION_EVENT_KEY) !== epoch) lock();
    },
    requestContext: ({ login = false, bootstrap = false } = {}) => {
      assertCurrent();
      if (login ? snapshot.status !== 'anonymous' : bootstrap ? snapshot.status !== 'checking'
        : snapshot.status !== 'ready' || !session) throw sessionChangedError();
      return { epoch, id: session?.id, csrf: session?.csrf };
    },
    acceptLogin: (value, expected) => {
      assertCurrent(expected);
      if (snapshot.status !== 'anonymous') throw sessionChangedError();
      session = validSession(value);
      clearSession(storage);
      announce(session.id);
      publish('checking', null);
    },
    verified: (usuario, value, expected) => {
      assertCurrent(expected);
      const user = sessionProfile(usuario);
      session = validSession(value);
      cacheProfile(user, storage);
      if (epoch !== session.id) announce(session.id);
      publish('ready', user);
    },
    unavailable: expected => {
      assertCurrent(expected);
      publish('unavailable');
    },
    retry: () => { assertCurrent(); publish('checking'); },
    changed: expected => { assertCurrent(expected); lock(); },
    expire: expected => {
      assertCurrent(expected);
      forget();
      publish(snapshot.user ? 'expired' : 'anonymous');
    },
    end: expected => {
      assertCurrent(expected);
      forget();
      publish('anonymous', null);
    },
  };
}
