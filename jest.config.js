const packagesToTranspile = [
  'lodash-es',
  'vee-validate',
  '@ionic/core',
  '@ionic/vue',
  '@stencil/core',
  'ionicons',
  'swiper',
];

module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  moduleFileExtensions: [
    'js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'json', 'node',
  ],
  transformIgnorePatterns: [
    `node_modules/(?!(${packagesToTranspile.join('|')})/)`,
  ],
  moduleNameMapper: {
    '^.*\\.svg\\?vue-component$': '<rootDir>/config/jest/EmptySvg.vue',
    '\\.(css|scss)$': 'identity-obj-proxy',
  },
  setupFiles: [
    '<rootDir>/config/jest/setEnvVars.js',
    '<rootDir>/src/protocols/registerAdapters.ts',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.mjs$': 'babel-jest',
  },
};
