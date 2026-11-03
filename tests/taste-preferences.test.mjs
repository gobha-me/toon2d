import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { summarizePreferences } from '../scripts/taste-preferences.mjs';

function fixture() {
  const key = { schema_version: 1, trials: [
    { trial_id: 'opaque-a', id: 'baseline-a', group: 'family-a', split: 'calibration', candidate_side: 'left' },
    { trial_id: 'opaque-b', id: 'baseline-b', group: 'family-b', split: 'held-out', candidate_side: 'right' },
  ] };
  const votes = (a, b) => [
    { trial_id: 'opaque-b', visible_text: false, preferences: Array(8).fill(b) },
    { trial_id: 'opaque-a', visible_text: false, preferences: Array(8).fill(a) },
  ];
  const responses = { schema_version: 1, reviewers: [
    { reviewer_id: 'owner-one', kind: 'owner', trials: votes('left', 'left') },
    { reviewer_id: 'judge-one', kind: 'judge', trials: votes('right', 'right') },
    { reviewer_id: 'panel-one', kind: 'human', trials: votes('tie', 'right') },
  ] };
  return { key, responses };
}

test('recover candidate votes by opaque ID and keep reviewer kinds and splits separate', () => {
  const { key, responses } = fixture();
  const report = summarizePreferences(key, responses);
  assert.equal(report.schema_version, 1);
  assert.equal(report.trial_count, 2);
  assert.deepEqual(report.excluded_trial_ids, []);
  const owner = report.reviewers.find(r => r.reviewer_id === 'owner-one');
  assert.equal(owner.kind, 'owner');
  assert.equal(owner.splits.calibration.trial_count, 1);
  assert.deepEqual(owner.splits.calibration.axes[0], {
    axis: 'proportions', candidate: 1, reference: 0, tie: 0,
    preference_score: 1, decisive_win_fraction: 1,
  });
  assert.equal(owner.splits['held-out'].axes[0].preference_score, 0);
  assert.equal(report.reviewers.find(r => r.kind === 'judge').splits['held-out'].axes[0].preference_score, 1);
  const panel = report.reviewers.find(r => r.kind === 'human');
  assert.equal(panel.splits.calibration.axes[0].preference_score, 0.5);
  assert.equal(panel.splits.calibration.axes[0].decisive_win_fraction, null);
  assert.equal(owner.splits.calibration.axes[7].axis, 'appeal');
  assert.equal(Object.hasOwn(report, 'passed'), false);
});

test('a visible-text flag excludes that trial for every reviewer', () => {
  const { key, responses } = fixture();
  responses.reviewers[1].trials[0].visible_text = true;
  const report = summarizePreferences(key, responses);
  assert.deepEqual(report.excluded_trial_ids, ['opaque-b']);
  for (const reviewer of report.reviewers) {
    assert.equal(reviewer.splits['held-out'].trial_count, 0);
    for (const axis of reviewer.splits['held-out'].axes) {
      assert.equal(axis.candidate + axis.reference + axis.tie, 0);
      assert.equal(axis.preference_score, null);
      assert.equal(axis.decisive_win_fraction, null);
    }
  }
});

test('reports each axis independently without mutating evidence', () => {
  const { key, responses } = fixture();
  responses.reviewers[0].trials[1].preferences = ['left', 'right', 'tie', 'right', 'left', 'tie', 'left', 'right'];
  const before = JSON.stringify({ key, responses });
  const axes = summarizePreferences(key, responses).reviewers[0].splits.calibration.axes;
  assert.deepEqual(axes.map(a => a.preference_score), [1, 0, 0.5, 0, 1, 0.5, 1, 0]);
  assert.equal(JSON.stringify({ key, responses }), before);
});

for (const [name, mutate] of [
  ['duplicate key trial', k => { k.trials.push({ ...k.trials[0] }); }],
  ['invalid candidate side', k => { k.trials[0].candidate_side = 'tie'; }],
  ['unknown split', k => { k.trials[0].split = 'training'; }],
  ['related variants across splits', k => { k.trials[1].group = k.trials[0].group; }],
  ['empty key', k => { k.trials = []; }],
  ['invalid key schema', k => { k.schema_version = 2; }],
  ['invalid response schema', (_, r) => { r.schema_version = 2; }],
  ['empty reviewers', (_, r) => { r.reviewers = []; }],
  ['duplicate reviewer', (_, r) => { r.reviewers.push(r.reviewers[0]); }],
  ['unknown reviewer kind', (_, r) => { r.reviewers[0].kind = 'author'; }],
  ['missing reviewer ID', (_, r) => { delete r.reviewers[0].reviewer_id; }],
  ['missing trial', (_, r) => { r.reviewers[0].trials.pop(); }],
  ['duplicate response trial', (_, r) => { r.reviewers[0].trials[0] = r.reviewers[0].trials[1]; }],
  ['unknown trial', (_, r) => { r.reviewers[0].trials[0].trial_id = 'unknown'; }],
  ['missing screen', (_, r) => { delete r.reviewers[0].trials[0].visible_text; }],
  ['nonboolean screen', (_, r) => { r.reviewers[0].trials[0].visible_text = 'false'; }],
  ['short axis vector', (_, r) => { r.reviewers[0].trials[0].preferences.pop(); }],
  ['invalid preference', (_, r) => { r.reviewers[0].trials[0].preferences[0] = 'candidate'; }],
]) {
  test(`reject ${name}`, () => {
    const { key, responses } = fixture();
    mutate(key, responses);
    assert.throws(() => summarizePreferences(key, responses));
  });
}

test('CLI binds reports to input bytes, writes privately and refuses overwrite', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'toon2d-preferences-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const { key, responses } = fixture();
  const keyBytes = JSON.stringify(key, null, 2) + '\n';
  const responseBytes = JSON.stringify(responses) + '\n';
  const keyPath = join(dir, 'key.json');
  const responsePath = join(dir, 'responses.json');
  const outputPath = join(dir, 'report.json');
  await writeFile(keyPath, keyBytes);
  await writeFile(responsePath, responseBytes);
  const args = ['scripts/taste-preferences.mjs', keyPath, responsePath, outputPath];
  const result = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 10_000 });
  assert.equal(result.status, 0, result.stderr);
  const bytes = await readFile(outputPath, 'utf8');
  const report = JSON.parse(bytes);
  const digest = value => createHash('sha256').update(value).digest('hex');
  assert.deepEqual(report.inputs, { key_sha256: digest(keyBytes), responses_sha256: digest(responseBytes) });
  assert.equal((await stat(outputPath)).mode & 0o777, 0o600);
  const repeat = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 10_000 });
  assert.equal(repeat.status, 2);
  assert.equal(await readFile(outputPath, 'utf8'), bytes);
});
