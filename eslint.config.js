import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'shots/**',
      // Archived cold-evaluation outputs: code written by the agents under test, kept verbatim as evidence.
      'evals/runs/**',
      // Archived lifelike research prototype and its one-off dev scripts. The shipped copy of its browser code
      // lives in docs/lifelike/ and is linted there.
      'prototypes/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['prototype/**/*.js', 'skills/**/*.js', 'docs/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
  },
  {
    files: ['scripts/**/*.mjs', 'skills/**/*.mjs', 'tests/**/*.mjs', 'eslint.config.js'],
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
      // `x == null` / `x != null` deliberately match both null and undefined; switching them to strict
      // equality would change behaviour, so only the null comparison is exempt.
      eqeqeq: ['warn', 'always', { null: 'ignore' }],
      'prefer-const': 'warn',
      'no-var': 'warn',
      curly: ['warn', 'multi-line'],
    },
  },
];
