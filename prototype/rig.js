// Pose pipeline: state machine -> sampled/crossfaded clips -> leg IK. Pure.
import { blendPose, clonePose, samplePose } from './anim.js';
import { solveTwoBoneIK, ikToLocalRotations } from './ik.js';
import { lerp } from './mathx.js';
import { applyPoint, boneMatrix, matrixAngle, solveFK } from './skeleton.js';
import { currentWeight } from './statemachine.js';

/** Sample the current (and fading-out previous) state and crossfade them. */
export function animatedPose(clips, sm) {
  const cur = samplePose(clips[sm.state], sm.time);
  if (!sm.prev) return cur;
  const prev = samplePose(clips[sm.prev], sm.prevTime);
  return blendPose(prev, cur, currentWeight(sm));
}

/** Blend IK mode weights across a crossfade. modes: { state: 'plant'|'adjust' }. */
export function ikWeights(sm, modes) {
  const w = currentWeight(sm);
  const of = (state) => ({
    plant: modes[state] === 'plant' ? 1 : 0,
    adjust: modes[state] ? 1 : 0,
  });
  const a = of(sm.state);
  if (!sm.prev) return a;
  const b = of(sm.prev);
  return { plant: lerp(b.plant, a.plant, w), adjust: lerp(b.adjust, a.adjust, w) };
}

/**
 * Ground-aware two-bone leg IK in character space.
 * groundAt(localX) -> local y of the ground under that x (0 on flat ground at the feet).
 * weights = { plant, adjust } in 0..1:
 *   adjust: shift each foot by the ground height under it (slopes), never below ground
 *   plant:  pin the foot exactly onto the ground (idle/land/charge)
 * groundAngle: slope angle used to lay planted shoes flat on the surface.
 * Lowers the hips when the downhill foot could not otherwise reach.
 * Returns { pose, world, targets }.
 */
export function applyLegIK(skel, inPose, legs, groundAt, weights, groundAngle = 0) {
  const pose = clonePose(inPose);
  const adjust = Math.max(weights.adjust, weights.plant);
  if (adjust <= 0) return { pose, world: solveFK(skel, pose), targets: [] };

  // 1) hips drop: the lowest ground under either foot decides how far to sink
  let world = solveFK(skel, pose);
  let drop = 0;
  for (const leg of legs) {
    const foot = applyPoint(boneMatrix(skel, world, leg.foot), 0, 0);
    drop = Math.max(drop, groundAt(foot.x));
  }
  if (drop > 0) {
    pose.hips = { ...(pose.hips || {}), y: (pose.hips?.y ?? 0) + drop * adjust };
    world = solveFK(skel, pose);
  }

  // 2) per-leg IK
  const hipsRot = matrixAngle(boneMatrix(skel, world, 'hips'));
  const targets = [];
  for (const leg of legs) {
    const thigh = skel.bones[skel.index.get(leg.thigh)];
    const shin = skel.bones[skel.index.get(leg.shin)];
    const hip = applyPoint(boneMatrix(skel, world, leg.thigh), 0, 0);
    const foot = applyPoint(boneMatrix(skel, world, leg.foot), 0, 0);
    const g = groundAt(foot.x);
    const adjusted = Math.min(foot.y + g, g);
    const planted = g;
    const ty = lerp(foot.y, lerp(adjusted, planted, weights.plant / Math.max(adjust, 1e-9)), adjust);
    const ik = solveTwoBoneIK(hip.x, hip.y, foot.x, ty, thigh.length, shin.length, 1);
    const local = ikToLocalRotations(ik, hipsRot);
    pose[leg.thigh] = { ...(pose[leg.thigh] || {}), rot: local.upper - thigh.rot };
    pose[leg.shin] = { ...(pose[leg.shin] || {}), rot: local.lower - shin.rot };
    targets.push({ x: foot.x, y: ty, reached: ik.reached });
  }
  world = solveFK(skel, pose);

  // 3) lay planted feet flat on the slope
  if (weights.plant > 0) {
    for (const leg of legs) {
      const shinRot = matrixAngle(boneMatrix(skel, world, leg.shin));
      const cur = pose[leg.foot]?.rot ?? 0;
      pose[leg.foot] = { ...(pose[leg.foot] || {}), rot: lerp(cur, groundAngle - shinRot, weights.plant) };
    }
    world = solveFK(skel, pose);
  }
  return { pose, world, targets };
}
