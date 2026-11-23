import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const moduleURL = new URL('../skills/toon2d-runtime-animation/scripts/visual-review.mjs', import.meta.url).href;

test('altered canvas readback is rejected before recording or creating evidence', (t) => {
  const parent = mkdtempSync(join(tmpdir(), 'toon-visual-readback-'));
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  const out = join(parent, 'evidence');
  const driver = `
    export async function open() {
      return { view: { mode: 'pixel', s: 1, k: 3 }, page: { errors: [],
        async eval(e) { return e.includes('__toon.dt') ? 1 / 60 : false; } },
        async close() { globalThis.closed++; } };
    }
    export async function record() {
      globalThis.recorded++;
      throw new Error('record must not run with altered readback');
    }
  `;
  const script = `
    import { registerHooks } from 'node:module';
    globalThis.closed = 0; globalThis.recorded = 0;
    registerHooks({ resolve(s, context, next) {
      if (context.parentURL === ${JSON.stringify(moduleURL)} && s === './lib/drive.mjs') {
        return { url: 'data:text/javascript,' + encodeURIComponent(${JSON.stringify(driver)}), shortCircuit: true };
      }
      return next(s, context);
    } });
    const { renderVisualReview } = await import(${JSON.stringify(moduleURL)});
    let error = null;
    try { await renderVisualReview('.', ${JSON.stringify(out)}); } catch (e) { error = e.message; }
    console.log(JSON.stringify({ error, closed: globalThis.closed, recorded: globalThis.recorded }));
  `;
  const child = spawnSync(process.execPath, ['--input-type=module', '--eval', script], { encoding: 'utf8', timeout: 5000 });
  assert.equal(child.status, 0, child.stderr);
  const result = JSON.parse(child.stdout);
  assert.match(result.error, /RGBA.*CHROME_PATH/);
  assert.equal(result.recorded, 0);
  assert.equal(result.closed, 1);
  assert.equal(existsSync(out), false);
});
