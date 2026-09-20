const router              = require('express').Router();
const { login, getMe, logout, logoutAll } = require('../controllers/auth.controller');
const { verificarToken }  = require('../middleware/auth');
const { limitAuthentication } = require('../middleware/limitarAutenticacion');

router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.post('/login', limitAuthentication('login'), login);
router.get('/me',     verificarToken, getMe);
router.post('/logout', verificarToken, logout);
router.post('/logout-all', verificarToken, logoutAll);

module.exports = router;
