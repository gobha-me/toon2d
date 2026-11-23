// Advisory pure-analysis slice only; no browser driver or score/gate changes.
const baseline = process.env.TAKEOFF_MUTATION_BASELINE === '1';

export default {
  mutate: ['skills/toon2d-runtime-animation/scripts/takeoff.mjs:10:0-83:0'],
  ignorePatterns: ['**', '!skills/toon2d-runtime-animation/scripts/**', '!tests/takeoff*.test.mjs'],
  testRunner: 'command',
  commandRunner: {
    command: "node --test --test-concurrency=2 --test-name-pattern='^(torsoPitch|hipHeight|analyzeTakeoff|calibration)' tests/takeoff.test.mjs"
      + (baseline ? '' : ' tests/takeoff-calibration.test.mjs'),
  },
  coverageAnalysis: 'off',
  concurrency: 2,
  timeoutMS: 2000,
  timeoutFactor: 1.5,
  reporters: ['clear-text', 'json'],
  jsonReporter: { fileName: `reports/takeoff-mutation-${baseline ? 'before' : 'after'}.json` },
  cleanTempDir: true,
};
