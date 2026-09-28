const assert = require('node:assert/strict');

module.exports = async ({ api, tokens, check }) => {
  await check('E09/M19: login rechaza un cuerpo excesivo antes de autenticar', async () => {
    const oversized = await api('POST', '/auth/login', {
      id: 'qaadmin', password: 'x'.repeat(20 * 1024),
    }, null);
    assert.equal(oversized.status, 413);
    assert.equal(oversized.body.ok, false);
  });
  await check('E09/M19: pacientes rechaza busquedas ambiguas y cuerpos excesivos', async () => {
    for (const url of ['/pacientes?search=a&search=b', `/pacientes?search=${'a'.repeat(201)}`]) {
      const response = await api('GET', url, null, tokens.qaadmin);
      assert.equal(response.status, 400);
      assert.equal(response.body.ok, false);
    }
    const oversized = await api('POST', '/pacientes', { nombres: 'x'.repeat(70 * 1024) }, tokens.qaadmin);
    assert.equal(oversized.status, 413);
    assert.equal(oversized.body.ok, false);
  });
};
