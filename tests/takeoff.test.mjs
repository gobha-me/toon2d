import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TAKEOFF, torsoPitch, hipHeight, analyzeTakeoff, takeoff,
} from '../skills/toon2d-runtime-animation/scripts/takeoff.mjs';

const standingHip = 100;
const tolerance = 1e-9;
const epsilon = 1e-6;
const checkNames = ['crouch_lean', 'crouch_depth', 'launch_lean', 'launch_unwind'];

function assertClose(actual, expected, message) {
  assert.equal(typeof actual, 'number', message);
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `${message}: expected ${expected}, got ${actual}`);
}

function snapshot({
  tick = 0, state = 'idle', facing = 1, grounded = true,
  pitch = 0, height = standingHip, events = [],
} = {}) {
  const y = grounded ? 100 : 100 - tick * 2;
  const hipY = y - height;
  return {
    tick,
    state,
    facing,
    grounded,
    root: { x: 0, y, vx: 0, vy: grounded ? 0 : -120 },
    joints: [
      { name: 'hip', x: 0, y: hipY, ex: 0, ey: hipY },
      // A unit vertical span keeps the requested pitch independent of hip height.
      { name: 'spine', x: 0, y: hipY, ex: facing * Math.tan(pitch * Math.PI / 180), ey: hipY - 1 },
    ],
    events,
  };
}

function jumpStates({
  facing = 1, crouchPitch = 20, depth = 0.4,
  launchPitches = Array.from({ length: TAKEOFF.launchTicks },
    (_, i) => 20 - 15 * i / (TAKEOFF.launchTicks - 1)),
} = {}) {
  const states = [snapshot({ facing })];
  for (let i = 0; i < 6; i += 1) {
    states.push(snapshot({
      tick: states.length, state: 'crouch', facing, pitch: crouchPitch,
      height: standingHip * (1 - depth * (i + 1) / 6),
      events: i === 0 ? ['crouch'] : [],
    }));
  }
  for (const [i, pitch] of launchPitches.entries()) {
    states.push(snapshot({
      tick: states.length, state: 'jump', facing, grounded: false, pitch,
      events: i === 0 ? ['jump'] : [],
    }));
  }
  return states;
}

function assertChecks(result, failed = []) {
  const expected = Object.fromEntries(checkNames.map((id) => [`jump.${id}`, !failed.includes(id)]));
  assert.equal(result.checks.length, checkNames.length, 'all four checks are reported');
  assert.deepEqual(Object.fromEntries(result.checks.map(({ id, pass }) => [id, pass])), expected);
  assert.equal(result.pass, failed.length === 0, JSON.stringify(result.checks));
}

for (const facing of [1, -1]) {
  test(`torsoPitch: forward is positive and backward is negative when facing ${facing}`, () => {
    assertClose(torsoPitch(snapshot({ facing, pitch: 20 })), 20, 'forward lean');
    assertClose(torsoPitch(snapshot({ facing })), 0, 'upright spine');
    assertClose(torsoPitch(snapshot({ facing, pitch: -20 })), -20, 'backward lean');
  });

  test(`analyzeTakeoff: healthy crouch and unwinding jump pass when facing ${facing}`, () => {
    const result = analyzeTakeoff(jumpStates({ facing }));
    assertChecks(result);
    assert.equal(result.metrics.crouchTicks, 6);
    assertClose(result.metrics.crouchLean, 20, 'crouch lean');
    assertClose(result.metrics.crouchDepth, 0.4, '40% hip drop');
    assert.equal(result.metrics.launchLean.length, TAKEOFF.launchTicks);
    assertClose(result.metrics.launchLean[0], 20, 'initial airborne lean');
    assertClose(result.metrics.launchLean.at(-1), 5, 'settled airborne lean');
  });
}

test('hipHeight: measures hip above root, falls back to spine, and rejects missing geometry', () => {
  const state = snapshot({ height: 60 });
  state.joints.find(({ name }) => name === 'spine').y += 10;
  assert.equal(hipHeight(state), 60, 'hip takes precedence over spine');
  state.joints = state.joints.filter(({ name }) => name !== 'hip');
  assert.equal(hipHeight(state), 50, 'spine start is the fallback');
  assert.equal(hipHeight({ ...state, root: null }), null, 'root is required');
  assert.equal(hipHeight({ ...state, joints: [] }), null, 'a hip or spine is required');
});

test('analyzeTakeoff: a 40-45 degree dive fails launch_lean despite settling', () => {
  const launchPitches = Array.from({ length: TAKEOFF.launchTicks }, (_, i) => i % 2 ? 45 : 40);
  launchPitches[launchPitches.length - 1] = 5;
  assertChecks(analyzeTakeoff(jumpStates({ launchPitches })), ['launch_lean']);
});

test('analyzeTakeoff: eight airborne ticks at 25 degrees fail launch_unwind', () => {
  const launchPitches = Array(TAKEOFF.launchTicks).fill(25);
  assertChecks(analyzeTakeoff(jumpStates({ launchPitches })), ['launch_unwind']);
});

test('analyzeTakeoff: fewer than the required airborne ticks fail launch_unwind', () => {
  const states = jumpStates({ launchPitches: Array(TAKEOFF.launchTicks - 1).fill(5) });
  assertChecks(analyzeTakeoff(states), ['launch_unwind']);
  states.push(snapshot({ tick: states.length, state: 'land' }));
  assertChecks(analyzeTakeoff(states), ['launch_unwind']);
});

test('analyzeTakeoff: a 5% hip drop fails crouch_depth', () => {
  assertChecks(analyzeTakeoff(jumpStates({ depth: 0.05 })), ['crouch_depth']);
});

test('analyzeTakeoff: a 40 degree bow fails crouch_lean', () => {
  assertChecks(analyzeTakeoff(jumpStates({ crouchPitch: 40 })), ['crouch_lean']);
});

test('analyzeTakeoff: missing crouch event fails the crouch check', () => {
  const states = jumpStates();
  states[1].events = [];
  const result = analyzeTakeoff(states);
  assert.equal(result.pass, false);
  assert.equal(result.metrics.crouchTicks, 0);
  assert.deepEqual(result.checks.map(({ id, pass }) => ({ id, pass })), [
    { id: 'jump.crouch', pass: false },
    { id: 'jump.launch_lean', pass: true },
    { id: 'jump.launch_unwind', pass: true },
  ]);
});

test('analyzeTakeoff: missing jump event fails launch, including an empty recording', () => {
  const states = jumpStates();
  for (const state of states) state.events = state.events.filter((event) => event !== 'jump');
  for (const recording of [states, []]) {
    const result = analyzeTakeoff(recording);
    assert.equal(result.pass, false);
    assert.deepEqual(result.checks.map(({ id, pass }) => ({ id, pass })), [
      { id: 'jump.launch', pass: false },
    ]);
  }
});

test('analyzeTakeoff: accepts event objects and an explicit standing hip baseline', () => {
  const states = jumpStates().slice(1);
  for (const state of states) state.events = state.events.map((type) => ({ type }));
  assertChecks(analyzeTakeoff(states, { standHip: standingHip }));
});

test('torsoPitch and analyzeTakeoff: missing spine fails rather than passing', () => {
  const states = jumpStates();
  for (const state of states) state.joints = state.joints.filter(({ name }) => name !== 'spine');
  assert.equal(torsoPitch(states[0]), null);
  assertChecks(analyzeTakeoff(states), ['crouch_lean', 'launch_lean', 'launch_unwind']);
});

test('analyzeTakeoff: one missing airborne spine prevents a complete unwind window', () => {
  const states = jumpStates();
  states.at(-1).joints = states.at(-1).joints.filter(({ name }) => name !== 'spine');
  assertChecks(analyzeTakeoff(states), ['launch_unwind']);
});

const boundaries = [
  {
    name: 'minimum crouch lean', check: 'crouch_lean', limit: TAKEOFF.crouchLeanMin, beyond: -epsilon,
    options: (value) => ({ crouchPitch: value }),
  },
  {
    name: 'maximum crouch lean', check: 'crouch_lean', limit: TAKEOFF.crouchLeanMax, beyond: epsilon,
    options: (value) => ({ crouchPitch: value }),
  },
  {
    name: 'minimum crouch depth', check: 'crouch_depth', limit: TAKEOFF.crouchDepthMin, beyond: -epsilon,
    options: (value) => ({ depth: value }),
  },
  {
    name: 'maximum forward launch lean', check: 'launch_lean', limit: TAKEOFF.launchLeanMax, beyond: epsilon,
    options: (value) => ({ launchPitches: [value, ...Array(TAKEOFF.launchTicks - 1).fill(5)] }),
  },
  {
    name: 'maximum backward launch lean', check: 'launch_lean', limit: -TAKEOFF.launchLeanBackMax, beyond: -epsilon,
    options: (value) => ({ launchPitches: [value, ...Array(TAKEOFF.launchTicks - 1).fill(5)] }),
  },
  {
    name: 'maximum settled launch lean', check: 'launch_unwind', limit: TAKEOFF.launchSettleMax, beyond: epsilon,
    options: (value) => ({ launchPitches: [...Array(TAKEOFF.launchTicks - 1).fill(20), value] }),
  },
];

for (const { name, check, limit, beyond, options } of boundaries) {
  test(`analyzeTakeoff: ${name} passes at the TAKEOFF limit and fails just beyond`, () => {
    assertChecks(analyzeTakeoff(jumpStates(options(limit))));
    assertChecks(analyzeTakeoff(jumpStates(options(limit + beyond))), [check]);
  });
}

test('takeoff: real starter passes all eight standing and running jump checks', { timeout: 120000 }, async () => {
  const starter = new URL('../skills/toon2d-runtime-animation/templates/starter/', import.meta.url);
  const result = await takeoff(starter.pathname);
  assert.equal(result.pass, true, JSON.stringify(result.checks));
  assert.equal(result.checks.length, 8);
  const expectedIds = ['stand', 'run'].flatMap((label) => checkNames.map((id) => `${label}.${id}`));
  assert.deepEqual(result.checks.map(({ id }) => id).sort(), expectedIds.sort());
  for (const check of result.checks) assert.equal(check.pass, true, `${check.id}: ${check.detail}`);
});
