const router = require('express').Router();
const { getStats, getUltimasHistorias, getDeudores, getCitasHoy, getFinanciero } = require('../controllers/dashboard.controller');
const { verificarToken, soloAdmin } = require('../middleware/auth');
const { getProduccion } = require('../controllers/produccion.controller');
const { getPos, setPos } = require('../controllers/pos.controller');
router.get('/configuracion-pos', verificarToken, getPos);
router.put('/configuracion-pos', verificarToken, soloAdmin, setPos);
router.get('/produccion', verificarToken, getProduccion);

router.get('/financiero',       verificarToken, soloAdmin, getFinanciero);
router.get('/citas-hoy',        verificarToken, getCitasHoy);
router.get('/stats',            verificarToken, getStats);
router.get('/ultimas-historias', verificarToken, getUltimasHistorias);
router.get('/deudores',         verificarToken, getDeudores);

module.exports = router;
