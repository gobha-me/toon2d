// Secondary motion: damped springs (overlap/follow-through) and a verlet chain (hair, scarf, coat tails). Pure.

/** Semi-implicit damped spring toward target. k = stiffness (1/s^2), c = damping (1/s). */
export function stepSpring(s, target, dt, k = 120, c = 14) {
  const v = s.v + (k * (target - s.x) - c * s.v) * dt;
  return { x: s.x + v * dt, v };
}
export const spring = (x = 0) => ({ x, v: 0 });

/** Verlet rope: n points, segment length seg. */
export function createChain(n, x, y, seg) {
  return { seg, pts: Array.from({ length: n }, (_, i) => ({ x, y: y + i * seg, px: x, py: y + i * seg })) };
}

/**
 * Advance the chain. Point 0 is pinned to (ax, ay). gravity and wind in units/s^2.
 * stiffness 0..1 pulls each segment toward the rest direction `restAngle` (keeps a scarf from hanging dead).
 * Returns a new chain (immutable so it can be held on 2s).
 */
export function stepChain(chain, ax, ay, dt, opts = {}) {
  const { gravity = 300, wind = 0, damping = 0.9, iters = 4, restAngle = Math.PI / 2, stiffness = 0.15 } = opts;
  const pts = chain.pts.map((p) => ({ ...p }));
  pts[0].x = ax;
  pts[0].y = ay;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    const vx = (p.x - p.px) * damping;
    const vy = (p.y - p.py) * damping;
    p.px = p.x;
    p.py = p.y;
    p.x += vx + wind * dt * dt;
    p.y += vy + gravity * dt * dt;
  }
  for (let k = 0; k < iters; k++) {
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const tx = a.x + Math.cos(restAngle) * chain.seg;
      const ty = a.y + Math.sin(restAngle) * chain.seg;
      b.x += (tx - b.x) * stiffness;
      b.y += (ty - b.y) * stiffness;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1e-6;
      const f = (d - chain.seg) / d;
      b.x -= dx * f;
      b.y -= dy * f;
    }
  }
  return { seg: chain.seg, pts };
}
