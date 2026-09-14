const router = require('express').Router();
const { getCitas, crearCita, editarCita, actualizarEstadoCita } = require('../controllers/citas.controller');
const { verificarToken } = require('../middleware/auth');

router.get('/',           verificarToken, getCitas);
router.post('/',          verificarToken, crearCita);
router.put('/:id',        verificarToken, editarCita);
router.put('/:id/estado', verificarToken, actualizarEstadoCita);

module.exports = router;