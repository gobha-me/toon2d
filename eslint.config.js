import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', 'dist/**', 'shots/**'] },
  js.configs.recommended,
  {
    files: ['prototype/**/*.js', 'skills/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
  },
  {
    files: ['scripts/**/*.mjs', 'skills/**/*.mjs', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
  {
    // Playwright page.evaluate/waitForFunction callbacks run inside the browser.
    files: ['scripts/shots.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      eqeqeq: ['warn', 'always'],
      'prefer-const': 'warn',
      'no-var': 'warn',
      curly: ['warn', 'multi-line'],
    },
  },
];
