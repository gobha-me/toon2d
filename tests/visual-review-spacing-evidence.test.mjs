import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeVisualReview, VISUAL_LIMITS } from '../skills/toon2d-runtime-animation/scripts/visual-review.mjs';
import { recording, view } from './fixtures/visual-review.mjs';

for (const [spike, expectedBone] of [[6, 'spine'], [40, 'armLF']]) {
  test(`spacing evidence follows the failing statistic with an isolated ${spike}px wrist displacement`, () => {
    const rec = recording();
    rec.run.states.forEach((s, i) => { s.joints[1].ey += i % 2 ? 1.2 : -1.2; });
    rec.run.states[30].joints[2].ey += spike;
    const s = analyzeVisualReview(rec, view).signals.find((s) => s.id === 'spacing');
    assert.equal(s.status, 'warn');
    assert.equal(s.metrics.worst_joint, 'spine');
    assert.equal(s.metrics.max_joint, 'armLF');
    assert.equal(s.metrics.acceleration_max > VISUAL_LIMITS.accelerationMax, spike === 40);
    assert.ok(s.evidence.length >= 3);
    assert.ok(s.evidence.every((e) => e.joint === expectedBone), JSON.stringify(s.evidence));
  });
}
