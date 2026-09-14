const router = require('express').Router();
const {
  getTrabajosPorConsulta, getTrabajos, crearTrabajo, registrarPagoLaboratorio
} = require('../controllers/laboratorio.controller');
const { verificarToken } = require('../middleware/auth');

router.get('/trabajos',              verificarToken, getTrabajos);
router.get('/consulta/:consultaId',  verificarToken, getTrabajosPorConsulta);
router.post('/consulta/:consultaId', verificarToken, crearTrabajo);
router.post('/:trabajoId/pagos',     verificarToken, registrarPagoLaboratorio);

module.exports = router;