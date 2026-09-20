const AUTH_KEYS = ['token', 'userNombre', 'userFullName', 'userRol', 'userPrefix',
  'userGender', 'isAdmin', 'userId', 'userNivel', 'userEspecialidad', 'userCop'];

export function clearSession(storage = localStorage) {
  for (const key of AUTH_KEYS) storage.removeItem(key);
}

export function clearMatchingSession(expectedToken, storage = localStorage) {
  const current = storage.getItem('token');
  if (current && current !== expectedToken) return false;
  clearSession(storage);
  return true;
}

export function shouldClearSession(error, currentToken) {
  if (error.response?.status !== 401 || error.config?.url === '/auth/login') return false;
  const authorization = error.config?.headers?.Authorization;
  // An old request must not destroy a newer login completed in another tab.
  return Boolean(currentToken) && authorization === `Bearer ${currentToken}`;
}
