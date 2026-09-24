import axios from 'axios';
import { normalizeResponse } from '../utils/data';
import { isFinancialMutation, notifyFinanceChange } from '../utils/financeEvents';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

async function postOnce(url, data) {
  const bytes = new TextEncoder().encode(JSON.stringify([localStorage.getItem('userId'), url, data]));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const slot = `micodent-pending-${Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2, '0')).join('')}`;
  const key = sessionStorage.getItem(slot) || crypto.randomUUID();
  sessionStorage.setItem(slot, key);
  try {
    const result = await api.post(url, data, { headers: { 'Idempotency-Key': key } });
    sessionStorage.removeItem(slot);
    return result;
  } catch (error) {
    if (error.response?.status >= 400 && error.response.status < 500) sessionStorage.removeItem(slot);
    throw error;
  }
}

// Agrega el token JWT a cada petición automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el token expira, manda al login
api.interceptors.response.use(
  (response) => {
    response.data = normalizeResponse(response.data);
    if (response.data?.ok !== false && isFinancialMutation(response.config)) notifyFinanceChange();
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================
// AUTH
// ============================================================
export const authService = {
  login: (id, password) => api.post('/auth/login', { id, password }),
  getMe: ()             => api.get('/auth/me'),
};

// ============================================================
// USUARIOS
// ============================================================
export const usuariosService = {
  cambiarPassword: (data) => api.put('/usuarios/cambiar-password', data),
  getAll:   ()            => api.get('/usuarios'),
  crear:    (data)        => api.post('/usuarios', data),
  editar:   (id, data)    => api.put(`/usuarios/${id}`, data),
  getDoctores: ()         => api.get('/usuarios/doctores'),
  eliminar: (id)          => api.delete(`/usuarios/${id}`),
  resetPassword: (data) => api.post('/usuarios/reset-password', data),
  actualizarFirmaSello: (data) => api.put('/usuarios/mi-firma-sello', data),
};

// ============================================================
// PACIENTES
// ============================================================
export const pacientesService = {
  getAll:       (search, incluirArchivados) => api.get('/pacientes', { params: { search, incluirArchivados } }),
  getById:      (id)       => api.get(`/pacientes/${id}`),
  getAuditoria: (id)       => api.get(`/pacientes/${id}/auditoria`),
  crear:        (data)     => api.post('/pacientes', data),
  editar:       (id, data) => api.put(`/pacientes/${id}`, data),
  eliminar:     (id)       => api.delete(`/pacientes/${id}`),
  reactivar:    (id)       => api.put(`/pacientes/${id}/reactivar`),
};

// ============================================================
// HISTORIAS CLÍNICAS
// ============================================================
export const historiasService = {
  getAll:             (search, incluirArchivadas) => api.get('/historias', { params: { search, incluirArchivadas } }),
  reactivar:          (pacienteId)         => api.put(`/historias/paciente/${pacienteId}/reactivar`),
  getByPaciente:      (pacienteId)        => api.get(`/historias/paciente/${pacienteId}`),
  guardarAntecedentes:(historiaId, data)  => api.put(`/historias/${historiaId}/antecedentes`, data),
  agregarItemOdontograma: (historiaId, data) => api.post(`/historias/${historiaId}/odontograma-items`, data),
  agregarAdendaOdontograma: (id, data)    => api.post(`/historias/odontograma-items/${id}/adendas`, data),
  agregarReceta:            (historiaId, data) => api.post(`/historias/${historiaId}/recetas`, data),
  reemitirReceta:           (id, data)    => api.post(`/historias/recetas/${id}/reemitir`, data),
  getCentrosReferencia:     ()            => api.get('/historias/centros-referencia'),
  agregarOrdenRadiografia:  (historiaId, data) => api.post(`/historias/${historiaId}/ordenes-radiografia`, data),
  reemitirOrdenRadiografia: (id, data)    => api.post(`/historias/ordenes-radiografia/${id}/reemitir`, data),
  eliminarItemOdontograma: (id, motivo)   => api.delete(`/historias/odontograma-items/${id}`, { data: { motivo } }),
  guardarFirmas:      (historiaId, data)  => api.put(`/historias/${historiaId}/firmas`, data),
  agregarConsulta:    (historiaId, data)  => postOnce(`/historias/${historiaId}/consultas`, data),
  editarConsulta:     (id, data)          => api.put(`/historias/consultas/${id}`, data),
  eliminarConsulta:   (id)                => api.delete(`/historias/consultas/${id}`),
  agregarAdendaConsulta: (id, data)       => api.post(`/historias/consultas/${id}/adendas`, data),
  registrarPago:      (consultaId, data)  => postOnce(`/historias/consultas/${consultaId}/pagos`, data),
  anularPago:         (pagoId, motivo) => postOnce(`/historias/pagos/${pagoId}/anular`, { motivo }),
  conciliarCostos:    (consultaId, data) => postOnce(`/historias/consultas/${consultaId}/conciliar-costos`, data),
  getRadiografias:    (historiaId)        => api.get(`/historias/${historiaId}/radiografias`),
  eliminarRadiografia:(id)                => api.delete(`/historias/radiografias/${id}`),
  subirRadiografia:   (historiaId, formData) =>
    api.post(`/historias/${historiaId}/radiografias`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  eliminar:           (pacienteId)        => api.delete(`/historias/paciente/${pacienteId}`),
};

// ============================================================
// DASHBOARD
// ============================================================
export const dashboardService = {
  getPos:            () => api.get('/dashboard/configuracion-pos'),
  setPos:            (data) => api.put('/dashboard/configuracion-pos', data),
  getStats:           () => api.get('/dashboard/stats'),
  getUltimasHistorias:() => api.get('/dashboard/ultimas-historias'),
  getDeudores:        () => api.get('/dashboard/deudores'),
  getCitasHoy:        () => api.get('/dashboard/citas-hoy'),
  getFinanciero:      (desde, hasta) => api.get('/dashboard/financiero', { params: { desde, hasta } }),
};

export const citasService = {
  getAll:            (desde, hasta, doctorId) => api.get('/citas', { params: { desde, hasta, doctorId } }),
  crear:             (data) => api.post('/citas', data),
  editar:            (id, data) => api.put(`/citas/${id}`, data),
  actualizarEstado:  (id, estado) => api.put(`/citas/${id}/estado`, { estado }),
};

export const gastosService = {
  getAll:           (desde, hasta) => api.get('/gastos', { params: { desde, hasta } }),
  crear:            (data) => api.post('/gastos', data),
  editar:           (id, data) => api.put(`/gastos/${id}`, data),
  eliminar:         (id) => api.delete(`/gastos/${id}`),
  reactivar:        (id) => api.put(`/gastos/${id}/reactivar`),
  getPenalidades:   (params) => api.get('/gastos/penalidades', { params }),
  crearPenalidad:   (data) => api.post('/gastos/penalidades', data),
};

export const laboratorioService = {
  getPorConsulta:   (consultaId) => api.get(`/laboratorio/consulta/${consultaId}`),
  getTrabajos:      (estado) => api.get('/laboratorio/trabajos', { params: { estado } }),
  crearTrabajo:     (consultaId, data) => postOnce(`/laboratorio/consulta/${consultaId}`, data),
  registrarPago:    (trabajoId, data) => postOnce(`/laboratorio/${trabajoId}/pagos`, data),
};

export const auditoriaService = {
  getFinanciera: () => api.get('/auditoria-financiera'),
};

export default api;
export const API_URL = '';
