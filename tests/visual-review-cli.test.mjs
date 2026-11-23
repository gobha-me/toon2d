import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { renderVisualReview } from '../skills/toon2d-runtime-animation/scripts/visual-review.mjs';

const cli = new URL('../skills/toon2d-runtime-animation/scripts/visual-review.mjs', import.meta.url).pathname;
for (const args of [[], ['project'], ['--out', 'evidence'], ['project', '--unknown', 'value'],
  ['project', '--out'], ['project', '--out', 'one', '--out', 'two'], ['project', '--out', 'one', '--query']]) {
  test(`invalid CLI syntax exits 2 before booting a browser: ${JSON.stringify(args)}`, () => {
    const r = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', timeout: 5000 });
    assert.equal(r.status, 2, r.stderr);
    assert.match(r.stderr, /usage:/);
    assert.equal(r.stdout, '');
  });
}

test('existing evidence is refused before opening even a nonexistent project', async (t) => {
  const out = mkdtempSync(join(tmpdir(), 'toon-visual-existing-'));
  t.after(() => rmSync(out, { recursive: true, force: true }));
  writeFileSync(join(out, 'keep.txt'), 'original evidence\n');
  await assert.rejects(renderVisualReview('missing-project', out), /exists/);
  assert.deepEqual(readdirSync(out), ['keep.txt']);
  assert.equal(readFileSync(join(out, 'keep.txt'), 'utf8'), 'original evidence\n');
});
