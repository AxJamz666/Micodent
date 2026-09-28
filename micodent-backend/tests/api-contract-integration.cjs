const assert = require('node:assert/strict');

module.exports = async ({ api, check }) => {
  await check('E09/M19: login rechaza un cuerpo excesivo antes de autenticar', async () => {
    const oversized = await api('POST', '/auth/login', {
      id: 'qaadmin', password: 'x'.repeat(20 * 1024),
    }, null);
    assert.equal(oversized.status, 413);
    assert.equal(oversized.body.ok, false);
  });
};
