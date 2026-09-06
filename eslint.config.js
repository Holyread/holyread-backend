const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Carried over from the tslint:recommended baseline this replaces.
      eqeqeq: ['error', 'allow-null'],
      'no-eval': 'error',
      'no-var': 'error',
      'no-duplicate-imports': 'error',
      'no-trailing-spaces': 'error',
      quotes: ['error', 'single', { avoidEscape: true }],
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/member-ordering': 'error',
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        { accessibility: 'explicit' },
      ],
    },
  },
];
