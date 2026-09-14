const router = require('express').Router();
const {
  getPacientes, getPacienteById, crearPaciente,
  editarPaciente, eliminarPaciente, getAuditoriaPaciente, reactivarPaciente
} = require('../controllers/pacientes.controller');
const { verificarToken } = require('../middleware/auth');

router.get('/',                  verificarToken, getPacientes);
router.get('/:id',               verificarToken, getPacienteById);
router.get('/:id/auditoria',     verificarToken, getAuditoriaPaciente);
router.post('/',                 verificarToken, crearPaciente);
router.put('/:id',               verificarToken, editarPaciente);
router.delete('/:id',            verificarToken, eliminarPaciente);
router.put('/:id/reactivar',     verificarToken, reactivarPaciente);

module.exports = router;