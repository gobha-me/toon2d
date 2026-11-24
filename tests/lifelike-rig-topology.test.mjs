import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { Rig, buildMeshes } from '../prototypes/lifelike/prototype/rig.js';

// Issue #37: the documented skinned grid meshes must form rectangular surfaces.
// Edge incidence detects holes/overlap that equal summed triangle area misses.
const fixture = JSON.parse(readFileSync(new URL('../prototypes/lifelike/prototype/body-rig.json', import.meta.url)));
const parts = { legN: 'legN', legF: 'legF', arm: 'arm', farArm: 'arm',
  torso: 'torso', head: 'head' };
// Same pre-existing IEEE-754 model-coordinate budget as the body smoke suite.
const coordinateEpsilon = 1e-9;

function onSameBoundary(a, b, left, top, right, bottom) {
  return [[a.x, b.x, left], [a.x, b.x, right],
    [a.y, b.y, top], [a.y, b.y, bottom]]
    .some(([first, second, boundary]) => Math.abs(first - boundary) <= coordinateEpsilon
      && Math.abs(second - boundary) <= coordinateEpsilon);
}

function edgeKey(a, b) {
  // Geometric endpoints make the property independent of vertex numbering and
  // triangle winding. Either diagonal of each rectangular cell is permitted.
  return [JSON.stringify([a.x, a.y]), JSON.stringify([b.x, b.y])].sort().join('|');
}

for (const [meshName, partName] of Object.entries(parts)) {
  test(`${meshName} grid has one boundary face and two interior faces per edge`, () => {
    const mesh = buildMeshes(new Rig(structuredClone(fixture)))[meshName];
    const [left, top] = fixture.parts[partName].origin;
    const [, , width, height] = fixture.parts[partName].rect;
    const right = left + width;
    const bottom = top + height;
    assert.ok(mesh, 'the documented body part has a real mesh');
    assert.ok(mesh.verts.length >= 4);
    assert.ok(mesh.tris.length >= 6);
    assert.equal(mesh.tris.length % 3, 0);
    const edges = new Map();
    for (let index = 0; index < mesh.tris.length; index += 3) {
      const indices = mesh.tris.slice(index, index + 3);
      assert.equal(new Set(indices).size, 3, 'triangle has three distinct indices');
      for (const vertexIndex of indices) {
        assert.ok(Number.isInteger(vertexIndex) && vertexIndex >= 0 && vertexIndex < mesh.verts.length);
      }
      const vertices = indices.map(vertexIndex => mesh.verts[vertexIndex]);
      for (const vertex of vertices) {
        assert.ok(Number.isFinite(vertex.x) && Number.isFinite(vertex.y));
        assert.ok(vertex.x >= left - coordinateEpsilon && vertex.x <= right + coordinateEpsilon);
        assert.ok(vertex.y >= top - coordinateEpsilon && vertex.y <= bottom + coordinateEpsilon);
      }
      for (let side = 0; side < 3; side += 1) {
        const a = vertices[side];
        const b = vertices[(side + 1) % 3];
        const key = edgeKey(a, b);
        assert.notDeepEqual([a.x, a.y], [b.x, b.y], 'edge has distinct geometric endpoints');
        const edge = edges.get(key) ?? { a, b, count: 0 };
        edge.count += 1;
        edges.set(key, edge);
      }
    }
    let boundaryEdges = 0;
    let interiorEdges = 0;
    for (const [key, { a, b, count }] of edges) {
      const boundary = onSameBoundary(a, b, left, top, right, bottom);
      assert.equal(count, boundary ? 1 : 2, `${key}: ${boundary ? 'boundary' : 'interior'} incidence`);
      if (boundary) boundaryEdges += 1;
      else interiorEdges += 1;
    }
    assert.ok(boundaryEdges >= 4, 'a rectangle has a nonempty boundary on four sides');
    assert.ok(interiorEdges > 0, 'real triangulation has shared interior edges');
  });
}
