const router  = require('express').Router();
const upload  = require('../config/multer');
const {
  getHistorias, getHistoriaByPaciente,
  guardarAntecedentes,
  eliminarHistoria,
  subirRadiografia, getRadiografias, eliminarRadiografia,
  guardarFirmas, editarConsulta, eliminarConsulta,
  agregarAdendaConsulta, agregarItemOdontograma, agregarAdendaOdontograma,
  eliminarItemOdontograma, reactivarHistoria,
  agregarReceta, reemitirReceta,
  getCentrosReferencia, agregarOrdenRadiografia, reemitirOrdenRadiografia,
} = require('../controllers/historias.controller');

// ✅ Importar verificarToken Y soloDoctor juntos
const { verificarToken, soloDoctor, soloAdmin } = require('../middleware/auth');
const { agregarConsulta, registrarPago, anularPago, conciliarCostos } = require('../controllers/cobros.controller');
router.post('/pagos/:pagoId/anular', verificarToken, soloAdmin, anularPago);
router.post('/consultas/:consultaId/conciliar-costos', verificarToken, soloAdmin, conciliarCostos);

// ── Administrativas (todos los roles) ─────────────────────
router.get('/',                              verificarToken, getHistorias);
router.get('/paciente/:pacienteId',          verificarToken, getHistoriaByPaciente);
router.post('/:historiaId/consultas',        verificarToken, soloDoctor, agregarConsulta);
router.put('/consultas/:id',                 verificarToken, soloDoctor, editarConsulta);
router.delete('/consultas/:id',              verificarToken, soloDoctor, eliminarConsulta);
router.post('/consultas/:consultaId/pagos',  verificarToken, registrarPago);
router.post('/consultas/:id/adendas',        verificarToken, soloDoctor, agregarAdendaConsulta);
router.get('/:historiaId/radiografias',      verificarToken, getRadiografias);
router.post('/:historiaId/radiografias',     verificarToken, upload.single('imagen'), subirRadiografia);
router.delete('/radiografias/:id',           verificarToken, eliminarRadiografia);
router.delete('/paciente/:pacienteId',       verificarToken, eliminarHistoria);
router.put('/paciente/:pacienteId/reactivar', verificarToken, reactivarHistoria);

// ── Clínicas (solo Doctor) ────────────────────────────────
router.put('/:historiaId/antecedentes',      verificarToken, soloDoctor, guardarAntecedentes);
router.post('/:historiaId/odontograma-items', verificarToken, soloDoctor, agregarItemOdontograma);
router.post('/odontograma-items/:id/adendas', verificarToken, soloDoctor, agregarAdendaOdontograma);
router.post('/:historiaId/recetas',           verificarToken, soloDoctor, agregarReceta);
router.post('/recetas/:id/reemitir',          verificarToken, soloDoctor, reemitirReceta);
router.get('/centros-referencia',             verificarToken, getCentrosReferencia);
router.post('/:historiaId/ordenes-radiografia', verificarToken, soloDoctor, agregarOrdenRadiografia);
router.post('/ordenes-radiografia/:id/reemitir', verificarToken, soloDoctor, reemitirOrdenRadiografia);
router.delete('/odontograma-items/:id',       verificarToken, soloDoctor, eliminarItemOdontograma);
router.put('/:historiaId/firmas',            verificarToken, soloDoctor, guardarFirmas);

module.exports = router;
