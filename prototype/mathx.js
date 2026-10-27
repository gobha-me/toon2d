// Small pure math helpers shared by every logic module. No DOM, no globals.

export const TAU = Math.PI * 2;

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Inverse lerp: where v sits between a and b (unclamped). Returns 0 when a === b. */
export function invLerp(a, b, v) {
  return a === b ? 0 : (v - a) / (b - a);
}

/** Hermite smoothstep on t clamped to [0,1]. */
export function smoothstep(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

/**
 * Frame-rate independent exponential approach: moves `current` toward `target`
 * so that after 1/rate seconds ~63% of the gap is closed.
 */
export function damp(current, target, rate, dt) {
  if (rate <= 0 || dt <= 0) return current;
  return lerp(current, target, 1 - Math.exp(-rate * dt));
}

/** Linear move toward target by at most maxDelta (never overshoots). */
export function approach(current, target, maxDelta) {
  if (maxDelta <= 0) return current;
  if (current < target) return Math.min(current + maxDelta, target);
  return Math.max(current - maxDelta, target);
}

/** Wrap an angle into (-PI, PI]. */
export function wrapAngle(a) {
  let r = (a + Math.PI) % TAU;
  if (r < 0) r += TAU;
  return r === 0 ? Math.PI : r - Math.PI;
}

/** Interpolate angles along the shortest arc. */
export function lerpAngle(a, b, t) {
  return a + wrapAngle(b - a) * t;
}

/** Catmull-Rom spline value for p1..p2 segment at t in [0,1]. */
export function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

/** Deterministic seeded PRNG (mulberry32). Returns a function producing [0,1). */
export function mulberry32(seed) {
  let s = seed >>> 0;
  return function rng() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
