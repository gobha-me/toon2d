import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { renderVisualReview } from '../skills/toon2d-runtime-animation/scripts/visual-review.mjs';
import { decodePNG } from '../skills/toon2d-runtime-animation/scripts/lib/png.mjs';

test('smooth starter uses native 3x world buffer and omits pixel-specific checks', { timeout: 120000 }, async (t) => {
  const parent = mkdtempSync(join(tmpdir(), 'toon-visual-smooth-'));
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  const out = join(parent, 'evidence');
  const project = new URL('../skills/toon2d-runtime-animation/templates/starter/', import.meta.url).pathname;
  const report = await renderVisualReview(project, out, { query: 'mode=smooth' });
  assert.equal(report.mode, 'smooth');
  assert.equal(report.signals.length, 6);
  assert.equal(report.signals.some((s) => s.id === 'pixel_grid'), false);
  const native = decodePNG(readFileSync(join(out, 'keyposes.png')));
  assert.equal(native.w, 6 * 216 + 14);
  assert.equal(native.h, 220);
  const manifest = JSON.parse(readFileSync(join(out, 'frames.json')));
  assert.equal(manifest.query, 'mode=smooth');
  assert.equal(manifest.view.s, 3);
  assert.equal(manifest.keyposes.some((p) => p.fallback), false);
});
