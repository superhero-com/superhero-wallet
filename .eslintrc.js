module.exports = {
  root: true,
  parserOptions: {
    parser: '@typescript-eslint/parser',
  },
  env: {
    browser: true,
    webextensions: true,
  },
  extends: [
    'plugin:vue-i18n/recommended',
    'plugin:vue/recommended',
    // '@vue/airbnb',
    // '@vue/typescript',
    '@vue/eslint-config-airbnb',
    '@vue/eslint-config-typescript', 
  ],
  // check if imports actually resolve
  settings: {
    'vue-i18n': {
      localeDir: './src/locales/*.json',
    },
  },
  // add your custom rules here
  rules: {
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
    'no-unused-vars': 'warn', // TODO: change back to 'error' 
    'no-underscore-dangle': 'off',
    'no-confusing-arrow': 'off',
    'import/prefer-default-export': 'off',
    'vue-i18n/no-dynamic-keys': 'error',
    'vue-i18n/no-unused-keys': 'error',
    'vue-i18n/no-raw-text': 'off',
    'vue/multi-word-component-names': 'off',
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
