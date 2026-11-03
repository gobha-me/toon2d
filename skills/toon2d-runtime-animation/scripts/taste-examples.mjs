#!/usr/bin/env node
// Original vector teaching sheets, not calibration data or grader references.
// Run from any directory: node taste-examples.mjs [output-directory]
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = resolve(process.argv[2] || fileURLToPath(new URL('../reference/taste-examples/', import.meta.url)));
mkdirSync(out, { recursive: true });
const axes = ['proportions', 'silhouette', 'line-weight', 'palette', 'shading', 'on-model', 'game-scale', 'appeal'];
const poses = [
  { y: 0, lean: -3, arms: [[-19, 49, -23, 61], [20, 48, 25, 42]], legs: [[-9, 76, -13, 91], [12, 76, 16, 91]] },
  { y: -3, lean: 10, arms: [[-20, 42, -9, 32], [20, 51, 30, 43]], legs: [[-19, 75, -29, 84], [18, 72, 7, 89]] },
  { y: -16, lean: -6, arms: [[-23, 35, -22, 24], [24, 34, 28, 22]], legs: [[-16, 73, -6, 85], [18, 70, 28, 79]] },
  { y: 9, lean: 8, arms: [[-24, 47, -32, 37], [22, 47, 32, 38]], legs: [[-21, 68, -24, 82], [21, 68, 26, 82]] },
];

function character(axis, adverse, frame) {
  const rigid = adverse && axis === 'appeal';
  const pose = rigid ? { ...poses[0], lean: 0, arms: [[-11, 49, -11, 62], [11, 49, 11, 62]], legs: [[-7, 77, -7, 91], [7, 77, 7, 91]] } : poses[frame];
  const blob = adverse && axis === 'silhouette';
  const silhouette = axis === 'silhouette';
  const muddy = adverse && axis === 'game-scale';
  const clash = adverse && axis === 'palette';
  const drift = adverse && axis === 'on-model';
  const broken = adverse && axis === 'line-weight';
  const skin = silhouette ? '#17252d' : muddy ? '#526677' : '#f4c796';
  const coat = silhouette ? '#17252d' : muddy ? '#536a7a' : clash ? '#fc16d6' : drift ? ['#dc8156', '#589ed0', '#dbcc52', '#dc8156'][frame] : '#dc8156';
  const shade = silhouette ? '#17252d' : muddy ? '#4e6376' : '#a65143';
  const ink = silhouette ? '#17252d' : muddy ? '#495e70' : clash ? '#6800b5' : '#23313e';
  const scarf = silhouette ? ink : muddy ? '#5b7182' : clash ? '#00ffff' : '#ecd790';
  const headScale = adverse && axis === 'proportions' ? [1, 1.55, 0.65, 1.25][frame] : 1;
  const line = broken ? [1, 5, 0, 3][frame] : 2;
  const limb = (start, middle, end, color, width = 8) => `<path d="M${start} L${middle} L${end}" fill="none" stroke="${ink}" stroke-width="${width + line * 2}"/><path d="M${start} L${middle} L${end}" fill="none" stroke="${color}" stroke-width="${width}"/>`;
  let parts = `<g transform="translate(48 ${pose.y}) rotate(${pose.lean} 0 58)" stroke-linejoin="round" stroke-linecap="round">`;
  const legs = blob ? [[-3, 76, -3, 91], [3, 76, 3, 91]] : pose.legs;
  for (let side = 0; side < 2; side++) {
    const [x, y, ex, ey] = legs[side];
    parts += limb(`${side ? 6 : -6},60`, `${x},${y}`, `${ex},${ey}`, silhouette ? ink : muddy ? ink : '#455a70');
    parts += `<path d="M${ex - 3} ${ey} h9" stroke="${ink}" stroke-width="7"/>`;
  }
  const arms = blob ? [[-6, 46, -4, 58], [6, 46, 4, 58]] : pose.arms;
  const arm = (side) => {
    const [x, y, ex, ey] = arms[side];
    return limb(`${side ? 9 : -9},37`, `${x},${y}`, `${ex},${ey}`, coat, 7) + `<circle cx="${ex}" cy="${ey}" r="4" fill="${skin}" stroke="${ink}" stroke-width="${line}"/>`;
  };
  parts += arm(0);
  parts += `<path d="M-11 34 Q0 30 11 34 L14 62 Q0 68 -14 62 Z" fill="${coat}" stroke="${ink}" stroke-width="${line}"/>`;
  const reverseLight = adverse && axis === 'shading' && frame % 2;
  parts += `<path d="${reverseLight ? 'M-11 36 L-2 39 L-1 63 L-12 61 Z' : 'M9 36 L2 42 L3 64 L12 61 Z'}" fill="${shade}"/>`;
  parts += `<path d="M-11 33 L10 34 L${rigid ? 10 : -22} ${rigid ? 49 : 29 + frame} L-8 27 Z" fill="${scarf}" stroke="${ink}" stroke-width="${line}"/>`;
  parts += arm(1);
  parts += `<g transform="translate(0 20) scale(${headScale})">`;
  parts += `<path d="M-12 -10 Q-16 0 -9 11 Q3 17 13 6 L14 -8 Z" fill="${skin}" stroke="${ink}" stroke-width="${line}"/>`;
  parts += `<path d="${reverseLight ? 'M-11 -6 Q-13 6 -5 11 L-1 3 Z' : 'M11 -6 L5 3 L4 12 Q12 9 13 5 Z'}" fill="${silhouette ? ink : muddy ? coat : '#cc916b'}"/>`;
  const hairTop = drift && frame === 2 ? -20 : -15;
  parts += `<path d="M-14 2 L-15 -10 L-7 ${hairTop} L3 -13 L11 -16 L16 -6 L10 -3 L4 -7 L-2 -2 L-8 -5 L-9 5 Z" fill="${ink}"/>`;
  if (!silhouette) {
    parts += `<path d="M0 0 h2 M9 -1 h2" stroke="${ink}" stroke-width="2"/>`;
    parts += `<path d="${rigid ? 'M4 8 h4' : 'M3 7 Q6 10 9 6'}" fill="none" stroke="${ink}" stroke-width="1.5"/>`;
  }
  parts += '</g>';
  if (!silhouette) parts += `<circle cx="0" cy="47" r="2.5" fill="${scarf}"/>`;
  if (broken) parts += `<path d="M-13 48 l5 2 M17 57 l4 -2" stroke="${ink}" stroke-width="5"/><circle cx="-20" cy="16" r="1" fill="${ink}"/>`;
  return parts + '</g>';
}

for (const axis of axes) {
  for (const adverse of [false, true]) {
    const name = `${axis}-${adverse ? 'adverse' : 'clear'}.svg`;
    const background = adverse && axis === 'palette' ? '#8c21dc' : adverse && axis === 'game-scale' ? '#536a7a' : '#e4edf0';
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="384" height="144" viewBox="0 0 384 144"><rect width="384" height="144" fill="${background}"/>`;
    for (let frame = 0; frame < 4; frame++) {
      svg += `<g transform="translate(${frame * 96} 24)">`;
      if (adverse && axis === 'game-scale') {
        for (let i = 0; i < 14; i++) svg += `<path d="M${i * 8 - 12} 0 l40 112" stroke="${i % 2 ? '#8d6f67' : '#364c60'}" stroke-width="4"/>`;
      }
      svg += `<ellipse cx="48" cy="101" rx="24" ry="3" fill="${background === '#e4edf0' ? '#beced3' : '#4e5b70'}"/>`;
      svg += character(axis, adverse, frame) + '</g>';
    }
    writeFileSync(resolve(out, name), svg + '</svg>\n');
  }
}
console.log('Wrote 16 original SVG teaching sheets.');
