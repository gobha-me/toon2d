// Exercise output and error handling without Chrome by replacing only the runtime driver.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createHash } from 'node:crypto';

const moduleURL = new URL('../skills/toon2d-runtime-animation/scripts/visual-review.mjs', import.meta.url).href;
const fixtureURL = new URL('./fixtures/visual-review.mjs', import.meta.url).href;

function run(t, scenario) {
  const parent = mkdtempSync(join(tmpdir(), 'toon-visual-session-'));
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  const out = join(parent, 'evidence');
  const driver = `
    import { recording, view } from ${JSON.stringify(fixtureURL)};
    export async function open() {
      return { view, page: { errors: ${JSON.stringify(scenario === 'console' ? ['render console failure'] : [])},
        async eval(e) { return e.includes('__toon.dt') ? ${scenario === 'dt' ? '1/30' : '1/60'} : true; } },
        async close() { globalThis.closed++; } };
    }
    export async function record() {
      globalThis.recorded++;
      if (${JSON.stringify(scenario)} === 'record') throw new Error('record failed');
      const rec = recording();
      if (${JSON.stringify(scenario)} === 'fallback') rec.jump.states[8].events = [];
      return rec;
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
  const child = spawnSync(process.execPath, ['--input-type=module', '--eval', script], { encoding: 'utf8', timeout: 10000 });
  assert.equal(child.status, 0, child.stderr);
  return { out, ...JSON.parse(child.stdout) };
}

for (const [scenario, message] of [['dt', /60 Hz/], ['record', /record failed/], ['console', /render console failure/]]) {
  test(`${scenario} failure closes the session and creates no evidence directory`, (t) => {
    const r = run(t, scenario);
    assert.match(r.error, message);
    assert.equal(r.closed, 1);
    assert.equal(r.recorded, scenario === 'dt' ? 0 : 1);
    assert.equal(existsSync(r.out), false);
  });
}

test('an incomplete jump still writes reviewable evidence with explicitly marked fallback poses', (t) => {
  const r = run(t, 'fallback');
  assert.equal(r.error, null);
  assert.equal(r.closed, 1);
  const manifest = JSON.parse(readFileSync(join(r.out, 'frames.json')));
  assert.equal(manifest.keyposes.filter((p) => p.fallback).length, 4);
  const report = JSON.parse(readFileSync(join(r.out, 'report.json')));
  assert.equal(report.signals.find((s) => s.id === 'anticipation').status, 'warn');
  for (const [file, expected] of Object.entries(report.images)) {
    const actual = createHash('sha256').update(readFileSync(join(r.out, file))).digest('hex');
    assert.equal(actual, expected, file);
  }
  assert.ok(readFileSync(join(r.out, 'report.md'), 'utf8').includes('advisory'));
});
