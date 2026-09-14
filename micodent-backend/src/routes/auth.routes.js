const router              = require('express').Router();
const { login, getMe }    = require('../controllers/auth.controller');
const { verificarToken }  = require('../middleware/auth');

router.post('/login', login);
router.get('/me',     verificarToken, getMe);

module.exports = router;