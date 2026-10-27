import test from 'node:test';
import assert from 'node:assert/strict';
import * as starter from '../skills/toon2d-runtime-animation/templates/starter/engine/physics.js';
import * as play from '../docs/play/engine/physics.js';

const dt = 1 / 60;
const level = { floorY: 100 };
const tolerance = 1e-9;
const maxTicks = 120;

function assertClose(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `${message}: expected ${expected}, got ${actual}`);
}

function launch(engine, releaseAtImpulse = false) {
  let body = engine.createBody(0, 100);
  for (let tick = 0; tick < maxTicks; tick += 1) {
    // The pending crouch counts down before launchJump reads this tick's input.
    // Keep holding on every earlier crouch tick; release on the impulse step.
    const release = releaseAtImpulse && body.pendingJump && body.squat === 1;
    const input = { jump: !release };
    const result = engine.stepBody(body, input, dt, level);
    body = result.body;
    if (result.events.includes('jump')) {
      assert.equal(input.jump, !releaseAtImpulse, 'launch sees the intended button state');
      assert.equal(body.grounded, false, 'launch leaves the floor');
      assert.ok(body.vy < 0, 'launch is rising');
      return body;
    }
    assert.equal(input.jump, true, 'button stays held until the jump event tick');
    assert.equal(body.grounded, true, 'take-off crouch stays on the floor');
  }
  assert.fail('jump event did not fire within the tick limit');
}

function apexHeight(engine, launchBody, jump) {
  let body = launchBody;
  let highestY = body.y;
  for (let tick = 0; tick < maxTicks; tick += 1) {
    const previousVy = body.vy;
    const result = engine.stepBody(body, { jump }, dt, level);
    body = result.body;
    assert.equal(result.events.includes('jump'), false, 'no second launch before apex');
    assertClose(body.vy, previousVy + engine.PHYS.gravity * dt,
      'unchanged button state applies gravity without another cut');
    highestY = Math.min(highestY, body.y);
    if (body.vy >= 0) return level.floorY - highestY;
  }
  assert.fail('apex was not reached within the tick limit');
}

test('both engine copies export identical PHYS values', () => {
  assert.deepEqual(starter.PHYS, play.PHYS);
});

for (const [name, engine] of [['starter', starter], ['docs/play', play]]) {
  const { PHYS, stepBody } = engine;

  test(`${name}: tap at impulse applies exactly one cut and has a lower apex`, () => {
    const body = launch(engine, true);
    const expectedVy = -PHYS.jumpV * PHYS.cut + PHYS.gravity * dt;
    const doubleCutVy = -PHYS.jumpV * PHYS.cut * PHYS.cut + PHYS.gravity * dt;
    assertClose(body.vy, expectedVy, 'tap launch applies one cut before gravity');
    assert.ok(Math.abs(body.vy - doubleCutVy) > tolerance,
      'tap launch must not stack two cuts');

    const tapApex = apexHeight(engine, body, false);
    const holdApex = apexHeight(engine, launch(engine), true);
    assert.ok(tapApex > 0, 'tap leaves the floor');
    assert.ok(tapApex < holdApex, 'tap apex is lower than full-hold apex');
  });

  test(`${name}: holding through apex launches at full jump speed without a cut`, () => {
    const body = launch(engine);
    assertClose(body.vy, -PHYS.jumpV + PHYS.gravity * dt,
      'held launch applies full jumpV before gravity');
    assert.ok(apexHeight(engine, body, true) > 0, 'held jump reaches an apex');
  });

  test(`${name}: mid-air release cuts once on release and never on later ticks`, () => {
    let body = launch(engine);
    for (let tick = 0; tick < 3; tick += 1) {
      const previousVy = body.vy;
      const result = stepBody(body, { jump: true }, dt, level);
      body = result.body;
      assert.equal(result.events.includes('jump'), false, 'held air ticks do not launch again');
      assertClose(body.vy, previousVy + PHYS.gravity * dt,
        'holding after launch does not cut velocity');
    }

    assert.ok(body.vy < 0, 'release happens while still rising');
    const previousVy = body.vy;
    const result = stepBody(body, { jump: false }, dt, level);
    body = result.body;
    assert.equal(result.events.includes('jump'), false, 'release is after the launch event');
    assertClose(body.vy, previousVy * PHYS.cut + PHYS.gravity * dt,
      'release applies exactly one cut before gravity');
    assert.ok(body.vy < 0, 'there are rising ticks after release to check for repeated cuts');

    apexHeight(engine, body, false);
  });
}
