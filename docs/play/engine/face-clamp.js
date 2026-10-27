// Clamp face-feature offsets to the drawn head/skin ellipse so yaw and look
// cannot slide eyes/mouth onto the hair or off the back of the head.
// Face-local units match face-pixel / face-vector (+x toward facing, +y down).

/** Soft skin ellipse (inside the hair mass). Slightly smaller than the drawn head. */
export const HEAD_RX = 3.4;
export const HEAD_RY = 4.9;

/** Clamp a face-local (fx, fy) to the head ellipse. */
export function clampToHead(fx, fy, rx = HEAD_RX, ry = HEAD_RY) {
  const nx = fx / rx;
  const ny = fy / ry;
  const d2 = nx * nx + ny * ny;
  if (d2 <= 1 || d2 === 0) return { fx, fy };
  const s = 1 / Math.sqrt(d2);
  return { fx: fx * s, fy: fy * s };
}

/**
 * Effective yaw used for feature parallax. Caps magnitude so a full turn kick
 * cannot shove features past the skin box; peak turns hide the far eye instead.
 */
export function clampedYaw(yaw) {
  const y = Number.isFinite(yaw) ? yaw : 0;
  // Soft cap: original faceYaw ranged ~[-1,1]; keep readable parallax under ±0.55.
  return Math.max(-0.50, Math.min(0.50, y));
}

/** True when the turn is strong enough that only the near eye should draw. */
export function peakTurn(yaw) {
  return Math.abs(yaw) > 0.45;
}
