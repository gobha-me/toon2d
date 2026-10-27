// Tiny platformer body: fixed 60 Hz ticks, coyote time, jump buffer, variable jump,
// and a short take-off crouch (anticipation) before the jump impulse. Pure.
export const PHYS = {
  accel: 900, airAccel: 520, maxSpeed: 80, friction: 1100, gravity: 900,
  jumpV: 300, cut: 0.5, coyote: 6, buffer: 8,
  // Take-off crouch: longer at walk/stand (~6 ticks) so anticipation reads; shorter at full
  // run (~4 ticks) so a sprint-jump stays snappy. Jump buffer still clears on arm so presses
  // feel responsive.
  squatWalk: 6, squatRun: 4,
};

export function createBody(x, y) {
  return {
    x, y, vx: 0, vy: 0, grounded: true, coyote: 0, buffer: 0, jumpHeld: false,
    squat: 0, squatMax: 0, pendingJump: false,
  };
}

function launchJump(b, input, events) {
  // Variable height: tap (button up at impulse) gets the short hop; hold gets full jumpV.
  // Sync jumpHeld here so the mid-air cut below does not also fire on this same tick (would stack to ~0.25×).
  const held = !!input.jump;
  b.vy = -PHYS.jumpV * (held ? 1 : PHYS.cut);
  b.grounded = false;
  b.coyote = 0;
  b.pendingJump = false;
  b.squat = 0;
  b.squatMax = 0;
  b.jumpHeld = held;
  events.push('jump');
}

/** level = { floorY, platforms:[{x0,x1,y}] } one-way tops. input = {left,right,jump}. Returns {body, events}. */
export function stepBody(b0, input, dt, level) {
  const b = { ...b0 };
  const events = [];
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const acc = b.grounded ? PHYS.accel : PHYS.airAccel;
  if (dir) b.vx = Math.max(-PHYS.maxSpeed, Math.min(PHYS.maxSpeed, b.vx + dir * acc * dt));
  else if (b.grounded) b.vx = Math.abs(b.vx) <= PHYS.friction * dt ? 0 : b.vx - Math.sign(b.vx) * PHYS.friction * dt;

  b.buffer = input.jump && !b.jumpHeld ? PHYS.buffer : Math.max(0, b.buffer - 1);
  b.coyote = b.grounded ? PHYS.coyote : Math.max(0, b.coyote - 1);

  let armedThisTick = false;
  // Coyote arms without requiring grounded (M1). Grounded → take-off crouch; air coyote → launch now.
  if (b.buffer > 0 && b.coyote > 0 && b.squat <= 0 && !b.pendingJump) {
    b.buffer = 0;
    if (b.grounded) {
      const speed01 = Math.min(1, Math.abs(b.vx) / PHYS.maxSpeed);
      const ticks = PHYS.squatWalk - Math.round((PHYS.squatWalk - PHYS.squatRun) * speed01);
      b.squat = ticks;
      b.squatMax = ticks;
      b.pendingJump = true;
      armedThisTick = true;
      events.push('crouch');
    } else {
      launchJump(b, input, events);
    }
  }

  // Countdown on subsequent ticks only so squatWalk/squatRun mean that many visible crouch frames.
  if (b.pendingJump && b.squat > 0 && !armedThisTick) {
    b.squat -= 1;
    if (b.squat <= 0) launchJump(b, input, events);
  }

  // Mid-air variable jump: release while rising cuts residual upward speed.
  if (!input.jump && b.jumpHeld && b.vy < 0) b.vy *= PHYS.cut;
  b.jumpHeld = !!input.jump;
  b.vy += PHYS.gravity * dt;
  const prevY = b.y;
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  b.x = Math.max(level.minX ?? -Infinity, Math.min(level.maxX ?? Infinity, b.x));
  const wasGrounded = b.grounded;
  b.grounded = false;
  const tops = [{ x0: -Infinity, x1: Infinity, y: level.floorY }, ...(level.platforms || [])];
  for (const p of tops) {
    if (b.x >= p.x0 && b.x <= p.x1 && b.vy >= 0 && prevY <= p.y + 0.01 && b.y >= p.y) {
      if (!wasGrounded) events.push({ type: 'land', vy: b.vy });
      b.y = p.y;
      b.vy = 0;
      b.grounded = true;
    }
  }
  if (wasGrounded && !b.grounded && b.vy >= 0) events.push('walkoff');
  // Walk-off during squat: launch (keep the buffered jump) instead of cancelling (M1).
  if (!b.grounded && b.pendingJump && b.squat > 0) launchJump(b, input, events);
  return { body: b, events };
}
