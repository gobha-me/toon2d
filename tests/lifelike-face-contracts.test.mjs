import assert from 'node:assert/strict';
import test from 'node:test';
import { FaceSim } from '../prototypes/lifelike/prototype/face.js';

// Issue #37. The final user verdict in REVIEW.md/LESSONS-face.md requires
// eyes-only gaze with the head retaining its idle sway. The speech table
// separately specifies angry upper brows for yell and surprised brows for
// projection. Compare real public models; no scheduler, RNG or state is faked.
const dt = 1 / 60;

function manualEyesOnly() {
  const sim = new FaceSim();
  sim.script = false;
  sim.eyesOnly = true;
  return sim;
}

function head(state) {
  const pose = { turn: state.turn, tilt: state.tilt, scale: state.headS };
  for (const [key, value] of Object.entries(pose)) {
    assert.ok(Number.isFinite(value), `${key} is an actual finite public head output`);
  }
  return pose;
}

for (const [distraction, ticks] of [[0, 120], [0.7, 600]]) {
  test(`eyes-only opposite glances with distraction ${distraction} cannot steer the idle head`, () => {
    const left = manualEyesOnly();
    const right = manualEyesOnly();
    left.distract = distraction;
    right.distract = distraction;
    const initial = head(left.state());
    let directionalGazeResponded = false;
    let idleHeadMoved = false;
    left.glance(-1);
    right.glance(1);
    // Both models receive the same event schedule; only gaze side differs.
    // Comparing against a quiet model would impose an undocumented identical
    // random realization across different event schedules.
    for (let tick = 0; tick < ticks; tick += 1) {
      left.step(dt);
      right.step(dt);
      const leftState = left.state();
      const rightState = right.state();
      const leftHead = head(leftState);
      assert.deepEqual(head(rightState), leftHead, `head differs at tick ${tick}`);
      assert.ok(Number.isFinite(leftState.gaze));
      assert.ok(Number.isFinite(rightState.gaze));
      directionalGazeResponded ||= leftState.gaze < 0 && rightState.gaze > 0;
      idleHeadMoved ||= leftHead.turn !== initial.turn || leftHead.tilt !== initial.tilt;
    }
    assert.ok(directionalGazeResponded, 'the opposite requests must actually move the eyes in opposite directions');
    assert.ok(idleHeadMoved, 'the retained idle head trajectory remains live');
  });
}

// Public expression-atlas order: happy, angry, surprised, sad, distressed,
// winded, pain. Use literal documented slots, not the model's EXPRS lookup.
for (const [intent, slot, expression] of [['yell', 1, 'angry'], ['project', 2, 'surprised']]) {
  test(`${intent} adds the documented ${expression} upper-face key`, () => {
    const quiet = manualEyesOnly();
    const speaking = manualEyesOnly();
    let selectedKeyActive = false;
    speaking.setSpeech(intent);
    for (let tick = 0; tick < 180; tick += 1) {
      quiet.step(dt);
      speaking.step(dt);
      const upper = speaking.state().wu;
      assert.equal(upper.length, 7);
      assert.ok(Number.isFinite(upper[slot]));
      assert.equal(quiet.state().wu[slot], 0, 'neutral silent control has no selected expression');
      selectedKeyActive ||= upper[slot] > 0;
    }
    assert.ok(selectedKeyActive, 'speech intent must contribute the specified upper-face key');
  });
}
