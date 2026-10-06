const { PASSWORD, admin, doctor, patient } = require('../fixtures/synthetic-api.cjs');

describe('MICODENT - isolated synthetic API E2E, additional to academic 60/60', () => {
  it('CYP-E2E-01 Login valido y sesion verificada', () => {
    cy.loginSynthetic();
    cy.contains('h1', 'Profesional E2E').should('be.visible');
    cy.window().then(win => {
      expect(win.localStorage.getItem('userId')).to.equal(admin.id);
      expect(win.localStorage.getItem('token')).to.equal(null);
      expect(win.localStorage.getItem('isAdmin')).to.equal('true');
    });
    cy.get('button[aria-label="Menú de perfil"]').click();
    cy.contains('a', 'Dashboard Financiero').should('be.visible');
    cy.screenshot('CYP-E2E-01-login-verificado');
  });

  it('CYP-E2E-02 Login invalido conserva formulario y permite reintento', () => {
    cy.visit('/login');
    cy.inputForLabel('ID de usuario').type(admin.id);
    cy.inputForLabel('Contraseña').type('Wrong-Synthetic-Only!', { log: false });
    cy.contains('button', 'Entrar al Sistema').click();
    cy.wait('@login').its('response.statusCode').should('eq', 401);
    cy.contains('[role="status"]', 'Credenciales invalidas E2E.').should('be.visible');
    cy.location('pathname').should('eq', '/login');
    cy.inputForLabel('ID de usuario').should('have.value', admin.id);
    cy.contains('button', 'Entrar al Sistema').should('be.enabled');
    cy.get('nav[aria-label="Navegación principal"]').should('not.exist');
    cy.inputForLabel('Contraseña').clear().type(PASSWORD, { log: false });
    cy.contains('button', 'Entrar al Sistema').click();
    cy.location('pathname').should('eq', '/');
    cy.get('nav').should('be.visible');
  });

  it('CYP-E2E-03 Listado, busqueda, vacio y limpieza de pacientes', () => {
    cy.loginSynthetic();
    cy.get('a[aria-label="Pacientes"]').click();
    cy.get('tbody tr').should('have.length', 2);
    cy.get('input[aria-label="Buscar pacientes"]').type(patient.dni);
    cy.contains('tbody tr', 'Sintetico, Paciente E2E').should('be.visible');
    cy.get('tbody tr').should('have.length', 1);
    cy.contains('tbody', 'Otro E2E').should('not.exist');
    cy.get('input[aria-label="Buscar pacientes"]').clear().type('SinCoincidenciaE2E');
    cy.contains('No se encontraron pacientes.').should('be.visible');
    cy.get('button[aria-label="Limpiar búsqueda"]').click();
    cy.get('tbody tr').should('have.length', 2);
    cy.location('pathname').should('eq', '/pacientes');
  });

  it('CYP-E2E-04 Apertura de ficha y retorno al directorio sin mutacion', () => {
    cy.loginSynthetic();
    cy.openSyntheticPatient();
    cy.contains('h2', 'Sintetico, Paciente E2E').should('be.visible');
    cy.inputForLabel('Nombres').should('have.value', patient.nombres);
    cy.inputForLabel('Apellidos').should('have.value', patient.apellidos);
    cy.inputForLabel('Fecha de nacimiento').should('have.value', '1990-01-01');
    cy.get('button[aria-label="Volver a pacientes"]').click();
    cy.location('pathname').should('eq', '/pacientes');
    cy.get('tbody tr').should('have.length', 2);
    cy.get('@syntheticState').its('mutations').should('have.length', 0);
  });

  it('CYP-E2E-05 Cita ficticia: formulario, guardado simulado, recarga y detalle', () => {
    cy.loginSynthetic();
    cy.get('a[aria-label="Agenda"]').click();
    cy.contains('h2', 'Agenda de Citas').should('be.visible');
    cy.contains('button', /^\s*Nueva cita\s*$/).click();
    cy.inputForLabel('Nombre de contacto').type('Contacto ficticio E2E');
    cy.inputForLabel('Celular').type('900000099');
    cy.inputForLabel('Motivo de consulta').type('Control ficticio');
    cy.inputForLabel('Doctor').select(admin.id);
    cy.inputForLabel('Fecha').should('not.have.value', '');
    cy.inputForLabel('Hora de inicio').select('09:00');
    cy.contains('button', /^\s*Agendar Cita\s*$/).click();
    cy.wait('@createAppointment').then(({ request, response }) => {
      expect(response.statusCode).to.equal(200);
      expect(request.body).to.include({
        nombre_contacto: 'Contacto ficticio E2E', celular_contacto: '900000099',
        doctor_id: admin.id, hora_inicio: '09:00', duracion_minutos: 30,
      });
    });
    cy.get('button[aria-label="Cerrar cita"]').should('not.exist');
    cy.contains('button', 'Contacto ficticio E2E').should('be.visible').click();
    cy.contains('h3', 'Detalle de la cita').should('be.visible');
    cy.inputForLabel('Nombre de contacto').should('have.value', 'Contacto ficticio E2E');
    cy.get('button[aria-label="Cerrar cita"]').click();
    cy.get('@syntheticState').its('mutations').should('have.length', 1);
    cy.screenshot('CYP-E2E-05-cita-sintetica');
  });

  it('CYP-E2E-06 Historia clinica: antecedentes, diagnostico y evolucion', () => {
    cy.loginSynthetic();
    cy.openSyntheticPatient();
    cy.contains('HC-E2E-0041').should('be.visible');
    cy.contains('button', /^\s*Triaje y Antecedentes\s*$/).click();
    cy.contains('label', /^Motivo de Consulta$/).parent().find('textarea')
      .should('have.value', 'Control sintetico E2E');
    cy.contains('button', /^\s*Diagnóstico y Plan\s*$/).click();
    cy.contains('label', /^Diagnóstico$/).parent().find('textarea')
      .should('have.value', 'Diagnostico ficticio E2E');
    cy.contains('button', /^\s*Evolución\s*$/).click();
    cy.contains('tbody tr', 'Tratamiento ficticio E2E').within(() => {
      cy.contains('td', 'S/ 100.00').should('be.visible');
      cy.contains('td', 'S/ 60.00').should('be.visible');
      cy.get('button[title="Ver Historial"]').click();
    });
    cy.get('dialog[open][aria-label="Historial y Correcciones"]').should('be.visible')
      .within(() => {
        cy.contains('S/ 40.00').should('be.visible');
        cy.contains('Abono #1').should('be.visible');
        cy.get('button[aria-label="Cerrar"]').click();
      });
    cy.get('dialog[open]').should('not.exist');
    cy.get('@syntheticState').its('mutations').should('have.length', 0);
  });

  it('CYP-E2E-07 Tratamiento: borrador, tipo y cierre seguro sin firma ni escritura', () => {
    cy.loginSynthetic();
    cy.openSyntheticPatient();
    cy.contains('button', /^\s*Evolución\s*$/).click();
    cy.contains('button', /^\s*Nuevo tratamiento\s*$/).click();
    cy.get('dialog[open][aria-label="Nuevo Tratamiento"]').should('be.visible').within(() => {
      cy.contains('label', /^Descripción del Tratamiento$/).parent().find('textarea')
        .type('Borrador ficticio no firmado');
      cy.contains('button', /^\s*Rehabilitación\s*$/).click().should('have.attr', 'aria-pressed', 'true');
      cy.inputForLabel('Nombre del Laboratorio').type('Laboratorio ficticio E2E');
      cy.contains('button', /^\s*Guardar y Firmar\s*$/).should('be.enabled');
      cy.get('button[aria-label="Cerrar"]').click();
    });
    cy.get('dialog[open]').should('not.exist');
    cy.contains('tbody', 'Borrador ficticio no firmado').should('not.exist');
    cy.contains('tbody tr', 'Tratamiento ficticio E2E').should('be.visible');
    cy.get('@syntheticState').its('mutations').should('have.length', 0);
  });

  it('CYP-E2E-08 Finanzas: importes, filtro por doctor y pestañas', () => {
    cy.loginSynthetic();
    cy.get('button[aria-label="Menú de perfil"]').click();
    cy.contains('a', 'Dashboard Financiero').click();
    cy.location('pathname').should('eq', '/finanzas');
    cy.contains('h2', 'Dashboard Financiero').should('be.visible');
    cy.get('section[aria-label="Movimientos de caja"]').within(() => {
      cy.contains('Entradas registradas').parent().should('contain.text', 'S/ 100.00');
      cy.contains('Pagos a laboratorio').parent().should('contain.text', 'S/ 20.00');
      cy.contains('Gastos pagados').parent().should('contain.text', 'S/ 10.00');
      cy.contains('Flujo neto registrado').parent().should('contain.text', 'S/ 70.00');
    });
    cy.get('tbody tr').should('have.length', 2);
    cy.inputForLabel('Doctor').select(admin.id);
    cy.get('tbody tr').should('have.length', 1).and('contain.text', admin.nombre_completo);
    cy.contains('button', /^\s*Gastos\s*$/).click().should('have.attr', 'aria-pressed', 'true');
    cy.contains('h3', 'Gastos Operativos').should('be.visible');
    cy.contains('button', /^\s*Laboratorio\s*$/).click().should('have.attr', 'aria-pressed', 'true');
    cy.contains('button', /^\s*Resumen\s*$/).click();
    cy.get('section[aria-label="Movimientos de caja"]').should('be.visible');
    cy.screenshot('CYP-E2E-08-finanzas-sinteticas');
  });

  it('CYP-E2E-09 Doctor sin administracion: menu y rutas protegidas', () => {
    cy.loginSynthetic(doctor.id);
    cy.get('button[aria-label="Menú de perfil"]').click();
    cy.contains('a', 'Mi producción').should('be.visible');
    cy.contains('a', 'Dashboard Financiero').should('not.exist');
    cy.contains('a', 'Administración de Personal').should('not.exist');
    cy.visit('/finanzas');
    cy.location('pathname').should('eq', '/');
    cy.contains('h1', 'Doctor E2E').should('be.visible');
    cy.contains('h2', 'Dashboard Financiero').should('not.exist');
    cy.visit('/administracion-personal');
    cy.location('pathname').should('eq', '/');
    cy.contains('h1', 'Doctor E2E').should('be.visible');
    cy.get('@syntheticState').its('mutations').should('have.length', 0);
  });

  it('CYP-E2E-10 Logout confirmado y ruta autenticada inaccesible', () => {
    cy.loginSynthetic();
    cy.openSyntheticPatient();
    cy.get('button[aria-label="Menú de perfil"]').click();
    cy.contains('button', 'Cerrar sesión').click();
    cy.wait('@logout').its('response.statusCode').should('eq', 200);
    cy.location('pathname').should('eq', '/login');
    cy.inputForLabel('ID de usuario').should('have.value', '');
    cy.get('nav').should('not.exist');
    cy.window().then(win => {
      expect(win.localStorage.getItem('userId')).to.equal(null);
      expect(win.localStorage.getItem('token')).to.equal(null);
    });
    cy.visit('/pacientes/41');
    cy.location('pathname').should('eq', '/login');
    cy.contains('h2', 'Sintetico, Paciente E2E').should('not.exist');
    cy.contains('button', 'Entrar al Sistema').should('be.visible');
  });
});
