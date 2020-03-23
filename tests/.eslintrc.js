module.exports = {
  plugins: ['cypress'],
  extends: ['plugin:cypress/recommended'],
  env: {
    'cypress/globals': true,
  },
  rules: {
    strict: 'off',
  },
};
