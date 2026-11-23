// Optional CPU FaceSim slice. Shader text, WebGL rendering and assets are not
// mutation targets, and this adds no CI or percentage gate.
export default {
  mutate: ['prototypes/lifelike/prototype/face.js:356:0-649:0'],
  ignorePatterns: ['**', '!prototypes/lifelike/prototype/*.js', '!tests/lifelike-face.test.mjs'],
  testRunner: 'command',
  commandRunner: {
    command: 'node --test --test-concurrency=2 tests/lifelike-face.test.mjs',
  },
  coverageAnalysis: 'off',
  concurrency: 2,
  timeoutMS: 2000,
  timeoutFactor: 1.5,
  reporters: ['clear-text', 'json'],
  jsonReporter: { fileName: 'reports/lifelike-face-mutation.json' },
  cleanTempDir: true,
};
