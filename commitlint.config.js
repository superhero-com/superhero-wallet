module.exports = {
  extends: ['@commitlint/config-conventional'],
  // Dependabot's bodies hold long links
  ignores: [(message) => message.includes('Signed-off-by: dependabot[bot]')],
  rules: {
    'subject-case': [
      2,
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
    ],
    'scope-case': [
      2,
      'always',
      ['lower-case', 'kebab-case'],
    ],
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
        'sample',
      ],
    ],
  },
};
