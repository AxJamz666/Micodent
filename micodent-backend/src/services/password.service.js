const bcrypt = require('bcryptjs');
const { SecurityError } = require('../utils/securityError');
const BCRYPT_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const DUMMY_HASH = bcrypt.hashSync('Not an application account password', 10);

function normalizeUserId(value) {
  if (typeof value !== 'string') throw new SecurityError(400, 'INVALID_USER_ID', 'ID de usuario invalido.');
  const id = value.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{0,49}$/.test(id)) {
    throw new SecurityError(400, 'INVALID_USER_ID', 'ID de usuario invalido.');
  }
  return id;
}

function validateCurrentPassword(value) {
  if (typeof value !== 'string' || !value.length || Buffer.byteLength(value, 'utf8') > 1024) {
    throw new SecurityError(400, 'INVALID_PASSWORD_INPUT', 'La contrasena es requerida y debe ser texto valido.');
  }
}

function validateNewPassword(value) {
  if (typeof value !== 'string' || [...value].length < 15 || !value.trim()) {
    throw new SecurityError(400, 'PASSWORD_POLICY', 'La nueva contrasena debe tener al menos 15 caracteres.');
  }
  if (Buffer.byteLength(value, 'utf8') > 72) {
    throw new SecurityError(400, 'PASSWORD_POLICY', 'La nueva contrasena no puede exceder 72 bytes UTF-8.');
  }
}

async function verifyPassword(value, hash) {
  validateCurrentPassword(value);
  const validFormat = typeof hash === 'string' && BCRYPT_PATTERN.test(hash);
  try {
    const matches = await bcrypt.compare(value, validFormat ? hash : DUMMY_HASH);
    return validFormat && matches;
  } catch {
    return false;
  }
}

async function hashPassword(value) {
  validateNewPassword(value);
  return bcrypt.hash(value, 10);
}

module.exports = { normalizeUserId, validateCurrentPassword, validateNewPassword, verifyPassword, hashPassword };
