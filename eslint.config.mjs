import js from '@eslint/js';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

const ignoredPaths = ['dist/**', 'coverage/**', 'node_modules/**'];

export default [
  { ignores: ignoredPaths },
  { files: ['src/**/*.ts'], ...js.configs.recommended },
  ...tsPlugin.configs['flat/recommended'],
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: tsParser,
      parserOptions: { project: './tsconfig.json' },
      globals: { ...globals.es2020, ...globals.node, ...globals.jest },
    },
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-function': 'off',
      // New in ESLint 10's recommended set. Attaching `cause` needs the
      // ES2022 ErrorOptions typings and would change the error objects this
      // library returns, so keep the pre-upgrade behaviour.
      'preserve-caught-error': 'off',
      'no-console': 'warn',
      'no-debugger': 'error',
    },
  },
  {
    files: [
      'src/cli/**/*.ts',
      'src/compat/emitter.ts',
      'src/kernel.ts',
      'src/locales/lazy.ts',
      'src/logger.ts',
    ],
    rules: {
      'no-console': 'off',
    },
  },
];
