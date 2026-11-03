#!/usr/bin/env node
// Summarize independently collected ratings; this does not run or calibrate a judge.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const TASTE_AXES = Object.freeze([
  'proportions', 'silhouette', 'line_weight', 'palette',
  'shading', 'on_model', 'game_scale', 'appeal',
]);
const SPLITS = ['calibration', 'held-out'];

function ranks(values) {
  const ordered = values.map((value, i) => ({ value, i })).sort((a, b) => a.value - b.value);
  const result = new Array(values.length);
  for (let start = 0; start < ordered.length;) {
    let end = start + 1;
    while (end < ordered.length && ordered[end].value === ordered[start].value) end++;
    for (let i = start; i < end; i++) result[ordered[i].i] = (start + end + 1) / 2;
    start = end;
  }
  return result;
}

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

function spearman(a, b) {
  if (a.length < 2) return null;
  const ar = ranks(a);
  const br = ranks(b);
  const am = mean(ar);
  const bm = mean(br);
  let covariance = 0;
  let av = 0;
  let bv = 0;
  for (let i = 0; i < a.length; i++) {
    const ad = ar[i] - am;
    const bd = br[i] - bm;
    covariance += ad * bd;
    av += ad * ad;
    bv += bd * bd;
  }
  return av && bv ? Math.max(-1, Math.min(1, covariance / Math.sqrt(av * bv))) : null;
}

function validate(input) {
  if (input?.schema_version !== 1) throw new Error('schema_version must be 1');
  if (!Array.isArray(input.pairs) || !input.pairs.length) throw new Error('pairs must be a nonempty array');
  const seen = new Set();
  for (const row of input.pairs) {
    if (typeof row?.sheet_id !== 'string' || !row.sheet_id.trim()) throw new Error('each pair needs a sheet_id');
    const id = row.sheet_id.trim();
    if (seen.has(id)) throw new Error(`duplicate sheet_id: ${id}`);
    seen.add(id);
    if (!SPLITS.includes(row.split)) throw new Error(`${id}: split must be calibration or held-out`);
    for (const source of ['human', 'judge']) {
      const scores = row[source];
      if (!scores || typeof scores !== 'object' || Array.isArray(scores) ||
          Object.keys(scores).sort().join() !== [...TASTE_AXES].sort().join()) {
        throw new Error(`${id}: ${source} must contain exactly the eight rubric axes`);
      }
      for (const axis of TASTE_AXES) {
        if (!Number.isInteger(scores[axis]) || scores[axis] < 1 || scores[axis] > 5) {
          throw new Error(`${id}: ${source}.${axis} must be an integer from 1 to 5`);
        }
      }
    }
  }
}

function summarize(rows) {
  const axes = Object.fromEntries(TASTE_AXES.map((axis) => {
    const human = rows.map((row) => row.human[axis]);
    const judge = rows.map((row) => row.judge[axis]);
    const errors = human.map((value, i) => Math.abs(value - judge[i]));
    const fraction = (predicate) => rows.length ? errors.filter(predicate).length / rows.length : null;
    return [axis, {
      pairs: rows.length,
      exact: fraction((error) => error === 0),
      within_one: fraction((error) => error <= 1),
      mean_absolute_error: rows.length ? mean(errors) : null,
      spearman: spearman(human, judge),
    }];
  }));
  const averages = (source) => rows.map((row) => mean(TASTE_AXES.map((axis) => row[source][axis])));
  return {
    sheet_count: rows.length,
    mean_score_spearman: spearman(averages('human'), averages('judge')),
    axes,
  };
}

/** One paired human/judge score vector per unique sheet, with a preassigned split. */
export function agreementReport(input) {
  validate(input);
  return {
    schema_version: 1,
    sheet_count: input.pairs.length,
    splits: Object.fromEntries(SPLITS.map((split) => [split, summarize(input.pairs.filter((row) => row.split === split))])),
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    if (process.argv.length !== 3) throw new Error('usage: taste-agreement.mjs <paired-ratings.json>');
    const bytes = readFileSync(process.argv[2]);
    const report = agreementReport(JSON.parse(bytes));
    console.log(JSON.stringify({
      ...report, input_sha256: createHash('sha256').update(bytes).digest('hex'),
    }, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
