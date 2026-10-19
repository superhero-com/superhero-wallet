import { defineConfig } from 'vitest/config';

// Layout checks in Playwright's WebKit (`npm run test:e2e:webkit`); not part of the unit run.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/e2e-webkit/**/*.spec.ts'],
    testTimeout: 120000,
    hookTimeout: 180000,
  },
});
