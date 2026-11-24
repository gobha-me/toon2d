# Eyes-only gaze and speech-face contracts

Issue #37 asks for a focused check covering `prototypes/**`. These additive CPU
checks use the final user verdict and speech table in
`prototypes/lifelike/LESSONS-face.md` and `REVIEW.md`:

- Eyes-only opposite glances move the eyes in the requested directions while
  leaving a shared idle head trajectory. Paired real models receive the same
  event schedule and fixed time steps, differing only in the requested side.
  Separate cases cover manual glances and active automatic distraction.
  The gaze must respond directionally, the idle head must keep moving, and
  public `turn`, `tilt` and `headS` outputs must match between the models.
- Yelling adds the angry upper-face key; projecting adds surprised brows.
  Literal key slots follow the documented atlas order, independently of the
  implementation's expression lookup. A simultaneous neutral silent control
  keeps those keys inactive.

Run all lifelike CPU checks from the repository root:

```sh
HEAVY_WAIT=1 heavy-run node --test --test-concurrency=2 tests/lifelike-face.test.mjs tests/lifelike-face-contracts.test.mjs tests/lifelike-rig.test.mjs tests/lifelike-rig-topology.test.mjs
HEAVY_WAIT=1 heavy-run npm run lint
git diff --check
```

The tests use the real exported `FaceSim` with its public manual-script and
`eyesOnly` flags. They substitute no model, scheduler, RNG or browser. Exact
paired head comparisons test that gaze side cannot steer the head;
they do not compare random realizations across different event schedules,
snapshot a captured pose, set an artistic tolerance or claim
rendered eye-mask coverage. All time advances are fixed simulation ticks.

The optional face-only Stryker configuration includes the original face suite
and the new contracts file:

```sh
HEAVY_WAIT=1 agent-mutate node "$CODEX_BURN_WORK/toon37-face-tools/node_modules/@stryker-mutator/core/bin/stryker.js" run tests/stryker.lifelike-face.config.mjs
```

It retains the same FaceSim class range, two-worker limit, mutation operators,
timeouts and lack of a percentage gate. Shader/rendering/widget behavior and
exact speech amplitude/timing calibration remain outside this CPU slice. The
owner still needs to select and wire prototype checks into CI for issue #37.

Local validation recorded 74 passing lifelike CPU cases and a clean repository
ESLint run. The 29-case FaceSim baseline and expanded 33-case suite were each
mutated with the same configuration, complete product source and 741 mutant
descriptors. Kills/timeouts/survivors changed from 242/6/493 to 261/6/474:
strict score 32.66% to 35.22%; Stryker including timeouts 33.47% to 36.03%.
All 242 previous kills and six timeouts were retained; 19 survivors became
kills. No timeout receives strict credit, and no source/operator/scope/gate
change contributes to the comparison.

Two actual-source red controls use disposable copies and exact Stryker
descriptors. Removing the eyes-only distraction condition (mutant 378) leaves
all 29 old cases passing but fails both new head comparisons. Reversing the
yell-shape comparison (mutant 599) likewise passes all old cases but fails both
new speech-key cases. Each expanded run has 31 passes and two ERR_ASSERTION
failures, without skips, import/runtime errors or model substitution. The real
source remains unchanged. The earlier public-input head-turn-mode control is
additional sensitivity evidence, not mutation-score credit.

The remaining 474 survivors stay in the denominator. These checks do not pin
exact speech amplitudes, random/voice/easing curves, compatibility aliases,
every reel cue, shared nondirectional head effects or rendered eye masks.
No equivalence, complete reachability, visual-quality or full-repository claim
is made. Earlier resource-busy attempts produced no mutation results; only the
completed guarded runs contribute to these scores.
