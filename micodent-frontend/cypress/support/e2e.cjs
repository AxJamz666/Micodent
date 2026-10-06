const { installSyntheticApi, PASSWORD, admin } = require('../fixtures/synthetic-api.cjs');

beforeEach(() => installSyntheticApi());
afterEach(() => {
  cy.get('@syntheticState').then(state => expect(state.unexpected, 'unmapped/external API requests').to.deep.equal([]));
});

Cypress.Commands.add('inputForLabel', text => cy.contains('label', text).then(label => {
  const id = label.attr('for');
  return id ? cy.get('[id="' + id + '"]') : cy.wrap(label).find('input,textarea,select');
}));
Cypress.Commands.add('loginSynthetic', (id = admin.id) => {
  cy.visit('/login');
  cy.inputForLabel('ID de usuario').should('be.visible').type(id);
  cy.inputForLabel('Contraseña').type(PASSWORD, { log: false });
  cy.contains('button', 'Entrar al Sistema').click();
  cy.wait('@login').its('response.statusCode').should('eq', 200);
  cy.location('pathname').should('eq', '/');
  cy.get('nav[aria-label="Navegación principal"]').should('be.visible');
});
Cypress.Commands.add('openSyntheticPatient', () => {
  cy.get('a[aria-label="Pacientes"]').click();
  cy.contains('tbody tr', 'Sintetico, Paciente E2E').within(() => {
    cy.get('button[title="Abrir ficha"]').click();
  });
  cy.location('pathname').should('eq', '/pacientes/41');
  cy.inputForLabel('DNI').should('have.value', '00000041');
});
