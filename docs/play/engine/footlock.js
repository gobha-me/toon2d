// World-space foot locking: the #1 foot-skate fix. Pure.
// A pose PROPOSES where each foot should be (root-local) and whether it is planted.
// While planted, the foot stays at its locked WORLD position, so blends, held
// (on-2s) poses, turns and decelerations cannot slide it. If the proposal drifts
// further than `maxDrift` from the lock, the foot takes a quick lifted step instead of skating.

export function createFootLock() {
  return { lock: null, step: null };
}

/**
 * f = foot state, prop = { x, y, planted } in root-local, root = {x, y} world, facing +1/-1.
 * Returns { state, x, y, planted } with x/y back in root-local space.
 */
export function stepFoot(f, prop, root, facing, dt, opts = {}) {
  const { maxDrift = 5, stepTime = 0.1, lift = 3, groundY = null } = opts;
  const wx = root.x + prop.x * facing;
  const wy = prop.planted && groundY != null && f.step ? root.y + groundY : root.y + prop.y;
  const toLocal = (x, y) => ({ x: (x - root.x) * facing, y: y - root.y });
  if (f.step) {
    const t = Math.min(1, f.step.t + dt / stepTime);
    const x = f.step.x0 + (wx - f.step.x0) * t;
    const y = f.step.y0 + (wy - f.step.y0) * t - Math.sin(t * Math.PI) * lift;
    if (t >= 1) return { state: { lock: prop.planted ? { x: wx, y: wy } : null, step: null }, ...toLocal(wx, wy), planted: prop.planted };
    return { state: { lock: null, step: { ...f.step, t } }, ...toLocal(x, y), planted: false };
  }
  if (!prop.planted) return { state: { lock: null, step: null }, ...toLocal(wx, wy), planted: false };
  if (!f.lock) {
    // Never lock a foot in the air (a crossfade can propose 'planted' mid-swing): step it down first.
    if (groundY != null && Math.abs(wy - (root.y + groundY)) > 0.75) {
      return { state: { lock: null, step: { x0: wx, y0: wy, t: 0 } }, ...toLocal(wx, wy), planted: false };
    }
    return { state: { lock: { x: wx, y: wy }, step: null }, ...toLocal(wx, wy), planted: true };
  }
  if (Math.hypot(wx - f.lock.x, wy - f.lock.y) > maxDrift) {
    return { state: { lock: null, step: { x0: f.lock.x, y0: f.lock.y, t: 0 } }, ...toLocal(f.lock.x, f.lock.y), planted: false };
  }
  return { state: f, ...toLocal(f.lock.x, f.lock.y), planted: true };
}
