const router = require('express').Router();
const {
  getPacientes, getPacienteById, crearPaciente,
  editarPaciente, eliminarPaciente, getAuditoriaPaciente, reactivarPaciente
} = require('../controllers/pacientes.controller');
const { verificarToken } = require('../middleware/auth');

const validarPacienteId = (req, res, next) => {
  const { id } = req.params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    return res.status(400).json({ ok: false, mensaje: 'Identificador de paciente no valido.' });
  }
  next();
};

router.get('/',                  verificarToken, getPacientes);
router.get('/:id',               verificarToken, validarPacienteId, getPacienteById);
router.get('/:id/auditoria',     verificarToken, validarPacienteId, getAuditoriaPaciente);
router.post('/',                 verificarToken, crearPaciente);
router.put('/:id',               verificarToken, validarPacienteId, editarPaciente);
router.delete('/:id',            verificarToken, validarPacienteId, eliminarPaciente);
router.put('/:id/reactivar',     verificarToken, validarPacienteId, reactivarPaciente);

module.exports = router;
