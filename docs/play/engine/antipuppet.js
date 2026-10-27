// Anti-puppet layers. Each one hides one "puppet tell". All pure and individually toggleable
// via flags so on/off captures can prove they matter. See subskills/toon2d-anti-puppet.
import { DEG, noise1, clamp } from './mathx.js';
import { stepSpring, spring } from './springs.js';

export const AP_FLAGS = ['idle', 'breath', 'overlap', 'asym', 'turn', 'caps', 'hold', 'feetswap'];

/** Idle: contrapposto + per-bone value noise at unrelated rates (nothing moves in sync). */
export function idleLayer(t, seed = 1) {
  return {
    hipX: 0.6 * noise1(t * 0.35, seed),
    spine: 2.5 * DEG * noise1(t * 0.5, seed + 1),
    head: 4 * DEG * noise1(t * 0.42, seed + 2),
    armUF: 5 * DEG * noise1(t * 0.6, seed + 3),
    armUB: 4 * DEG * noise1(t * 0.55, seed + 4),
    armLF: 6 * DEG * noise1(t * 0.7, seed + 5),
    armLB: 5 * DEG * noise1(t * 0.66, seed + 6),
  };
}

/** Breathing: chest rise + shoulder lift, faster with exertion (0..1). Returns {phase, hipY, chest}. */
export function stepBreath(phase, exertion, dt) {
  const rate = 1.4 + 1.6 * clamp(exertion, 0, 1);
  const p = phase + dt * rate * Math.PI * 2;
  return { phase: p, hipY: -0.5 * Math.sin(p), chest: 0.5 + 0.5 * Math.sin(p) };
}

/** Overlap: head and arms lag behind root acceleration (springs kicked by facing-relative dv). */
export function createOverlap() {
  return { head: spring(), arms: spring(), spine: spring() };
}
export function stepOverlap(o, accelX, accelY, dt, amount = 1) {
  const head = stepSpring(o.head, -accelX * 0.0009 * amount + accelY * 0.0004 * amount, dt, 160, 12);
  const arms = stepSpring(o.arms, accelX * 0.0016 * amount - accelY * 0.001 * amount, dt, 90, 9);
  const spine = stepSpring(o.spine, -accelX * 0.0005 * amount, dt, 140, 14);
  return { head, arms, spine };
}

/** Head-first turn: kick jumps to 1 on a facing flip and decays; renderer narrows the body and yaws the face. */
export function stepTurnKick(kick, flipped, dt, rate = 7) {
  const k = flipped ? 1 : kick * Math.exp(-rate * dt);
  return k < 1e-3 ? 0 : k;
}

/** Face yaw for parallax: -1 toward camera, +1 toward profile. */
export function faceYaw(speed01, turnKick) {
  return clamp(-0.2 + 0.5 * speed01 - 1.2 * turnKick, -1, 1);
}

/** Step-hold: show a new body pose only every 1/fps s (anime "on 2s"). IK + root stay per-tick. */
export function stepHold(acc, dt, fps) {
  if (!fps) return { acc: 0, tick: true };
  const step = 1 / fps;
  const a = acc + dt;
  return a + 1e-9 >= step ? { acc: a - step > step ? 0 : a - step, tick: true } : { acc: a, tick: false };
}

/** Hand shape swap by state (fist running, open in air/hurt, relaxed idle). */
export function handShape(state) {
  if (state === 'run') return 'fist';
  if (state === 'jump' || state === 'fall' || state === 'hurt') return 'open';
  return 'relaxed';
}
