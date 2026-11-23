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
HEAVY_WAIT=1 heavy-run node --test --test-concurrency=2 tests/lifelike-face.test.mjs tests/lifelike-face-contracts.test.mjs tests/lifelike-rig.test.mjs
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

Local validation recorded 68 passing lifelike CPU cases and a clean repository
ESLint run. A disposable public-input sensitivity control selecting the
rejected head-turn mode makes both new head assertions fail; this demonstrates
sensitivity without substituting the model. The source-mutation baseline was
resource-busy (guard exit75), so this extension claims no new mutation score
or actual-source kill. The previous FaceSim results remain historical evidence
for their original suite. Before/final mutation and a source-mutant red control
remain deferred until the shared guard is available.
