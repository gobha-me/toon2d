// Optional pure CPU body slice: affine/bone helpers and Rig (6-24, 28-137),
// mesh construction including its grid helper (183-231), and public gait
// presets/speed (308-312). Drawing, shaders, render-order tables and the
// renderer-only point application helper are outside this scope.
// These source ranges are independent of the existing FaceSim mutation scope.
export default {
  mutate: [
    'prototypes/lifelike/prototype/rig.js:6:0-24:43',
    'prototypes/lifelike/prototype/rig.js:28:0-137:1',
    'prototypes/lifelike/prototype/rig.js:183:0-231:1',
    'prototypes/lifelike/prototype/rig.js:308:0-312:61',
  ],
  ignorePatterns: ['**', '!prototypes/lifelike/prototype/rig.js',
    '!prototypes/lifelike/prototype/body-rig.json', '!tests/lifelike-rig.test.mjs',
    '!tests/lifelike-rig-topology.test.mjs'],
  testRunner: 'command',
  commandRunner: {
    command: 'node --test --test-concurrency=2 tests/lifelike-rig.test.mjs tests/lifelike-rig-topology.test.mjs',
  },
  coverageAnalysis: 'off',
  concurrency: 2,
  timeoutMS: 2000,
  timeoutFactor: 1.5,
  reporters: ['clear-text', 'json'],
  jsonReporter: { fileName: 'reports/lifelike-rig-mutation.json' },
  cleanTempDir: true,
};
