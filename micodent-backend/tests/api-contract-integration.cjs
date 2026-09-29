const assert = require('node:assert/strict');

module.exports = async ({ api, conn, tokens, check }) => {
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
  await check('E09/M19: editar paciente inexistente devuelve 404 sin auditoria', async () => {
    const [[before]] = await conn.query('SELECT COUNT(*) AS total FROM auditoria_pacientes');
    const data = { dni: '00000001', nombres: 'Paciente', apellidos: 'Sintetico', sexo: 'M',
      fecha_nacimiento: '1990-01-01', domicilio: null, celular: null,
      cambios_detectados: 'Cambio QA que no debe persistir' };
    const missing = await api('PUT', '/pacientes/999999', data, tokens.qaadmin);
    assert.equal(missing.status, 404);
    assert.equal(missing.body.ok, false);
    const [[after]] = await conn.query('SELECT COUNT(*) AS total FROM auditoria_pacientes');
    assert.equal(Number(after.total), Number(before.total));
    const existing = await api('PUT', '/pacientes/1', { ...data, cambios_detectados: null }, tokens.qaadmin);
    assert.equal(existing.status, 200);
  });
  await check('E09/M19: rutas de paciente rechazan identificadores ambiguos sin escribir', async () => {
    const [[before]] = await conn.query('SELECT activo, nombres FROM pacientes WHERE id = 1');
    const [[auditBefore]] = await conn.query('SELECT COUNT(*) AS total FROM auditoria_pacientes');
    for (const id of ['1abc', '1e0', '0', '9007199254740992']) {
      for (const [method, suffix] of [
        ['GET', ''], ['GET', '/auditoria'], ['PUT', ''], ['DELETE', ''], ['PUT', '/reactivar'],
      ]) {
        const response = await api(method, `/pacientes/${id}${suffix}`, undefined, tokens.qaadmin);
        assert.equal(response.status, 400, `${method} /pacientes/${id}${suffix}`);
        assert.equal(response.body.ok, false);
      }
    }
    const [[after]] = await conn.query('SELECT activo, nombres FROM pacientes WHERE id = 1');
    const [[auditAfter]] = await conn.query('SELECT COUNT(*) AS total FROM auditoria_pacientes');
    assert.deepEqual(after, before);
    assert.equal(Number(auditAfter.total), Number(auditBefore.total));
  });
};
