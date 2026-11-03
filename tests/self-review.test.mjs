import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { AXES, assessRound, captureRound, jumpPoses } from '../skills/toon2d-runtime-animation/scripts/self-review.mjs';
import { encodePNG } from '../skills/toon2d-runtime-animation/scripts/lib/png.mjs';

function fixture(t) {
  const out = mkdtempSync(join(tmpdir(), 'toon-review-'));
  t.after(() => rmSync(out, { recursive: true, force: true }));
  let renders = 0;
  const capture = async (_project, dir) => {
    renders++;
    const image = encodePNG(1, 1, new Uint8Array([renders, 20, 30, 255]));
    for (const name of ['keyposes', 'keyposes-3x', 'motion'].map((stem) => `${stem}.png`)) writeFileSync(join(dir, name), image);
  };
  const review = (round, scores = {}) => {
    const value = {
      reviewer: 'Fixture reviewer', role: 'author',
      images_seen: ['keyposes', 'keyposes-3x', 'motion'].map((stem) => `${stem}.png`),
      axes: Object.fromEntries(AXES.map((axis) => [axis, {
        score: scores[axis] ?? 3, observation: 'Run frame 3: the front arm separates from the torso.',
      }])),
    };
    writeFileSync(join(out, `round-${round}`, 'review.json'), JSON.stringify(value));
    return value;
  };
  return { out, capture, review, renders: () => renders };
}

test('jump key poses follow events, deepest crouch, apex and landing instead of fixed tick numbers', () => {
  const s = (y, height, grounded, events = []) => ({
    root: { y }, grounded, events, joints: [{ name: 'hip', y: y - height }],
  });
  const states = [s(150, 40, true), s(150, 28, true, ['crouch']), s(149, 35, false, [{ type: 'jump' }]),
    s(120, 40, false), s(100, 40, false), s(130, 40, false), s(150, 32, true, [{ type: 'land' }])];
  assert.deepEqual(jumpPoses(states), { crouch: 1, takeoff: 2, apex: 4, land: 6 });
  assert.throws(() => jumpPoses(states.slice(0, -1)), /complete jump/);
  assert.throws(() => jumpPoses(states.map((s) => ({ ...s, joints: [] }))), /crouch geometry/);
});

test('a capture must be reviewed before another render and completed rounds are kept', async (t) => {
  const f = fixture(t);
  const first = await captureRound('fixture', f.out, { capture: f.capture });
  assert.equal(first.status, 'awaiting-review');
  await assert.rejects(captureRound('fixture', f.out, { capture: f.capture }), /awaiting-review/);
  assert.equal(f.renders(), 1);
  f.review(1, { silhouette: 2, appeal: 1 });
  const result = assessRound(f.out);
  assert.equal(result.status, 'ready');
  assert.equal(result.fix_first, 'appeal');
  const critique = readFileSync(join(first.directory, 'critique.json'), 'utf8');
  await captureRound('fixture', f.out, { capture: f.capture });
  assert.equal(readFileSync(join(first.directory, 'critique.json'), 'utf8'), critique);
  const state = JSON.parse(readFileSync(join(f.out, 'state.json')));
  assert.notEqual(state.rounds[0].images['keyposes.png'], state.rounds[1].images['keyposes.png']);
});

test('the third unsuccessful critique exhausts the budget and prevents a fourth capture', async (t) => {
  const f = fixture(t);
  for (let round = 1; round <= 3; round++) {
    await captureRound('fixture', f.out, { capture: f.capture });
    f.review(round, { game_scale: 2 });
    const result = assessRound(f.out);
    assert.equal(result.status, round === 3 ? 'budget-exhausted' : 'ready');
  }
  await assert.rejects(captureRound('fixture', f.out, { capture: f.capture }), /budget-exhausted/);
  assert.equal(f.renders(), 3);
});

test('all competent axes stop the author loop with a provisional result', async (t) => {
  const f = fixture(t);
  await captureRound('fixture', f.out, { capture: f.capture });
  f.review(1);
  const result = assessRound(f.out);
  assert.equal(result.status, 'author-pass');
  assert.equal(result.provisional, true);
  assert.equal(result.fix_first, null);
  await assert.rejects(captureRound('fixture', f.out, { capture: f.capture }), /author-pass/);
  assert.throws(() => assessRound(f.out), /cannot assess/);
});

for (const [name, alter, message] of [
  ['missing image acknowledgement', (r) => { r.images_seen.pop(); }, /all three images/],
  ['missing axis', (r) => { delete r.axes.shading; }, /eight rubric axes/],
  ['extra axis', (r) => { r.axes.other = r.axes.shading; }, /eight rubric axes/],
  ['fractional score', (r) => { r.axes.appeal.score = 2.5; }, /integer score/],
  ['out-of-range score', (r) => { r.axes.appeal.score = 6; }, /integer score/],
  ['no observation', (r) => { r.axes.appeal.observation = ' '; }, /visual observation/],
  ['anonymous reviewer', (r) => { r.reviewer = ''; }, /name the reviewer/],
]) {
  test(`incomplete critique is rejected: ${name}`, async (t) => {
    const f = fixture(t);
    await captureRound('fixture', f.out, { capture: f.capture });
    const value = f.review(1);
    alter(value);
    writeFileSync(join(f.out, 'round-1', 'review.json'), JSON.stringify(value));
    assert.throws(() => assessRound(f.out), message);
    assert.equal(existsSync(join(f.out, 'round-1', 'critique.json')), false);
  });
}

test('a critique cannot be attached to altered pixels', async (t) => {
  const f = fixture(t);
  await captureRound('fixture', f.out, { capture: f.capture });
  f.review(1);
  writeFileSync(join(f.out, 'round-1', 'keyposes.png'), 'replaced capture');
  assert.throws(() => assessRound(f.out), /capture changed: keyposes.png/);
});

test('failed capture is retained and cannot be scored or silently retried', async (t) => {
  const f = fixture(t);
  await assert.rejects(captureRound('fixture', f.out, {
    capture: async () => { throw new Error('renderer failed'); },
  }), /renderer failed/);
  assert.throws(() => assessRound(f.out), /capture-failed/);
  await assert.rejects(captureRound('fixture', f.out, { capture: f.capture }), /capture-failed/);
});
