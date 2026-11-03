import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { agreementReport, TASTE_AXES } from '../skills/toon2d-runtime-animation/scripts/taste-agreement.mjs';

const scores = (score) => Object.fromEntries(TASTE_AXES.map((axis) => [axis, score]));
const pair = (id, human, judge, split = 'calibration') => ({
  sheet_id: id, split, human: scores(human), judge: scores(judge),
});
const dataset = (pairs) => ({ schema_version: 1, pairs });
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);

test('agreement is computed separately for calibration and held-out sheets', () => {
  const input = dataset([
    pair('a', 1, 1), pair('b', 3, 3), pair('c', 5, 5),
    pair('d', 1, 5, 'held-out'), pair('e', 3, 3, 'held-out'), pair('f', 5, 1, 'held-out'),
  ]);
  const snapshot = JSON.stringify(input);
  const report = agreementReport(input);
  assert.equal(report.schema_version, 1);
  assert.equal(report.sheet_count, 6);
  assert.equal(report.splits.calibration.sheet_count, 3);
  assert.equal(report.splits['held-out'].sheet_count, 3);
  close(report.splits.calibration.mean_score_spearman, 1);
  close(report.splits['held-out'].mean_score_spearman, -1);
  for (const axis of TASTE_AXES) {
    const calibrated = report.splits.calibration.axes[axis];
    assert.deepEqual(calibrated, { pairs: 3, exact: 1, within_one: 1, mean_absolute_error: 0, spearman: 1 });
    const held = report.splits['held-out'].axes[axis];
    close(held.exact, 1 / 3);
    close(held.within_one, 1 / 3);
    close(held.mean_absolute_error, 8 / 3);
    close(held.spearman, -1);
  }
  assert.equal(JSON.stringify(input), snapshot, 'reporting must not change the paired ratings');
  assert.equal(Object.hasOwn(report, 'pass'), false, 'no acceptance threshold has been calibrated');
});

test('Spearman correlation uses average ranks for tied scores', () => {
  const report = agreementReport(dataset([pair('a', 1, 1), pair('b', 1, 2), pair('c', 3, 3)]));
  close(report.splits.calibration.mean_score_spearman, Math.sqrt(3) / 2);
  close(report.splits.calibration.axes.appeal.spearman, Math.sqrt(3) / 2);
  close(report.splits.calibration.axes.appeal.exact, 2 / 3);
  close(report.splits.calibration.axes.appeal.within_one, 1);
});

test('constant, singleton and absent ratings have undefined correlation rather than perfect agreement', () => {
  for (const pairs of [[pair('a', 3, 3)], [pair('a', 3, 2), pair('b', 3, 4)]]) {
    const report = agreementReport(dataset(pairs));
    assert.equal(report.splits.calibration.mean_score_spearman, null);
    assert.equal(report.splits.calibration.axes.appeal.spearman, null);
    const absent = report.splits['held-out'];
    assert.equal(absent.sheet_count, 0);
    assert.equal(absent.mean_score_spearman, null);
    assert.deepEqual(absent.axes.appeal, {
      pairs: 0, exact: null, within_one: null, mean_absolute_error: null, spearman: null,
    });
  }
});

test('each rubric axis keeps its own disagreement', () => {
  const row = pair('a', 3, 3);
  row.judge.palette = 5;
  row.judge.shading = 4;
  const axes = agreementReport(dataset([row])).splits.calibration.axes;
  assert.equal(axes.palette.mean_absolute_error, 2);
  assert.equal(axes.palette.within_one, 0);
  assert.equal(axes.shading.mean_absolute_error, 1);
  assert.equal(axes.shading.within_one, 1);
  assert.equal(axes.appeal.exact, 1);
});

for (const [name, alter, message] of [
  ['unknown schema', (d) => { d.schema_version = 2; }, /schema_version/],
  ['empty dataset', (d) => { d.pairs = []; }, /nonempty/],
  ['missing pair', (d) => { d.pairs = [null]; }, /sheet_id/],
  ['blank sheet id', (d) => { d.pairs[0].sheet_id = ' '; }, /sheet_id/],
  ['unassigned split', (d) => { delete d.pairs[0].split; }, /split/],
  ['unknown split', (d) => { d.pairs[0].split = 'training'; }, /split/],
  ['duplicate sheet', (d) => { d.pairs.push({ ...d.pairs[0], split: 'held-out' }); }, /duplicate/],
  ['whitespace duplicate', (d) => { d.pairs.push({ ...d.pairs[0], sheet_id: ' a ' }); }, /duplicate/],
  ['missing human', (d) => { delete d.pairs[0].human; }, /human/],
  ['missing axis', (d) => { delete d.pairs[0].judge.appeal; }, /eight/],
  ['extra axis', (d) => { d.pairs[0].judge.other = 3; }, /eight/],
  ['fractional rating', (d) => { d.pairs[0].human.appeal = 2.5; }, /integer/],
  ['string rating', (d) => { d.pairs[0].human.appeal = '3'; }, /integer/],
  ['missing rating', (d) => { d.pairs[0].human.appeal = null; }, /integer/],
  ['low rating', (d) => { d.pairs[0].human.appeal = 0; }, /integer/],
  ['high rating', (d) => { d.pairs[0].human.appeal = 6; }, /integer/],
]) {
  test(`reject invalid paired ratings: ${name}`, () => {
    const input = dataset([pair('a', 3, 3)]);
    alter(input);
    assert.throws(() => agreementReport(input), message);
  });
}

test('CLI emits a reproducible JSON report with the input hash and rejects malformed input', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'toon-agreement-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const input = join(dir, 'ratings.json');
  const bytes = `${JSON.stringify(dataset([pair('a', 3, 4)]))}\n`;
  writeFileSync(input, bytes);
  const script = new URL('../skills/toon2d-runtime-animation/scripts/taste-agreement.mjs', import.meta.url);
  const run = (...args) => spawnSync(process.execPath, [script.pathname, ...args], { encoding: 'utf8' });
  const result = run(input);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.input_sha256, createHash('sha256').update(bytes).digest('hex'));
  assert.deepEqual(report.splits, agreementReport(JSON.parse(bytes)).splits);
  assert.equal(run(input).stdout, result.stdout);
  writeFileSync(input, '{');
  const invalid = run(input);
  assert.equal(invalid.status, 2);
  assert.equal(invalid.stdout, '');
  assert.ok(invalid.stderr.trim());
  assert.equal(run().status, 2);
  assert.equal(run(input, 'extra').status, 2);
});
