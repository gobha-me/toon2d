// @dom
// The eval/capture contract. Every build made from this skill exposes window.__toon with this API
// so scripts/capture.mjs and scripts/score.mjs can drive it deterministically (no rAF, no wall clock).
// Keep the method names and return shapes; add fields freely.
import { stepCharacter, setPinned, worldFeet, worldJoints } from './character.js';
import { renderFrame } from './render.js';

const b64 = (u8) => {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
};

/** game = { ch, r, level, input, opts, make(seed, flags) -> fresh ch, dt } */
export function installHarness(game) {
  const api = {
    version: 1,
    dt: game.dt,
    manual: (v = true) => {
      game.manual = v;
      return v;
    },
    reset: ({ seed = 1, flags, x } = {}) => {
      game.ch = game.make(seed, { ...game.ch.flags, ...(flags || {}) }, x);
      game.input = { left: false, right: false, jump: false };
      game.pending = [];
      renderFrame(game.r, game.ch, game.level, game.opts);
      return api.state();
    },
    setInput: (inp) => {
      game.input = { left: !!inp.left, right: !!inp.right, jump: !!inp.jump };
    },
    trigger: (ev) => game.pending.push(ev),
    tick: (n = 1) => {
      for (let i = 0; i < n; i++) {
        stepCharacter(game.ch, game.input, game.dt, game.level, game.pending);
        game.pending = [];
      }
      renderFrame(game.r, game.ch, game.level, game.opts);
      return game.ch.tick;
    },
    setFlags: (f) => Object.assign(game.ch.flags, f),
    setExpression: (name) => setPinned(game.ch, name || null),
    expressions: () => Object.keys(game.ch.presets || {}),
    lookAt: (x, y) => {
      game.ch.lookTarget = x == null ? null : { x, y };
    },
    view: () => ({ mode: game.r.mode, W: game.r.W, H: game.r.H, s: game.r.s, k: game.r.k, camX: game.r.cam.x, camY: game.r.cam.y, canvas: '#game' }),
    state: () => {
      const ch = game.ch;
      return {
        tick: ch.tick,
        state: ch.sm.state,
        facing: ch.facing,
        grounded: ch.body.grounded,
        root: { x: ch.body.x, y: ch.body.y, vx: ch.body.vx, vy: ch.body.vy },
        feet: worldFeet(ch),
        joints: worldJoints(ch),
        face: { ...ch.face.params },
        blink: ch.face.closed,
        pinned: ch.face.dir.pinned,
        flags: { ...ch.flags },
        events: [...ch.events],
      };
    },
    /**
     * layer: 'buffer' (low-res composite), 'character' (character only, transparent bg), 'display' (upscaled).
     * rect (optional) = {x, y, w, h} in that layer's pixels; out-of-bounds reads come back transparent.
     */
    pixels: (layer = 'buffer', rect = null) => {
      const c = layer === 'character' ? game.r.chr : layer === 'display' ? game.r.display : game.r.buf;
      const R = rect || { x: 0, y: 0, w: c.width, h: c.height };
      const d = c.getContext('2d').getImageData(R.x, R.y, R.w, R.h).data;
      return { w: R.w, h: R.h, x: R.x, y: R.y, data: b64(new Uint8Array(d.buffer)) };
    },
  };
  window.__toon = api;
  return api;
}
