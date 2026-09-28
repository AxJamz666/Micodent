const assert = require('node:assert/strict');

module.exports = async ({ api, conn, tokens, check }) => {
  const base = {
    nombre_contacto: 'Contacto QA', celular_contacto: '900000001',
    doctor_id: 'qadoctor', fecha: '2026-10-15', hora_inicio: '09:00', duracion_minutos: 60,
  };
  const create = (extra = {}) => api('POST', '/citas', { ...base, ...extra }, tokens.qaadmin);
  const edit = (id, extra = {}) => api('PUT', `/citas/${id}`, { ...base, ...extra }, tokens.qaadmin);
  const state = (id, estado) => api('PUT', `/citas/${id}/estado`, { estado }, tokens.qaadmin);
  const saved = async id => (await conn.query('SELECT * FROM citas WHERE id=?', [id]))[0][0];

  await check('E09: fechas, horas, duraciones, contacto y referencias invalidas no escriben', async () => {
    const [[before]] = await conn.query('SELECT COUNT(*) AS total FROM citas');
    const invalid = [
      { fecha: '2026-02-30' }, { fecha: '0001-01-01' }, { fecha: 'no-date' }, { hora_inicio: '24:00' },
      { hora_inicio: '09:60' }, { hora_inicio: '23:30', duracion_minutos: 60 },
      { duracion_minutos: '60abc' }, { duracion_minutos: '6e1' },
      { nombre_contacto: ' ' }, { celular_contacto: 'a123456' },
      { paciente_id: 'not-id' }, { doctor_id: 'missing' }, { paciente_id: 999999 },
    ];
    for (const entry of invalid) assert.equal((await create(entry)).status, 400, JSON.stringify(entry));
    assert.equal((await create({ motivo_consulta: 'x'.repeat(70 * 1024) })).status, 413);
    for (const url of ['/citas?desde=2026-02-30', '/citas?desde=2026-10-16&hasta=2026-10-15',
      '/citas?doctorId=']) {
      assert.equal((await api('GET', url, null, tokens.qaadmin)).status, 400);
    }
    assert.equal((await api('GET', '/citas?desde=2026-10-01&hasta=2026-11-12', null, tokens.qaadmin)).status, 200);
    assert.equal((await api('GET', '/citas?desde=2020-01-01&hasta=2030-12-31', null, tokens.qaadmin)).status, 200);
    assert.equal((await edit('abc')).status, 400);
    assert.equal((await edit('999999')).status, 404);
    assert.equal((await state('999999', 'cancelada')).status, 404);
    assert.equal((await api('POST', '/citas', base, null)).status, 401);
    const [[after]] = await conn.query('SELECT COUNT(*) AS total FROM citas');
    assert.equal(Number(after.total), Number(before.total));
  });

  await check('E09: telefonos formateados de pacientes existentes se conservan', async () => {
    const result = await create({ fecha: '2026-10-22', celular_contacto: '+51 900-000-001' });
    assert.equal(result.status, 201);
    assert.equal((await saved(result.body.citaId)).celular_contacto, '+51 900-000-001');
  });

  await check('E09/M19: busqueda de pacientes limitada sin cambiar el contrato anterior', async () => {
    const inserted = [];
    try {
      for (const [dni, name] of [['90000001', 'Agenda QA Uno'], ['90000002', 'Agenda QA Dos']]) {
        const [result] = await conn.query(`INSERT INTO pacientes
          (dni,nombres,apellidos,sexo,fecha_nacimiento,fecha_registro,hora_registro)
          VALUES (?,?,'Busqueda','M','1990-01-01','2026-09-22','09:00:00')`, [dni, name]);
        inserted.push(result.insertId);
      }
      const all = await api('GET', '/pacientes?search=Agenda%20QA', null, tokens.qaadmin);
      assert.equal(all.status, 200);
      assert.equal(all.body.data.length, 2);
      const limited = await api('GET', '/pacientes?search=Agenda%20QA&limit=1', null, tokens.qaadmin);
      assert.equal(limited.status, 200);
      assert.equal(limited.body.data.length, 1);
      for (const value of ['0', '51', '1abc']) {
        assert.equal((await api('GET', `/pacientes?limit=${value}`, null, tokens.qaadmin)).status, 400);
      }
    } finally {
      for (const id of inserted) await conn.query('DELETE FROM pacientes WHERE id=?', [id]);
    }
  });

  await check('E09: dos altas simultaneas producen una sola reserva', async () => {
    const results = await Promise.all([create(), create()]);
    assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
    const id = results.find(r => r.status === 201).body.citaId;
    const [[count]] = await conn.query("SELECT COUNT(*) AS total FROM citas WHERE doctor_id='qadoctor' AND fecha='2026-10-15' AND hora_inicio='09:00:00'");
    assert.equal(Number(count.total), 1);
    assert.equal((await create({ hora_inicio: '09:30' })).status, 409);
    assert.equal((await create({ hora_inicio: '10:00' })).status, 201);
    assert.equal((await create({ doctor_id: 'qaotro' })).status, 201);
    assert.equal((await saved(id)).estado, 'agendada');
  });

  await check('E09: editar otro horario rechaza conflicto y conserva la cita', async () => {
    const first = await create({ fecha: '2026-10-16', hora_inicio: '09:00' });
    const second = await create({ fecha: '2026-10-16', hora_inicio: '12:00' });
    assert.equal(first.status, 201); assert.equal(second.status, 201);
    const id = second.body.citaId;
    const before = await saved(id);
    assert.equal((await edit(id, { fecha: '2026-10-16', hora_inicio: '09:30' })).status, 409);
    assert.deepEqual(await saved(id), before);
    assert.equal((await edit(id, { fecha: '2026-10-16', hora_inicio: '12:00', nombre_contacto: 'Nombre corregido' })).status, 200);
    assert.equal((await saved(id)).nombre_contacto, 'Nombre corregido');
  });

  await check('E09: dos ediciones simultaneas no reservan el mismo espacio', async () => {
    const date = '2026-10-20';
    const one = await create({ fecha: date, hora_inicio: '09:00' });
    const two = await create({ fecha: date, hora_inicio: '11:00' });
    assert.equal(one.status, 201); assert.equal(two.status, 201);
    const results = await Promise.all([edit(one.body.citaId, { fecha: date, hora_inicio: '14:00' }),
      edit(two.body.citaId, { fecha: date, hora_inicio: '14:00' })]);
    assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
    const [[reserved]] = await conn.query("SELECT COUNT(*) AS total FROM citas WHERE fecha=? AND doctor_id='qadoctor' AND hora_inicio='14:00:00'", [date]);
    assert.equal(Number(reserved.total), 1);
  });

  await check('E09: citas historicas superpuestas conservan edicion de contacto', async () => {
    const date = '2026-10-21';
    const [first] = await conn.query(`INSERT INTO citas
      (nombre_contacto,celular_contacto,doctor_id,fecha,hora_inicio,duracion_minutos,creado_por)
      VALUES ('Legado QA A','900000002','qadoctor',?,'09:00',90,'qaadmin')`, [date]);
    await conn.query(`INSERT INTO citas
      (nombre_contacto,celular_contacto,doctor_id,fecha,hora_inicio,duracion_minutos,creado_por)
      VALUES ('Legado QA B','900000003','qadoctor',?,'09:30',60,'qaadmin')`, [date]);
    assert.equal((await edit(first.insertId, { fecha: date, hora_inicio: '09:00', duracion_minutos: 90,
      nombre_contacto: 'Contacto histórico corregido' })).status, 200);
    assert.equal((await saved(first.insertId)).nombre_contacto, 'Contacto histórico corregido');
    assert.equal((await create({ fecha: date, hora_inicio: '10:00' })).status, 409);
  });

  await check('E09: citas historicas mantienen referencias inactivas al corregir contacto', async () => {
    const created = await create({ fecha: '2026-10-23', paciente_id: 1 });
    assert.equal(created.status, 201);
    const id = created.body.citaId;
    await conn.query("UPDATE usuarios SET activo=0 WHERE id='qadoctor'");
    await conn.query('UPDATE pacientes SET activo=0 WHERE id=1');
    try {
      assert.equal((await edit(id, { fecha: '2026-10-23', paciente_id: 1,
        nombre_contacto: 'Contacto actualizado' })).status, 200);
      assert.equal((await saved(id)).nombre_contacto, 'Contacto actualizado');
      assert.equal((await edit(id, { fecha: '2026-10-25', paciente_id: 1 })).status, 400);
      assert.equal((await create({ fecha: '2026-10-24' })).status, 400);
      assert.equal((await create({ fecha: '2026-10-24', doctor_id: 'qaotro', paciente_id: 1 })).status, 400);
    } finally {
      await conn.query("UPDATE usuarios SET activo=1 WHERE id='qadoctor'");
      await conn.query('UPDATE pacientes SET activo=1 WHERE id=1');
    }
  });

  await check('E09: cancelacion libera horario, reactivacion vuelve a comprobarlo', async () => {
    const first = await create({ fecha: '2026-10-17' });
    assert.equal(first.status, 201);
    const id = first.body.citaId;
    assert.equal((await state(id, 'cancelada')).status, 200);
    const replacement = await create({ fecha: '2026-10-17' });
    assert.equal(replacement.status, 201);
    assert.equal((await state(id, 'agendada')).status, 409);
    assert.equal((await saved(id)).estado, 'cancelada');
    assert.equal((await edit(id, { fecha: '2026-10-17', hora_inicio: '11:00' })).status, 200);
    assert.equal((await state(id, 'agendada')).status, 200);
    assert.equal((await state(id, 'no_asistio')).status, 200);
    assert.equal((await state(id, 'cancelada')).status, 409);
    assert.equal((await state(id, 'agendada')).status, 200);
    assert.equal((await state(id, 'atendida')).status, 200);
  });

  await check('E09: dos reactivaciones simultaneas no duplican el horario', async () => {
    const date = '2026-10-18';
    const one = await create({ fecha: date });
    assert.equal(one.status, 201);
    assert.equal((await state(one.body.citaId, 'cancelada')).status, 200);
    const two = await create({ fecha: date });
    assert.equal(two.status, 201);
    assert.equal((await state(two.body.citaId, 'cancelada')).status, 200);
    const results = await Promise.all([state(one.body.citaId, 'agendada'), state(two.body.citaId, 'agendada')]);
    assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
    const [[active]] = await conn.query("SELECT COUNT(*) AS total FROM citas WHERE fecha=? AND doctor_id='qadoctor' AND estado='agendada'", [date]);
    assert.equal(Number(active.total), 1);
  });

  await check('E09: fallo SQL no deja cita parcial ni retiene el bloqueo', async () => {
    const [[before]] = await conn.query('SELECT COUNT(*) AS total FROM citas');
    await conn.query("CREATE TRIGGER qa_block_agenda BEFORE INSERT ON citas FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='QA agenda unavailable'");
    try { assert.equal((await create({ fecha: '2026-10-19' })).status, 500); }
    finally { await conn.query('DROP TRIGGER qa_block_agenda'); }
    const [[after]] = await conn.query('SELECT COUNT(*) AS total FROM citas');
    assert.equal(Number(after.total), Number(before.total));
    assert.equal((await create({ fecha: '2026-10-19' })).status, 201);
  });
};
