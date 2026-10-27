// Skeleton, procedural gait (2-bone IK on a treadmill) and the three body renderers:
//   A = rigid cutout parts on bones, B = skinned grid meshes over whole-limb textures,
//   C = flipbook of AI-generated walk frames.
// Model space = rest-pose pixels of the AI side view at atlas scale (360 x 640).

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;

// --- 2D affine matrices [a, b, c, d, e, f]: x' = a x + c y + e, y' = b x + d y + f
const mul = (m, n) => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];
const rotAbout = (px, py, ang) => {
  const c = Math.cos(ang), s = Math.sin(ang);
  return [c, s, -s, c, px - c * px + s * py, py - s * px - c * py];
};
const trans = (x, y) => [1, 0, 0, 1, x, y];
const apply = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

// bone -> parent, pivot (from body-rig.json joints)
const HIER = {
  root: null, torso: 'root', head: 'torso', armU: 'torso', armL: 'armU',
  farArmU: 'torso', farArmL: 'farArmU',
  thighN: 'root', shinN: 'thighN', footN: 'shinN', thighF: 'root', shinF: 'thighF', footF: 'shinF',
};
const FAR_ARM_OFFSET = [16, -3];

export class Rig {
  constructor(rig) {
    this.rig = rig;
    const J = rig.joints;
    this.J = { ...J, root: J.thighN, farArmU: J.armU, farArmL: J.armL };
    const len = (a, b) => Math.hypot(J[b][0] - J[a][0], J[b][1] - J[a][1]);
    const ang = (a, b) => Math.atan2(J[b][1] - J[a][1], J[b][0] - J[a][0]);
    this.legs = {
      N: { hip: J.thighN, l1: len('thighN', 'shinN'), l2: len('shinN', 'footN'), a1: ang('thighN', 'shinN'), a2: ang('shinN', 'footN'), ground: J.footN[1] },
      F: { hip: J.thighF, l1: len('thighF', 'shinF'), l2: len('shinF', 'footF'), a1: ang('thighF', 'shinF'), a2: ang('shinF', 'footF'), ground: J.footF[1] },
    };
    this.ankleX = { N: J.footN[0], F: J.footF[0] };
  }

  // gait: {name, T, stance, L, lift, drop} ; returns pose = {angles, root:[dx,dy], breath, sway}
  gaitPose(g, phase, t) {
    const a = {};
    const hipDy = g.name === 'run'
      ? g.drop * Math.cos(TAU * 2 * (phase - g.stance / 2)) // low at mid-stance, high in flight
      : g.drop * (0.5 + 0.5 * Math.cos(TAU * 2 * phase)); // low at double support
    for (const side of ['N', 'F']) {
      const leg = this.legs[side];
      const ph = (phase + (side === 'F' ? 0.5 : 0)) % 1;
      let x, y, footAng;
      if (ph < g.stance) {
        const u = ph / g.stance;
        x = this.ankleX[side] + g.L - 2 * g.L * u;
        y = leg.ground;
        footAng = 0.55 * smooth(0.7, 1, u); // heel-off
        y -= 10 * smooth(0.7, 1, u);
      } else {
        const u = (ph - g.stance) / (1 - g.stance);
        x = this.ankleX[side] - g.L + 2 * g.L * smooth(0, 1, u);
        y = leg.ground - g.lift * Math.sin(Math.PI * Math.pow(u, 0.8));
        footAng = lerp(0.55, -0.2, smooth(0, 0.8, u));
      }
      const hx = leg.hip[0], hy = leg.hip[1] + hipDy;
      let dx = x - hx, dy = y - hy;
      let d = Math.hypot(dx, dy);
      const maxD = leg.l1 + leg.l2 - 0.5;
      if (d > maxD) {
        dx *= maxD / d;
        dy *= maxD / d;
        d = maxD;
      }
      const base = Math.atan2(dy, dx);
      const cosA = clamp((leg.l1 * leg.l1 + d * d - leg.l2 * leg.l2) / (2 * leg.l1 * d), -1, 1);
      const thighAbs = base - Math.acos(cosA); // knee bends forward (+x)
      const kx = hx + leg.l1 * Math.cos(thighAbs), ky = hy + leg.l1 * Math.sin(thighAbs);
      const shinAbs = Math.atan2(hy + dy - ky, hx + dx - kx);
      a[`thigh${side}`] = thighAbs - leg.a1;
      a[`shin${side}`] = shinAbs - leg.a2 - (thighAbs - leg.a1);
      a[`foot${side}`] = footAng - (shinAbs - leg.a2);
    }
    const sw = Math.cos(TAU * phase);
    const runK = g.name === 'run' ? 1 : 0;
    a.armU = g.arm * sw;
    a.armL = -(0.2 + 0.25 * Math.max(0, -sw)) - runK * 1.2;
    a.farArmU = -g.arm * sw;
    a.farArmL = -(0.2 + 0.25 * Math.max(0, sw)) - runK * 1.2;
    a.torso = g.lean + 0.02 * Math.cos(TAU * 2 * phase);
    a.head = -g.lean * 0.6 - 0.015 * Math.cos(TAU * 2 * phase);
    a.root = 0;
    return { a, root: [0, hipDy], breath: 0.5 + 0.5 * Math.sin(t * TAU / 2.2), sway: 0.6 * Math.sin(TAU * 2 * phase + 1) };
  }

  idlePose(t) {
    const b = Math.sin((t * TAU) / 3.6);
    const a = {
      root: 0, torso: 0.012 * b, head: -0.01 * b + 0.02 * Math.sin(t * 0.7),
      armU: 0.03 * b + 0.02, armL: -0.05 - 0.02 * b, farArmU: -0.01 * b, farArmL: -0.08,
    };
    for (const k of ['thighN', 'shinN', 'footN', 'thighF', 'shinF', 'footF']) a[k] = 0;
    // keep feet planted while the hips settle a little: small knee flex
    const flex = 0.03 + 0.02 * b;
    a.thighN = -flex; a.shinN = 2 * flex; a.footN = -flex;
    a.thighF = -flex; a.shinF = 2 * flex; a.footF = -flex;
    return { a, root: [0, 1.2 + 1.2 * b], breath: 0.5 + 0.5 * b, sway: 0.4 * Math.sin(t * 1.3) };
  }

  static blend(p, q, k) {
    const a = {};
    for (const n of Object.keys(p.a)) a[n] = lerp(p.a[n], q.a[n], k);
    return { a, root: [lerp(p.root[0], q.root[0], k), lerp(p.root[1], q.root[1], k)], breath: lerp(p.breath, q.breath, k), sway: lerp(p.sway, q.sway, k) };
  }

  // world matrices (model space) for every bone
  matrices(pose) {
    const M = {};
    const get = (name) => {
      if (M[name]) return M[name];
      const parent = HIER[name];
      const [px, py] = this.J[name];
      let local = rotAbout(px, py, pose.a[name] || 0);
      if (name === 'root') local = mul(trans(pose.root[0], pose.root[1]), local);
      if (name === 'farArmU') local = mul(trans(FAR_ARM_OFFSET[0], FAR_ARM_OFFSET[1]), local);
      M[name] = parent ? mul(get(parent), local) : local;
      return M[name];
    };
    for (const n of Object.keys(HIER)) get(n);
    return M;
  }
}

// ---------------------------------------------------------------- A: rigid cutout
const A_ORDER = [
  ['farArmL', 'armL', 'far'], ['farArmU', 'armU', 'far'],
  ['footF', 'footF', 'farLeg'], ['shinF', 'shinF', 'farLeg'], ['thighF', 'thighF', 'farLeg'],
  ['footN', 'footN'], ['shinN', 'shinN'], ['thighN', 'thighN'],
  ['torso', 'torso'], ['head', 'head'],
  ['armL', 'armL'], ['armU', 'armU'],
];

export function drawCutout(batch, tex, rig, M, view, tints, debug) {
  const P = rig.rig.parts;
  let curTint = null;
  for (const [bone, part, kind] of A_ORDER) {
    const tint = tints[kind || 'near'];
    if (curTint && tint !== curTint) batch.flush(tex, curTint);
    curTint = tint;
    const p = P[part];
    const [ox, oy] = p.origin;
    const [, , w, h] = p.rect;
    const c = [];
    for (const [x, y] of [[ox, oy], [ox + w, oy], [ox + w, oy + h], [ox, oy + h]]) {
      const [mx, my] = apply(M[bone], x, y);
      c.push(view.x + mx * view.s, view.y + my * view.s);
    }
    batch.quad(c, p.rect);
  }
  batch.flush(tex, curTint);
  if (debug) drawBones(batch, rig, M, view);
}

function drawBones(batch, rig, M, view) {
  const pts = [];
  const J = rig.J;
  for (const [name, parent] of Object.entries(HIER)) {
    if (!parent || name === 'root') continue;
    const a = apply(M[parent], J[name][0], J[name][1]);
    const child = Object.keys(HIER).find((k) => HIER[k] === name);
    const end = child ? apply(M[name], J[child][0], J[child][1]) : apply(M[name], J[name][0] + 20, J[name][1] + 10);
    pts.push(view.x + a[0] * view.s, view.y + a[1] * view.s, view.x + end[0] * view.s, view.y + end[1] * view.s);
  }
  batch.lines(pts, [1, 0.85, 0.2, 1]);
}

// ---------------------------------------------------------------- B: skinned meshes
function grid(part, P, cols, rows, weightsFn) {
  const p = P[part];
  const [ox, oy] = p.origin;
  const [rx, ry, w, h] = p.rect;
  const verts = [];
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      const x = ox + (w * i) / cols, y = oy + (h * j) / rows;
      verts.push({ x, y, u: rx + (w * i) / cols, v: ry + (h * j) / rows, w: weightsFn(x, y) });
    }
  }
  const tris = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = j * (cols + 1) + i;
      tris.push(k, k + 1, k + cols + 2, k, k + cols + 2, k + cols + 1);
    }
  }
  return { verts, tris };
}

export function buildMeshes(rig) {
  const P = rig.rig.parts, J = rig.J;
  const legW = (s) => (x, y) => {
    const knee = J[`shin${s}`][1], ankle = J[`foot${s}`][1];
    const wT = 1 - smooth(knee - 18, knee + 18, y);
    const wF = smooth(ankle - 16, ankle + 4, y);
    return [[`thigh${s}`, wT], [`shin${s}`, Math.max(0, 1 - wT - wF)], [`foot${s}`, wF]];
  };
  const armW = (pre) => (x, y) => {
    const e = J.armL[1];
    const wU = 1 - smooth(e - 16, e + 16, y);
    return [[`${pre}U`, wU], [`${pre}L`, 1 - wU]];
  };
  return {
    legN: grid('legN', P, 6, 36, legW('N')),
    legF: grid('legF', P, 5, 34, legW('F')),
    arm: grid('arm', P, 5, 28, armW('arm')),
    farArm: grid('arm', P, 5, 28, armW('farArm')),
    torso: grid('torso', P, 8, 18, (x, y) => {
      const k = smooth(285, 322, y); // hem follows the hips, chest follows the spine
      return [['torso', 1 - k], ['root', k]];
    }),
    head: grid('head', P, 8, 10, (x, y) => {
      const k = smooth(88, 108, y); // neck blends into the collar
      return [['head', 1 - k], ['torso', k]];
    }),
  };
}

const B_ORDER = [['farArm', 'far'], ['legF', 'farLeg'], ['legN'], ['torso'], ['head'], ['arm']];

export function drawMeshes(batch, tex, rig, meshes, M, pose, view, tints, debug) {
  const J = rig.J;
  const out = {};
  for (const [name, kind] of B_ORDER) {
    const mesh = meshes[name];
    const pts = mesh.verts.map((v) => {
      let { x, y } = v;
      // pre-skin deformation in rest space: breathing + hair sway + shoulder rise
      if (name === 'torso') {
        const chest = smooth(120, 160, y) * (1 - smooth(230, 290, y));
        x += pose.breath * 2.4 * ((x - J.torso[0]) / 55) * chest;
        y -= pose.breath * 1.6 * (1 - smooth(110, 200, y));
      } else if (name === 'arm' || name === 'farArm') {
        y -= pose.breath * 1.6 * (1 - smooth(150, 240, y));
      } else if (name === 'head') {
        const hair = 1 - smooth(10, 70, y);
        x += pose.sway * 3 * hair * hair;
        y -= pose.breath * 0.8;
      }
      let sx = 0, sy = 0;
      for (const [bone, w] of v.w) {
        if (w <= 0) continue;
        const p = apply(M[bone], x, y);
        sx += p[0] * w;
        sy += p[1] * w;
      }
      return [view.x + sx * view.s, view.y + sy * view.s];
    });
    out[name] = pts;
    const t = mesh.tris;
    for (let i = 0; i < t.length; i += 3) {
      const a = mesh.verts[t[i]], b = mesh.verts[t[i + 1]], c = mesh.verts[t[i + 2]];
      const pa = pts[t[i]], pb = pts[t[i + 1]], pc = pts[t[i + 2]];
      batch.tri(pa[0], pa[1], a.u, a.v, pb[0], pb[1], b.u, b.v, pc[0], pc[1], c.u, c.v);
    }
    batch.flush(tex, tints[kind || 'near']);
  }
  if (debug) {
    for (const name of ['legN', 'arm', 'torso', 'head']) {
      const mesh = meshes[name], pts = out[name];
      const L = [];
      const t = mesh.tris;
      for (let i = 0; i < t.length; i += 3) {
        const a = pts[t[i]], b = pts[t[i + 1]], c = pts[t[i + 2]];
        L.push(a[0], a[1], b[0], b[1], b[0], b[1], c[0], c[1]);
      }
      batch.lines(L, [0.3, 1, 0.9, 0.55]);
    }
  }
}

// ---------------------------------------------------------------- C: AI flipbook
export function drawFlipbook(batch, tex, meta, frame, view, opts) {
  const { w, h } = meta;
  const draw = (f, alpha) => {
    const rect = [f * w, 0, w, h];
    const s = view.s * opts.k;
    const sy = s * (opts.squash || 1);
    const x0 = view.x + opts.cx * view.s - (w / 2) * s;
    const y1 = view.y + opts.ground * view.s;
    const y0 = y1 - h * sy;
    batch.quad([x0, y0, x0 + w * s, y0, x0 + w * s, y1, x0, y1], rect);
    batch.flush(tex, [1, 1, 1, alpha]);
    if (opts.debug) batch.lines([x0, y0, x0 + w * s, y0, x0 + w * s, y0, x0 + w * s, y1, x0 + w * s, y1, x0, y1, x0, y1, x0, y0], [1, 0.5, 0.3, 0.8]);
  };
  const i = Math.floor(frame) % meta.n;
  if (opts.blend) {
    const f = frame - Math.floor(frame);
    draw(i, 1 - f);
    draw((i + 1) % meta.n, f);
  } else draw(i, 1);
}

export const GAITS = {
  walk: { name: 'walk', T: 1.1, stance: 0.6, L: 82, lift: 34, drop: 12, arm: 0.32, lean: 0.04 },
  run: { name: 'run', T: 0.72, stance: 0.36, L: 112, lift: 90, drop: 10, arm: 0.75, lean: 0.16 },
};
export const gaitSpeed = (g) => (2 * g.L) / (g.stance * g.T); // model px / s, stance foot glued to ground
