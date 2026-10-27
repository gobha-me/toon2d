// Secondary motion: damped scalar springs and verlet rope/hair chains. Pure.
import { clamp } from './mathx.js';

/**
 * Semi-implicit Euler damped spring toward target.
 * stiffness k (1/s^2), damping c (1/s). Sub-steps internally for stability.
 * Returns { x, v }.
 */
export function stepSpring(x, v, target, stiffness, damping, dt, maxStep = 1 / 120) {
  let px = x;
  let pv = v;
  let remaining = Math.max(0, dt);
  while (remaining > 1e-9) {
    const h = Math.min(maxStep, remaining);
    const a = -stiffness * (px - target) - damping * pv;
    pv += a * h;
    px += pv * h;
    remaining -= h;
  }
  return { x: px, v: pv };
}

/** Critically damped damping coefficient for a stiffness. */
export function criticalDamping(stiffness) {
  return 2 * Math.sqrt(Math.max(0, stiffness));
}

/** Create a chain of `count` points hanging from (x, y) along (dirX, dirY). */
export function createChain(count, segLen, x, y, dirX = 0, dirY = 1) {
  if (count < 2) throw new Error('chain needs at least 2 points');
  const len = Math.hypot(dirX, dirY) || 1;
  const ux = dirX / len;
  const uy = dirY / len;
  const points = [];
  for (let i = 0; i < count; i++) {
    const px = x + ux * segLen * i;
    const py = y + uy * segLen * i;
    points.push({ x: px, y: py, px, py });
  }
  return { points, segLen };
}

export const CHAIN_DEFAULTS = {
  gravity: { x: 0, y: 900 },
  damping: 0.9, // velocity kept per 1/60 s
  iterations: 4,
  stiffness: 0.2, // 0..1 pull toward rest direction per iteration
  restDir: { x: 0, y: 1 },
  maxStep: 1 / 120,
  bend: 0, // per-segment curl (radians) applied to the rest direction
};

/**
 * Advance a verlet chain whose first point is pinned to (anchorX, anchorY).
 * Returns a NEW chain (input untouched). Large dt is sub-stepped.
 */
export function stepChain(chain, anchorX, anchorY, dt, options = {}) {
  const o = { ...CHAIN_DEFAULTS, ...options };
  const pts = chain.points.map((p) => ({ ...p }));
  const n = pts.length;
  let remaining = Math.max(0, dt);
  const startX = pts[0].x;
  const startY = pts[0].y;
  let elapsed = 0;
  const total = remaining;
  while (remaining > 1e-9) {
    const h = Math.min(o.maxStep, remaining);
    remaining -= h;
    elapsed += h;
    const keep = Math.pow(clamp(o.damping, 0, 1), h * 60);
    // pinned root interpolates toward the new anchor across sub-steps
    const f = total > 0 ? elapsed / total : 1;
    pts[0].px = pts[0].x;
    pts[0].py = pts[0].y;
    pts[0].x = startX + (anchorX - startX) * f;
    pts[0].y = startY + (anchorY - startY) * f;
    for (let i = 1; i < n; i++) {
      const p = pts[i];
      const vx = (p.x - p.px) * keep;
      const vy = (p.y - p.py) * keep;
      p.px = p.x;
      p.py = p.y;
      p.x += vx + o.gravity.x * h * h;
      p.y += vy + o.gravity.y * h * h;
    }
    for (let it = 0; it < o.iterations; it++) {
      let dirAngle = Math.atan2(o.restDir.y, o.restDir.x);
      for (let i = 1; i < n; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        // shape memory: pull toward the rest direction from the parent
        dirAngle += o.bend;
        const rx = a.x + Math.cos(dirAngle) * chain.segLen;
        const ry = a.y + Math.sin(dirAngle) * chain.segLen;
        b.x += (rx - b.x) * o.stiffness;
        b.y += (ry - b.y) * o.stiffness;
        // distance constraint (parent is authoritative: root-pinned rope)
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1e-9;
        const k = chain.segLen / d;
        b.x = a.x + dx * k;
        b.y = a.y + dy * k;
      }
    }
  }
  return { points: pts, segLen: chain.segLen };
}

/** Teleport a chain (e.g. on respawn) so it does not whip across the screen. */
export function translateChain(chain, dx, dy) {
  return {
    segLen: chain.segLen,
    points: chain.points.map((p) => ({ x: p.x + dx, y: p.y + dy, px: p.px + dx, py: p.py + dy })),
  };
}
