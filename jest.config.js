const packagesToTranspile = [
  'lodash-es',
  '@aeternity/aepp-sdk',
  '@aeternity/hd-wallet',
];

module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  transformIgnorePatterns: [
    `node_modules/(?!(${packagesToTranspile.join('|')})/)`,
  ],
  moduleNameMapper: {
    '^.*\\.svg\\?vue-component$': '<rootDir>/config/jest/EmptySvg.vue',
    '^.*\\.svg\\?skip-optimize$': '<rootDir>/config/jest/EmptySvg.vue',
  },
  setupFiles: [
    '<rootDir>/config/jest/setEnvVars.js',
  ],
};
