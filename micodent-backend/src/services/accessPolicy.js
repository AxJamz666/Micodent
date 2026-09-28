const CAPABILITY = Object.freeze({
  ADMIN: 'admin',
  CLINICAL_WRITE: 'clinical.write',
  PRODUCTION_READ: 'production.read',
  PRODUCTION_ALL: 'production.all',
});

function hasCapability(user, capability) {
  if (!user) return false;
  const admin = user.isAdmin === true;
  const doctor = user.rol === 'Doctor';
  switch (capability) {
    case CAPABILITY.ADMIN:
    case CAPABILITY.PRODUCTION_ALL:
      return admin;
    case CAPABILITY.CLINICAL_WRITE:
      return doctor;
    case CAPABILITY.PRODUCTION_READ:
      return admin || doctor;
    default:
      return false;
  }
}

module.exports = { CAPABILITY, hasCapability };
