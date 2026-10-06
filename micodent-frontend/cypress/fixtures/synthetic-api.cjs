const PASSWORD = 'E2e-Synthetic-Only-1!';
const session = { id: 'a'.repeat(64), csrf: 'b'.repeat(64) };
const admin = {
  id: 'e2eadmin', nombre: 'Profesional E2E', nombre_completo: 'Doctor Sintetico E2E',
  rol: 'Doctor', is_admin: true, nivel: 5, gender: 'o', prefix: 'Dr.',
  especialidad: 'Odontologia general', cop: 'E2E-ONLY',
  firma_digital: null, sello_digital: null,
};
const doctor = { ...admin, id: 'e2edoctor', nombre: 'Doctor E2E', is_admin: false, nivel: 1 };
const patient = {
  id: 41, nombres: 'Paciente E2E', apellidos: 'Sintetico', dni: '00000041',
  celular: '900000041', sexo: 'F', fecha_nacimiento: '1990-01-01',
  domicilio: 'Direccion ficticia E2E', activo: 1, nro_historia: 'HC-E2E-0041',
  estado_hc: 'en_progreso', ultima_actividad: '2026-10-03',
};
const otherPatient = { ...patient, id: 42, nombres: 'Otro E2E', dni: '00000042', nro_historia: 'HC-E2E-0042' };
const history = {
  id: 7, nro_historia: patient.nro_historia, antecedentes: {
    motivo_consulta: 'Control sintetico E2E', antecedentes_medicos: 'Antecedente ficticio',
    diagnostico: 'Diagnostico ficticio E2E', plan_tratamiento: 'Plan ficticio E2E',
    examen_clinico: 'Examen ficticio E2E',
  },
  triaje: { presion: '120/80', pulso: '70' }, odontograma: [], recetas: [],
  ordenes: [], radiografias: [], firma: null,
  consultas: [{
    id: 81, fecha_consulta: '2026-10-03', descripcion: 'Tratamiento ficticio E2E',
    costo_total: '100.00', estado_clinico: 'Control ficticio', tipo_comision: 'estandar',
    doctor_id: admin.id, doctor_nombre: admin.nombre_completo, bloqueada: 1, adendas: [],
    pagos: [{ id: 91, monto: '40.00', metodo_pago: 'Efectivo', comision_generada: '12.00',
      fecha_pago: '2026-10-03', hora_pago: '09:00:00' }],
  }],
};
const financial = {
  caja: { ingresos: '100.00', pagosLaboratorio: '20.00', gastosOperativos: '10.00',
    flujoNeto: '70.00', recargosTarjeta: '0.00' },
  totales: { totalFacturado: '200.00', totalComisionBruta: '18.00',
    costosExternosAplicados: '20.00', gananciaNetaReal: '52.00', movimientosPorConciliar: 0 },
  porDoctor: [{
    doctor_id: admin.id, doctor_nombre: admin.nombre_completo, pacientes_atendidos: 1,
    total_cobrado: '60.00', comision_bruta: '18.00', penalidades: '0.00', comision_neta: '18.00',
  }, {
    doctor_id: doctor.id, doctor_nombre: 'Otro Doctor E2E', pacientes_atendidos: 1,
    total_cobrado: '40.00', comision_bruta: '0.00', penalidades: '0.00', comision_neta: '0.00',
  }],
};

function installSyntheticApi() {
  const state = {
    user: null, patients: [structuredClone(patient), structuredClone(otherPatient)],
    appointments: [], mutations: [], unexpected: [],
  };
  const json = (req, data, statusCode = 200) => req.reply({
    statusCode, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: data,
  });
  const data = (req, value) => json(req, { ok: true, data: value });
  cy.intercept({ url: '**', middleware: true }, req => {
    const url = new URL(req.url);
    if (url.origin !== new URL(Cypress.config('baseUrl')).origin) {
      state.unexpected.push(req.method + ' external request');
      return json(req, { ok: false, mensaje: 'External requests disabled in E2E.' }, 503);
    }
    if (!/^\/(api|uploads)(\/|$)/.test(url.pathname)) return req.continue();
    const route = req.method + ' ' + url.pathname;
    if (route === 'POST /api/auth/login') {
      req.alias = 'login';
      const user = req.body.id === admin.id ? admin : req.body.id === doctor.id ? doctor : null;
      if (!user || req.body.password !== PASSWORD) {
        return json(req, { ok: false, mensaje: 'Credenciales invalidas E2E.' }, 401);
      }
      state.user = structuredClone(user);
      return json(req, { ok: true, usuario: state.user, sesion: session });
    }
    if (route === 'GET /api/auth/me') {
      req.alias = 'session';
      return state.user ? json(req, { ok: true, usuario: state.user, sesion: session })
        : json(req, { ok: false, mensaje: 'Sin sesion E2E.' }, 401);
    }
    if (!state.user) return json(req, { ok: false, mensaje: 'Sin sesion E2E.' }, 401);
    expect(req.headers['x-micodent-client'], 'original API client header').to.equal('web');
    expect(req.headers['x-micodent-session'], 'original session binding').to.equal(session.id);
    if (req.method !== 'GET') {
      expect(req.headers['x-csrf-token'], 'original CSRF context').to.equal(session.csrf);
    }
    if (route === 'POST /api/auth/logout') {
      req.alias = 'logout';
      state.user = null;
      return json(req, { ok: true });
    }
    if (route === 'GET /api/usuarios/doctores') return data(req, [admin, doctor]);
    if (route === 'GET /api/dashboard/stats') {
      return data(req, { ingresosHoy: '100.00', sinHistoria: 0, deudores: 1, totalHistorias: 2 });
    }
    if (['GET /api/dashboard/ultimas-historias', 'GET /api/dashboard/deudores',
      'GET /api/dashboard/citas-hoy'].includes(route)) return data(req, []);
    if (route === 'GET /api/pacientes') {
      req.alias = 'patients';
      const search = (url.searchParams.get('search') || '').toLowerCase();
      return data(req, state.patients.filter(p =>
        [p.nombres, p.apellidos, p.dni, p.nro_historia].join(' ').toLowerCase().includes(search)));
    }
    if (route === 'GET /api/pacientes/41') { req.alias = 'patient'; return data(req, patient); }
    if (route === 'GET /api/historias/paciente/41') {
      req.alias = 'history'; return data(req, history);
    }
    if (route === 'GET /api/historias/centros-referencia') return data(req, []);
    if (route === 'GET /api/dashboard/configuracion-pos') {
      return data(req, { porcentaje: '3.00', revision: 1 });
    }
    if (route === 'GET /api/citas') { req.alias = 'appointments'; return data(req, state.appointments); }
    if (route === 'POST /api/citas') {
      req.alias = 'createAppointment';
      state.mutations.push({ route, body: structuredClone(req.body) });
      state.appointments.push({
        ...structuredClone(req.body), id: 71, estado: 'agendada',
        doctor_nombre: admin.nombre_completo,
      });
      return data(req, { id: 71 });
    }
    if (route === 'GET /api/dashboard/financiero') {
      req.alias = 'financial'; return data(req, financial);
    }
    if (route === 'GET /api/gastos') { req.alias = 'expenses'; return data(req, []); }
    if (route === 'GET /api/laboratorio/trabajos') { req.alias = 'laboratory'; return data(req, []); }
    state.unexpected.push(route);
    return json(req, { ok: false, mensaje: 'Unmapped E2E request.' }, 503);
  });
  cy.wrap(state, { log: false }).as('syntheticState');
}

module.exports = { installSyntheticApi, PASSWORD, admin, doctor, patient };
