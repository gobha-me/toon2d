// Analytic two-bone IK (thigh/shin, upper/fore arm). Pure.
import { clamp } from './mathx.js';

/**
 * Solve root->mid->end with lengths l1, l2 so the end reaches target (tx, ty).
 * bend = +1 or -1 picks the elbow/knee side. Returns world angles a1 (first bone)
 * and a2 (second bone), the mid point, the reached end and `reach` (false when the
 * target was out of range and got clamped: that shows up as foot slip).
 */
export function solveTwoBone(rx, ry, tx, ty, l1, l2, bend = 1) {
  let dx = tx - rx;
  let dy = ty - ry;
  let d = Math.hypot(dx, dy);
  const maxD = (l1 + l2) * 0.9995;
  const minD = Math.abs(l1 - l2) + 1e-4;
  const reach = d <= maxD && d >= minD;
  if (d < 1e-6) {
    dx = 0;
    dy = 1;
    d = minD;
  }
  const dc = clamp(d, minD, maxD);
  const base = Math.atan2(dy, dx);
  const cosA = clamp((l1 * l1 + dc * dc - l2 * l2) / (2 * l1 * dc), -1, 1);
  const a1 = base - bend * Math.acos(cosA);
  const mx = rx + Math.cos(a1) * l1;
  const my = ry + Math.sin(a1) * l1;
  const ex = rx + (dx / d) * dc;
  const ey = ry + (dy / d) * dc;
  const a2 = Math.atan2(ey - my, ex - mx);
  return { a1, a2, mid: { x: mx, y: my }, end: { x: ex, y: ey }, reach };
}
