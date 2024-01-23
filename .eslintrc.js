module.exports = {
  root: true,
  parserOptions: {
    parser: '@typescript-eslint/parser',
  },
  globals: {
    NodeJS: true,
    browser: true,
  },
  env: {
    browser: true,
  },
  extends: [
    'plugin:@intlify/vue-i18n/recommended',
    'plugin:vue/recommended',
    '@vue/eslint-config-airbnb',
    '@vue/eslint-config-typescript',
  ],
  // check if imports actually resolve
  settings: {
    'vue-i18n': {
      localeDir: './src/popup/locales/*.json',
      messageSyntaxVersion: '^9.2.2',
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
    'no-unused-vars': 'off',
    'no-underscore-dangle': 'off',
    'no-confusing-arrow': 'off',
    'import/prefer-default-export': 'off',
    '@intlify/vue-i18n/no-dynamic-keys': 'warn',
    '@intlify/vue-i18n/no-unused-keys': 'error',
    '@intlify/vue-i18n/no-missing-keys': 'off',
    '@intlify/vue-i18n/no-raw-text': 'off',
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    '@typescript-eslint/member-delimiter-style': ['error'],
  },
  overrides: [
    {
      files: [
        '**/tests/unit/**/*.spec.{j,t}s?(x)',
      ],
      env: {
        jest: true,
      },
    },
  ],
};
