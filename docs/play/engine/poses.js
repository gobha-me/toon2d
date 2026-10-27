// Pose generators: one function per locomotion state. Pure.
// A pose = { hip:{x,y}, angles:{bone: rad offset from rest}, feet:{F,B:{x,y,planted}}, squash }
// in root-local space (x = facing direction, y down, root = ground under the body).
// F = near (front, drawn over the torso), B = far (behind, drawn darker).
import { DEG, TAU, clamp, easeOutBack, smoothstep } from './mathx.js';

// Body proportions in world px. Defaults fit legs of 10+10. configureBody(rig) rescales them from the
// rig's leg length (or takes rig.body overrides) so a new character's planted feet still reach the ground.
// Rule of thumb: standing hip-to-ankle ~ 0.92 x leg length (IK needs slack), run hip 2.5px lower,
// stride ~ 0.7 x leg, lift ~ 0.3 x leg. A too-high hip = IK reach fails = foot skate.
export const BODY = { hipY: -20.5, ankleY: -2, stride: 14, lift: 6, stanceW: 3, legLen: 20 };
// Run cycle distance must equal 2 * stride so the stance foot moves backward at
// exactly the root speed (zero slip). Always read it through cycleLength().
export const cycleLength = () => 2 * BODY.stride;

export function configureBody(rigJson) {
  const len = (n) => rigJson.bones?.find((b) => b.name === n)?.len;
  const leg = (len('legUF') ?? 10) + (len('legLF') ?? 10);
  const k = leg / 20;
  Object.assign(BODY, { hipY: -2 - 18.5 * k, ankleY: -2, stride: 14 * k, lift: 6 * k, stanceW: 3 * k, legLen: leg }, rigJson.body || {});
  return BODY;
}

const A = (deg) => deg * DEG;

export function idlePose(t, layer = {}) {
  return {
    hip: { x: layer.hipX ?? 0, y: BODY.hipY + (layer.hipY ?? 0) },
    angles: {
      spine: A(2) + (layer.spine ?? 0),
      head: A(-2) + (layer.head ?? 0),
      armUF: A(-6) + (layer.armUF ?? 0),
      armLF: A(-14) + (layer.armLF ?? 0),
      armUB: A(8) + (layer.armUB ?? 0),
      armLB: A(-10) + (layer.armLB ?? 0),
    },
    feet: { F: { x: BODY.stanceW + 1, y: BODY.ankleY, planted: true }, B: { x: -BODY.stanceW, y: BODY.ankleY, planted: true } },
    squash: 0,
  };
}

/** Swing/stance foot for phase u in [0,1): [0,.5) stance (moves back at root speed), [.5,1) swing. */
function footAt(u) {
  const S = BODY.stride;
  if (u < 0.5) return { x: S / 2 - (u / 0.5) * S, y: BODY.ankleY, planted: true };
  const s = (u - 0.5) / 0.5;
  const e = smoothstep(s);
  return { x: -S / 2 + e * S, y: BODY.ankleY - Math.sin(s * Math.PI) * BODY.lift, planted: false };
}

/** phase in [0,1) advanced by distance / CYCLE. asym = anti-puppet asymmetry (0 = mirrored). */
export function runPose(phase, speed01, asym = 0) {
  const p = phase * TAU;
  const bob = -1.4 * Math.cos(2 * p) - 0.6;
  const swing = A(38) * speed01;
  return {
    // keep the hip low enough that a planted foot at full stride is still reachable (IK reach => no drag)
    hip: { x: 1.5 * speed01, y: BODY.hipY + (2.5 + 0.7 * bob * speed01) * (BODY.legLen / 20) },
    angles: {
      spine: A(14) * speed01 + A(3) * Math.sin(2 * p + 0.6),
      head: -A(10) * speed01 + A(2) * Math.sin(2 * p + 1.2),
      armUF: -Math.cos(p) * swing * (1 + 0.15 * asym),
      armLF: -A(70) - A(15) * Math.sin(p + 0.4 * asym),
      armUB: Math.cos(p + 0.25 * asym) * swing,
      armLB: -A(75) - A(10) * Math.sin(p),
    },
    feet: { F: footAt(phase % 1), B: footAt((phase + 0.5 + 0.03 * asym) % 1) },
    squash: 0,
  };
}

export function turnPose(t) {
  const k = smoothstep(t / 0.15);
  return {
    hip: { x: -2 * (1 - k), y: BODY.hipY + 1.5 },
    angles: { spine: -A(12) * (1 - k), head: A(6), armUF: A(40), armLF: -A(40), armUB: A(55), armLB: -A(30) },
    feet: { F: { x: 4, y: BODY.ankleY, planted: true }, B: { x: -3, y: BODY.ankleY, planted: true } },
    squash: 0.15 * (1 - k),
  };
}


/** Take-off crouch / jump-squat. amount 1 = deepest, 0 = just starting.
 *  Depth is large enough to read on a contact sheet: hip drop, knee bend (IK from planted feet),
 *  forward lean, and vertical squash. Standing hops dip a touch deeper than run-jumps. */
export function crouchPose(amount, speed01 = 0) {
  const a = clamp(amount, 0, 1);
  const walkBias = 1 - 0.25 * clamp(speed01, 0, 1); // walk/stand dips a bit more
  const depth = (6.5 + 5.5 * a) * walkBias;
  return {
    hip: { x: 1.2 + 2.5 * a, y: BODY.hipY + depth },
    angles: {
      spine: A(12 + 16 * a),
      head: -A(6 + 6 * a),
      armUF: -A(28) * a,
      armLF: -A(20),
      armUB: A(35) * a,
      armLB: -A(12),
    },
    feet: {
      F: { x: BODY.stanceW + 2 + 2 * a, y: BODY.ankleY, planted: true },
      B: { x: -BODY.stanceW - 1 - a, y: BODY.ankleY, planted: true },
    },
    squash: 0.16 + 0.18 * a,
  };
}

export function jumpPose(t, vy) {
  const up = clamp(-vy / 300, 0, 1);
  const a = easeOutBack(clamp(t / 0.18, 0, 1));
  // Early release: stretch the torso/limbs so the crouch→air snap reads as anticipation→extension.
  const release = 1 - clamp(t / 0.1, 0, 1);
  return {
    hip: { x: 0, y: BODY.hipY - 2.5 * release },
    angles: {
      spine: A(6) * up - A(4) * release,
      head: -A(8),
      // Keep the face clear in the air (cold-run lesson): near arm out and below the eye line,
      // far arm lifted behind the head. Never raise the near arm through the face.
      armUF: -A(55) * a,
      armLF: -A(45),
      armUB: A(100) * a,
      armLB: A(60),
    },
    feet: { F: { x: 5, y: -8 * a, planted: false }, B: { x: -5, y: BODY.ankleY - 1, planted: false } },
    squash: -0.14 * up - 0.16 * release,
  };
}

export function fallPose(t, vy) {
  const k = clamp(vy / 350, 0, 1);
  return {
    hip: { x: 0, y: BODY.hipY },
    angles: { spine: -A(4) * k, head: A(6) * k, armUF: -A(45) - A(15) * k, armLF: -A(55), armUB: A(95) * k, armLB: -A(30) },
    feet: { F: { x: 4, y: -4 + 2 * k, planted: false }, B: { x: -4, y: -3, planted: false } },
    squash: -0.06 * k,
  };
}

/** Landing absorb. strength 0..1 from impact speed. Anticipation lives in jump start, follow-through here. */
export function landPose(t, strength) {
  const dip = (1 - smoothstep(t / (0.12 + 0.12 * strength))) * (2 + 5 * strength);
  return {
    hip: { x: 0.5, y: BODY.hipY + dip },
    angles: { spine: A(10 + 14 * strength) * (dip > 0 ? 1 : 0), head: -A(8), armUF: -A(30), armLF: -A(30), armUB: A(30), armLB: -A(20) },
    feet: { F: { x: 4, y: BODY.ankleY, planted: true }, B: { x: -4, y: BODY.ankleY, planted: true } },
    squash: 0.25 * strength * (dip / 7),
  };
}
