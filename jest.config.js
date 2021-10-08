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
};
