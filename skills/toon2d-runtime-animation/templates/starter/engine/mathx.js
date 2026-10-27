// Pure math helpers. No DOM. Safe to import from tests and Node tools.
export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;
export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (t) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};
/** Frame-rate independent exponential approach (use instead of lerp(c, t, 0.1)). */
export const damp = (c, t, rate, dt) => lerp(c, t, 1 - Math.exp(-rate * dt));
/** Wrap an angle to (-PI, PI]. Forgetting this gave a 60 px foot spike in a prior cutout prototype. */
export function wrapAngle(a) {
  let x = (a + Math.PI) % TAU;
  if (x < 0) x += TAU;
  return x - Math.PI;
}
export const lerpAngle = (a, b, t) => a + wrapAngle(b - a) * t;
/** Ease with anticipation/overshoot: back-out. */
export function easeOutBack(t, s = 1.70158) {
  const x = t - 1;
  return 1 + x * x * ((s + 1) * x + s);
}
/** Seeded PRNG (mulberry32). Never use Math.random in the sim: captures must be reproducible. */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Smooth 1D value noise in [-1, 1]; different seeds give unrelated curves. */
export function noise1(t, seed = 0) {
  const h = (i) => {
    const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
    return (x - Math.floor(x)) * 2 - 1;
  };
  const i = Math.floor(t);
  const f = t - i;
  return lerp(h(i), h(i + 1), f * f * (3 - 2 * f));
}
