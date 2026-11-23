import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeVisualReview, visualMarkdown } from '../skills/toon2d-runtime-animation/scripts/visual-review.mjs';
import { image, recording, view } from './fixtures/visual-review.mjs';

const signal = (rec, id, v = view) => {
  const result = analyzeVisualReview(rec, v);
  const found = result.signals.find((s) => s.id === id);
  assert.ok(found, `${id} is reported`);
  assert.ok(found.evidence.length, `${id} cites observed ticks`);
  return found;
};

test('generated readable, smooth, anticipated and settling fixture passes all advisory signals', () => {
  const result = analyzeVisualReview(recording(), view);
  assert.equal(result.schema_version, 1);
  assert.equal(result.advisory, true);
  assert.deepEqual(result.signals.map((s) => s.id), [
    'silhouette', 'spacing', 'anticipation', 'overshoot', 'holds', 'jitter', 'pixel_grid',
  ]);
  for (const s of result.signals) assert.equal(s.status, 'pass', JSON.stringify(s));
  assert.deepEqual(result, analyzeVisualReview(recording(), view), 'no clocks or random values');
});

for (const variant of ['solid', 'detached', 'empty']) {
  test(`silhouette warns on ${variant} pixels even with healthy telemetry`, () => {
    const rec = recording();
    rec.run.frames[21].img = image(variant);
    const s = signal(rec, 'silhouette');
    assert.equal(s.status, 'warn');
    assert.ok(s.evidence.some((e) => e.segment === 'run' && e.tick === 21));
  });
}

test('silhouette warns when limbs merge but the overall fill is low', () => {
  const rec = recording();
  for (const frame of rec.run.frames) {
    const im = image();
    for (let y = 40; y < 55; y++) {
      for (let x = 31; x < 33; x++) im.data.set([120, 180, 220, 255], (y * im.w + x) * 4);
    }
    frame.img = im;
  }
  assert.equal(signal(rec, 'silhouette').status, 'warn');
});

test('spacing and jitter warn on alternating limb teleports in a moving root frame', () => {
  const rec = recording();
  rec.run.states.forEach((s, i) => { s.joints[2].ey += i % 2 ? 15 : -15; });
  assert.equal(signal(rec, 'spacing').status, 'warn');
  assert.equal(signal(rec, 'jitter').status, 'warn');
});

test('spacing measures root-relative endpoints and is invariant to world translation and scale', () => {
  const rec = recording();
  const expected = signal(rec, 'spacing');
  for (const segment of Object.values(rec)) {
    for (const s of segment.states) {
      s.root.x = s.root.x * 3 + 1000;
      s.root.y = s.root.y * 3 - 500;
      for (const j of s.joints) {
        for (const k of ['x', 'ex']) j[k] = j[k] * 3 + 1000;
        for (const k of ['y', 'ey']) j[k] = j[k] * 3 - 500;
      }
    }
  }
  assert.deepEqual(signal(rec, 'spacing').metrics, expected.metrics);
});

for (const kind of ['no-event', 'shallow', 'no-land']) {
  test(`anticipation warns on ${kind} jump rather than accepting incomplete evidence`, () => {
    const rec = recording();
    if (kind === 'no-event') rec.jump.states[2].events = [];
    if (kind === 'no-land') rec.jump.states[51].events = [];
    if (kind === 'shallow') {
      for (const s of rec.jump.states.slice(2, 8)) {
        const dy = s.root.y - 39 - s.joints[0].y;
        for (const j of s.joints) { j.y += dy; j.ey += dy; }
      }
    }
    assert.equal(signal(rec, 'anticipation').status, 'warn');
  });
}

test('overshoot distinguishes a settled follow-through from an abrupt stop and an unsettled tail', () => {
  const rec = recording();
  for (const s of rec.stop.states) s.joints[1].ex = s.joints[1].x;
  assert.equal(signal(rec, 'overshoot').status, 'warn');
  const unsettled = recording();
  for (const s of unsettled.stop.states.slice(-5)) s.joints[1].ex += 10;
  assert.equal(signal(unsettled, 'overshoot').status, 'warn');
});

test('pose timing accepts ones and twos but warns on a frozen run', () => {
  const rec = recording();
  assert.equal(signal(rec, 'holds').status, 'pass');
  rec.run.frames.forEach((f, i) => { f.img = image('clear', i % 2); });
  assert.equal(signal(rec, 'holds').status, 'pass');
  rec.run.frames.forEach((f) => { f.img = image(); });
  assert.equal(signal(rec, 'holds').status, 'warn');
});

test('pixel grid warns on partial edge alpha or noninteger scale, and is omitted for smooth styles', () => {
  const rec = recording();
  rec.run.frames[21].img = image('blurred');
  assert.equal(signal(rec, 'pixel_grid').status, 'warn');
  assert.equal(signal(recording(), 'pixel_grid', { ...view, k: 2.5 }).status, 'warn');
  assert.equal(analyzeVisualReview(rec, { ...view, mode: 'smooth' }).signals.some((s) => s.id === 'pixel_grid'), false);
});

test('missing telemetry cannot become a clean motion report', () => {
  const rec = recording();
  for (const seg of Object.values(rec)) for (const state of seg.states) state.joints = [];
  const result = analyzeVisualReview(rec, view);
  for (const id of ['spacing', 'anticipation', 'overshoot', 'jitter']) {
    assert.equal(result.signals.find((s) => s.id === id).status, 'warn');
  }
});

test('malformed frames, nonfinite geometry and sparse captures are rejected', () => {
  const badImage = recording();
  badImage.run.frames[0].img.data = new Uint8Array(4);
  assert.throws(() => analyzeVisualReview(badImage, view), /image/);
  const badGeometry = recording();
  badGeometry.run.states[0].joints[0].x = NaN;
  assert.throws(() => analyzeVisualReview(badGeometry, view), /finite/);
  const sparse = recording();
  sparse.run.frames.splice(1, 1);
  assert.throws(() => analyzeVisualReview(sparse, view), /every tick/);
  assert.throws(() => analyzeVisualReview({}, view), /segment/);
});

test('short Markdown report names warnings, measured values and evidence without claiming artistic approval', () => {
  const rec = recording();
  rec.run.frames[21].img = image('solid');
  const report = analyzeVisualReview(rec, view);
  const md = visualMarkdown(report);
  assert.match(md, /advisory/i);
  assert.match(md, /silhouette.*warn/i);
  assert.match(md, /silhouette\.png/);
  assert.match(md, /keyposes\.png/);
  assert.match(md, /rubric/i);
  assert.ok(md.length < 7000);
});
