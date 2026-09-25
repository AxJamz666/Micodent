const router = require('express').Router();
const {
  getUsuarios, crearUsuario, editarUsuario,
  eliminarUsuario, cambiarPassword, resetPassword,
  actualizarFirmaSello, getDoctores
} = require('../controllers/usuarios.controller');
const { verificarToken, soloAdmin } = require('../middleware/auth');
const { limitAuthentication } = require('../middleware/limitarAutenticacion');

router.get('/doctores',           verificarToken, getDoctores);
router.get('/',                   verificarToken, soloAdmin, getUsuarios);
router.post('/',                  verificarToken, soloAdmin, crearUsuario);
router.put('/cambiar-password',   verificarToken, limitAuthentication('reauth'), cambiarPassword);
router.put('/mi-firma-sello',     verificarToken,            actualizarFirmaSello);
router.post('/reset-password',    verificarToken, soloAdmin, limitAuthentication('reauth'), resetPassword);
router.put('/:id',                verificarToken, soloAdmin, editarUsuario);
router.delete('/:id',             verificarToken, soloAdmin, eliminarUsuario);

module.exports = router;
