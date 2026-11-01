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
