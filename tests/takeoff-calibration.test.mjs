import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TAKEOFF, analyzeTakeoff, torsoPitch, hipHeight,
} from '../skills/toon2d-runtime-animation/scripts/takeoff.mjs';

// Issue #13 and reference/review-rubric.md: independent synthetic probes of
// the advisory contract, not clean/cluttered artwork ratings or a gate change.
function pose({ tick = 0, state = 'idle', height = 100, pitch = 0,
  facing = 1, grounded = true, events = [] } = {}) {
  return {
    tick, state, facing, grounded, events,
    root: { x: 200, y: 300, vx: 0, vy: grounded ? 0 : -100 },
    joints: [
      { name: 'hip', x: 200, y: 300 - height, ex: 200, ey: 300 - height },
      { name: 'spine', x: 200, y: 300 - height,
        ex: 200 + facing * 20 * Math.sin(pitch * Math.PI / 180),
        ey: 300 - height - 20 * Math.cos(pitch * Math.PI / 180) },
    ],
  };
}

function recording({ height = 60, pitch = 20,
  launch = [20, 18, 16, 14, 12, 10, 8, 5], facing = 1 } = {}) {
  return [
    pose({ height: 180, facing }),
    pose({ tick: 1, facing }),
    pose({ tick: 2, state: 'crouch', height, pitch, facing, events: ['crouch'] }),
    ...launch.map((angle, i) => pose({ tick: i + 3, state: 'jump', height,
      pitch: angle, facing, grounded: false, events: i === 0 ? ['jump'] : [] })),
  ];
}

function checkPass(states, id, expected, options) {
  const result = analyzeTakeoff(states, options);
  assert.equal(result.checks.find((check) => check.id === `jump.${id}`)?.pass,
    expected, JSON.stringify(result));
  return result;
}

test('calibration: literal published defaults cannot drift with their test inputs', () => {
  assert.deepEqual(TAKEOFF, {
    crouchLeanMin: 5, crouchLeanMax: 30, launchLeanMax: 30,
    launchSettleMax: 15, launchLeanBackMax: 15, launchTicks: 8, crouchDepthMin: 0.15,
  });
});

for (const facing of [1, -1]) {
  test(`calibration: literal rubric examples discriminate crouch lean, facing ${facing}`, () => {
    for (const pitch of [5.1, 20, 29.9]) {
      checkPass(recording({ pitch, facing }), 'crouch_lean', true);
    }
    for (const pitch of [4.9, 30.1, 40]) {
      checkPass(recording({ pitch, facing }), 'crouch_lean', false);
    }
  });

  test(`calibration: literal launch and settle probes, facing ${facing}`, () => {
    for (const [angle, pass] of [[29.9, true], [30.1, false], [-14.9, true], [-15.1, false]]) {
      checkPass(recording({ facing, launch: [angle, 20, 18, 16, 14, 12, 10, 5] }),
        'launch_lean', pass);
    }
    for (const [angle, pass] of [[14.9, true], [15.1, false], [25, false]]) {
      checkPass(recording({ facing, launch: [20, 18, 16, 14, 12, 10, 8, angle] }),
        'launch_unwind', pass);
    }
  });
}

test('calibration: 15% crouch depth is measured against the immediately preceding standing pose', () => {
  for (const [height, pass] of [[84, true], [86, false]]) {
    const result = checkPass(recording({ height }), 'crouch_depth', pass);
    assert.ok(Math.abs(result.metrics.crouchDepth - (100 - height) / 100) < 1e-12);
  }
});

test('calibration: explicit standing baseline overrides the recorded baseline', () => {
  const states = recording({ height: 86 });
  checkPass(states, 'crouch_depth', false);
  const result = checkPass(states, 'crouch_depth', true, { standHip: 200 });
  assert.ok(Math.abs(result.metrics.crouchDepth - 0.57) < 1e-12);
});

test('calibration: launch window has eight samples and excludes a later dive', () => {
  const eight = recording();
  assert.equal(analyzeTakeoff(eight).pass, true);
  checkPass(eight.slice(0, -1), 'launch_unwind', false);
  const nine = [...eight, pose({ tick: 11, state: 'jump', grounded: false, pitch: 45 })];
  assert.deepEqual(analyzeTakeoff(nine), analyzeTakeoff(eight));
});

test('calibration: supplied thresholds permit a separate three-tick advisory probe', () => {
  const states = recording({ launch: [20, 15, 5] });
  checkPass(states, 'launch_unwind', false);
  const result = analyzeTakeoff(states, {
    label: 'probe',
    t: { crouchLeanMin: 10, crouchLeanMax: 25, crouchDepthMin: 0.25,
      launchLeanMax: 25, launchLeanBackMax: 10, launchSettleMax: 10, launchTicks: 3 },
  });
  assert.equal(result.pass, true, JSON.stringify(result));
  assert.deepEqual(result.checks.map(({ id }) => id), [
    'probe.crouch_lean', 'probe.crouch_depth', 'probe.launch_lean', 'probe.launch_unwind',
  ]);
  assert.equal(result.metrics.launchLean.length, 3);
});

test('calibration: translation and uniform scale preserve pitch and normalized depth', () => {
  const original = recording();
  const moved = structuredClone(original);
  for (const state of moved) {
    for (const point of [state.root, ...state.joints]) {
      point.x = point.x * 3 - 1000;
      point.y = point.y * 3 + 2000;
      if ('ex' in point) point.ex = point.ex * 3 - 1000;
      if ('ey' in point) point.ey = point.ey * 3 + 2000;
    }
  }
  assert.ok(Math.abs(torsoPitch(moved[2]) - 20) < 1e-10);
  assert.equal(hipHeight(moved[2]), 180);
  const result = analyzeTakeoff(moved);
  assert.equal(result.pass, true, JSON.stringify(result));
  assert.ok(Math.abs(result.metrics.crouchDepth - 0.4) < 1e-12);
});

test('calibration: pure analysis accepts frozen snapshots and leaves them intact', () => {
  const states = recording();
  const original = structuredClone(states);
  for (const state of states) {
    state.joints.forEach(Object.freeze);
    Object.freeze(state.joints);
    Object.freeze(state.root);
    Object.freeze(state.events);
    Object.freeze(state);
  }
  Object.freeze(states);
  assert.equal(analyzeTakeoff(states).pass, true);
  assert.deepEqual(states, original);
});

test('calibration: exact zero-degree custom limits include an upright pose', () => {
  const result = analyzeTakeoff(recording({ pitch: 0, launch: Array(8).fill(0) }), {
    t: { crouchLeanMin: 0, crouchLeanMax: 0, crouchDepthMin: 0.15,
      launchLeanMax: 0, launchLeanBackMax: 0, launchSettleMax: 0, launchTicks: 8 },
  });
  assert.equal(result.pass, true, JSON.stringify(result));
  assert.equal(result.metrics.crouchLean, 0);
  assert.deepEqual(result.metrics.launchLean, Array(8).fill(0));
});

test('calibration: crouch lean belongs to the deepest pose, independent of its position', () => {
  for (const heights of [[60, 90], [90, 60]]) {
    const states = recording();
    states.splice(2, 1, ...heights.map((height, i) => pose({
      tick: i + 2, state: 'crouch', height, pitch: height === 60 ? 20 : 40,
      events: i === 0 ? ['crouch'] : [],
    })));
    const result = analyzeTakeoff(states);
    assert.equal(result.pass, true, JSON.stringify(result));
    assert.ok(Math.abs(result.metrics.crouchLean - 20) < 1e-10);
    assert.ok(Math.abs(result.metrics.crouchDepth - 0.4) < 1e-12);
    assert.equal(result.metrics.crouchTicks, 2);
  }
});

test('calibration: a recording starting at launch still measures its airborne window', () => {
  const result = analyzeTakeoff(recording().slice(3), { standHip: 100 });
  assert.equal(result.pass, false, 'missing crouch cannot be certified');
  assert.deepEqual(result.checks.map(({ id, pass }) => ({ id, pass })), [
    { id: 'jump.crouch', pass: false },
    { id: 'jump.launch_lean', pass: true },
    { id: 'jump.launch_unwind', pass: true },
  ]);
});

test('calibration: unavailable or zero standing geometry cannot certify crouch depth', () => {
  for (const base of [null, 0]) {
    const states = recording();
    states[1] = base === null ? { ...states[1], root: null } : pose({ tick: 1, height: 0 });
    const result = checkPass(states, 'crouch_depth', false);
    assert.equal(result.metrics.crouchDepth, null);
  }
  const states = recording();
  states[2].joints = [];
  const result = analyzeTakeoff(states);
  assert.equal(result.metrics.crouchLean, null);
  assert.equal(result.metrics.crouchDepth, null);
  checkPass(states, 'crouch_lean', false);
  checkPass(states, 'crouch_depth', false);
});

test('calibration: healthy and missing-geometry reports keep actionable diagnostics', () => {
  const noSpine = recording();
  for (const state of noSpine) state.joints = [];
  for (const states of [recording(), noSpine, []]) {
    for (const { detail } of analyzeTakeoff(states).checks) {
      assert.equal(typeof detail, 'string');
      assert.ok(detail.trim().length > 0, 'diagnostic may not disappear');
    }
  }
});

test('calibration: zero custom minima still require actual crouch geometry', () => {
  const states = recording();
  states[2].joints = [];
  const result = analyzeTakeoff(states, {
    t: { crouchLeanMin: 0, crouchLeanMax: 30, crouchDepthMin: 0,
      launchLeanMax: 30, launchLeanBackMax: 15, launchSettleMax: 15, launchTicks: 8 },
  });
  assert.equal(result.checks.find(({ id }) => id === 'jump.crouch_lean').pass, false);
  assert.equal(result.checks.find(({ id }) => id === 'jump.crouch_depth').pass, false);
});
