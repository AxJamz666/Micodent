export const fixture = { user: null, status: undefined };
export function useSession() { return { user: fixture.user, status: fixture.status }; }

function service() {
  return new Proxy({}, {
    get(target, key) {
      if (key in target) return target[key];
      return () => { throw new Error('UNEXPECTED_COMPONENT_API_CALL: ' + String(key)); };
    },
  });
}
export const usuariosService = service();
export const pacientesService = service();
export const historiasService = service();
export const authService = service();
export const citasService = service();
export const dashboardService = service();
export const gastosService = service();
export const laboratorioService = service();
export const auditoriaService = service();
export const browserSession = service();
export default service();
