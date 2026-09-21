import { createSessionState } from './sessionState.js';
import { useSyncExternalStore } from 'react';

export const browserSession = createSessionState(window.localStorage);

export function useSession() {
  return useSyncExternalStore(browserSession.subscribe, browserSession.getSnapshot);
}
