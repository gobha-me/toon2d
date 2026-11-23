# Advisory takeoff contract probes (issue #13)

These synthetic snapshots check the published numerical rubric through the
exported pure API. They are not clean/cluttered reference artwork, independent
human ratings, or evidence to promote the advisory check into `score.mjs`.
PR #36 owns the separate browser evidence and visual self-review work; none of
its files are changed here.

From the repository root, run the pure suite without a browser:

```sh
node --test --test-concurrency=2 --test-name-pattern='^(torsoPitch|hipHeight|analyzeTakeoff|calibration)' tests/takeoff.test.mjs tests/takeoff-calibration.test.mjs
```

There are 38 checks: 21 existing pure cases and 17 new cases. The new fixtures
use literal published defaults rather than generating expectations from the
mutable `TAKEOFF` object. They cover both facings, independent standing-height
baselines, the eight-tick window, explicit calibration options, deepest-pose
selection, missing geometry, immutable inputs, and translation/scale invariance.
Exact zero-degree custom limits exercise inclusivity without relying on a
floating-point approximation of a 30-degree boundary.

The optional Stryker 9.6.1 configuration mutates only lines 10–83 of
`scripts/takeoff.mjs`: defaults, helper functions, and pure analysis. It excludes
the browser driver/CLI, not individual surviving mutants. There is no existing
repository mutation minimum; this optional experiment adds no gate. Use the
shared heavy-work guard where required:

```sh
TAKEOFF_MUTATION_BASELINE=1 HEAVY_WAIT=1 agent-mutate npm exec --yes --package=@stryker-mutator/core@9.6.1 -- stryker run tests/stryker.takeoff.config.mjs
HEAVY_WAIT=1 agent-mutate npm exec --yes --package=@stryker-mutator/core@9.6.1 -- stryker run tests/stryker.takeoff.config.mjs
```

The first command runs the existing 21 pure cases; the second adds the new 17.
Both use two mutation workers and identical product source/mutant identities.
Reports are generated under `reports/takeoff-mutation-{before,after}.json` and
should remain uncommitted. Wait for mutation cleanup before running root lint,
because ESLint also traverses a live Stryker sandbox.

Measured on the unchanged `a3d6c65` product baseline: 171/212 killed (80.66%)
before, 193/212 (91.04%) after; zero timeouts, errors or uncovered mutants.
All 19 survivors stay in the denominator:

| IDs in the JSON | Remaining limitation |
| --- | --- |
| 6, 21 | Replacing empty fallback arrays with a nonmatching string element still finds no named event/bone. |
| 31 | Multiplication/division by the supported facing values +1/-1 are equivalent. |
| 80, 89 | Missing-crouch slicing and the baseline before index zero still produce the same empty/null result. |
| 196 | With a positive airborne window, missing final pitch already fails the required sample count. |
| 107 | Equal-depth frames with different lean remain an unspecified tie; these tests do not impose a new selection rule. |
| 103, 141, 144, 145, 156–162, 205 | Diagnostic wording/formatting can change without changing numeric metrics or pass/fail. The tests require nonempty diagnostics, but do not freeze every displayed substring. |

The 22 newly killed mutants are executed red controls for these assertions.
This slice does not establish browser/CLI coverage, visual quality, human/judge
agreement, or a safe required grader threshold. Those remain #13/#5 follow-ups.
