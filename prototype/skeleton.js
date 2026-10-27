// Bone hierarchy + forward kinematics. Pure: data in, matrices out.
//
// Matrices use the canvas/SVG affine layout [a, b, c, d, e, f]:
//   x' = a*x + c*y + e
//   y' = b*x + d*y + f
// Convention: y points DOWN, a bone's "length" runs along its local +y axis,
// positive rotation is clockwise on screen.

export function identity() {
  return [1, 0, 0, 1, 0, 0];
}

export function multiply(m, n) {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

/** Local transform: translate(x,y) * rotate(rot) * scale(sx,sy). */
export function localMatrix(x, y, rot, sx = 1, sy = 1) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  return [c * sx, s * sx, -s * sy, c * sy, x, y];
}

export function applyPoint(m, x, y) {
  return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] };
}

export function invert(m) {
  const det = m[0] * m[3] - m[1] * m[2];
  if (Math.abs(det) < 1e-12) throw new Error('matrix not invertible');
  const id = 1 / det;
  return [
    m[3] * id,
    -m[1] * id,
    -m[2] * id,
    m[0] * id,
    (m[2] * m[5] - m[3] * m[4]) * id,
    (m[1] * m[4] - m[0] * m[5]) * id,
  ];
}

/** World rotation of a matrix's local x axis (ignores reflection). */
export function matrixAngle(m) {
  return Math.atan2(m[1], m[0]);
}

/**
 * Build a skeleton from bone definitions.
 * defs: [{ name, parent?: string|null, x, y, rot?, length? }]
 * Bones are re-ordered so every parent precedes its children.
 * Throws on duplicate names, unknown parents, or cycles.
 */
const hasParent = (d) => d.parent !== undefined && d.parent !== null;

export function createSkeleton(defs) {
  const byName = new Map();
  for (const d of defs) {
    if (!d || typeof d.name !== 'string' || d.name === '') throw new Error('bone needs a name');
    if (byName.has(d.name)) throw new Error(`duplicate bone: ${d.name}`);
    byName.set(d.name, d);
  }
  for (const d of defs) {
    if (hasParent(d) && !byName.has(d.parent)) throw new Error(`unknown parent ${d.parent} for ${d.name}`);
  }
  const ordered = [];
  const state = new Map(); // 1 = visiting, 2 = done
  const visit = (d) => {
    const st = state.get(d.name);
    if (st === 2) return;
    if (st === 1) throw new Error(`bone cycle at ${d.name}`);
    state.set(d.name, 1);
    if (hasParent(d)) visit(byName.get(d.parent));
    state.set(d.name, 2);
    ordered.push(d);
  };
  defs.forEach(visit);
  const index = new Map(ordered.map((d, i) => [d.name, i]));
  const bones = ordered.map((d) => ({
    name: d.name,
    parent: d.parent ?? null,
    parentIndex: hasParent(d) ? index.get(d.parent) : -1,
    x: d.x ?? 0,
    y: d.y ?? 0,
    rot: d.rot ?? 0,
    length: d.length ?? 0,
  }));
  return { bones, index };
}

/**
 * Forward kinematics.
 * pose: { [boneName]: { rot?, x?, y?, sx?, sy? } } — rot/x/y are ADDED to the
 * rest pose, sx/sy are absolute local scales (default 1).
 * Returns an array of world matrices aligned with skel.bones.
 */
export function solveFK(skel, pose = {}, root = identity()) {
  const out = new Array(skel.bones.length);
  for (let i = 0; i < skel.bones.length; i++) {
    const b = skel.bones[i];
    const p = pose[b.name] || {};
    const local = localMatrix(b.x + (p.x || 0), b.y + (p.y || 0), b.rot + (p.rot || 0), p.sx ?? 1, p.sy ?? 1);
    const parent = b.parentIndex >= 0 ? out[b.parentIndex] : root;
    out[i] = multiply(parent, local);
  }
  return out;
}

/** World matrix for a bone by name. */
export function boneMatrix(skel, world, name) {
  const i = skel.index.get(name);
  if (i === undefined) throw new Error(`unknown bone ${name}`);
  return world[i];
}

/** World position of a bone's origin and tip (origin + length along local +y). */
export function boneEnds(skel, world, name) {
  const m = boneMatrix(skel, world, name);
  const len = skel.bones[skel.index.get(name)].length;
  return { origin: applyPoint(m, 0, 0), tip: applyPoint(m, 0, len) };
}
