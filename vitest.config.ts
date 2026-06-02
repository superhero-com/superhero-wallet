import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'path';

const r = (...p: string[]) => path.resolve(process.cwd(), ...p);

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      // SVGs imported as Vue components resolve to an empty component in tests.
      // The whole id must be matched so it is fully replaced (not just the suffix).
      { find: /^.+\.svg\?(?:vue-component|component)$/, replacement: r('config/jest/EmptySvg.vue') },
      { find: '@ledgerhq/devices/hid-framing', replacement: r('node_modules/@ledgerhq/devices/lib/hid-framing') },
      { find: '@', replacement: r('src') },
      { find: 'lodash', replacement: 'lodash-es' },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      r('config/vitest/setup.ts'),
      r('src/protocols/registerAdapters.ts'),
    ],
    include: ['tests/unit/**/*.spec.{js,ts}'],
    // Many third-party packages ship ESM that must be transformed.
    server: {
      deps: {
        inline: [
          'lodash-es',
          'vee-validate',
          '@ionic/core',
          '@ionic/vue',
          '@stencil/core',
          'ionicons',
          'swiper',
        ],
      },
    },
  },
});
