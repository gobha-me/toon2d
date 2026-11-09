import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { renderVisualReview } from '../skills/toon2d-runtime-animation/scripts/visual-review.mjs';
import { decodePNG } from '../skills/toon2d-runtime-animation/scripts/lib/png.mjs';

const digest = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

test('headless starter evidence is deterministic, native-sized, auditable and never overwritten', { timeout: 120000 }, async (t) => {
  const out = mkdtempSync(join(tmpdir(), 'toon-visual-'));
  t.after(() => rmSync(out, { recursive: true, force: true }));
  const project = new URL('../skills/toon2d-runtime-animation/templates/starter/', import.meta.url).pathname;
  const first = await renderVisualReview(project, join(out, 'first'));
  const second = await renderVisualReview(project, join(out, 'second'));
  assert.deepEqual(first, second);
  assert.equal(first.advisory, true);
  const manifest = JSON.parse(readFileSync(join(out, 'first', 'frames.json')));
  assert.deepEqual(manifest.keyposes.map((p) => p.pose), ['idle', 'run', 'crouch', 'takeoff', 'apex', 'land']);
  const png = (name) => decodePNG(readFileSync(join(out, 'first', name)));
  const native = png('keyposes.png');
  const large = png('keyposes-3x.png');
  assert.equal(native.w, 6 * 72 + 14);
  assert.equal(native.h, 76);
  assert.equal(large.w, native.w * 3);
  assert.equal(large.h, native.h * 3);
  for (let y = 0; y < large.h; y++) {
    for (let x = 0; x < large.w; x++) {
      const a = (y * large.w + x) * 4;
      const b = (Math.floor(y / 3) * native.w + Math.floor(x / 3)) * 4;
      assert.deepEqual(large.data.subarray(a, a + 4), native.data.subarray(b, b + 4));
    }
  }
  const silhouettes = png('silhouettes.png');
  assert.equal(silhouettes.w, native.w);
  assert.equal(silhouettes.h, native.h);
  for (const s of first.signals) {
    const file = `${s.id}.png`;
    assert.equal(first.images[file], digest(join(out, 'first', file)));
    assert.equal(manifest.signals[s.id].length, s.evidence.length);
  }
  assert.equal(JSON.parse(readFileSync(join(out, 'first', 'report.json'))).schema_version, 1);
  for (const f of readdirSync(join(out, 'first'))) {
    assert.equal(digest(join(out, 'first', f)), digest(join(out, 'second', f)), f);
  }
  await assert.rejects(renderVisualReview(project, join(out, 'first')), /exists/);
});
