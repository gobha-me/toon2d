# Headless CPU smoke for the lifelike prototype

Issue #37 asks for a focused check of `prototypes/**`. From the repository root:

```sh
node --test --test-concurrency=2 tests/lifelike-face.test.mjs
npm run lint
```

The tests import the real `FaceSim` CPU model from
`prototypes/lifelike/prototype/face.js`, without a browser, display, WebGL
context, asset loading, network or clock substitute. They use fixed `1/60`
steps and public controls for expressions/blends, speech, gaze, breathing and
pain. Manual scenarios set the public `script` flag false so the automatic
gambit reel cannot overwrite their inputs. A separate one-minute simulation
exercises the default reel. All time advances are deterministic simulation
ticks; there are no real-time waits or retries.

Expectations come from the public expression-key header, README event API and
`prototypes/lifelike/LESSONS-face.md` contracts. Literal key indices are kept
independent of the implementation's own expression table. The suite checks
fixed-step advancement, deterministic replay/reset, instance isolation,
expression and speech responses, input intensity, recovery ordering and finite
snapshots. Replay checks compare separately executed trajectories to test
determinism; the semantic checks do not freeze a generated trace as a
correctness oracle.
The automatic wander contract specifies no global gaze clamp; the smoke suite
does not invent one. Transitions may decay smoothly: quiet and recovery checks
use ordering at fixed ticks instead of assuming an immediate exact zero.

Optional mutation, using an existing Stryker 9.6.1 installation:

```sh
HEAVY_WAIT=1 agent-mutate node "$CODEX_BURN_WORK/mutation-tools/node_modules/@stryker-mutator/core/bin/stryker.js" run tests/stryker.lifelike-face.config.mjs
```

The target is only the `FaceSim` class at current lines 356–649 of the mixed
face/shader module. It does not certify shader strings, WebGL renderers, artwork
or the browser widget. Concurrency is two; the JSON report is generated under
`reports/` and should remain local. No mutation percentage minimum or CI gate is
introduced. Busy heavy-run results are deferrals, not passes. Refresh the range
if the public class moves before rerunning.

The authored 23-case smoke suite killed 219/741 mutants (29.55% strict);
expanding it to 29 cases killed 242/741 (32.66% strict). The final report also
has 6 timeouts and 493 survivors; timeouts receive no strict-score credit.
All 741 identities and the full product source match between runs. These are
within-PR measurements; master had no previous FaceSim suite to score.
This remains a focused smoke check: compatibility accessors, detailed numeric
easing/random/voice curves, each individual reel cue and precise pose mixing
are incomplete. No mutation-complete or visual-quality claim is made.

Owner follow-up: select and wire the desired prototype checks into CI. This
test-side slice changes no workflows, product behavior or design/taste policy,
and does not close issue #37's CI work.
