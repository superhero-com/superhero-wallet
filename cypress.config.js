// eslint-disable-next-line import/no-extraneous-dependencies
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1',
  video: false,
  // Ensure Cypress waits long enough for initial webpack compile
  pageLoadTimeout: 120000,
  requestTimeout: 120000,
  fixturesFolder: 'tests/e2e/fixtures',
  screenshotsFolder: 'tests/e2e/screenshots',
  videosFolder: 'tests/e2e/videos',
  e2e: {
    specPattern: 'tests/e2e/integration/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'tests/e2e/support/index.js',
    experimentalRunAllSpecs: true,
    baseUrl: 'http://localhost:8080',
    excludeSpecPattern: [
      'tests/e2e/integration/tip.cy.js',
      'tests/e2e/integration/transaction-details.cy.js',
      'tests/e2e/integration/transactions.cy.js',
      'tests/e2e/integration/transfer-send.cy.js',
      'tests/e2e/integration/networks.cy.js',
    ],
  },
  viewportHeight: 660,
  viewportWidth: 420,
});
