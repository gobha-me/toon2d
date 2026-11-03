# Final launcher evidence

**Overall acceptance: RED.** Four launcher items are GREEN; harness policy and
char2 mutation infrastructure are RED. Completing the schedule does not mean
all acceptance goals passed.

Tested head: `9a63493221473a9e1cd7cac2947af4b8e3f4fb9c`.
Tests base: `2e036060c9c42d235d0b5efb1b9d714651e36f2a`.
Only evidence in this validation directory is added after the tested head.
The accompanying handoff identifies the final evidence commit.

Implementation commits:

- `ac173798c700a619992361fb265684261147d85f` — audit and script the courier kit.
- `dc8ceb0175697d6cf343dd99951478c95e0731ee` — assemble the manifest-driven rig.
- `c41ed9dfcf8a78f98c28894f5b8392413b6d45be` — round backing edges at seams.
- `9a63493221473a9e1cd7cac2947af4b8e3f4fb9c` — record authoring checks and limits.

This review executed no tests, heavy jobs, Xvfb or Godot. It consumed the
launcher ledger, six attempt logs and all 22 snapshotted result files.
No fix or retry was attempted.

## Exact ledger results

| Item | Exact ledger command | Result | rc | Attempts | Start UTC | End UTC |
|---|---|---|---:|---:|---|---|
| C1-char2-body | `heavy-run prototypes/imagine-cutout/tests/run_body_tests.sh --character char2` | GREEN | 0 | 1 | 2026-11-01T15:23:02Z | 2026-11-01T15:23:38Z |
| C2-trenchcoat-body | `heavy-run prototypes/imagine-cutout/tests/run_body_tests.sh --character trenchcoat` | GREEN | 0 | 1 | 2026-11-01T15:23:38Z | 2026-11-01T15:25:49Z |
| C3-trenchcoat-legacy | `heavy-run prototypes/imagine-cutout/tests/run_tests.sh --character trenchcoat` | GREEN | 0 | 1 | 2026-11-01T15:25:49Z | 2026-11-01T15:26:10Z |
| C4-harness-policy | `heavy-run "$TEST_PYTHON" prototypes/imagine-cutout/tests/test_harness_policy.py` | RED | 1 | 1 | 2026-11-01T15:26:10Z | 2026-11-01T15:26:11Z |
| C5-char2-mutants | `heavy-run prototypes/imagine-cutout/tests/run_mutants.sh --character char2` | RED | 2 | 1 | 2026-11-01T15:26:11Z | 2026-11-01T15:26:22Z |
| C6-trenchcoat-mutants | `heavy-run prototypes/imagine-cutout/tests/run_mutants.sh --character trenchcoat` | GREEN | 0 | 1 | 2026-11-01T15:26:22Z | 2026-11-01T15:29:59Z |

All entries have ledger note `ran`; each has one recorded attempt. No ledger
rc 75, 78, 79 or 124 and no launcher retry occurred. The admission build is
v5c, SHA-256
`3bc14651d44b4438d3823dfa582f767094ca8a95681721e743be3b8a57011a0b`:
17.5 GiB working-set and 24.5 GiB memory.current limits. Literal `[75, 0]`,
`[75]` and `[78]` in the policy log identify intended subtest inputs, not
admission return codes.

## Results per character

| Character | Check | Result and observations |
|---|---|---|
| char2 | Manifest | GREEN, zero failures |
| char2 | Completeness | GREEN, zero failures |
| char2 | Per-joint | GREEN, 30 poses, 450 seams, zero gap pixels |
| char2 | Combined | GREEN, 420 pair + 200 random poses, 9,300 seams, zero gap pixels |
| char2 | Facing | GREEN, 82/82 samples |
| trenchcoat | Manifest | GREEN, zero failures |
| trenchcoat | Completeness | GREEN, zero failures |
| trenchcoat | Per-joint | GREEN, 42 poses, 882 seams, zero gap pixels |
| trenchcoat | Combined | GREEN, 840 pair + 200 random poses, 21,840 seams, zero gap pixels |
| trenchcoat | Facing | GREEN, 82/82 samples |
| trenchcoat | Legacy 1 hierarchy | GREEN, zero failures |
| trenchcoat | Legacy 2 timing | GREEN, zero failures |
| trenchcoat | Legacy 3 flash | GREEN, zero failures |
| trenchcoat | Legacy 4 gun rigidity | GREEN, zero failures |
| trenchcoat | Legacy 5 joint gaps | GREEN, zero failures, HD and pixel modes |

Char2 body checks inherit C1's command/rc/attempt/UTC interval; trenchcoat
body checks inherit C2, and legacy checks inherit C3. Char2 standalone legacy
acceptance was not scheduled; none is claimed.

The snapshot char2/body.json timestamp is
`2026-11-01T15:23:36.937242+00:00`, within C1. Trenchcoat/body.json is dated
`2026-11-01T15:29:25.694212+00:00`, within C6: the later mutation baseline
overwrote the earlier body output. C2 is GREEN from its own log and ledger;
the detailed trenchcoat counts above come from the later full GREEN baseline,
which used the same frozen pose plan. This snapshot is not attributed to C2.
Trenchcoat legacy.json is dated within C3. No missing original C2 JSON is
reconstructed.

## Lifecycle and harness finding

The launcher-held lifecycle status is **GREEN**, rewritten before this review.
The conditional UNPROVED downgrade therefore does not apply. This inherited
gate does not change the fresh C4 result: **RED, rc 1**.

C4 reports three tests with five errors: driver defer-policy subcases
`[75, 0]`, `[75]`, `[78]`, normal-exit lifecycle and TERM lifecycle all fail at
`tempfile.TemporaryDirectory(dir=os.environ['TMPDIR'])` with
`FileNotFoundError`. The shared parent directory was missing. Sanitized
tracebacks replace the failing path with `<TMPDIR>/<SCRATCH>`.
See `final-logs/C4-harness-policy.a1.txt`: lines 3-8 list the errors, and
lines 14-22, 28-36, 42-50, 56-66 and 72-82 retain their setup tracebacks.

Neither lifecycle subtest reached server spawn or cleanup assertions. Fresh
normal-exit, TERM, lock/scratch cleanup and driver retry-policy verification
failed in setup; no fresh cleanup success is claimed. Why the parent directory
disappeared is unresolved. No occupied-display or signal-related failure is
recorded in the six suite logs. The runner and drivers are outside this lane
and remain untouched.

## Mutation results

C5 char2 is **RED, rc 2**. Its complete log has
`Running mutant a: flash` on line 3 and
`FAIL infrastructure: no flash visibility track` on line 4. The runner could
not construct the first legacy mutation; it established neither a kill nor
a survivor. Char2 a: **CANNOT_PLANT**; b-h: **NOT REACHED**; **0 kills**.
No char2 body-mutant result is claimed. Read-only inspection locates the
assertion in `tests/driver.py:311`; the all-mutants path calls legacy mutations
before body mutations. No mutation or production change was made here.

C6 trenchcoat is **GREEN, rc 0**, with **7 kills / 8 scheduled, 1 explicit skip**:

| Mutant | Result | Evidence |
|---|---|---|
| a flash | KILLED | Newly red legacy test 3 |
| b bone | KILLED | Newly red legacy tests 1 and 5 |
| c overlap | SKIPPED | Missing raw Segments PNG inputs, including original.png |
| d timing | KILLED | Newly red legacy test 2 |
| e | KILLED | 1 new relevant failure |
| f | KILLED | 82 new relevant failures |
| g | KILLED | 4 new relevant failures |
| h | KILLED | 2 new relevant failures; 2 increased-gap seams, 264 gap pixels |

These are launcher-run results. No mutant was added, edited or run during this
review. The source mutants.txt contains legacy a-d only; e-h verdicts appear
in the C6 log and corresponding snapshot projections. No eight-kill claim
is made.

## Gap report per slot

| Slot | Action |
|---|---|
| head_face | scripted |
| upper_arm_left | scripted |
| lower_arm_left | scripted |
| hand_left | scripted |
| upper_arm_right | scripted |
| lower_arm_right | scripted |
| hand_right | scripted |
| upper_leg_left | scripted |
| lower_leg_left | scripted |
| foot_left | scripted |
| upper_leg_right | scripted |
| lower_leg_right | scripted |
| foot_right | scripted |
| held_prop_satchel | scripted |

Generate slots: none. All 16 part PNGs, including torso/pelvis backing, have
scripted provenance sidecars. Source: `characters/char2/gap-report.json`.
Authoring limitations remain documented in `AUTHORING.md`.

## Evidence preservation and scope

`FINAL-LEDGER.tsv` preserves the exact ledger bytes. `FINAL-SOURCES.json`
inventories original SHA-256 digests and sanitized evidence digests for the
ledger, six attempt logs and all 22 snapshot files. Controller paths become
logical source names. Complete suite logs retain line order; trailing whitespace is removed. JSON projections
retain metadata, all test verdicts/errors and facing samples. Seam observations
are aggregated by joint and pose kind or render mode; all failed observations
are retained and null counts are explicit. Pose vectors become counts.
Rendering-log excerpts retain first/last lines and all distinct diagnostic-line
counts. These are projections of existing evidence, not newly executed checks.

Host, checkout, interpreter-library and disposable project paths become
`<HOST>`, `<REPO>`, `<PYTHON>` and `<TMPDIR>` placeholders. Local source outputs
are unchanged.

The frozen-path diff is:

```text
git diff --name-only 2e036060c9c42d235d0b5efb1b9d714651e36f2a HEAD -- prototypes/imagine-cutout/tests/ prototypes/imagine-cutout/body_parts.yml prototypes/imagine-cutout/characters.yml
(no output)
```

The tests base and tested head remain ancestors. All changes after the tested
head lie in this validation directory. The final handoff records the clean
tracked tree, attribution, whitespace, private-string and gitleaks checks.

Disputes: none; no acceptance rule or manifest value is challenged. Outstanding:
the launcher owner must restore a valid scratch parent for fresh policy
verification; the appropriate lane must resolve char2 mutation construction
or applicability; trenchcoat mutant c needs raw source inputs for full kill
proof. This review made no fixes or reruns.

Visual limits remain: visible round knee/elbow hinges, one neutral face,
limited pose differentiation, unclear visual satchel-handle direction, and
motion unscored from still images. Numerical coverage does not certify these
visual qualities.


# Flash contract follow-up: final launcher evidence

**Overall acceptance: GREEN under the stated expectations.** The base red-first
is RED exactly as required; all seven final items are GREEN. Trenchcoat mutant c
is the explicitly allowed missing-input skip. This section supersedes the
pending acceptance statements in the authoring follow-up and resolves the
historical harness and char2 mutation failures recorded above. Earlier evidence
is preserved unchanged.

Baseline: `059f4ebf472a50a9917724723d42208495b1650f`.
Tested head: `30d7bfefe549f058c9956e670fa393d245e45507`.
Frozen tests head: `2e036060c9c42d235d0b5efb1b9d714651e36f2a`.
Rig restoration commit: `6a7b5c954e5100c7b1b85d749ac1b9c62033eb29`.
Authoring evidence commit: `30d7bfefe549f058c9956e670fa393d245e45507`.
The final evidence commit is identified by the local final handoff after commit;
the tested head is unchanged by these evidence additions.

This evidence review executed no heavy-run, tests, Xvfb, Godot or mutations.
All runtime results below come from the launcher captures. Reading JSON,
counting scene tracks, hashing evidence and comparing Git objects are light
checks. The controller records COMPLETE and the required kill/legacy/shape
expectations as passing; COMPLETE alone is not the basis for the GREEN verdict.

## Ledger commands, return codes and UTC boundaries

| Item | Ledger command | Result | rc | Attempts | Start UTC | End UTC |
|---|---|---|---:|---:|---|---|
| C7-base-char2-legacy | `heavy-run prototypes/imagine-cutout/tests/run_tests.sh --character char2 --output <REPO>/<BASE_OUTPUT>/legacy.json` | RED (expected) | 1 | 1 | 2026-11-01T16:28:57Z | 2026-11-01T16:29:08Z |
| C1-char2-body | `heavy-run prototypes/imagine-cutout/tests/run_body_tests.sh --character char2` | GREEN | 0 | 1 | 2026-11-01T16:34:10Z | 2026-11-01T16:34:51Z |
| C2-trenchcoat-body | `heavy-run prototypes/imagine-cutout/tests/run_body_tests.sh --character trenchcoat` | GREEN | 0 | 1 | 2026-11-01T16:34:51Z | 2026-11-01T16:37:03Z |
| C3-trenchcoat-legacy | `heavy-run prototypes/imagine-cutout/tests/run_tests.sh --character trenchcoat` | GREEN | 0 | 1 | 2026-11-01T16:37:03Z | 2026-11-01T16:37:24Z |
| C4-harness-policy | `heavy-run "$TEST_PYTHON" prototypes/imagine-cutout/tests/test_harness_policy.py` | GREEN | 0 | 1 | 2026-11-01T16:37:24Z | 2026-11-01T16:37:30Z |
| C7-char2-legacy | `heavy-run prototypes/imagine-cutout/tests/run_tests.sh --character char2` | GREEN | 0 | 1 | 2026-11-01T16:37:30Z | 2026-11-01T16:37:41Z |
| C5-char2-mutants | `heavy-run prototypes/imagine-cutout/tests/run_mutants.sh --character char2` | GREEN | 0 | 1 | 2026-11-01T16:37:41Z | 2026-11-01T16:39:13Z |
| C6-trenchcoat-mutants | `heavy-run prototypes/imagine-cutout/tests/run_mutants.sh --character trenchcoat` | GREEN | 0 | 1 | 2026-11-01T16:39:13Z | 2026-11-01T16:42:49Z |

Commands are the ledger strings, except the base output argument is necessarily
sanitized to `<REPO>/<BASE_OUTPUT>/legacy.json`. The private output-directory
spelling is retained in the uncommitted local handoff; its original source
bytes are authenticated by `flash-contract/SOURCES.json`. `"$TEST_PYTHON"`
remains literal, as in the ledger. UTC boundaries are taken verbatim from the
ledger, including where the controller's child-spawn timestamp is one second
later. All rows have note `ran`; every item had exactly one attempt. There were
no actual admission rc 75, 78 or 79, no timeout and no retries.

The recorded heavy-run build is staged v5c (self-label v5, 2026-10-30), SHA-256
`3bc14651d44b4438d3823dfa582f767094ca8a95681721e743be3b8a57011a0b`:
17.5 GiB working-set and 24.5 GiB memory.current limits for memory.max 28 GiB.
The launcher SHA-256 is
`9d1be7b45a0566deb7603b249dbe6bd277a6f8165ff1a2791d676482729f0a33`.
The controller records `-s danger-full-access`, change lane, and the same
admission-build SHA before authoring and final suites. Policy stub returns
75/79/78 below are deliberate test inputs/results, not admission failures.

## Legacy tests 1-5 and the rig-gap verdict

| Test | Base char2 C7-base | Final char2 C7 | Final trenchcoat C3 |
|---|---|---|---|
| 1 hierarchy | GREEN, 0 failures | GREEN, 0 failures | GREEN, 0 failures |
| 2 timing | GREEN, 0 failures | GREEN, 0 failures | GREEN, 0 failures |
| 3 flash | RED, exactly `hd: missing MuzzleFlash` | GREEN, 0 failures | GREEN, 0 failures |
| 4 gun rigidity | GREEN, 0 failures | GREEN, 0 failures | GREEN, 0 failures |
| 5 joint gaps | GREEN, 0 failures | GREEN, 0 failures | GREEN, 0 failures |

Each row inherits the corresponding ledger command, rc, attempt and interval.
Base JSON timestamp: `2026-11-01T16:29:08.103271+00:00`; its only error is
`hd: missing MuzzleFlash`, and overall passed=false. The base console has each
of the five prescribed summary lines exactly once, no other FAIL line and no
infrastructure, traceback, script or parse error. Final char2 JSON timestamp:
`2026-11-01T16:37:38.082043+00:00`; trenchcoat:
`2026-11-01T16:37:21.463984+00:00`. Both final JSONs have passed=true and empty
errors for tests 1-5. Char2 uses HD; trenchcoat covers HD and pixel modes.

**C5 verdict: the real rig gap is repaired.** At the baseline,
`scripts/build_rig.gd:126-135` conditionally owned the effect only for trenchcoat,
used courier animation without flash tracks and freed the char2 effect.
Frozen `tests/check_rig.gd:108,118-119` requires MuzzleFlash for every character;
`tests/driver.py:309-317` requires its fire visibility track and exact key shape.
Base legacy test 3 now proves the failure, and the restored contract makes both
legacy test 3 and mutant a pass their final expectations. No mutant set or
assertion was changed to avoid the gap.

## Body results per character

| Check | char2 C1 | trenchcoat C2 |
|---|---|---|
| manifest | GREEN, 0 failures | GREEN, 0 failures |
| completeness | GREEN, 0 failures | GREEN, 0 failures |
| per_joint | GREEN; 30 poses, 450 seams, 0 gap pixels | GREEN; 42 poses, 882 seams, 0 gap pixels |
| combined | GREEN; 420 pair + 200 random poses, 9,300 seams, 0 gap pixels | GREEN; 840 pair + 200 random poses, 21,840 seams, 0 gap pixels |
| facing | GREEN, 82/82 samples | GREEN, 82/82 samples |

Each check inherits its character's body ledger command, rc 0, one attempt and
UTC interval. C1/C2 logs independently prove all five checks GREEN. The detailed
JSONs in the snapshot are later mutation baselines: char2/body.json timestamp
`2026-11-01T16:38:48.624050+00:00` lies inside C5; trenchcoat/body.json timestamp
`2026-11-01T16:42:15.598975+00:00` lies inside C6. Both have full_acceptance_run=true
and all five checks passed. These later baselines supply the seam/facing counts
above; they are not presented as the missing original C1/C2 JSON files.
Frozen random N=200 and seeds remain char2 20261031, trenchcoat 20261030.
Char2 body evidence is no longer provisional under the brief's condition:
C5 killed all body mutants e-h.

## C4 policy subtests and fresh lifecycle proof

C4 is GREEN, rc 0, one attempt, `2026-11-01T16:37:24Z` through
`2026-11-01T16:37:30Z`. `flash-contract/logs/C4-harness-policy.a1.txt`
retains the complete policy output and three-test `OK` result:

| Test/subcase | Result | Captured observation |
|---|---|---|
| test_driver_heavy_defer_policy, stub [75, 0] | GREEN | exit 0, attempts 2 |
| test_driver_heavy_defer_policy, stub [75] | GREEN | exit 79, attempts 4 |
| test_driver_heavy_defer_policy, stub [78] | GREEN | exit 78, attempts 1 |
| test_xvfb_no_orphan_normal_exit | GREEN | NORMAL: recorded PID gone; display lock gone; scratch removed |
| test_xvfb_no_orphan_on_term | GREEN | TERM: recorded PID gone; display lock gone; scratch removed |

The three driver rows are subcases of one unittest; the log reports three tests
in total, 0.781 seconds. Both lifecycle tests freshly reached and passed the
recorded-PID cleanup assertions. No by-name lookup or policy assertion was
changed. The historical missing-parent setup errors are resolved by the
launcher environment. No actual scratch-removal scope finding appears in the
controller state at review time; the header's guard description is not a
finding. Required head review still applies before any push.

## Kill list per mutant id, both characters

| Mutant | char2 C5 | trenchcoat C6 | Kill evidence |
|---|---|---|---|
| a flash | KILLED | KILLED | expected legacy 3; observed red 3; increased-gap joints 0 |
| b bone | KILLED | KILLED | expected legacy 1; observed red 1,5; increased-gap joints 0 |
| c overlap | Not scheduled for char2 | SKIPPED | missing src/parts/raw-hd Segments PNG inputs, including original.png; not committed |
| d timing | KILLED | KILLED | expected legacy 2; observed red 2; increased-gap joints 0 |
| e | KILLED | KILLED | 1 new relevant failure; 0 increased-gap seams |
| f | KILLED | KILLED | 82 new relevant failures; 0 increased-gap seams |
| g | KILLED | KILLED | 4 new relevant failures; 0 increased-gap seams |
| h | KILLED | KILLED | 2 new relevant failures; 2 increased-gap seams |

Char2: **7/7 KILLED**, ids `[a b d e f g h]`. Trenchcoat: **7 KILLED,
1 explicit SKIP**, ids `[a b d e f g h]` killed and c skipped. No survivor or
CANNOT_PLANT is recorded. Mutant h has 69 char2 gap pixels and 264 trenchcoat
gap pixels. Every listed id has exactly one verdict line, matched in full
against its driver's prescribed form; neither log has FAIL infrastructure.
C5/C6 command, rc, attempt and UTC interval apply to their respective kill lists.
Individual JSON timestamps are retained in the evidence files.

The expected failing mutant JSON verdict passed=false is kill evidence, not a
RED final suite item. Complete console verdicts are retained in the two mutant
logs; JSON snapshots retain test errors and failed observations. Char2
legacy-mutants.json contains a/b/d while mutants.json contains e-h. Trenchcoat
mutants.txt contains its legacy list; e-h verdicts are in the C6 log and JSONs.
No mutant was authored, edited, removed, re-scoped or run during this review.

## Flash node/track count and unchanged files

Read-only scene inspection at the tested head finds **exactly 1 MuzzleFlash
node and 4 MuzzleFlash:visible tracks**, one per clip. The node is initially
hidden at hand-local `[32, 0]`, z=30. The manifest supplies muzzle_texture_px
`[48, 8]`, transformed through the satchel sprite offset `[-16, -8]`; no
hand-origin fallback was needed. The existing procedural effect script is
unchanged. The visibility keys are:

| Clip | Seconds | Values |
|---|---|---|
| aim | 0, 10/24 | false, false |
| cooldown | 0, 14/24 | false, false |
| fire | 0, 3/24, 6/24 | true, false, false |
| idle | 0, 48/24 | false, false |

The saved fire off key is exactly 0.125 seconds. Authoring preserved courier
bone motion. The controller independently records nodes=1, visible-tracks=4
and HDPIXEL-EQUALS-BASE=yes.

```text
git diff 059f4ebf472a50a9917724723d42208495b1650f HEAD -- prototypes/imagine-cutout/scenes/hd.tscn prototypes/imagine-cutout/scenes/pixel.tscn prototypes/imagine-cutout/scripts/muzzle_flash.gd
(no output)
git diff --name-only 2e036060c9c42d235d0b5efb1b9d714651e36f2a HEAD -- prototypes/imagine-cutout/tests/ prototypes/imagine-cutout/body_parts.yml prototypes/imagine-cutout/characters.yml
(no output)
```

Byte comparisons against baseline Git objects also pass. HD SHA-256:
`5d2416cf4fda9a5fd5912cd6eaf10976b4b9b48583d91b026597751b32381a63`;
pixel SHA-256:
`910080c9c1937e32f918a744405b0592efd1d4ea1e3a63a9827781d22ce5b94c`.
Both pinned heads remain ancestors. The only baseline-to-head changes are the
builder, generated char2 scene and validation evidence. Changes after the tested
head are confined to this validation directory. No tests, manifests, tolerances,
art, tools or effect script were changed in this phase.

## Preserved sources, hygiene and remaining work

`flash-contract/LEDGER.tsv`, eight complete sanitized attempt logs, the base
legacy JSON/render-log excerpt, and all 41 snapshot file projections are
preserved separately from historical evidence. `flash-contract/SOURCES.json`
inventories 53 sources including selected controller metadata, with original
byte counts/SHA-256 and sanitized evidence SHA-256. Large body joint arrays
become per-kind/per-joint counts, gap totals and maxima; every failed joint
observation, all test errors, metadata and facing samples remain. Pose vectors
become counts by kind. Render-log excerpts retain first/last 12 lines and every
distinct diagnostic line with occurrence counts, including expected mutation
warnings. Smaller legacy and mutant-list JSONs remain complete. No raw private
run identifiers or host paths are committed.

The local final handoff records the final head SHA and verification of scope,
identities/trailers, whitespace, added-content hygiene, digests and gitleaks
against the baseline. Final evidence is committed locally in the change lane.
Disputes: none. No heavy step or retry was left unfinished by this review.
No push or forge writes were made. The mandated head review before any push
remains for the reviewer. Trenchcoat c remains skipped pending absent raw PNG
inputs; the owner's courier-effect design question remains open with the
contract-preserving default implemented. Visual authoring limits documented
earlier remain unchanged; numerical acceptance does not resolve them.
