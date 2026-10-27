import test from 'node:test';
import assert from 'node:assert/strict';

test('CI canary: deliberate failure', () => {
  assert.fail('CI canary: deliberate failure');
});
