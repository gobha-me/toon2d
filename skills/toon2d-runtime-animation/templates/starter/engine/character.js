// Character orchestrator: physics -> state machine -> pose -> anti-puppet layers -> foot lock -> IK -> FK -> face.
// Pure (no DOM). The renderer only reads the returned character object.
import { clamp, rng as makeRng } from './mathx.js';
import { buildRig, fk, offsetForWorld } from './skeleton.js';
import { solveTwoBone } from './ik.js';
import { createChain, stepChain } from './springs.js';
import { blendPose, createSM, fadeWeight, tickSM, transition } from './statemachine.js';
import { createFootLock, stepFoot } from './footlock.js';
import { PHYS, createBody, stepBody } from './physics.js';
import { BODY, configureBody, crouchPose, cycleLength, fallPose, idlePose, jumpPose, landPose, runPose, turnPose } from './poses.js';
import { createOverlap, faceYaw, handShape, idleLayer, stepBreath, stepHold, stepOverlap, stepTurnKick } from './antipuppet.js';
import {
  approachParams, composeFace, createBlink, createDirector, lookAt, mixExpressions, neutralParams, pinExpression, stepBlink, stepDirector,
} from './face-core.js';

export const TIMING_FPS = { ones: 0, twos: 12, threes: 8 };

export function defaultFlags() {
  return { ap: true, idle: true, breath: true, overlap: true, asym: true, turn: true, caps: true, hold: true, feetswap: true, timing: 'twos' };
}
/** Effective flag: master `ap` switch AND the individual flag. */
export const on = (flags, name) => !!(flags.ap && flags[name]);

export function createCharacter(rigJson, expressions, opts = {}) {
  configureBody(rigJson);
  const rig = buildRig(rigJson);
  const seed = opts.seed ?? 1;
  return {
    rig,
    presets: expressions?.expressions,
    reactions: expressions?.reactions,
    flags: { ...defaultFlags(), ...(opts.flags || {}) },
    seed,
    rand: makeRng(seed),
    body: createBody(opts.x ?? 0, opts.y ?? 0),
    facing: 1,
    sm: createSM('idle'),
    phase: 0,
    t: 0,
    tick: 0,
    shown: null,
    held: null,
    holdAcc: Infinity,
    feetState: { F: createFootLock(), B: createFootLock() },
    feet: {},
    overlap: createOverlap(),
    breath: { phase: 0, hipY: 0, chest: 0 },
    exertion: 0,
    kick: 0,
    lastVx: 0,
    lastVy: 0,
    landStrength: 0,
    chain: createChain(6, opts.x ?? 0, (opts.y ?? 0) - 30, 3),
    face: { dir: createDirector(), smoothed: neutralParams(), blink: createBlink(0.8), closed: 0, params: neutralParams() },
    lookTarget: null,
    hurtT: 0,
    events: [],
    local: null,
  };
}

function wantedState(ch, dir, landed) {
  const b = ch.body;
  const s = ch.sm.state;
  if (ch.hurtT > 0) return 'hurt';
  if (!b.grounded) return b.vy < 0 ? 'jump' : 'fall';
  if (landed) return 'land';
  if (s === 'land' && ch.sm.t < 0.1 + 0.12 * ch.landStrength && !(dir && ch.sm.t > 0.06)) return 'land';
  // During take-off crouch: allow a real turn when pressing reverse+jump (M3). Otherwise
  // hold run/idle so the squat reads as anticipation, not a state flicker.
  if (b.pendingJump && b.squat > 0) {
    if (dir && dir !== ch.facing) return 'turn';
    if (dir || Math.abs(b.vx) > 8) return 'run';
    return 'idle';
  }
  if (s === 'turn' && ch.sm.t < 0.15) return 'turn';
  if (dir && dir !== ch.facing) return 'turn';
  if (dir || Math.abs(b.vx) > 8) return 'run';
  return 'idle';
}

function hurtPose(t) {
  const p = landPose(0, 0.3);
  return { ...p, angles: { ...p.angles, spine: -0.35, head: 0.3, armUF: -0.9, armUB: -0.4 }, squash: 0.1 * Math.exp(-t * 8) };
}

function poseFor(ch, state, t) {
  const b = ch.body;
  // Take-off crouch wins over idle/run/turn while the squat ticks down (physics still grounded).
  if (b.pendingJump && b.squat > 0 && b.grounded) {
    // Progress 0→1 over the squat; ease into depth and hold deepest near release.
    const u = b.squatMax > 0 ? 1 - (b.squat - 1) / b.squatMax : 1;
    const amount = Math.min(1, u * 1.35);
    return crouchPose(amount, Math.abs(b.vx) / 80);
  }
  switch (state) {
    case 'run':
      return runPose(ch.phase, clamp(Math.abs(b.vx) / 80, 0.25, 1), on(ch.flags, 'asym') ? 1 : 0);
    case 'turn':
      return turnPose(t);
    case 'jump':
      return jumpPose(t, b.vy);
    case 'fall':
      return fallPose(t, b.vy);
    case 'land':
      return landPose(t, ch.landStrength);
    case 'hurt':
      return hurtPose(t);
    default: {
      const layer = on(ch.flags, 'idle') ? idleLayer(ch.t, ch.seed) : {};
      return idlePose(t, layer);
    }
  }
}

/** input = {left,right,jump}. level = {floorY, platforms, minX, maxX}. extEvents = ['hurt', ...] from gameplay. */
export function stepCharacter(ch, input, dt, level, extEvents = []) {
  ch.tick++;
  ch.t += dt;
  ch.events = [];
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const prevFacing = ch.facing;
  const { body, events } = stepBody(ch.body, input, dt, level);
  ch.body = body;
  let landed = false;
  const faceEvents = [...extEvents];
  for (const e of events) {
    if (e === 'jump') faceEvents.push('bigJump');
    if (e && e.type === 'land') {
      landed = true;
      ch.landStrength = clamp((e.vy - 180) / 320, 0, 1);
      if (e.vy > 400) faceEvents.push('landHard');
    }
    ch.events.push(typeof e === 'string' ? e : e.type);
  }
  if (extEvents.includes('hurt')) ch.hurtT = 0.5;
  ch.hurtT = Math.max(0, ch.hurtT - dt);

  // Facing during reverse+jump comes from the turn state (head-first), not a crouch snap (M3).

  // --- state machine (facing flips 3 ticks into a ground turn: head leads, body follows)
  const next = wantedState(ch, dir, landed);
  if (next !== ch.sm.state) ch.sm = transition(ch.sm, next, ch.shown);
  else ch.sm = tickSM(ch.sm, dt);
  if (ch.sm.state === 'turn' && ch.sm.t >= 0.05 && dir && dir !== ch.facing) ch.facing = dir;
  if (!ch.body.grounded && dir && dir !== ch.facing) ch.facing = dir;
  if (ch.sm.state === 'idle' && dir && dir !== ch.facing) ch.facing = dir;
  const flipped = ch.facing !== prevFacing;
  ch.kick = on(ch.flags, 'turn') ? stepTurnKick(ch.kick, flipped, dt) : 0;

  // --- distance-locked run phase (cycle = 2 * stride => stance foot has zero slip)
  if (ch.sm.state === 'run') ch.phase = (ch.phase + (Math.abs(ch.body.vx) * dt) / cycleLength()) % 1;

  // --- pose (upper body held on 2s/3s; feet proposals every tick)
  const fresh = poseFor(ch, ch.sm.state, ch.sm.t);
  const fps = on(ch.flags, 'hold') ? TIMING_FPS[ch.flags.timing] ?? 0 : 0;
  const crouching = !!(ch.body.pendingJump && ch.body.squat > 0);
  // B1: twos/threes hold must not freeze the hip across crouch ticks — refresh every tick while squatting
  // so anticipation deepens. Feet still update every tick below.
  const h = stepHold(ch.holdAcc === Infinity ? 1 : ch.holdAcc, dt, crouching ? 0 : fps);
  ch.holdAcc = crouching ? Infinity : h.acc;
  if (h.tick || !ch.held || ch.sm.t === 0 || crouching) ch.held = { hip: fresh.hip, angles: fresh.angles, squash: fresh.squash };
  let pose = { ...fresh, hip: ch.held.hip, angles: ch.held.angles, squash: ch.held.squash };
  if (ch.sm.fade) pose = blendPose(ch.sm.fade.from, pose, fadeWeight(ch.sm));

  // --- anti-puppet: breathing + overlap springs
  ch.exertion = clamp(ch.exertion + (ch.sm.state === 'run' ? dt * 0.5 : -dt * 0.15), 0, 1);
  if (on(ch.flags, 'breath')) {
    ch.breath = stepBreath(ch.breath.phase, ch.exertion, dt);
    pose = { ...pose, hip: { ...pose.hip, y: pose.hip.y + ch.breath.hipY } };
  } else ch.breath = { phase: 0, hipY: 0, chest: 0 };
  const ax = ((ch.body.vx - ch.lastVx) / dt) * ch.facing;
  // Felt acceleration: remove free-fall gravity in the air, or the arm/head springs hold a constant
  // offset for the whole jump (cold-run bug: near arm rose through the face on every jump).
  const ay = (ch.body.vy - ch.lastVy) / dt - (ch.body.grounded ? 0 : PHYS.gravity);
  ch.lastVx = ch.body.vx;
  ch.lastVy = ch.body.vy;
  if (on(ch.flags, 'overlap')) {
    ch.overlap = stepOverlap(ch.overlap, flipped ? 0 : clamp(ax, -3000, 3000), clamp(ay, -3000, 3000), dt);
    const o = ch.overlap;
    pose = {
      ...pose,
      angles: { ...pose.angles, head: pose.angles.head + o.head.x, spine: pose.angles.spine + o.spine.x, armUF: pose.angles.armUF + o.arms.x, armUB: pose.angles.armUB + o.arms.x * 0.8 },
    };
  }
  ch.shown = pose;

  // --- world-space foot lock, then 2-bone IK for each leg
  const root = { x: ch.body.x, y: ch.body.y };
  const pre = fk(ch.rig, pose);
  const angles = { ...pose.angles };
  for (const side of ['F', 'B']) {
    // B1: during crouch keep planted feet within a wider drift so a deepening hip does not unplant.
    const r = stepFoot(ch.feetState[side], pose.feet[side], root, ch.facing, dt, {
      groundY: BODY.ankleY,
      maxDrift: crouching ? 12 : 5,
    });
    ch.feetState[side] = r.state;
    const up = ch.rig.byName[`legU${side}`];
    const lo = ch.rig.byName[`legL${side}`];
    const hip = pre[`legU${side}`];
    const ik = solveTwoBone(hip.x, hip.y, r.x, r.y, up.len, lo.len, 1);
    const parentA = pre[up.parent].a;
    angles[`legU${side}`] = offsetForWorld(ch.rig, up.name, ik.a1, parentA);
    angles[`legL${side}`] = offsetForWorld(ch.rig, lo.name, ik.a2, ik.a1);
    ch.feet[side] = { planted: r.planted, reach: ik.reach };
  }
  ch.pose = { ...pose, angles };
  ch.local = fk(ch.rig, ch.pose);

  // --- secondary: scarf chain anchored at the neck, simulated in world space
  const neck = ch.local.head;
  ch.chain = stepChain(ch.chain, root.x + neck.x * ch.facing, root.y + neck.y + 2, dt, {
    restAngle: ch.facing > 0 ? Math.PI * 0.8 : Math.PI * 0.2,
    stiffness: on(ch.flags, 'overlap') ? 0.12 : 0.6,
    gravity: 260,
  });

  // --- face: director (mood + event transients) -> mix -> per-param smoothing -> blink/look -> compose
  const speed01 = clamp(Math.abs(ch.body.vx) / 80, 0, 1);
  const snap = { grounded: ch.body.grounded, speed: Math.abs(ch.body.vx) * 3, charging: false, vy: ch.body.vy * 3, hurt: ch.hurtT > 0 };
  const d = stepDirector(ch.face.dir, snap, faceEvents, dt, ch.reactions || undefined);
  ch.face.dir = d.director;
  const target = mixExpressions(d.weights, ch.presets || undefined);
  ch.face.smoothed = approachParams(ch.face.smoothed, target, dt);
  const bl = stepBlink(ch.face.blink, dt, ch.rand, { suppress: target.eyeOpenL > 1.1 ? 0.8 : 0 });
  ch.face.blink = bl.state;
  ch.face.closed = bl.closed;
  const head = ch.local.head;
  const hx = root.x + head.x * ch.facing;
  const hy = root.y + head.y;
  const lt = ch.lookTarget || { x: hx + ch.facing * 60, y: hy + 4 };
  const look = lookAt(hx, hy, lt.x, lt.y, ch.facing);
  ch.face.params = composeFace(ch.face.smoothed, { blink: bl.closed, look: { ...look, weight: 1 } });
  ch.yaw = on(ch.flags, 'turn') ? faceYaw(speed01, ch.kick) : 0;
  ch.hand = on(ch.flags, 'feetswap') ? handShape(ch.sm.state) : 'ball';
  return ch;
}

export function setPinned(ch, name) {
  ch.face.dir = pinExpression(ch.face.dir, name);
}

/** World-space joints (what the eval harness measures). Upper body includes the turn narrowing. */
export function worldJoints(ch) {
  const out = [];
  const narrow = 1 - 0.22 * ch.kick;
  const hip = ch.local.hip;
  for (const b of ch.rig.bones) {
    const j = ch.local[b.name];
    const upper = !b.name.startsWith('leg') && b.name !== 'hip';
    const lx = upper ? hip.x + (j.x - hip.x) * narrow : j.x;
    const ex = upper ? hip.x + (j.ex - hip.x) * narrow : j.ex;
    out.push({ name: b.name, x: ch.body.x + lx * ch.facing, y: ch.body.y + j.y, ex: ch.body.x + ex * ch.facing, ey: ch.body.y + j.ey });
  }
  return out;
}

export function worldFeet(ch) {
  return ['F', 'B'].map((s) => {
    const j = ch.local[`legL${s}`];
    return { side: s, x: ch.body.x + j.ex * ch.facing, y: ch.body.y + j.ey, planted: !!ch.feet[s]?.planted, reach: ch.feet[s]?.reach };
  });
}
