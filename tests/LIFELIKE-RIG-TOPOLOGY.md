# Skinned grid edge incidence

Issue #37 asks for focused checks covering `prototypes/**`. The public
`prototypes/lifelike/prototype/rig.js` header describes approach B as skinned
grid meshes in model-space pixels; `prototypes/lifelike/README.md` describes
the skinned-mesh approach. The shipped `body-rig.json` supplies each part's
model-space rectangle. Six additive CPU cases inspect the real `Rig` and
`buildMeshes` outputs without a renderer, DOM, image or substitute model.

Every geometric edge inside a rectangular mesh must belong to two triangles;
an edge wholly on a rectangle boundary must belong to one. Endpoint ordering,
vertex numbering, triangle winding, grid subdivision and diagonal choice do
not select a preferred layout. Boundary classification uses the existing
`1e-9` model-coordinate roundoff budget, fixed before execution.

This adds a check that the existing aggregate-area assertion misses. For a
unit square with cyclic corners A, B, C, D, triangles ABC and ABD are unique,
use all four vertices and have total area one. They overlap and leave a hole.
Their shared outer edge AB has incidence two and their interior diagonals
have incidence one, so the new property rejects that topology. This tiny
geometric example is an explanation, not a substituted unit or an executed
source-mutant control.

From the repository root:

```sh
HEAVY_WAIT=1 heavy-run node --test --test-concurrency=2 tests/lifelike-rig-topology.test.mjs
HEAVY_WAIT=1 heavy-run node --test --test-concurrency=2 tests/lifelike-rig.test.mjs tests/lifelike-rig-topology.test.mjs
HEAVY_WAIT=1 heavy-run npm run lint
git diff --check
HEAVY_WAIT=1 agent-mutate node "$CODEX_BURN_WORK/toon37-face-tools/node_modules/@stryker-mutator/core/bin/stryker.js" run tests/stryker.lifelike-rig.config.mjs
```

The optional Rig Stryker config includes the original 35 cases and these six
cases, retaining its source ranges, operators, timeouts and concurrency two.
No repository percentage gate is introduced. Existing assertions are unchanged.
Completed before/final Stryker runs use the same expanded configuration,
complete source and 397 mutant descriptors. The baseline retains the old 35
cases and empties only the new topology file; the final restores all six new
cases. Both produce 244 kills, four timeouts and 149 survivors: strict 61.46%
and Stryker including timeouts 62.47%. Every status is unchanged. No additional
Stryker kill or score gain is claimed; timeouts receive no strict credit and
survivors stay in the denominator. Remaining gait/idle numeric, affine/default
and skin-weight calibration gaps are outside this topology extension.

An actual-source red control changes each grid cell's second triangle from
ACD to ABD, keeping the first triangle ABC. The two triangles retain the same
total absolute area and all four vertices, but overlap and leave a hole. In a
disposable copy, all 35 original cases pass this faulty source; the expanded
suite exits 1 with 35 passes and six edge-incidence ERR_ASSERTION failures.
There are no skips or import/runtime errors. The real product remains
unchanged. This deliberately seeded source fault is not one of the fixed 397
Stryker descriptors and contributes no mutation-score credit.

The guarded control command used for the recorded evidence was:

```sh
HEAVY_WAIT=1 agent-mutate python3 "$CODEX_BURN_WORK/tmp/iteration9-rig-topology-control.py"
```

Edge incidence complements the existing geometric checks. It does not prove
every possible planar intersection is absent, calibrate skin weights or gait,
test renderer behavior or replace visual inspection. CI wiring for issue #37
remains owner work.
