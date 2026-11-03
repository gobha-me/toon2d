// Evaluator-side evidence only; never include the private key in an author packet.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const axes = ['proportions', 'silhouette', 'line_weight', 'palette', 'shading', 'on_model', 'game_scale', 'appeal'];
const splits = ['calibration', 'held-out'];
const text = value => typeof value === 'string' && value.trim().length > 0;

export function summarizePreferences(key, responses) {
  if (key?.schema_version !== 1 || !Array.isArray(key.trials) ||
      key.trials.length < 1 || key.trials.length > 100) throw new Error('Invalid packet key');
  const trials = new Map();
  const groups = new Map();
  for (const trial of key.trials) {
    if (!trial || !['trial_id', 'id', 'group'].every(field => text(trial[field])) ||
        !splits.includes(trial.split) || !['left', 'right'].includes(trial.candidate_side)) {
      throw new Error('Invalid key trial');
    }
    if (trials.has(trial.trial_id)) throw new Error('Duplicate key trial');
    if (groups.has(trial.group) && groups.get(trial.group) !== trial.split) {
      throw new Error('Related variants must remain in one split');
    }
    groups.set(trial.group, trial.split);
    trials.set(trial.trial_id, trial);
  }
  if (responses?.schema_version !== 1 || !Array.isArray(responses.reviewers) ||
      responses.reviewers.length < 1 || responses.reviewers.length > 1000) throw new Error('Invalid reviewers');
  const reviewerIds = new Set();
  const excluded = new Set();
  // Finish validation and collect contamination flags before counting any votes.
  for (const reviewer of responses.reviewers) {
    if (!reviewer || !text(reviewer.reviewer_id) || reviewerIds.has(reviewer.reviewer_id) ||
        !['owner', 'human', 'judge'].includes(reviewer.kind) || !Array.isArray(reviewer.trials) ||
        reviewer.trials.length !== trials.size) throw new Error('Invalid or incomplete reviewer');
    reviewerIds.add(reviewer.reviewer_id);
    const seen = new Set();
    for (const row of reviewer.trials) {
      if (!row || !trials.has(row.trial_id) || seen.has(row.trial_id) ||
          typeof row.visible_text !== 'boolean' || !Array.isArray(row.preferences) ||
          row.preferences.length !== axes.length ||
          !row.preferences.every(vote => ['left', 'right', 'tie'].includes(vote))) {
        throw new Error('Invalid or duplicate preference row');
      }
      seen.add(row.trial_id);
      if (row.visible_text) excluded.add(row.trial_id);
    }
  }
  const reviewers = responses.reviewers.map(reviewer => {
    const bySplit = {};
    for (const split of splits) {
      const rows = reviewer.trials.filter(row => trials.get(row.trial_id).split === split && !excluded.has(row.trial_id));
      bySplit[split] = {
        trial_count: rows.length,
        axes: axes.map((axis, index) => {
          let candidate = 0, reference = 0, tie = 0;
          for (const row of rows) {
            const vote = row.preferences[index];
            if (vote === 'tie') tie++;
            else if (vote === trials.get(row.trial_id).candidate_side) candidate++;
            else reference++;
          }
          return {
            axis, candidate, reference, tie,
            preference_score: rows.length ? (candidate + tie * 0.5) / rows.length : null,
            decisive_win_fraction: candidate + reference ? candidate / (candidate + reference) : null,
          };
        }),
      };
    }
    return { reviewer_id: reviewer.reviewer_id, kind: reviewer.kind, splits: bySplit };
  });
  return { schema_version: 1, trial_count: trials.size, excluded_trial_ids: [...excluded].sort(), reviewers };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 5) {
      throw new Error('Usage: node scripts/taste-preferences.mjs private-key.json responses.json new-report.json');
    }
    const keyBytes = await readFile(resolve(process.argv[2]));
    const responseBytes = await readFile(resolve(process.argv[3]));
    const report = summarizePreferences(JSON.parse(keyBytes), JSON.parse(responseBytes));
    const hash = bytes => createHash('sha256').update(bytes).digest('hex');
    report.inputs = { key_sha256: hash(keyBytes), responses_sha256: hash(responseBytes) };
    await writeFile(resolve(process.argv[4]), JSON.stringify(report, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
    console.log('Wrote private preference report. Keep it with the evaluator evidence.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
