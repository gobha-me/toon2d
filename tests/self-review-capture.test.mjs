import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { captureRound } from '../skills/toon2d-runtime-animation/scripts/self-review.mjs';
import { decodePNG } from '../skills/toon2d-runtime-animation/scripts/lib/png.mjs';

test('visual review captures the real starter at native and nearest enlarged scales', { timeout: 120000 }, async (t) => {
  const out = mkdtempSync(join(tmpdir(), 'toon-review-capture-'));
  t.after(() => rmSync(out, { recursive: true, force: true }));
  const starter = new URL('../skills/toon2d-runtime-animation/templates/starter/', import.meta.url);
  const result = await captureRound(starter.pathname, out);
  assert.equal(result.status, 'awaiting-review');
  const frames = JSON.parse(readFileSync(join(result.directory, 'frames.json'), 'utf8'));
  assert.deepEqual(frames.order, ['idle', 'run', 'crouch', 'takeoff', 'apex', 'land']);
  const { crouch, takeoff, apex, land } = frames.jump_ticks;
  assert.ok(crouch < takeoff && takeoff < apex && apex < land);
  assert.deepEqual(frames.motion_ticks, [0, 10, 20, 30, 40, 50]);
  const image = (name) => decodePNG(readFileSync(join(result.directory, name)));
  const native = image('keyposes.png');
  const enlarged = image('keyposes-3x.png');
  const motion = image('motion.png');
  assert.equal(native.w, 6 * 72 * frames.view.s + 14);
  assert.equal(native.h, 72 * frames.view.s + 4);
  assert.equal(motion.w, native.w);
  assert.equal(motion.h, native.h);
  assert.equal(enlarged.w, native.w * 3);
  assert.equal(enlarged.h, native.h * 3);
  for (let y = 0; y < enlarged.h; y++) {
    for (let x = 0; x < enlarged.w; x++) {
      const source = (Math.floor(y / 3) * native.w + Math.floor(x / 3)) * 4;
      const dest = (y * enlarged.w + x) * 4;
      for (let channel = 0; channel < 4; channel++) {
        assert.equal(enlarged.data[dest + channel], native.data[source + channel]);
      }
    }
  }
});
