import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeVisualReview } from '../skills/toon2d-runtime-animation/scripts/visual-review.mjs';
import { recording, view } from './fixtures/visual-review.mjs';

const find = (r, id) => r.signals.find((s) => s.id === id);

test('one twitching limb cannot hide behind many stationary bones', () => {
  const rec = recording();
  for (const [i, state] of rec.run.states.entries()) {
    for (let n = 0; n < 20; n++) state.joints.push({ ...state.joints[1], name: `extra${n}` });
    state.joints[2].ey += i % 2 ? 15 : -15;
  }
  const result = analyzeVisualReview(rec, view);
  assert.equal(find(result, 'spacing').status, 'warn');
  assert.equal(find(result, 'jitter').status, 'warn');
  assert.equal(find(result, 'spacing').metrics.worst_joint, 'armLF');
  assert.equal(find(result, 'jitter').metrics.worst_joint, 'armLF');
});

test('missing standing-height baseline yields warnings and finite-or-null metrics', () => {
  const rec = recording();
  for (const state of rec.idle.states) state.joints = state.joints.filter((j) => !['hip', 'spine'].includes(j.name));
  const result = analyzeVisualReview(rec, view);
  for (const id of ['spacing', 'jitter', 'anticipation']) assert.equal(find(result, id).status, 'warn');
  for (const s of result.signals) {
    for (const v of Object.values(s.metrics)) if (typeof v === 'number') assert.ok(Number.isFinite(v));
  }
});

test('a twitch or spacing warning includes consecutive frames around the worst measurement', () => {
  const rec = recording();
  rec.run.states[30].joints[2].ey += 50;
  const result = analyzeVisualReview(rec, view);
  for (const id of ['spacing', 'jitter']) {
    const evidence = find(result, id).evidence;
    const ticks = evidence.map((e) => e.tick);
    assert.ok(ticks.includes(30), id);
    assert.ok(ticks.some((n, i) => ticks[i + 1] === n + 1 && ticks[i + 2] === n + 2), id);
  }
});

test('a single extreme teleport is reported even if its percentile is diluted by a long clean run', () => {
  const rec = recording();
  rec.run.states[30].joints[2].ey += 200;
  assert.equal(find(analyzeVisualReview(rec, view), 'spacing').status, 'warn');
});

test('a full-body rigid run cannot pass spacing or jitter merely because the root moves', () => {
  const rec = recording();
  for (const state of rec.run.states) {
    const arm = state.joints[2];
    arm.ey = state.root.y - 55;
  }
  const result = analyzeVisualReview(rec, view);
  assert.equal(find(result, 'spacing').status, 'warn');
  assert.equal(find(result, 'jitter').status, 'warn');
});
