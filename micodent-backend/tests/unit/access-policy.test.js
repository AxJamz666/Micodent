const test = require('node:test');
const assert = require('node:assert/strict');
const { CAPABILITY, hasCapability } = require('../../src/services/accessPolicy');

test('current roles keep independent clinical, administrative and production rights', () => {
  const cases = [
    [{ rol: 'Asistente', isAdmin: false }, []],
    [{ rol: 'Administradora', isAdmin: false }, []],
    [{ rol: 'Doctor', isAdmin: false }, [CAPABILITY.CLINICAL_WRITE, CAPABILITY.PRODUCTION_READ]],
    [{ rol: 'Administradora', isAdmin: true }, [CAPABILITY.ADMIN, CAPABILITY.PRODUCTION_ALL, CAPABILITY.PRODUCTION_READ]],
    [{ rol: 'Doctor', isAdmin: true }, Object.values(CAPABILITY)],
  ];
  for (const [user, allowed] of cases) {
    for (const capability of Object.values(CAPABILITY)) {
      assert.equal(hasCapability(user, capability), allowed.includes(capability), `${user.rol}/${user.isAdmin}/${capability}`);
    }
  }
});

test('missing users and unknown capabilities fail closed', () => {
  assert.equal(hasCapability(null, CAPABILITY.ADMIN), false);
  assert.equal(hasCapability({ rol: 'Administradora', isAdmin: 1 }, CAPABILITY.ADMIN), false);
  assert.equal(hasCapability({ rol: 'Doctor', isAdmin: true }, 'clinical.override'), false);
});
