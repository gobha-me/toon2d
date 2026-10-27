// Drives a build through the window.__toon contract (see reference/harness-contract.md).
// open(projectDir, query) -> { page, server, view, close }. record(page, segments) runs scripted input
// tick-by-tick INSIDE the page (one CDP round trip per segment) and returns per-tick states + sampled layers.
import { launch } from './cdp.mjs';
import { startServer } from './serve.mjs';
import { crop, fromB64 } from './img.mjs';

export async function open(projectDir, query = '') {
  const server = await startServer(projectDir);
  const page = await launch();
  const sep = query ? `&${query}` : '';
  const ok = await page.goto(`${server.url}index.html?harness=1${sep}`);
  if (!ok) {
    const errs = page.errors.join('\n');
    await page.close();
    server.close();
    throw new Error(`page never exposed window.__toon (contract missing or boot error)\n${errs}`);
  }
  await page.eval('window.__toon.manual && window.__toon.manual(true), true');
  const view = await page.eval('window.__toon.view()');
  return { page, server, view, close: async () => { await page.close(); server.close(); } };
}

const REC = `(seg) => {
  const T = window.__toon;
  const out = { states: [], frames: [] };
  T.setInput(seg.input || {});
  for (let i = 0; i < seg.ticks; i++) {
    if (seg.releaseJumpAt != null && i === seg.releaseJumpAt) T.setInput({ ...(seg.input || {}), jump: false });
    T.tick(1);
    const s = T.state();
    out.states.push({ tick: s.tick, state: s.state, facing: s.facing, grounded: s.grounded, root: s.root, feet: s.feet, face: s.face, blink: s.blink, joints: s.joints, events: s.events });
    if (seg.every && i % seg.every === 0) {
      const v = T.view();
      // follow box around the root (same as followBox below), cropped in-page to keep CDP traffic small
      const cx = Math.round((s.root.x - v.camX) * v.s);
      const cy = Math.round((s.root.y - v.camY) * v.s);
      const box = { x: cx - 36 * v.s, y: cy - 62 * v.s, w: 72 * v.s, h: 72 * v.s };
      out.frames.push({ i, layer: T.pixels(seg.layer || 'character', box), box, view: v, root: s.root, joints: s.joints, state: s.state });
    }
  }
  return out;
}`;

/** segments: [{ name, ticks, input:{left,right,jump}, every, layer, releaseJumpAt }] */
export async function record(page, segments) {
  const result = {};
  for (const seg of segments) {
    const r = await page.eval(`(${REC})(${JSON.stringify(seg)})`);
    r.frames = r.frames.map((f) => {
      let img = fromB64(f.layer);
      // builds that ignore the optional rect return the full layer: crop here instead
      if (img.w !== f.box.w || img.h !== f.box.h) img = crop(img, f.box.x, f.box.y, f.box.w, f.box.h);
      return { ...f, img, layer: undefined };
    });
    result[seg.name] = r;
  }
  return result;
}

/** Standard scenario used by score.mjs and capture.mjs. Ticks are 60 Hz. */
export const STANDARD = [
  { name: 'idle', ticks: 360, input: {}, every: 3 },
  { name: 'run', ticks: 150, input: { right: true }, every: 2 },
  { name: 'turn', ticks: 45, input: { left: true }, every: 1 },
  { name: 'stop', ticks: 50, input: {}, every: 2 },
  { name: 'jump', ticks: 75, input: { jump: true }, releaseJumpAt: 22, every: 2 },
  { name: 'runjump', ticks: 70, input: { right: true, jump: true }, releaseJumpAt: 18, every: 2 },
  { name: 'settle', ticks: 40, input: {}, every: 2 },
];

/** Crop box (buffer px) that follows the character root. Frames from record() are ALREADY this crop (f.box). */
export function followBox(view, root, halfW = 36, up = 62, down = 10) {
  const s = view.s;
  const cx = Math.round((root.x - view.camX) * s);
  const cy = Math.round((root.y - view.camY) * s);
  return { x: cx - halfW * s, y: cy - up * s, w: halfW * 2 * s, h: (up + down) * s };
}
