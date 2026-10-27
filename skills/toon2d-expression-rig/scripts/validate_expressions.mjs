#!/usr/bin/env node
// Validate an expressions.json (params + presets + reactions). No dependencies.
// Usage: node validate_expressions.mjs [path/to/expressions.json]
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const path = process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), '../reference/expressions.json');
const data = JSON.parse(readFileSync(path, 'utf8'));
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
for (const [name, preset] of Object.entries(data.expressions || {})) {
  const keys = Object.keys(preset);
  for (const k of keys) {
    const p = params.get(k);
    if (!p) errors.push(`expression ${name}: unknown param ${k}`);
    else if (preset[k] < p.min || preset[k] > p.max) errors.push(`expression ${name}: ${k}=${preset[k]} outside [${p.min}, ${p.max}]`);
  }
  if (name !== 'neutral' && keys.length < 3) warnings.push(`expression ${name}: only ${keys.length} params; may read weakly`);
  if (!('mouthCurve' in preset || 'mouthOpen' in preset) && name !== 'neutral') warnings.push(`expression ${name}: no mouth change`);
}
if (!data.expressions || !data.expressions.neutral) errors.push('a "neutral" expression is required');
for (const [ev, r] of Object.entries(data.reactions || {})) {
  if (!data.expressions?.[r.expr]) errors.push(`reaction ${ev}: unknown expression ${r.expr}`);
  if (!(r.weight > 0 && r.weight <= 1)) errors.push(`reaction ${ev}: weight must be in (0, 1]`);
}
for (const w of warnings) console.warn(`warn: ${w}`);
if (errors.length) {
  console.error(errors.map((e) => `error: ${e}`).join('\n'));
  process.exit(1);
}
console.log(`ok: ${params.size} params, ${Object.keys(data.expressions).length} expressions, ${Object.keys(data.reactions || {}).length} reactions`);
