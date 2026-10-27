#!/usr/bin/env node
// Capture review evidence from any build that implements window.__toon:
//   node scripts/capture.mjs <projectDir> [--out shots] [--query "mode=pixel"] [--label after] [--zoom 3]
// Writes <out>/<label>/{idle,run,turn,jump,runjump,expressions}.gif, sheet-<seg>.png contact strips,
// expressions.png (one pinned frame per expression) and meta.json. Deterministic: seed 1, fixed ticks.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { STANDARD, followBox, open, record } from './lib/drive.mjs';
import { encodeGIF } from './lib/gif.mjs';
import { encodePNG } from './lib/png.mjs';
import { crop, fromB64, scaleNearest, sheet } from './lib/img.mjs';

export function parseArgs(argv) {
  const pos = [];
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) o[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    else pos.push(argv[i]);
  }
  return { pos, o };
}

const savePNG = (path, im) => writeFileSync(path, encodePNG(im.w, im.h, im.data));

/** Composite frames (buffer layer) cropped around the character, upscaled for viewing. */
export async function captureAll(projectDir, { out = 'shots', query = '', label = 'capture', zoom } = {}) {
  const dir = resolve(out, label);
  mkdirSync(dir, { recursive: true });
  const sess = await open(resolve(projectDir), query);
  const { page, view } = sess;
  const z = Number(zoom || (view.s >= 3 ? 1 : 3));
  try {
    await page.eval('window.__toon.reset({ seed: 1 })');
    const segs = STANDARD.map((s) => ({ ...s, layer: 'buffer', every: s.name === 'idle' ? 4 : 2 }));
    const rec = await record(page, segs);
    const meta = { query, view, segments: {} };
    for (const [name, r] of Object.entries(rec)) {
      if (name === 'settle' || name === 'stop') continue;
      const frames = r.frames.map((f) => {
        return scaleNearest(f.img, z);
      });
      if (!frames.length) continue;
      const step = name === 'idle' ? 4 : 2;
      writeFileSync(join(dir, `${name}.gif`), encodeGIF(frames, { delayMs: (1000 / 60) * step }));
      const pick = frames.filter((_, i) => i % Math.max(1, Math.floor(frames.length / 12)) === 0).slice(0, 12);
      savePNG(join(dir, `sheet-${name}.png`), sheet(pick, 12));
      meta.segments[name] = { frames: frames.length, states: [...new Set(r.states.map((s) => s.state))] };
    }
    // expressions: pin each, let it settle, grab a head crop
    const names = await page.eval('window.__toon.expressions()');
    const faces = [];
    const exprFrames = [];
    await page.eval('window.__toon.reset({ seed: 1 })');
    for (const n of names) {
      await page.eval(`window.__toon.setExpression(${JSON.stringify(n)}), window.__toon.tick(40)`);
      const st = await page.eval('window.__toon.state()');
      const v = await page.eval('window.__toon.view()');
      const img = fromB64(await page.eval('window.__toon.pixels("buffer")'));
      const b = followBox(v, st.root);
      const full = scaleNearest(crop(img, b.x, b.y, b.w, b.h), z);
      exprFrames.push(full);
      const head = st.joints.find((j) => j.name === 'head') || st.joints[0];
      const hx = Math.round((head.x - v.camX) * v.s);
      const hy = Math.round((head.y - v.camY) * v.s);
      faces.push(scaleNearest(crop(img, hx - 14 * v.s, hy - 22 * v.s, 28 * v.s, 26 * v.s), Math.max(1, Math.round((z * 2) / v.s))));
    }
    await page.eval('window.__toon.setExpression(null)');
    if (faces.length) {
      savePNG(join(dir, 'expressions.png'), sheet(faces, Math.min(8, faces.length), 4));
      writeFileSync(join(dir, 'expressions.gif'), encodeGIF(exprFrames, { delayMs: 600 }));
    }
    meta.expressions = names;
    meta.errors = page.errors;
    writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
    return { dir, meta };
  } finally {
    await sess.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { pos, o } = parseArgs(process.argv.slice(2));
  if (!pos[0]) {
    console.error('usage: node capture.mjs <projectDir> [--out shots] [--query "mode=pixel"] [--label name] [--zoom 3]');
    process.exit(2);
  }
  const r = await captureAll(pos[0], { out: o.out, query: o.query === true ? '' : o.query, label: o.label, zoom: o.zoom });
  console.log(`wrote ${r.dir}`);
  if (r.meta.errors.length) {
    console.error(r.meta.errors.join('\n'));
    process.exit(1);
  }
}
