import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeVisualReview } from '../skills/toon2d-runtime-animation/scripts/visual-review.mjs';
import { recording, view } from './fixtures/visual-review.mjs';

for (const fault of ['never-airborne', 'grounded-launch', 'airborne-land']) {
  test(`anticipation requires flight evidence when event labels say ${fault}`, () => {
    const rec = recording();
    if (fault === 'never-airborne') rec.jump.states.forEach((s) => { s.grounded = true; });
    if (fault === 'grounded-launch') rec.jump.states[8].grounded = true;
    if (fault === 'airborne-land') rec.jump.states[51].grounded = false;
    const s = analyzeVisualReview(rec, view).signals.find((s) => s.id === 'anticipation');
    assert.equal(s.status, 'warn');
    if (fault === 'never-airborne') assert.equal(s.metrics.airborne_ticks, 0);
  });
}

test('complete flight with object events reports its observed airborne duration', () => {
  const rec = recording();
  for (const s of rec.jump.states) s.events = s.events.map((type) => ({ type }));
  const s = analyzeVisualReview(rec, view).signals.find((s) => s.id === 'anticipation');
  assert.equal(s.status, 'pass');
  assert.equal(s.metrics.airborne_ticks, 43);
});
