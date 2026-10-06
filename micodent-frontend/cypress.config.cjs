const { defineConfig } = require('cypress');

module.exports = defineConfig({
  viewportWidth: 1280,
  viewportHeight: 900,
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  responseTimeout: 15000,
  pageLoadTimeout: 30000,
  retries: 0,
  video: false,
  screenshotOnRunFailure: true,
  screenshotsFolder: 'test-results/cypress/screenshots',
  videosFolder: 'test-results/cypress/videos',
  downloadsFolder: 'test-results/cypress/downloads',
  e2e: {
    baseUrl: 'http://127.0.0.1:4175',
    specPattern: 'cypress/e2e/**/*.cy.cjs',
    supportFile: 'cypress/support/e2e.cjs',
    testIsolation: true,
    async setupNodeEvents(_on, config) {
      const url = new URL(config.baseUrl);
      if (url.hostname !== '127.0.0.1' || url.protocol !== 'http:') {
        throw new Error('E2E requires the isolated loopback server; use npm run test:e2e.');
      }
      const response = await fetch(new URL('/__micodent_e2e_health', url), {
        signal: AbortSignal.timeout(5000),
      });
      const health = await response.json();
      if (!response.ok || health.mode !== 'synthetic-api-only' || health.database !== 'disabled') {
        throw new Error('E2E isolation marker missing; refusing to test this installation.');
      }
      return config;
    },
  },
});
