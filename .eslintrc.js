module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint',
  },
  env: {
    browser: true,
    webextensions: true,
  },
  extends: [
    'plugin:vue-i18n/recommended',
    'plugin:vue/recommended',
    'airbnb-base',
  ],
  // check if imports actually resolve
  settings: {
    'vue-i18n': {
      localeDir: './src/locales/*.json',
    },
  },
  // add your custom rules here
  rules: {
    // don't require .vue extension when importing
    'import/extensions': ['error', 'always', {
      js: 'never',
      vue: 'never',
    }],
    // disallow reassignment of function parameters
    // disallow parameter object manipulation except for specific exclusions
    'no-param-reassign': ['error', {
      props: true,
      ignorePropertyModificationsFor: [
        'state', // for vuex state
      ],
    }],
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'vue-i18n/no-dynamic-keys': 'error',
    'vue-i18n/no-unused-keys': 'error',
    'vue-i18n/no-raw-text': 'off',
  },
  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)',
      ],
      env: {
        jest: true,
      },
    },
  ],
};
