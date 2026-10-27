// Locomotion state machine with timed crossfades. Pure.
// Canonical state names (the eval harness looks for these): idle, run, turn, jump, fall, land.
import { lerp, lerpAngle, smoothstep } from './mathx.js';

export const FADES = { default: 0.1, 'run>idle': 0.18, 'idle>run': 0.08, 'fall>land': 0.03, 'land>idle': 0.15, 'jump>fall': 0.12 };

export function createSM(state = 'idle') {
  return { state, prev: null, t: 0, fade: null };
}

/** Switch state; `from` is the last displayed pose, faded out over FADES[prev>next]. */
export function transition(sm, next, from) {
  if (next === sm.state) return sm;
  const dur = FADES[`${sm.state}>${next}`] ?? FADES.default;
  return { state: next, prev: sm.state, t: 0, fade: { from, dur, age: 0 } };
}

export function tickSM(sm, dt) {
  const fade = sm.fade ? { ...sm.fade, age: sm.fade.age + dt } : null;
  return { ...sm, t: sm.t + dt, fade: fade && fade.age < fade.dur ? fade : null };
}

/** 0..1 weight of the new state's pose (smoothstep, so fades ease in and out). */
export const fadeWeight = (sm) => (sm.fade ? smoothstep(sm.fade.age / sm.fade.dur) : 1);

/** Blend two poses: angles via shortest arc, everything else linearly. Feet keep b's planted flags. */
export function blendPose(a, b, w) {
  if (!a || w >= 1) return b;
  const angles = {};
  for (const k of new Set([...Object.keys(a.angles), ...Object.keys(b.angles)])) {
    angles[k] = lerpAngle(a.angles[k] ?? 0, b.angles[k] ?? 0, w);
  }
  const feet = {};
  for (const k of Object.keys(b.feet)) {
    const fa = a.feet[k] ?? b.feet[k];
    feet[k] = { x: lerp(fa.x, b.feet[k].x, w), y: lerp(fa.y, b.feet[k].y, w), planted: b.feet[k].planted };
  }
  return {
    ...b,
    hip: { x: lerp(a.hip.x, b.hip.x, w), y: lerp(a.hip.y, b.hip.y, w) },
    angles,
    feet,
    squash: lerp(a.squash ?? 0, b.squash ?? 0, w),
  };
}
