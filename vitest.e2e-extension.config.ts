import { defineConfig } from 'vitest/config';

// Drives the built Chrome extension (`npm run test:e2e:extension`); not part of the unit run.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/e2e-extension/**/*.spec.ts'],
    testTimeout: 90000,
    hookTimeout: 180000,
    fileParallelism: false,
  },
});
