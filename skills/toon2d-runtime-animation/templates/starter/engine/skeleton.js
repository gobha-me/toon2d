// Skeleton + forward kinematics. Pure. Angles in radians internally, degrees in rig.json.
// Convention: y down, angle 0 = +x (facing direction), +90deg = straight down.
// A bone's local angle is relative to its parent's world angle.
import { DEG } from './mathx.js';

export function buildRig(json) {
  const byName = {};
  const bones = [];
  const pending = [...json.bones];
  let guard = 0;
  while (pending.length && guard++ < 1000) {
    const b = pending.shift();
    if (b.parent && !byName[b.parent]) {
      pending.push(b);
      continue;
    }
    const bone = { ...b, restRad: (b.rest || 0) * DEG, at: b.at || [0, 0] };
    byName[b.name] = bone;
    bones.push(bone);
  }
  if (pending.length) throw new Error(`rig: unresolved parents for ${pending.map((b) => b.name).join(', ')}`);
  return { ...json, bones, byName };
}

/**
 * FK. pose.hip = {x, y} (root-local), pose.angles[name] = offset (rad) added to rest.
 * Returns { [name]: { x, y, a, ex, ey, len } } in root-local (facing-local) space.
 */
export function fk(rig, pose) {
  const out = {};
  for (const b of rig.bones) {
    const local = b.restRad + (pose.angles?.[b.name] ?? 0);
    let x;
    let y;
    let a;
    if (!b.parent) {
      x = pose.hip.x;
      y = pose.hip.y;
      a = local;
    } else {
      const p = out[b.parent];
      const c = Math.cos(p.a);
      const s = Math.sin(p.a);
      x = p.x + c * b.at[0] - s * b.at[1];
      y = p.y + s * b.at[0] + c * b.at[1];
      a = p.a + local;
    }
    out[b.name] = { x, y, a, len: b.len, ex: x + Math.cos(a) * b.len, ey: y + Math.sin(a) * b.len };
  }
  return out;
}

/** Local angle offset that makes bone `name` point at world angle `worldA`, given parent world angle. */
export function offsetForWorld(rig, name, worldA, parentWorldA) {
  return worldA - parentWorldA - rig.byName[name].restRad;
}
