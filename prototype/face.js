// Parameter-driven anime face: parameter schema, expression presets, weighted
// mixing, per-parameter smoothing, and procedural layers (blink, look-at,
// lip-flap). Pure: no DOM, no rendering. The renderer only ever reads a flat
// { paramName: number } object, so the drawing backend (vector shapes, PNG
// part swaps, Live2D-style mesh deforms) can change without touching this.
import { clamp, damp, lerp, smoothstep } from './mathx.js';

/**
 * Parameter schema. `rate` = how fast the parameter chases its target (1/s,
 * used by approachParams). Fast for eyes/brows (snappy anime acting), slow for
 * blush/tears (they bloom and fade).
 * L = the eye/brow on screen-left when the character faces right (far side in
 * our 3/4 view); R = screen-right (near side). Flipping the character mirrors
 * the whole head, so L/R stay attached to the same drawn feature.
 */
export const FACE_PARAMS = [
  { name: 'eyeOpenL', min: 0, max: 1.3, def: 1, rate: 14 },
  { name: 'eyeOpenR', min: 0, max: 1.3, def: 1, rate: 14 },
  { name: 'eyeSmileL', min: 0, max: 1, def: 0, rate: 10 },
  { name: 'eyeSmileR', min: 0, max: 1, def: 0, rate: 10 },
  { name: 'eyeShut', min: 0, max: 1, def: 0, rate: 16 },
  { name: 'pupilX', min: -1, max: 1, def: 0, rate: 18 },
  { name: 'pupilY', min: -1, max: 1, def: 0, rate: 18 },
  { name: 'pupilSize', min: 0.4, max: 1.4, def: 1, rate: 10 },
  { name: 'browAngleL', min: -1, max: 1, def: 0, rate: 12 },
  { name: 'browAngleR', min: -1, max: 1, def: 0, rate: 12 },
  { name: 'browHeight', min: -1, max: 1, def: 0, rate: 12 },
  { name: 'mouthOpen', min: 0, max: 1, def: 0, rate: 16 },
  { name: 'mouthCurve', min: -1, max: 1, def: 0.25, rate: 10 },
  { name: 'mouthWidth', min: 0.3, max: 1.6, def: 1, rate: 10 },
  { name: 'mouthSmirk', min: -1, max: 1, def: 0, rate: 8 },
  { name: 'blush', min: 0, max: 1, def: 0, rate: 2.5 },
  { name: 'sweat', min: 0, max: 1, def: 0, rate: 4 },
  { name: 'angerMark', min: 0, max: 1, def: 0, rate: 6 },
  { name: 'tears', min: 0, max: 1, def: 0, rate: 3 },
  { name: 'gloom', min: 0, max: 1, def: 0, rate: 3 },
  { name: 'sparkle', min: 0, max: 1, def: 0, rate: 6 },
  { name: 'headTilt', min: -1, max: 1, def: 0, rate: 6 },
];

export const PARAM_BY_NAME = Object.fromEntries(FACE_PARAMS.map((p) => [p.name, p]));
export const PARAM_NAMES = FACE_PARAMS.map((p) => p.name);

export function neutralParams() {
  return Object.fromEntries(FACE_PARAMS.map((p) => [p.name, p.def]));
}

export function clampParams(params) {
  const out = {};
  for (const p of FACE_PARAMS) {
    const v = params[p.name];
    out[p.name] = clamp(Number.isFinite(v) ? v : p.def, p.min, p.max);
  }
  return out;
}

/**
 * Expression presets: SPARSE absolute values. Anything not listed = neutral.
 * Mixing works on deltas from neutral, so presets compose (angry + surprised
 * = shocked rage) instead of averaging back toward a mush.
 */
export const EXPRESSIONS = {
  neutral: {},
  happy: {
    eyeSmileL: 0.85, eyeSmileR: 0.85, browHeight: 0.35, browAngleL: -0.15, browAngleR: -0.15,
    mouthOpen: 0.55, mouthCurve: 1, mouthWidth: 1.15, blush: 0.55, headTilt: 0.25,
  },
  angry: {
    browAngleL: 0.9, browAngleR: 0.9, browHeight: -0.5, eyeOpenL: 0.75, eyeOpenR: 0.75,
    mouthCurve: -0.7, mouthOpen: 0.25, mouthWidth: 0.9, angerMark: 1, pupilSize: 0.8,
  },
  sad: {
    browAngleL: -0.85, browAngleR: -0.85, browHeight: 0.2, eyeOpenL: 0.7, eyeOpenR: 0.7, pupilY: 0.3,
    mouthCurve: -0.8, mouthOpen: 0.05, mouthWidth: 0.7, tears: 0.7, gloom: 0.8, headTilt: -0.3,
  },
  surprised: {
    eyeOpenL: 1.25, eyeOpenR: 1.25, pupilSize: 0.55, browHeight: 1, browAngleL: -0.2, browAngleR: -0.2,
    mouthOpen: 0.85, mouthWidth: 0.5, mouthCurve: 0, sweat: 0.7,
  },
  smug: {
    eyeOpenL: 0.55, eyeOpenR: 0.62, eyeSmileL: 0.25, eyeSmileR: 0.25, browAngleL: -0.35, browAngleR: 0.4,
    browHeight: 0.1, mouthCurve: 0.6, mouthSmirk: 0.9, mouthWidth: 0.9, blush: 0.2, headTilt: 0.4,
  },
  hurt: {
    eyeShut: 1, browAngleL: -0.7, browAngleR: -0.7, browHeight: -0.2, mouthOpen: 0.5, mouthCurve: -0.6,
    mouthWidth: 1.2, sweat: 1, tears: 0.4,
  },
  determined: {
    browAngleL: 0.55, browAngleR: 0.55, browHeight: -0.25, eyeOpenL: 0.92, eyeOpenR: 0.92, pupilSize: 0.9,
    mouthOpen: 0.15, mouthCurve: 0.3, mouthWidth: 1.1, sparkle: 1,
  },
};

export const EXPRESSION_NAMES = Object.keys(EXPRESSIONS);

/**
 * Weighted mix: result = neutral + sum(w_i * (preset_i - neutral)).
 * If the weights sum to more than 1 they are normalised (so the result stays a
 * convex combination and never exaggerates past the strongest preset).
 * `neutral` is a legal key: it adds weight without deltas (dilutes the rest).
 * Unknown expression names are ignored. Result is clamped to param ranges.
 */
export function mixExpressions(weights, presets = EXPRESSIONS) {
  const base = neutralParams();
  let total = 0;
  for (const [name, w] of Object.entries(weights || {})) if (presets[name] && w > 0) total += w;
  const scale = total > 1 ? 1 / total : 1;
  const out = { ...base };
  for (const [name, w] of Object.entries(weights || {})) {
    const preset = presets[name];
    if (!preset || !(w > 0)) continue;
    for (const [param, value] of Object.entries(preset)) {
      if (!(param in base)) continue;
      out[param] += (value - base[param]) * w * scale;
    }
  }
  return clampParams(out);
}

/** Chase target params with per-parameter rates. speed scales every rate. */
export function approachParams(current, target, dt, speed = 1) {
  const out = {};
  for (const p of FACE_PARAMS) {
    const c = current[p.name] ?? p.def;
    const t = target[p.name] ?? p.def;
    out[p.name] = damp(c, t, p.rate * speed, dt);
  }
  return out;
}

// ---------------------------------------------------------------- blinking

export const BLINK_DEFAULTS = { minInterval: 1.6, maxInterval: 4.8, duration: 0.16, doubleChance: 0.2 };

/** Closedness 0..1 over a blink's normalised time u in [0,1]: fast close, slower open. */
export function blinkCurve(u) {
  if (u <= 0 || u >= 1) return 0;
  return u < 0.4 ? smoothstep(u / 0.4) : 1 - smoothstep((u - 0.4) / 0.6);
}

export function createBlink(firstDelay = 1) {
  return { wait: firstDelay, phase: -1, pendingDouble: false };
}

/**
 * Advance the blink scheduler. rng() -> [0,1). Returns { state, closed }.
 * opts.suppress (0..1) scales blink probability down (e.g. while surprised).
 */
export function stepBlink(state, dt, rng, opts = {}) {
  const o = { ...BLINK_DEFAULTS, ...opts };
  const s = { ...state };
  if (s.phase >= 0) {
    s.phase += dt / o.duration;
    if (s.phase >= 1) {
      s.phase = -1;
      if (s.pendingDouble) {
        s.pendingDouble = false;
        s.wait = 0.08;
      } else {
        s.wait = lerp(o.minInterval, o.maxInterval, rng());
      }
    }
  } else {
    s.wait -= dt;
    if (s.wait <= 0) {
      const suppress = clamp(o.suppress ?? 0, 0, 1);
      if (rng() < suppress) {
        s.wait = lerp(o.minInterval, o.maxInterval, rng()) * 0.5;
      } else {
        s.phase = 0;
        s.pendingDouble = s.pendingDouble || rng() < o.doubleChance;
      }
    }
  }
  return { state: s, closed: s.phase >= 0 ? blinkCurve(s.phase) : 0 };
}

// ---------------------------------------------------------------- look-at

/**
 * Pupil offset + head turn toward a target. facing = +1/-1 (character's
 * horizontal facing; the head is mirrored when facing -1, so x is mirrored too).
 * Pupils saturate smoothly with distance instead of clamping hard.
 */
export function lookAt(fromX, fromY, toX, toY, facing = 1, opts = {}) {
  const range = opts.range ?? 140;
  const maxHead = opts.maxHead ?? 0.2;
  const dx = (toX - fromX) * (facing < 0 ? -1 : 1);
  const dy = toY - fromY;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-6) return { pupilX: 0, pupilY: 0, headTurn: 0 };
  const g = dist / (dist + range * 0.5);
  return {
    pupilX: clamp((dx / dist) * g, -1, 1),
    pupilY: clamp((dy / dist) * g * 0.8, -1, 1),
    // tilt the head a little toward targets in front; looking back just uses the eyes
    headTurn: clamp(Math.atan2(dy, Math.max(Math.abs(dx), 1)) * 0.35 * (dx >= 0 ? 1 : 0.3), -maxHead, maxHead),
  };
}

// ---------------------------------------------------------------- lip flap

const VISEMES = {
  rest: { open: 0, width: 1 },
  A: { open: 0.9, width: 0.95 },
  E: { open: 0.45, width: 1.25 },
  O: { open: 0.75, width: 0.55 },
  U: { open: 0.4, width: 0.45 },
  MBP: { open: 0, width: 0.9 },
  FV: { open: 0.15, width: 1.05 },
  C: { open: 0.3, width: 1 },
};

/** Map a character to a coarse viseme (Japanese-style A/I/U/E/O flaps + closers). */
export function visemeForChar(ch) {
  const c = (ch || ' ').toLowerCase();
  if ('ah'.includes(c)) return VISEMES.A;
  if ('eiy'.includes(c)) return VISEMES.E;
  if (c === 'o') return VISEMES.O;
  if ('uwq'.includes(c)) return VISEMES.U;
  if ('mbp'.includes(c)) return VISEMES.MBP;
  if ('fv'.includes(c)) return VISEMES.FV;
  if (/[a-z0-9]/.test(c)) return VISEMES.C;
  return VISEMES.rest;
}

/**
 * Lip-flap for a line of text at time t (seconds) at `cps` chars/second.
 * Returns { mouthOpen, mouthWidth, shown, done } where `shown` is how many
 * characters a typewriter speech bubble should display.
 */
export function lipFlap(text, t, cps = 14) {
  const len = text.length;
  const pos = Math.max(0, t) * cps;
  if (len === 0 || pos >= len) return { mouthOpen: 0, mouthWidth: 1, shown: len, done: true };
  const i = Math.floor(pos);
  const a = visemeForChar(text[i]);
  const b = visemeForChar(text[i + 1]);
  const u = smoothstep(pos - i);
  return { mouthOpen: lerp(a.open, b.open, u), mouthWidth: lerp(a.width, b.width, u), shown: i + 1, done: false };
}

// ---------------------------------------------------------------- composition

/**
 * Layer procedural channels on top of a (smoothed) expression result.
 * Order matters and is part of the contract:
 *   1. look-at   adds to pupils (expression offsets like sad-looks-down survive)
 *   2. lip-flap  overrides mouth open/width by its weight
 *   3. blink     multiplies eye openness (skipped when eyes are squeezed shut)
 *   4. overrides hard-set any params (debug sliders, cutscenes)
 *   5. clamp
 * layers = { look:{pupilX,pupilY,weight}, viseme:{mouthOpen,mouthWidth,weight},
 *            blink: 0..1, overrides: {param:value} }
 */
export function composeFace(base, layers = {}) {
  const p = { ...neutralParams(), ...base };
  const look = layers.look;
  if (look && look.weight > 0) {
    p.pupilX += (look.pupilX ?? 0) * look.weight;
    p.pupilY += (look.pupilY ?? 0) * look.weight;
  }
  const v = layers.viseme;
  if (v && v.weight > 0) {
    const w = clamp(v.weight, 0, 1);
    p.mouthOpen = lerp(p.mouthOpen, Math.max(p.mouthOpen * 0.4, v.mouthOpen), w);
    p.mouthWidth = lerp(p.mouthWidth, p.mouthWidth * v.mouthWidth, w);
  }
  const blink = clamp(layers.blink ?? 0, 0, 1);
  if (blink > 0 && p.eyeShut < 0.5) {
    p.eyeOpenL *= 1 - blink;
    p.eyeOpenR *= 1 - blink;
  }
  for (const [k, val] of Object.entries(layers.overrides || {})) {
    if (k in PARAM_BY_NAME && Number.isFinite(val)) p[k] = val;
  }
  return clampParams(p);
}
