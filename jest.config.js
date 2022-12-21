const packagesToTranspile = [
  'lodash-es',
  '@aeternity/aepp-sdk',
  '@aeternity/hd-wallet',
  'vee-validate',
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
    '^.*\\.svg\\?skip-optimize$': '<rootDir>/config/jest/EmptySvg.vue',
  },
  setupFiles: [
    '<rootDir>/config/jest/setEnvVars.js',
    '<rootDir>/config/jest/setup.js',
  ],
  collectCoverage: true,
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.vue$': 'vue-jest',
    '^.+\\.mjs$': 'babel-jest',
  },
};
