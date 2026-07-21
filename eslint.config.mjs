import js from '@eslint/js';
import globals from 'globals';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Flag unused variables as errors; allow intentionally unused prefixed with _
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      // Keep undeclared variables as errors to catch typos quickly
      'no-undef': 'error',
    },
  },
  {
    ignores: [
      'node_modules/**',
      'assets/**',
      'scripts/bundle.js',
      'you/scripts/ok/**',
      'you/pop_ok.js',
      '**/*.min.js',
    ],
  },
];
