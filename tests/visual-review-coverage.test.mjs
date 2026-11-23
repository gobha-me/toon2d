import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeVisualReview } from '../skills/toon2d-runtime-animation/scripts/visual-review.mjs';
import { image, recording, view } from './fixtures/visual-review.mjs';

for (const missing of ['first', 'middle']) {
  test(`a missing bone in the ${missing} run snapshot cannot hide that bone from analysis`, () => {
    const rec = recording();
    const i = missing === 'first' ? 0 : 25;
    rec.run.states[i].joints = rec.run.states[i].joints.filter((j) => j.name !== 'armLF');
    const result = analyzeVisualReview(rec, view);
    for (const id of ['spacing', 'jitter']) {
      const s = result.signals.find((s) => s.id === id);
      assert.equal(s.status, 'warn');
      assert.equal(s.metrics.complete, false);
    }
  });
}

for (const variant of ['duplicate', 'unnamed']) {
  test(`ambiguous ${variant} joints are invalid input`, () => {
    const rec = recording();
    if (variant === 'duplicate') rec.run.states[20].joints.push({ ...rec.run.states[20].joints[2] });
    else rec.run.states[20].joints[2].name = '';
    assert.throws(() => analyzeVisualReview(rec, view), /joint names/);
  });
}

test('dimensions must agree across segments so contact sheets cannot silently crop evidence', () => {
  const rec = recording();
  for (const f of rec.stop.frames) f.img = { w: 71, h: 72, data: new Uint8Array(71 * 72 * 4) };
  assert.throws(() => analyzeVisualReview(rec, view), /dimensions/);
});

test('crops touching an image boundary warn instead of pretending the full silhouette was visible', () => {
  const rec = recording();
  const im = image();
  im.data.set([120, 180, 220, 255], (30 * im.w) * 4);
  rec.run.frames[21].img = im;
  const s = analyzeVisualReview(rec, view).signals.find((s) => s.id === 'silhouette');
  assert.equal(s.status, 'warn');
  assert.equal(s.metrics.clipped_frames, 1);
});
