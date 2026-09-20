import axios from 'axios';
import { clearSession, shouldClearSession } from './session';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Agrega el token JWT a cada petición automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el token expira, manda al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (shouldClearSession(error, localStorage.getItem('token'))) {
      clearSession();
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
  logout: ()            => api.post('/auth/logout'),
  logoutAll: ()         => api.post('/auth/logout-all'),
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
  agregarConsulta:    (historiaId, data)  => api.post(`/historias/${historiaId}/consultas`, data),
  editarConsulta:     (id, data)          => api.put(`/historias/consultas/${id}`, data),
  eliminarConsulta:   (id)                => api.delete(`/historias/consultas/${id}`),
  agregarAdendaConsulta: (id, data)       => api.post(`/historias/consultas/${id}/adendas`, data),
  registrarPago:      (consultaId, data)  => api.post(`/historias/consultas/${consultaId}/pagos`, data),
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
  crearTrabajo:     (consultaId, data) => api.post(`/laboratorio/consulta/${consultaId}`, data),
  registrarPago:    (trabajoId, data) => api.post(`/laboratorio/${trabajoId}/pagos`, data),
};

export const auditoriaService = {
  getFinanciera: () => api.get('/auditoria-financiera'),
};

export default api;
export const API_URL = import.meta.env.VITE_API_URL;
