# Lifelike CPU body smoke tests

Issue #37 asks for focused checks of `prototypes/**`. This independent slice
executes the exported `Rig`, `Rig.blend`, `GAITS`, `gaitSpeed` and `buildMeshes`
APIs using the shipped 2495-byte `body-rig.json`. It loads no image, DOM, browser,
WebGL context, network service or substitute model. No existing assertion or
production source is changed.

From the repository root, no npm install is needed for the tests:

```sh
heavy-run node --test --test-concurrency=2 tests/lifelike-rig.test.mjs
heavy-run node --test --test-concurrency=2 --experimental-test-coverage \
  --test-coverage-include=prototypes/lifelike/prototype/rig.js \
  --test-coverage-include=prototypes/lifelike/prototype/face.js \
  tests/lifelike-face.test.mjs tests/lifelike-rig.test.mjs
npm run lint
git diff --check
```

The new 35 body cases plus the existing 29 FaceSim cases pass: 64 total, zero
skips, TODOs or failures. Independent geometry checks require neutral model
coordinates, a quarter-turn of vectors, rigid affine transforms, connected bind
joints, world translation, complete nondegenerate mesh tiling, atlas-coordinate
agreement and normalized legal bone weights. Literal blend endpoints/midpoints
and stride-distance/stance-time speed examples supplement replay/finite-state
smoke checks. Coordinate `1e-9`, unit-vector `1e-12` and summed-area `1e-7`
budgets cover floating-point arithmetic; they were fixed before execution and
were not tuned to observed samples.

Native coverage reports 68.27% lines / 100% branches / 82.14% functions for the
mixed `rig.js` file. Drawing functions remain unexecuted; this does not validate
rendering or every possible branch/input. Existing FaceSim coverage is unchanged.

## Optional mutation command

Install Stryker outside the repository, then run the independent body scope:

```sh
npm install --prefix "$CODEX_BURN_WORK/rig-tools" --no-package-lock --ignore-scripts \
  @stryker-mutator/core@9.6.1
agent-mutate node "$CODEX_BURN_WORK/rig-tools/node_modules/@stryker-mutator/core/bin/stryker.js" \
  run tests/stryker.lifelike-rig.config.mjs
```

The configuration selects affine/bone helpers and `Rig` (lines 6–24 and 28–137),
the grid helper and mesh constructor (183–231), and gait presets/speed (308–312).
Renderer functions, drawing-order tables and the renderer-only point helper are
outside this CPU scope. Check ranges when source layout changes. Audited source
SHA-256: `967fa80a70923e611743b325a2dbcb723e656d4160ac182dceef73c559d1772c`.
Concurrency is two, timeout is 2000 ms with factor 1.5, and there is no repository
percentage minimum or new CI gate. The existing FaceSim scope stays unchanged.

All three mutation runs completed. Against the same 397 mutants and identical
source, the initial five authored smoke tests killed 115, timed out four and left
278 survivors. The final 35 tests killed 244, timed out the same four and left
149 survivors: strict killed/total 28.97% → 61.46%; Stryker including timeouts
29.97% → 62.47%. All 115 prior kills remain kills; 129 survivors become kills.
The intermediate 29-case run was 238 killed / four timeout / 155 survived.
Master had no prior body suite; the initial authored suite is the comparison
baseline, not a measured master score. No timeout receives strict credit.

As a standalone red control, actual Stryker arithmetic mutant 395 replaces the
exported speed numerator `2 * g.L` with `2 / g.L` in a disposable source copy.
The initial five tests pass against that mutant; the final suite fails exactly
one case with `ERR_ASSERTION` (34 pass), without import/runtime errors. No
production checkout is edited for this control.

## Remaining gaps

The 149 survivors remain in the denominator: gait poses 103, idle poses 28,
constructor four, matrices three, mesh weighting five, interpolation/easing
helpers four, cycle constant one and far-arm placement one. These are retained
coverage gaps, not equivalence claims. The four grid-loop timeouts remain
timeouts, not kills. No tool/runtime/compile errors or NoCoverage statuses occur;
coverage analysis is off, so NoCoverage=0 is not a reachability claim.

The README's promise that feet stay planted still needs a documented stance-phase
contract and an independent trajectory oracle. This suite checks connected rigid
limbs, not exact foot-plant acceptance, gait easing, artistic offsets, mesh-weight
calibration or visual quality. Exact animation envelopes and undocumented edge
inputs are intentionally not invented by the smoke tests. Owner CI wiring stays
separate; this PR changes no workflow, gate, dependency or product source.
