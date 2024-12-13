import { defineConfig, devices } from '@playwright/test';

// eslint-disable-next-line import/no-extraneous-dependencies
require('dotenv').config();

/** See https://playwright.dev/docs/test-configuration. */
export default defineConfig({
  testDir: './tests/e2e/playwright/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { open: 'never' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  timeout: 70000,
  webServer: {
    command: 'npm run serve:production',
    url: 'http://localhost:7771',
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 180 * 1000,
  },
  use: {
    testIdAttribute: 'data-cy',
    baseURL: 'http://localhost:7771',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',

    permissions: ['camera', 'clipboard-read'],
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'chromiumExt',
      testIgnore: ['**/*.setup.ts'],
      use: {
        ...devices['Desktop Chrome'],
        deviceScaleFactor: undefined,
        viewport: null,
      },

    },
  ],
});
