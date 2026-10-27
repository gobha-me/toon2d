// Expression director: turns gameplay state + events into expression weights.
// Pure & immutable. A "mood" is the sustained base layer chosen from state;
// "transients" are short reactions triggered by events that temporarily take
// over (with envelope fade-in/hold/fade-out) and then hand back to the mood.
import { clamp, damp } from './mathx.js';

/** Event name -> reaction. weight 0..1, times in seconds, optional line to say. */
export const REACTIONS = {
  hurt: { expr: 'hurt', weight: 1, fadeIn: 0.04, hold: 0.7, fadeOut: 0.4, line: 'Ouch!' },
  apexHigh: { expr: 'surprised', weight: 1, fadeIn: 0.06, hold: 0.5, fadeOut: 0.3, line: 'Whoa!' },
  landHard: { expr: 'hurt', weight: 0.5, fadeIn: 0.03, hold: 0.18, fadeOut: 0.3, line: 'Oof.' },
  gem: { expr: 'happy', weight: 1, fadeIn: 0.08, hold: 0.8, fadeOut: 0.5, line: 'Yay!' },
  chargeFull: { expr: 'determined', weight: 0.6, fadeIn: 0.05, hold: 0.3, fadeOut: 0.2, line: 'Here goes!' },
  bigJump: { expr: 'happy', weight: 0.6, fadeIn: 0.05, hold: 0.3, fadeOut: 0.3 },
  respawn: { expr: 'sad', weight: 1, fadeIn: 0.1, hold: 1.0, fadeOut: 0.6, line: 'Not again...' },
};

export function createDirector() {
  return { moodWeights: { neutral: 1 }, transients: [], pinned: null, runTime: 0, idleTime: 0 };
}

/**
 * Sustained mood from state. snap = { grounded, speed, charging, charge (0..1), vy, hurt }.
 * Returns target weights (sum <= 1 + neutral filler).
 */
export function moodFor(snap, runTime, idleTime) {
  if (snap.hurt) return { neutral: 1 };
  if (snap.charging) {
    const w = 0.55 + 0.45 * clamp(snap.charge ?? 0, 0, 1);
    return { determined: w, neutral: 1 - w };
  }
  if (!snap.grounded && snap.vy > 520) return { surprised: 0.55, neutral: 0.45 };
  if (snap.grounded && runTime > 0.35) return { happy: 0.8, neutral: 0.2 };
  if (snap.grounded && idleTime > 6) return { smug: 0.7, neutral: 0.3 };
  return { neutral: 1 };
}

/** Envelope weight of a transient at `age` seconds (0 once finished). */
export function envelope(t, age) {
  if (age < 0) return 0;
  if (age < t.fadeIn) return t.weight * (t.fadeIn > 0 ? age / t.fadeIn : 1);
  const a = age - t.fadeIn;
  if (a < t.hold) return t.weight;
  const b = a - t.hold;
  if (b < t.fadeOut) return t.weight * (1 - b / t.fadeOut);
  return 0;
}

function transientDone(t) {
  return t.age >= t.fadeIn + t.hold + t.fadeOut;
}

/**
 * Advance the director.
 * events: array of event names (keys of REACTIONS; unknown names ignored).
 * Returns { director, weights, lines } — lines are things to say (speech bubble + lip-flap).
 */
export function stepDirector(dir, snap, events, dt, reactions = REACTIONS) {
  const moving = snap.grounded && snap.speed > 30;
  const runTime = moving ? dir.runTime + dt : 0;
  const idleTime = snap.grounded && !moving && !snap.charging ? dir.idleTime + dt : 0;
  const target = moodFor(snap, runTime, idleTime);
  const moodWeights = {};
  for (const k of new Set([...Object.keys(dir.moodWeights), ...Object.keys(target)])) {
    const v = damp(dir.moodWeights[k] ?? 0, target[k] ?? 0, 6, dt);
    if (v > 1e-3) moodWeights[k] = v;
  }
  const lines = [];
  let transients = dir.transients.map((t) => ({ ...t, age: t.age + dt })).filter((t) => !transientDone(t));
  for (const e of events || []) {
    const r = reactions[e];
    if (!r) continue;
    transients = transients.filter((t) => t.event !== e); // re-trigger restarts, no stacking
    transients.push({ ...r, event: e, age: 0 });
    if (r.line) lines.push(r.line);
  }
  const director = { ...dir, moodWeights, transients, runTime, idleTime };
  return { director, weights: weightsOf(director), lines };
}

/** Final expression weights: pinned > transients over mood. */
export function weightsOf(dir) {
  if (dir.pinned) return { [dir.pinned]: 1 };
  const tw = {};
  let tsum = 0;
  for (const t of dir.transients) {
    const w = envelope(t, t.age);
    if (w <= 0) continue;
    tw[t.expr] = (tw[t.expr] ?? 0) + w;
    tsum += w;
  }
  const keep = 1 - clamp(tsum, 0, 1);
  const out = {};
  for (const [k, v] of Object.entries(dir.moodWeights)) out[k] = v * keep;
  for (const [k, v] of Object.entries(tw)) out[k] = (out[k] ?? 0) + v;
  return out;
}

export function pinExpression(dir, name) {
  return { ...dir, pinned: name || null };
}
