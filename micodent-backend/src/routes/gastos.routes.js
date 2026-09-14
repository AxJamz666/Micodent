const router = require('express').Router();
const {
  getGastos, crearGasto, editarGasto, eliminarGasto, reactivarGasto, getPenalidades, crearPenalidad
} = require('../controllers/gastos.controller');
const { verificarToken, soloAdmin } = require('../middleware/auth');

router.get('/penalidades',   verificarToken, soloAdmin, getPenalidades);
router.post('/penalidades',  verificarToken, soloAdmin, crearPenalidad);
router.get('/',               verificarToken, soloAdmin, getGastos);
router.post('/',              verificarToken, soloAdmin, crearGasto);
router.put('/:id',            verificarToken, soloAdmin, editarGasto);
router.put('/:id/reactivar',  verificarToken, soloAdmin, reactivarGasto);
router.delete('/:id',         verificarToken, soloAdmin, eliminarGasto);

module.exports = router;