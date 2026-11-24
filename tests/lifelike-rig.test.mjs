import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { Rig, GAITS, buildMeshes, gaitSpeed } from '../prototypes/lifelike/prototype/rig.js';

// Issue #37: independent CPU smoke for the documented bones/IK/skinned-mesh
// prototype. Inputs are the shipped public rest-pose data, not model snapshots.
const fixture = JSON.parse(readFileSync(new URL('../prototypes/lifelike/prototype/body-rig.json', import.meta.url)));

function makeRig() {
  return new Rig(structuredClone(fixture));
}

function finite(value) {
  if (typeof value === 'number') assert.ok(Number.isFinite(value));
  else if (value && typeof value === 'object') Object.values(value).forEach(finite);
}

test('the CPU body model imports and constructs without DOM or WebGL', () => {
  assert.equal(typeof globalThis.window, 'undefined');
  assert.equal(typeof globalThis.document, 'undefined');
  const rig = makeRig();
  finite(rig.idlePose(0));
  assert.deepEqual(Object.keys(GAITS).sort(), ['run', 'walk']);
});

test('idle poses and matrices replay deterministically in independent rigs', () => {
  const left = makeRig();
  const right = makeRig();
  for (const time of [0, 1 / 60, 0.25, 1, 5]) {
    const a = left.idlePose(time);
    const b = right.idlePose(time);
    finite(a);
    assert.deepEqual(a, b);
    assert.deepEqual(left.matrices(a), right.matrices(b));
  }
});

for (const name of ['walk', 'run']) {
  test(`${name} CPU gait poses and matrices stay finite for a full cycle`, () => {
    const rig = makeRig();
    const gait = GAITS[name];
    assert.ok(gaitSpeed(gait) > 0);
    for (let tick = 0; tick <= 120; tick += 1) {
      const pose = rig.gaitPose(gait, tick / 120, gait.T * tick / 120);
      finite(pose);
      finite(rig.matrices(pose));
    }
  });
}

test('body mesh construction produces finite vertices and real triangles', () => {
  const meshes = buildMeshes(makeRig());
  assert.ok(Object.keys(meshes).length > 0);
  for (const mesh of Object.values(meshes)) {
    assert.ok(mesh.verts.length >= 3);
    assert.ok(mesh.tris.length >= 3);
    finite(mesh);
  }
});

// These are roundoff budgets for IEEE-754 rotation/composition on <=1000 px
// model coordinates, fixed before execution; they are not image tolerances.
const coordinateEpsilon = 1e-9;
const scalarEpsilon = 1e-12;
const bones = ['root', 'torso', 'head', 'armU', 'armL', 'farArmU', 'farArmL',
  'thighN', 'shinN', 'footN', 'thighF', 'shinF', 'footF'];
const ordinaryBones = bones.filter(name => !name.startsWith('farArm'));
const links = [
  ['root', 'torso'], ['torso', 'head'], ['torso', 'armU'], ['armU', 'armL'],
  ['root', 'thighN'], ['thighN', 'shinN'], ['shinN', 'footN'],
  ['root', 'thighF'], ['thighF', 'shinF'], ['shinF', 'footF'],
];

function close(actual, expected, epsilon = coordinateEpsilon, message = '') {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= epsilon,
    `${message}: expected ${expected}, got ${actual}`);
}

// Public rig.js header specifies the standard [a,b,c,d,e,f] affine format.
function point(matrix, [x, y]) {
  const [a, b, c, d, e, f] = matrix;
  return [a * x + c * y + e, b * x + d * y + f];
}

function neutral(root = [0, 0]) {
  return { a: Object.fromEntries(bones.map(name => [name, 0])), root,
    breath: 0, sway: 0 };
}

function checkRigid(matrix, name) {
  assert.equal(matrix.length, 6, `${name}: affine matrix has six coefficients`);
  finite(matrix);
  const [a, b, c, d] = matrix;
  close(a * a + b * b, 1, scalarEpsilon, `${name}: unit x axis`);
  close(c * c + d * d, 1, scalarEpsilon, `${name}: unit y axis`);
  close(a * c + b * d, 0, scalarEpsilon, `${name}: perpendicular axes`);
  close(a * d - b * c, 1, scalarEpsilon, `${name}: no mirror or scale`);
}

function checkSkeleton(matrices) {
  for (const bone of bones) {
    assert.ok(Object.hasOwn(matrices, bone), `${bone}: no missing bone matrix`);
    checkRigid(matrices[bone], bone);
  }
  for (const [parent, child] of links) {
    const pivot = fixture.joints[child];
    const a = point(matrices[parent], pivot);
    const b = point(matrices[child], pivot);
    close(a[0], b[0], coordinateEpsilon, `${parent}/${child}: shared joint x`);
    close(a[1], b[1], coordinateEpsilon, `${parent}/${child}: shared joint y`);
  }
}

test('a neutral pose preserves the rest pixels and applies the requested translation', () => {
  const rig = makeRig();
  const matrices = rig.matrices(neutral([17, -23]));
  for (const bone of ordinaryBones) {
    const matrix = matrices[bone];
    for (const [index, expected] of [[0, 1], [1, 0], [2, 0], [3, 1], [4, 17], [5, -23]]) {
      close(matrix[index], expected, scalarEpsilon, `${bone}: coefficient ${index}`);
    }
  }
  checkSkeleton(matrices);
});

test('a root quarter-turn rotates model-space vectors by ninety degrees', () => {
  const pose = neutral([7, -11]);
  pose.a.root = Math.PI / 2;
  const matrices = makeRig().matrices(pose);
  const first = fixture.joints.head;
  const second = fixture.joints.footN;
  const a = point(matrices.root, first);
  const b = point(matrices.root, second);
  // A quarter turn maps (dx,dy) to (-dy,dx). Vector differences cancel
  // translation and do not presume an undocumented root pivot location.
  close(b[0] - a[0], -(second[1] - first[1]));
  close(b[1] - a[1], second[0] - first[0]);
  checkSkeleton(matrices);
});

for (const bone of ordinaryBones.filter(name => name !== 'root')) {
  test(`${bone} articulation keeps the skeleton connected and rigid`, () => {
    const pose = neutral();
    pose.a[bone] = Math.PI / 3;
    const before = structuredClone(pose);
    const matrices = makeRig().matrices(pose);
    checkSkeleton(matrices);
    assert.deepEqual(pose, before, 'matrix evaluation does not rewrite the caller pose');
    const [a, b, c, d] = matrices[bone];
    close(a, 0.5, scalarEpsilon, `${bone}: cosine`);
    close(b, Math.sqrt(3) / 2, scalarEpsilon, `${bone}: sine`);
    close(c, -Math.sqrt(3) / 2, scalarEpsilon, `${bone}: negative sine`);
    close(d, 0.5, scalarEpsilon, `${bone}: cosine`);
  });
}

test('world translation moves every articulated bone by the same requested delta', () => {
  const rig = makeRig();
  const pose = neutral([9, -13]);
  for (const [index, bone] of bones.entries()) pose.a[bone] = (index - 6) / 20;
  const before = rig.matrices(pose);
  const translated = structuredClone(pose);
  translated.root[0] += 31;
  translated.root[1] -= 47;
  const after = rig.matrices(translated);
  checkSkeleton(before);
  checkSkeleton(after);
  for (const bone of bones) {
    for (let index = 0; index < 4; index += 1) close(after[bone][index], before[bone][index]);
    close(after[bone][4] - before[bone][4], 31);
    close(after[bone][5] - before[bone][5], -47);
  }
});

for (const name of ['walk', 'run']) {
  test(`${name} keeps articulated joints connected through a full cycle`, () => {
    const rig = makeRig();
    const gait = structuredClone(GAITS[name]);
    const before = structuredClone(gait);
    const states = [];
    for (let tick = 0; tick <= 60; tick += 1) {
      const pose = rig.gaitPose(gait, tick / 60, gait.T * tick / 60);
      assert.equal(pose.root.length, 2);
      for (const bone of bones) assert.ok(Number.isFinite(pose.a[bone]), `${bone}: finite angle`);
      checkSkeleton(rig.matrices(pose));
      states.push(pose);
    }
    assert.notDeepEqual(states[0].a, states[15].a, 'the gait actually articulates its bones');
    assert.deepEqual(gait, before, 'evaluating the gait does not modify the caller preset');
  });
}

test('idle motion is live while every joint remains connected', () => {
  const rig = makeRig();
  const start = rig.idlePose(0);
  const next = rig.idlePose(0.5);
  assert.notDeepEqual(next, start, 'idle must breathe or sway instead of freezing');
  for (const time of [0, 0.5, 1, 3, 7]) checkSkeleton(rig.matrices(rig.idlePose(time)));
});

test('gait speed scales with stride span and inversely with elapsed time', () => {
  // A half-span of 25 model pixels crosses 50 px in a one-second stance
  // (T=2 seconds, stance fraction=1/2): distance / time = 50 px/s.
  const gait = { L: 25, T: 2, stance: 0.5 };
  assert.equal(gaitSpeed(gait), 50);
  assert.equal(gaitSpeed({ ...gait, L: 50 }), 100);
  assert.equal(gaitSpeed({ ...gait, T: 4 }), 25);
  assert.equal(gaitSpeed({ ...gait, stance: 1 }), 25);
  assert.deepEqual(gait, { L: 25, T: 2, stance: 0.5 });
});

const meshParts = {
  legN: ['legN', ['thighN', 'shinN', 'footN']],
  legF: ['legF', ['thighF', 'shinF', 'footF']],
  arm: ['arm', ['armU', 'armL']],
  farArm: ['arm', ['farArmU', 'farArmL']],
  torso: ['torso', ['torso', 'root']],
  head: ['head', ['head', 'torso']],
};

for (const [meshName, [partName, influences]] of Object.entries(meshParts)) {
  test(`${meshName} mesh tiles its atlas rectangle with valid normalized skinning`, () => {
    const rig = makeRig();
    const mesh = buildMeshes(rig)[meshName];
    const part = fixture.parts[partName];
    const [atlasX, atlasY, width, height] = part.rect;
    const [originX, originY] = part.origin;
    assert.ok(mesh, `${meshName}: required body mesh exists`);
    assert.ok(mesh.verts.length >= 4);
    assert.ok(mesh.tris.length >= 6);
    assert.equal(mesh.tris.length % 3, 0, 'triangle indices form complete triples');
    const positiveInfluences = new Set();
    for (const vertex of mesh.verts) {
      finite(vertex);
      assert.ok(vertex.x >= originX && vertex.x <= originX + width);
      assert.ok(vertex.y >= originY && vertex.y <= originY + height);
      close(vertex.u - atlasX, vertex.x - originX);
      close(vertex.v - atlasY, vertex.y - originY);
      let sum = 0;
      for (const [bone, weight] of vertex.w) {
        assert.ok(influences.includes(bone), `${meshName}: correct skeleton influence`);
        assert.ok(Number.isFinite(weight) && weight >= 0 && weight <= 1);
        if (weight > 0) positiveInfluences.add(bone);
        sum += weight;
      }
      close(sum, 1, scalarEpsilon, 'skinning weights form a partition of unity');
    }
    for (const bone of influences) assert.ok(positiveInfluences.has(bone), `${bone}: used influence`);
    close(Math.min(...mesh.verts.map(v => v.x)), originX);
    close(Math.max(...mesh.verts.map(v => v.x)), originX + width);
    close(Math.min(...mesh.verts.map(v => v.y)), originY);
    close(Math.max(...mesh.verts.map(v => v.y)), originY + height);
    const used = new Set();
    const triangles = new Set();
    let area = 0;
    for (let index = 0; index < mesh.tris.length; index += 3) {
      const indices = mesh.tris.slice(index, index + 3);
      assert.equal(new Set(indices).size, 3, 'triangle references three distinct vertices');
      for (const vertexIndex of indices) {
        assert.ok(Number.isInteger(vertexIndex) && vertexIndex >= 0 && vertexIndex < mesh.verts.length);
        used.add(vertexIndex);
      }
      const key = [...indices].sort((a, b) => a - b).join(',');
      assert.ok(!triangles.has(key), 'no repeated triangle');
      triangles.add(key);
      const [a, b, c] = indices.map(i => mesh.verts[i]);
      const twiceArea = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      assert.ok(Math.abs(twiceArea) > scalarEpsilon, 'no zero-area triangle');
      area += Math.abs(twiceArea) / 2;
    }
    assert.equal(used.size, mesh.verts.length, 'no unreferenced vertices');
    // Summation roundoff for at most 1000 small triangles in pixel units.
    close(area, width * height, 1e-7, 'triangles cover the whole texture rectangle');
  });
}

test('pose evaluation and mesh generation preserve the shared rest-pose data', () => {
  const data = structuredClone(fixture);
  const original = structuredClone(data);
  const rig = new Rig(data);
  rig.matrices(rig.idlePose(1));
  rig.matrices(rig.gaitPose(GAITS.walk, 0.25, GAITS.walk.T / 4));
  buildMeshes(rig);
  assert.deepEqual(data, original);
});

for (const name of ['walk', 'run']) {
  test(`${name} preset identifies the public gait it selects`, () => {
    assert.equal(GAITS[name].name, name);
  });
}

function blendInputs() {
  return [
    { a: { root: 0, torso: 0 }, root: [0, 0], breath: 0, sway: 0 },
    { a: { root: 1, torso: 2 }, root: [8, -12], breath: 1, sway: 4 },
  ];
}

for (const endpoint of [0, 1]) {
  test(`public static pose blend preserves endpoint ${endpoint}`, () => {
    const inputs = blendInputs();
    const before = structuredClone(inputs);
    const result = Rig.blend(...inputs, endpoint);
    assert.deepEqual(result, before[endpoint]);
    assert.deepEqual(inputs, before, 'blending leaves both caller poses intact');
  });
}

test('public static pose blend interpolates every numeric channel halfway', () => {
  const inputs = blendInputs();
  assert.deepEqual(Rig.blend(...inputs, 0.5), {
    a: { root: 0.5, torso: 1 }, root: [4, -6], breath: 0.5, sway: 2,
  });
});

test('public static pose blending does not modify or alias caller poses', () => {
  const inputs = blendInputs();
  const before = structuredClone(inputs);
  const output = Rig.blend(...inputs, 0.5);
  assert.deepEqual(inputs, before);
  output.a.root = 99;
  output.root[0] = 99;
  assert.deepEqual(inputs, before, 'editing the blended pose leaves both inputs intact');
});
