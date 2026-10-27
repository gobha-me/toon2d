#!/usr/bin/env node
// Validate expressions.json (params, presets, reactions). Zero deps. Superset of the sub-skill validator.
//   node scripts/validate-expressions.mjs <expressions.json> [--min 3]
// --min N: require N non-neutral presets that each move eyes AND brows AND mouth (what reads at game scale).
import { readFileSync } from 'node:fs';

export function validateExpressions(data, { min = 0 } = {}) {
  const errors = [];
  const warnings = [];
  const params = new Map();
  for (const p of data.params || []) {
    if (params.has(p.name)) errors.push(`duplicate param ${p.name}`);
    if (!(p.min < p.max)) errors.push(`param ${p.name}: min must be < max`);
    if (p.def < p.min || p.def > p.max) errors.push(`param ${p.name}: default outside range`);
    if (!(p.rate > 0)) errors.push(`param ${p.name}: rate must be > 0`);
    params.set(p.name, p);
  }
  if (!params.size) errors.push('no params');
  const ex = data.expressions || {};
  if (!ex.neutral) errors.push('a "neutral" expression is required');
  let strong = 0;
  for (const [name, preset] of Object.entries(ex)) {
    const groups = new Set();
    for (const [k, v] of Object.entries(preset)) {
      const p = params.get(k);
      if (!p) {
        errors.push(`expression ${name}: unknown param ${k}`);
        continue;
      }
      if (v < p.min || v > p.max) errors.push(`expression ${name}: ${k}=${v} outside [${p.min}, ${p.max}]`);
      if (Math.abs(v - p.def) > 0.15) groups.add(k.startsWith('eye') || k.startsWith('pupil') ? 'eyes' : k.startsWith('brow') ? 'brows' : k.startsWith('mouth') ? 'mouth' : 'other');
    }
    if (name === 'neutral') continue;
    if (groups.has('eyes') && groups.has('brows') && groups.has('mouth')) strong++;
    else warnings.push(`expression ${name}: moves only ${[...groups].join('+') || 'nothing'}; needs eyes+brows+mouth to read at game scale`);
  }
  for (const [ev, r] of Object.entries(data.reactions || {})) {
    if (!ex[r.expr]) errors.push(`reaction ${ev}: unknown expression ${r.expr}`);
    for (const k of ['weight', 'fadeIn', 'hold', 'fadeOut']) if (!(r[k] >= 0)) errors.push(`reaction ${ev}: ${k} must be >= 0`);
  }
  if (strong < min) errors.push(`only ${strong} strong expressions (eyes+brows+mouth); need ${min}`);
  return { errors, warnings, strong };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: node validate-expressions.mjs <expressions.json> [--min 3]');
    process.exit(2);
  }
  const i = process.argv.indexOf('--min');
  const r = validateExpressions(JSON.parse(readFileSync(file, 'utf8')), { min: i > 0 ? Number(process.argv[i + 1]) : 0 });
  for (const w of r.warnings) console.log(`warn  ${w}`);
  for (const e of r.errors) console.log(`ERROR ${e}`);
  console.log(r.errors.length ? `FAIL (${r.errors.length} errors)` : `OK (${r.strong} strong expressions)`);
  process.exit(r.errors.length ? 1 : 0);
}
