#!/usr/bin/env node
// Validate a rig.json (+ its sprite sheet parts, if any). Zero deps.
//   node scripts/validate-rig.mjs <rig.json> [--contract]   (--contract = also require the harness bone names)
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export const CONTRACT_BONES = ['hip', 'spine', 'head', 'armUF', 'armLF', 'armUB', 'armLB', 'legUF', 'legLF', 'legUB', 'legLB'];

export function validateRig(rig, { baseDir = '.', contract = false } = {}) {
  const errors = [];
  const warnings = [];
  const bones = rig.bones;
  if (!Array.isArray(bones) || !bones.length) return { errors: ['rig.bones must be a non-empty array'], warnings };
  const by = new Map();
  for (const b of bones) {
    if (!b.name || typeof b.name !== 'string') errors.push('bone without a name');
    if (by.has(b.name)) errors.push(`duplicate bone ${b.name}`);
    by.set(b.name, b);
    if (!(Number.isFinite(b.len) && b.len >= 0)) errors.push(`${b.name}: len must be a number >= 0`);
    if (b.rest != null && !Number.isFinite(b.rest)) errors.push(`${b.name}: rest must be degrees (number)`);
    if (Math.abs(b.rest ?? 0) > 360) warnings.push(`${b.name}: rest ${b.rest} looks like it is not in degrees`);
    if (b.at && !(Array.isArray(b.at) && b.at.length === 2 && b.at.every(Number.isFinite))) errors.push(`${b.name}: at must be [along, perp]`);
  }
  const roots = bones.filter((b) => !b.parent);
  if (roots.length !== 1) errors.push(`expected exactly one root bone, got ${roots.length}`);
  for (const b of bones) {
    if (b.parent && !by.has(b.parent)) errors.push(`${b.name}: parent ${b.parent} does not exist`);
    const seen = new Set();
    let c = b;
    while (c && c.parent) {
      if (seen.has(c.name)) {
        errors.push(`cycle through ${b.name}`);
        break;
      }
      seen.add(c.name);
      c = by.get(c.parent);
    }
  }
  if (contract) for (const n of CONTRACT_BONES) if (!by.has(n)) errors.push(`missing contract bone ${n} (see reference/harness-contract.md)`);
  // legs: IK must be able to reach the ground from the standing hip, with slack for bob
  for (const s of ['F', 'B']) {
    const u = by.get(`legU${s}`);
    const l = by.get(`legL${s}`);
    if (u && l) {
      if (Math.abs(u.len - l.len) / Math.max(u.len, l.len) > 0.35) warnings.push(`leg ${s}: thigh/shin lengths very different (${u.len}/${l.len}); IK knees will look broken`);
      if (rig.stand?.hipHeight && rig.stand.hipHeight > (u.len + l.len) * 0.97) errors.push(`leg ${s}: standing hip height ${rig.stand.hipHeight} >= 97% of leg length; planted feet will drag (foot skate)`);
    }
  }
  // draw section
  const d = rig.draw;
  if (d) {
    for (const [k, spec] of Object.entries(d.limbs || {})) {
      for (const bn of spec.bones || []) if (!by.has(bn)) errors.push(`draw.limbs.${k}: unknown bone ${bn}`);
      if (spec.color && rig.palette && !rig.palette[spec.color]) errors.push(`draw.limbs.${k}: colour ${spec.color} not in palette`);
    }
    for (const k of ['torso', 'head', 'face']) if (d[k] && !by.has(d[k].bone)) errors.push(`draw.${k}: unknown bone ${d[k].bone}`);
    if (!d.face) warnings.push('draw.face missing: the face anchor decides where the param face is drawn');
  }
  // sprite sheet parts
  const sprites = bones.filter((b) => b.sprite).map((b) => [b.name, b.sprite]);
  for (const spec of Object.values(d?.limbs || {})) if (spec.endSprite) sprites.push([`end of ${spec.bones?.at(-1)}`, spec.endSprite]);
  if (sprites.length) {
    if (!rig.sheet?.parts || !rig.sheet?.image) errors.push('bones use sprites but rig.sheet {image, parts} is missing');
    else {
      const pf = resolve(baseDir, rig.sheet.parts);
      const img = resolve(baseDir, rig.sheet.image);
      if (!existsSync(img)) errors.push(`sheet image not found: ${rig.sheet.image}`);
      if (!existsSync(pf)) errors.push(`sheet parts not found: ${rig.sheet.parts}`);
      else {
        const parts = JSON.parse(readFileSync(pf, 'utf8')).parts || {};
        for (const [bn, pn] of sprites) {
          const p = parts[pn];
          if (!p) {
            errors.push(`${bn}: sprite part ${pn} not in ${rig.sheet.parts}`);
            continue;
          }
          const [x, y, w, h] = p.rect || [];
          const inside = (pt) => pt && pt[0] >= x - 0.5 && pt[0] <= x + w + 0.5 && pt[1] >= y - 0.5 && pt[1] <= y + h + 0.5;
          if (!inside(p.pivot)) errors.push(`part ${pn}: pivot ${JSON.stringify(p.pivot)} outside rect ${JSON.stringify(p.rect)}`);
          if (!inside(p.tip)) errors.push(`part ${pn}: tip ${JSON.stringify(p.tip)} outside rect`);
          const b = by.get(bn);
          if (b && p.pivot && p.tip && b.len > 0) {
            const plen = Math.hypot(p.tip[0] - p.pivot[0], p.tip[1] - p.pivot[1]);
            if (Math.abs(plen - b.len) > Math.max(1.5, 0.15 * b.len)) warnings.push(`${bn}: bone len ${b.len} vs sprite pivot->tip ${plen.toFixed(1)}; joints will gap or overlap`);
          }
        }
      }
    }
  }
  return { errors, warnings };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: node validate-rig.mjs <rig.json> [--contract]');
    process.exit(2);
  }
  const rig = JSON.parse(readFileSync(file, 'utf8'));
  const { errors, warnings } = validateRig(rig, { baseDir: dirname(resolve(file)), contract: process.argv.includes('--contract') });
  for (const w of warnings) console.log(`warn  ${w}`);
  for (const e of errors) console.log(`ERROR ${e}`);
  console.log(errors.length ? `FAIL (${errors.length} errors)` : `OK (${rig.bones.length} bones, ${warnings.length} warnings)`);
  process.exit(errors.length ? 1 : 0);
}
