const router = require('express').Router();
const { getAuditoriaFinanciera } = require('../controllers/auditoria.controller');
const { verificarToken, soloAdmin } = require('../middleware/auth');

router.get('/', verificarToken, soloAdmin, getAuditoriaFinanciera);

module.exports = router;