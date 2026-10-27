// Minimal sidescroller body physics: one-way segment ground (flat + slopes),
// coyote time, charge-jump, spikes. Pure: stepBody returns a new body + events.
import { approach, clamp } from './mathx.js';

/** y of a segment at x, or null if x is outside its span. */
export function segmentYAt(seg, x) {
  const lo = Math.min(seg.x1, seg.x2);
  const hi = Math.max(seg.x1, seg.x2);
  if (x < lo || x > hi) return null;
  if (seg.x2 === seg.x1) return Math.min(seg.y1, seg.y2);
  const t = (x - seg.x1) / (seg.x2 - seg.x1);
  return seg.y1 + (seg.y2 - seg.y1) * t;
}

/** Highest surface at x whose y >= (y - tolerance). Returns { y, seg } or null. */
export function surfaceBelow(segments, x, y, tolerance = 0) {
  let best = null;
  for (const seg of segments) {
    const sy = segmentYAt(seg, x);
    if (sy === null || sy < y - tolerance) continue;
    if (!best || sy < best.y) best = { y: sy, seg };
  }
  return best;
}

/** Slope angle (radians, y-down) of the ground at x under feet y, 0 if none. */
export function groundAngleAt(segments, x, y, tolerance = 4) {
  const s = surfaceBelow(segments, x, y, tolerance);
  if (!s) return 0;
  return Math.atan2(s.seg.y2 - s.seg.y1, s.seg.x2 - s.seg.x1);
}

export const TUNING = {
  runSpeed: 230,
  groundAccel: 1900,
  airAccel: 1100,
  gravity: 1750,
  maxFall: 950,
  jumpMin: 560,
  jumpMax: 840,
  chargeFull: 0.55,
  coyote: 0.1,
  stepUp: 10,
  snapDown: 14,
  halfWidth: 9,
  height: 64,
  knockbackX: 240,
  knockbackY: 420,
  hurtTime: 0.45,
  invulnTime: 1.2,
};

export function createBody(x, y) {
  return {
    x, y, vx: 0, vy: 0, grounded: false, facing: 1,
    charging: false, charge: 0, chargeFullSent: false, coyote: 0, hurtTime: 0, invuln: 0,
  };
}

function overlapsRect(b, r, T) {
  return b.x + T.halfWidth > r.x && b.x - T.halfWidth < r.x + r.w && b.y > r.y && b.y - T.height < r.y + r.h;
}

/**
 * input = { x: -1..1, jumpHeld: bool, jumpPressed: bool }
 * level = { segments, spikes?, bounds:{minX,maxX}, killY }
 * Returns { body, events: [{ type, ... }] }. Event types:
 *   chargeStart, chargeFull, jump{power}, leftGround{drop}, apex{drop}, land{impact}, hurt, fellOut
 */
export function stepBody(body, input, dt, level, tuning = {}) {
  const T = { ...TUNING, ...tuning };
  const b = { ...body };
  const events = [];
  const segs = level.segments;
  const stunned = b.hurtTime > 0;
  b.hurtTime = Math.max(0, b.hurtTime - dt);
  b.invuln = Math.max(0, b.invuln - dt);
  const ix = stunned ? 0 : clamp(input.x || 0, -1, 1);

  // charge jump: hold to crouch & charge, release to jump (tap = small jump)
  if (!stunned && input.jumpPressed && (b.grounded || b.coyote > 0) && !b.charging) {
    b.charging = true;
    b.charge = 0;
    b.chargeFullSent = false;
    events.push({ type: 'chargeStart' });
  }
  if (b.charging) {
    b.charge = Math.min(1, b.charge + dt / T.chargeFull);
    if (b.charge >= 1 && !b.chargeFullSent) {
      b.chargeFullSent = true;
      events.push({ type: 'chargeFull' });
    }
    if (!input.jumpHeld || stunned) {
      const power = b.charge;
      b.vy = -(T.jumpMin + (T.jumpMax - T.jumpMin) * power);
      b.grounded = false;
      b.coyote = 0;
      b.charging = false;
      b.charge = 0;
      events.push({ type: 'jump', power });
    }
  }

  const targetVx = b.charging ? 0 : ix * T.runSpeed;
  if (!stunned) b.vx = approach(b.vx, targetVx, (b.grounded ? T.groundAccel : T.airAccel) * dt);
  if (ix !== 0 && !stunned) b.facing = ix > 0 ? 1 : -1;

  const prevVy = b.vy;
  if (!b.grounded) b.vy = Math.min(T.maxFall, b.vy + T.gravity * dt);
  else b.vy = 0;
  if (prevVy < 0 && b.vy >= 0 && !b.grounded) {
    const s = surfaceBelow(segs, b.x, b.y);
    events.push({ type: 'apex', drop: s ? s.y - b.y : Infinity });
  }

  // horizontal
  b.x = clamp(b.x + b.vx * dt, level.bounds.minX + T.halfWidth, level.bounds.maxX - T.halfWidth);

  // vertical
  if (b.grounded) {
    const s = surfaceBelow(segs, b.x, b.y, T.stepUp);
    if (s && s.y - b.y <= T.snapDown) {
      b.y = s.y;
    } else {
      b.grounded = false;
      b.coyote = b.charging ? 0 : T.coyote;
      b.charging = false;
      const below = surfaceBelow(segs, b.x, b.y);
      events.push({ type: 'leftGround', drop: below ? below.y - b.y : Infinity });
    }
  } else {
    b.coyote = Math.max(0, b.coyote - dt);
    const ny = b.y + b.vy * dt;
    const s = b.vy >= 0 ? surfaceBelow(segs, b.x, b.y, 1) : null;
    if (s && ny >= s.y) {
      events.push({ type: 'land', impact: b.vy });
      b.y = s.y;
      b.vy = 0;
      b.grounded = true;
      b.coyote = 0;
    } else {
      b.y = ny;
    }
  }

  for (const sp of level.spikes || []) {
    if (b.invuln <= 0 && overlapsRect(b, sp, T)) {
      b.hurtTime = T.hurtTime;
      b.invuln = T.invulnTime;
      b.vx = -b.facing * T.knockbackX;
      b.vy = -T.knockbackY;
      b.grounded = false;
      b.charging = false;
      events.push({ type: 'hurt' });
      break;
    }
  }

  if (level.killY !== undefined && b.y > level.killY) events.push({ type: 'fellOut' });
  return { body: b, events };
}
