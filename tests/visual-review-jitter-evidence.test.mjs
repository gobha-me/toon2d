import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeVisualReview } from '../skills/toon2d-runtime-animation/scripts/visual-review.mjs';
import { recording, view } from './fixtures/visual-review.mjs';

test('jitter evidence follows the worst bone rather than an earlier bone with one isolated reversal', () => {
  const rec = recording();
  rec.run.states[20].joints[1].ey += 10;
  rec.run.states.forEach((s, i) => { s.joints[2].ey += i % 2 ? 15 : -15; });
  const s = analyzeVisualReview(rec, view).signals.find((s) => s.id === 'jitter');
  assert.equal(s.status, 'warn');
  assert.equal(s.metrics.worst_joint, 'armLF');
  assert.ok(s.evidence.length >= 3);
  assert.ok(s.evidence.every((e) => e.joint === 'armLF'), JSON.stringify(s.evidence));
});
