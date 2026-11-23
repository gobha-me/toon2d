import assert from 'node:assert/strict';
import test from 'node:test';
import { FaceSim } from '../prototypes/lifelike/prototype/face.js';

// Issue #37 asks for a focused prototypes/** smoke check. Expectations come
// from the public fixed-dt behavior, expression-key header and README/LESSONS
// speech, gaze, breath and pain contracts. No renderer or artwork is loaded.
const dt = 1 / 60;

function manualSim() {
  const sim = new FaceSim();
  // The public script flag selects the automatic gambit reel. Manual controls
  // need that scheduler disabled so it cannot overwrite the caller's inputs.
  sim.script = false;
  return sim;
}

function advance(sim, ticks) {
  for (let tick = 0; tick < ticks; tick += 1) sim.step(dt);
  return sim.state();
}

function finiteState(value, path = 'state') {
  if (typeof value === 'number') {
    assert.ok(Number.isFinite(value), `${path} must be finite`);
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) finiteState(child, `${path}.${key}`);
  }
}

function boundedState(state) {
  finiteState(state);
  for (const weights of [state.wu, state.wl]) {
    assert.equal(weights.length, 7, 'six expression/air keys plus the pain key');
    for (const weight of weights) assert.ok(weight >= 0 && weight <= 1);
  }
  for (const key of ['talk', 'blink', 'pain']) {
    assert.ok(state[key] >= 0 && state[key] <= 1, `${key} is a blend fraction`);
  }
  assert.ok(state.headS > 0, 'head scale stays positive');
  assert.ok(state.breathAmp > 0, 'breathing amplitude stays positive');
}

function inputAt(sim, tick) {
  if (tick === 0) sim.setExpr('happy');
  if (tick === 15) sim.setSpeech('yell');
  if (tick === 45) sim.hit(0.7, -1);
  if (tick === 60) sim.setBreath(0.9);
  if (tick === 90) sim.glance(-1);
  if (tick === 120) sim.setHurt(0.6);
  if (tick === 150) sim.setSpeech('off');
  if (tick === 180) sim.setExpr('sad');
  if (tick === 210) sim.setBreath(0);
  if (tick === 240) sim.setHurt(0);
}

test('the CPU face model imports and constructs without browser globals', () => {
  assert.equal(typeof globalThis.document, 'undefined');
  assert.equal(typeof globalThis.window, 'undefined');
  const sim = manualSim();
  boundedState(sim.state());
  assert.equal(sim.t, 0);
  assert.equal(sim.state().talk, 0, 'initial speech is quiet');
  assert.equal(sim.state().pain, 0, 'initial face is uninjured');
});

test('120 fixed ticks advance two seconds and produce live idle motion', () => {
  const sim = manualSim();
  const initial = structuredClone(sim.state());
  const after = advance(sim, 120);
  assert.ok(Math.abs(sim.t - 2) < 1e-12);
  assert.notDeepEqual(after, initial, 'idle behavior must advance, not freeze');
  boundedState(after);
});

test('the same ordered public inputs replay identically in independent models', () => {
  const left = manualSim();
  const right = manualSim();
  for (let tick = 0; tick < 300; tick += 1) {
    inputAt(left, tick);
    inputAt(right, tick);
    left.step(dt);
    right.step(dt);
    assert.deepEqual(left.state(), right.state(), `replay diverged at tick ${tick}`);
    boundedState(left.state());
  }
});

test('one model cannot change another model through expression or hit state', () => {
  const active = manualSim();
  const untouched = manualSim();
  const before = structuredClone(untouched.state());
  active.setExpr('angry');
  active.hit(1);
  advance(active, 30);
  assert.notDeepEqual(active.state(), before);
  assert.deepEqual(untouched.state(), before);
  assert.equal(untouched.t, 0);
});

test('reset removes old events and reproduces the next ordered replay', () => {
  const sim = manualSim();
  const initial = structuredClone(sim.state());
  const snapshots = [];
  for (let tick = 0; tick < 300; tick += 1) {
    inputAt(sim, tick);
    sim.step(dt);
    snapshots.push(structuredClone(sim.state()));
  }
  sim.reset();
  sim.script = false;
  assert.equal(sim.t, 0);
  assert.deepEqual(sim.state(), initial);
  for (let tick = 0; tick < 300; tick += 1) {
    inputAt(sim, tick);
    sim.step(dt);
    assert.deepEqual(sim.state(), snapshots[tick], `reset replay differs at tick ${tick}`);
  }
});

// The declared face-key atlas order is happy, angry, surprised, sad,
// distressed, winded; pain has its own seventh slot. Use literal expectations
// rather than deriving the slot from the unit's own EXPRS table.
for (const [expression, slot] of [['happy', 0], ['angry', 1], ['surprised', 2],
  ['sad', 3], ['distressed', 4]]) {
  test(`${expression} selects its declared upper and lower face key`, () => {
    const sim = manualSim();
    sim.setExpr(expression);
    const state = advance(sim, 60);
    for (const weights of [state.wu, state.wl]) {
      assert.ok(weights[slot] > 0, 'selected expression must visibly contribute');
      for (let index = 0; index < weights.length; index += 1) {
        if (index !== slot) assert.equal(weights[index], 0, 'unselected keys stay neutral');
      }
    }
    boundedState(state);
  });
}

test('neutral clears an expression without leaving another face key active', () => {
  const sim = manualSim();
  sim.setExpr('angry');
  const angry = advance(sim, 60);
  assert.ok(angry.wu[1] > 0);
  sim.setExpr('neutral');
  const neutral = advance(sim, 120);
  assert.ok(neutral.wu[1] < angry.wu[1]);
  assert.ok(neutral.wl[1] < angry.wl[1]);
  for (const weights of [neutral.wu, neutral.wl]) {
    for (let index = 0; index < weights.length; index += 1) {
      if (index !== 1) assert.equal(weights[index], 0);
    }
  }
});

test('a declared sad/distressed blend preserves both contributions and their ratio', () => {
  const sim = manualSim();
  const input = { sad: 0.3, distressed: 0.7 };
  sim.setBlend(input);
  const state = advance(sim, 60);
  assert.deepEqual(input, { sad: 0.3, distressed: 0.7 }, 'caller blend is not rewritten');
  for (const weights of [state.wu, state.wl]) {
    assert.ok(weights[3] > 0 && weights[4] > weights[3]);
    assert.ok(Math.abs(weights[3] / weights[4] - 3 / 7) < 1e-12);
    for (let slot = 0; slot < weights.length; slot += 1) {
      if (slot !== 3 && slot !== 4) assert.equal(weights[slot], 0);
    }
  }
  boundedState(state);
});

for (const [intent, shape] of [['talk', 'talk'], ['yell', 'yell'],
  ['project', 'project'], ['interject', 'talk']]) {
  test(`${intent} produces speech, with its documented eventual mouth shape`, () => {
    const sim = manualSim();
    sim.setSpeech(intent);
    let openFrames = 0;
    for (let tick = 0; tick < 180; tick += 1) {
      sim.step(dt);
      const state = sim.state();
      if (state.talk > 0) openFrames += 1;
      boundedState(state);
    }
    assert.ok(openFrames > 0, 'speech must open the mouth during its phrases');
    assert.equal(sim.state().speechShape, shape);
  });
}

for (const intent of ['talk', 'yell', 'project', 'interject']) {
  test(`${intent} remains a layer on top of the selected sad expression`, () => {
    const sim = manualSim();
    sim.setExpr('sad');
    sim.setSpeech(intent);
    let layeredFrames = 0;
    for (let tick = 0; tick < 180; tick += 1) {
      sim.step(dt);
      const state = sim.state();
      if (state.talk > 0 && state.wu[3] > 0 && state.wl[3] > 0) layeredFrames += 1;
      boundedState(state);
    }
    assert.ok(layeredFrames > 0, 'speech and the requested expression must coexist');
  });
}

test('off speech switches intent and lets an active yell decay', () => {
  const sim = manualSim();
  sim.setSpeech('yell');
  let wasOpen = false;
  for (let tick = 0; tick < 120; tick += 1) {
    sim.step(dt);
    wasOpen ||= sim.state().talk > 0;
  }
  assert.ok(wasOpen);
  const before = sim.state().talk;
  sim.setSpeech('off');
  assert.equal(sim.speech, 'off');
  let previous = before;
  for (let tick = 0; tick < 120; tick += 1) {
    sim.step(dt);
    const current = sim.state().talk;
    assert.ok(current <= previous, 'quiet intent must not open a new speech phrase');
    previous = current;
  }
  assert.ok(sim.state().talk < before, 'the existing mouth opening decays');
});

test('out-of-breath input increases breathing and clearing it permits recovery', () => {
  const quiet = manualSim();
  const winded = manualSim();
  winded.setBreath(1);
  advance(quiet, 120);
  const high = advance(winded, 120);
  assert.ok(high.breathAmp > quiet.state().breathAmp);
  assert.ok(high.wu[5] > 0 && high.wl[5] > 0, 'winded key contributes');
  winded.setBreath(0);
  const recovered = advance(winded, 120);
  assert.ok(recovered.breathAmp < high.breathAmp);
  boundedState(recovered);
});

test('heavier hits produce a stronger transient pain response and then recover', () => {
  const peaks = [];
  for (const intensity of [0.3, 1]) {
    const sim = manualSim();
    sim.hit(intensity);
    let peak = 0;
    let smallestHead = 1;
    for (let tick = 0; tick < 60; tick += 1) {
      sim.step(dt);
      peak = Math.max(peak, sim.state().pain);
      smallestHead = Math.min(smallestHead, sim.state().headS);
      boundedState(sim.state());
    }
    assert.ok(peak > 0, 'hit must reach the pain layer');
    assert.ok(smallestHead < 1, 'hit shrinks the head as it snaps back');
    advance(sim, 120);
    assert.ok(sim.state().pain < peak, 'transient pain decreases from its peak');
    assert.ok(Math.abs(sim.state().headS - 1) < Math.abs(smallestHead - 1),
      'head scale returns toward its neutral size');
    peaks.push(peak);
  }
  assert.ok(peaks[1] > peaks[0], 'hit intensity must affect the response');
});

test('sustained hurt adds pain and distressed keys plus labored breathing', () => {
  const quiet = manualSim();
  const hurting = manualSim();
  hurting.setHurt(1);
  advance(quiet, 120);
  const state = advance(hurting, 120);
  assert.ok(state.wu[6] > 0, 'upper face uses the pain key');
  assert.ok(state.wu[4] > 0, 'distressed brows remain represented');
  assert.ok(state.breathAmp > quiet.state().breathAmp);
  boundedState(state);
});

test('opposite explicit hit sides produce different directional head responses', () => {
  const left = manualSim();
  const right = manualSim();
  left.hit(0.8, -1);
  right.hit(0.8, 1);
  let differentDirection = false;
  for (let tick = 0; tick < 60; tick += 1) {
    left.step(dt);
    right.step(dt);
    const a = left.state();
    const b = right.state();
    differentDirection ||= a.tilt !== b.tilt || a.turn !== b.turn;
    finiteState(a);
    finiteState(b);
  }
  assert.ok(differentDirection, 'the explicit side must affect directional pose');
});

for (const side of [-1, 1]) {
  test(`glance ${side} moves the gaze to the requested side`, () => {
    const sim = manualSim();
    sim.glance(side);
    const state = advance(sim, 20);
    assert.ok(state.gaze * side > 0);
    boundedState(state);
  });
}

test('distraction makes gaze wander rather than ignoring the requested behavior', () => {
  const quiet = manualSim();
  const distracted = manualSim();
  distracted.distract = 0.7;
  distracted.eyesOnly = true;
  const gazeValues = new Set();
  let responds = false;
  for (let tick = 0; tick < 3600; tick += 1) {
    quiet.step(dt);
    distracted.step(dt);
    const normal = quiet.state();
    const wandering = distracted.state();
    gazeValues.add(wandering.gaze);
    responds ||= wandering.gaze !== normal.gaze || wandering.gazeY !== normal.gazeY;
    finiteState(wandering);
  }
  assert.ok(gazeValues.size > 1, 'gaze must move during distraction');
  assert.ok(responds, 'the distraction input changes the eye response');
});

test('the automatic gambit reel advances labels and live speech/expression state', () => {
  const sim = new FaceSim();
  const labels = new Set();
  let expressionActive = false;
  let speechActive = false;
  for (let tick = 0; tick < 3600; tick += 1) {
    sim.step(dt);
    const state = sim.state();
    // The automatic reel includes wander cues. No global normalized gaze
    // range is documented for those; only finite rendering inputs are promised.
    finiteState(state);
    labels.add(sim.label);
    expressionActive ||= state.wu.some(weight => weight > 0);
    speechActive ||= state.talk > 0;
  }
  assert.ok(labels.size > 1, 'the automatic reel must leave its first cue');
  assert.ok(expressionActive, 'the reel demonstrates expressions');
  assert.ok(speechActive, 'the reel demonstrates speech');
});
