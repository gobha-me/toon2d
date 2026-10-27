// Analytic two-bone IK (law of cosines). Pure.
import { clamp, wrapAngle } from './mathx.js';

/**
 * Solve a two-bone chain rooted at (ax, ay) reaching for (tx, ty).
 * Angles are world directions (atan2 convention, y down => clockwise positive).
 * bendSign = +1 bends the middle joint to the side reached by rotating the
 * root->target direction counter-clockwise (for a leg pointing down while the
 * character faces +x, +1 puts the knee forward). Use -1 for the other side.
 *
 * Returns { angle1, angle2, bend, joint:{x,y}, end:{x,y}, reached }.
 * When the target is out of reach the chain straightens toward it (or folds
 * as far as possible when too close) and `reached` is false.
 */
export function solveTwoBoneIK(ax, ay, tx, ty, l1, l2, bendSign = 1) {
  if (!(l1 > 0) || !(l2 > 0)) throw new Error('bone lengths must be positive');
  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.hypot(dx, dy);
  const maxReach = l1 + l2;
  const minReach = Math.abs(l1 - l2);
  const eps = 1e-9;
  const reached = dist <= maxReach + eps && dist >= minReach - eps;
  const d = clamp(dist, minReach + eps, maxReach - eps);
  const base = dist > eps ? Math.atan2(dy, dx) : Math.PI / 2;
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const a = Math.acos(clamp(cosA, -1, 1));
  const sign = bendSign >= 0 ? 1 : -1;
  const angle1 = base - sign * a;
  const jx = ax + Math.cos(angle1) * l1;
  const jy = ay + Math.sin(angle1) * l1;
  const ex = ax + Math.cos(base) * d;
  const ey = ay + Math.sin(base) * d;
  const angle2 = Math.atan2(ey - jy, ex - jx);
  return {
    angle1,
    angle2,
    bend: wrapAngle(angle2 - angle1),
    joint: { x: jx, y: jy },
    end: { x: ex, y: ey },
    reached,
  };
}

/**
 * Convert IK world directions into local bone rotations for bones whose
 * length runs along local +y (rest rot 0). parentWorldRot is the world rotation
 * of the upper bone's parent.
 */
export function ikToLocalRotations(ik, parentWorldRot) {
  const upperWorld = ik.angle1 - Math.PI / 2;
  return {
    upper: wrapAngle(upperWorld - parentWorldRot),
    lower: wrapAngle(ik.angle2 - ik.angle1),
  };
}
