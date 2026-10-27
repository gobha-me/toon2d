#!/usr/bin/env node
// Extract joint markers from a parts sheet and write a clean sheet + parts.json. Zero deps.
//   node scripts/sheet-markers.mjs <sheet.png> <sheet.json> [--out DIR]
// sheet.json: { parts: { name: { rect: [x,y,w,h] } }, markers?: {pivot,tip,face} }
// Markers (single pixels, exact colours): #FF00FF pivot (joint to parent), #00FFFF tip (joint to child),
// #FFFF00 optional face anchor. Output (DIR defaults to the sheet's dir):
//   sheet.clean.png : markers replaced by the most common opaque neighbour (markers must never render)
//   parts.json      : { image:'sheet.clean.png', palette:[hex...], parts:{ name:{ rect, pivot:[x,y], tip:[x,y], face?:[x,y], len } } }
//   Coordinates are sheet pixels at the pixel centre (x+0.5, y+0.5). len = |tip - pivot| -> use it as bone len.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { decodePNG, encodePNG } from './lib/png.mjs';

const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));

export function extractMarkers(img, meta) {
  const { w: W, data } = img;
  const mk = { pivot: '#FF00FF', tip: '#00FFFF', face: '#FFFF00', ...(meta.markers || {}) };
  const cols = Object.fromEntries(Object.entries(mk).map(([k, v]) => [k, hex(v)]));
  const out = { parts: {} };
  const problems = [];
  const at = (x, y) => (y * W + x) * 4;
  const marked = [];
  for (const [name, p] of Object.entries(meta.parts)) {
    const [rx, ry, rw, rh] = p.rect;
    const found = {};
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        const i = at(x, y);
        if (data[i + 3] < 250) continue;
        for (const [k, c] of Object.entries(cols)) {
          if (data[i] === c[0] && data[i + 1] === c[1] && data[i + 2] === c[2]) {
            (found[k] ||= []).push([x + 0.5, y + 0.5]);
            marked.push([x, y]);
          }
        }
      }
    }
    const rec = { rect: p.rect };
    for (const k of ['pivot', 'tip', 'face']) {
      const f = found[k] || [];
      if (f.length > 1) problems.push(`${name}: ${f.length} ${k} markers (expected 1)`);
      if (f.length) rec[k] = f[0];
      else if (k !== 'face') problems.push(`${name}: no ${k} marker`);
    }
    if (rec.face && rec.pivot && rec.tip) {
      // face anchor in bone space -> rig.draw.face {along, perp} (perp + = toward the facing side, sheet drawn facing +x)
      const ux = rec.tip[0] - rec.pivot[0];
      const uy = rec.tip[1] - rec.pivot[1];
      const L = Math.hypot(ux, uy) || 1;
      const fx = rec.face[0] - rec.pivot[0];
      const fy = rec.face[1] - rec.pivot[1];
      rec.faceAnchor = { along: +((fx * ux + fy * uy) / L).toFixed(2), perp: +((fx * -uy + fy * ux) / L).toFixed(2) };
    }
    if (rec.pivot && rec.tip) rec.len = +Math.hypot(rec.tip[0] - rec.pivot[0], rec.tip[1] - rec.pivot[1]).toFixed(2);
    out.parts[name] = rec;
  }
  // clean: replace each marker with the most common opaque non-marker 4/8-neighbour colour
  const clean = new Uint8Array(data);
  const isMarker = new Set(marked.map(([x, y]) => y * W + x));
  for (const [x, y] of marked) {
    const votes = new Map();
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= img.h || isMarker.has(ny * W + nx)) continue;
        const i = at(nx, ny);
        if (data[i + 3] < 128) continue;
        const key = data.slice(i, i + 4).join(',');
        votes.set(key, (votes.get(key) || 0) + 1);
      }
    }
    const best = [...votes].sort((a, b) => b[1] - a[1])[0];
    const i = at(x, y);
    if (best) best[0].split(',').forEach((v, j) => (clean[i + j] = +v));
    else clean[i + 3] = 0;
  }
  const pal = new Set();
  for (let i = 0; i < clean.length; i += 4) if (clean[i + 3] >= 128) pal.add('#' + [0, 1, 2].map((j) => clean[i + j].toString(16).padStart(2, '0')).join(''));
  if (pal.size > 48) problems.push(`sheet has ${pal.size} colours; pixel mode wants <= 48 (reduce the palette before rigging)`);
  return { parts: out.parts, palette: [...pal], problems, clean: { w: W, h: img.h, data: clean } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [png, json] = process.argv.slice(2);
  if (!png || !json) {
    console.error('usage: node sheet-markers.mjs <sheet.png> <sheet.json> [--out DIR]');
    process.exit(2);
  }
  const oi = process.argv.indexOf('--out');
  const outDir = resolve(oi > 0 ? process.argv[oi + 1] : dirname(resolve(png)));
  mkdirSync(outDir, { recursive: true });
  const img = decodePNG(readFileSync(png));
  const meta = JSON.parse(readFileSync(json, 'utf8'));
  const r = extractMarkers(img, meta);
  writeFileSync(join(outDir, 'sheet.clean.png'), encodePNG(r.clean.w, r.clean.h, r.clean.data));
  writeFileSync(join(outDir, 'parts.json'), JSON.stringify({ image: 'sheet.clean.png', source: png, palette: r.palette, parts: r.parts }, null, 1));
  for (const p of r.problems) console.log(`ERROR ${p}`);
  for (const [n, p] of Object.entries(r.parts)) console.log(`${n.padEnd(10)} rect=${JSON.stringify(p.rect)} pivot=${JSON.stringify(p.pivot)} tip=${JSON.stringify(p.tip)} len=${p.len}${p.face ? ' face=' + JSON.stringify(p.face) + ' -> rig.draw.face ' + JSON.stringify(p.faceAnchor) : ''}`);
  console.log(r.problems.length ? 'FAIL' : `OK -> ${outDir}/parts.json, sheet.clean.png`);
  process.exit(r.problems.length ? 1 : 0);
}
