# Final launcher clip evidence

Tested committed head: `37c78463a2fbf6aefb6b3a3c48505241cb177133`. Pinned rig base:
`cf702b44326db2a9891eb4059372a13e6765cfce`.
The supplied committed-source handoff and RIGEQ both identify this tested head;
RIG-EQUALS-BASE=yes on scenes/, tools/, body_parts.yml and characters.yml.
The current phase records evidence only, so its final commit retains these same
rig and harness bytes. The delivery summary reports the final evidence commit SHA.

The recorded acceptance outcome is RED, as required for the tests lane:
HD chaining and recoil departure fail; pixel gaps, chaining and recoil departure
fail. Every case CL1–CL5 is either RED for its own assertion or covered by its
named killed mutant. All eight required mutants are KILLED. This is evidence of
test sensitivity, not passing clip acceptance. **REVIEW=required** because runner
modes were added; subsequent work requires review of the final evidence head.
The supplied files contain no final launcher completion verdict, so none is inferred.

| Item | Result | rc | Attempt | Start UTC | End UTC | Exact ledger command |
|---|---|---|---|---|---|---|
| Legacy suite (T1-trenchcoat-legacy) | GREEN | 0 | 1 | 2026-11-01T15:54:01Z | 2026-11-01T15:54:17Z | `TEST_PYTHON="$TOON_PYTHON" heavy-run prototypes/imagine-cutout/tests/run_tests.sh` |
| Body suite (T2-trenchcoat-body) | GREEN | 0 | 1 | 2026-11-01T15:54:17Z | 2026-11-01T15:56:29Z | `TEST_PYTHON="$TOON_PYTHON" heavy-run prototypes/imagine-cutout/tests/run_body_tests.sh` |
| Clip acceptance (T3-clips-red-first) | RED (acceptance verdicts) | 1 | 1 | 2026-11-01T15:56:29Z | 2026-11-01T15:56:50Z | `TEST_PYTHON="$TOON_PYTHON" heavy-run prototypes/imagine-cutout/tests/runner.sh clips` |
| Clip mutants (T4-clip-mutants) | All eight KILLED | 0 | 1 | 2026-11-01T15:56:50Z | 2026-11-01T15:59:27Z | `TEST_PYTHON="$TOON_PYTHON" heavy-run prototypes/imagine-cutout/tests/runner.sh clip-mutants` |

All four rows have note `ran`, one attempt, and no refusal 75/78 or retry.
No item in this ledger is NOT-RUN. Any NOT-RUN item remains deferred and is
never passed. Formal attempt logs do not supply the heavy-run executable hash;
the earlier development build hash in heavy-build.txt is historical and is not
asserted to identify the formal launcher build.

| Case | Scene | Result on tested head | Verdict reason or named killed mutant | Exact ledger command | rc | Attempt | UTC start → end |
|---|---|---|---|---|---|---|---|
| CL1 | hd | GREEN; 84 PASS / 0 FAIL / 0 ERROR | All rotations inside manifest limits; m1 KILLED on idle:hem_left in this scene. | `TEST_PYTHON="$TOON_PYTHON" heavy-run prototypes/imagine-cutout/tests/runner.sh clips` | 1 | 1 | 2026-11-01T15:56:29Z → 2026-11-01T15:56:50Z |
| CL2 | hd | GREEN; 1722 PASS / 0 FAIL / 0 ERROR | No background pixels, all 1,722 keys GREEN. m2 KILLED on 27 HD right_fore targets GREEN in the same invocation baseline. | `TEST_PYTHON="$TOON_PYTHON" heavy-run prototypes/imagine-cutout/tests/runner.sh clips` | 1 | 1 | 2026-11-01T15:56:29Z → 2026-11-01T15:56:50Z |
| CL3 | hd | RED; 104 PASS / 6 FAIL / 0 ERROR | Six FAIL keys: idle-aim and cooldown-idle, each torso 0.00610865233466029, hem_left 0.0209439508616924, hem_right 0.0174532923847437 rad versus <=1e-06 rad. Other 104 keys GREEN; m3 kills idle-loop:torso, m3b kills aim-fire:right_upper in this scene. | `TEST_PYTHON="$TOON_PYTHON" heavy-run prototypes/imagine-cutout/tests/runner.sh clips` | 1 | 1 | 2026-11-01T15:56:29Z → 2026-11-01T15:56:50Z |
| CL4 | hd | GREEN; 3 PASS / 0 FAIL / 0 ERROR | Hip range 6.0 native px (inclusive [1,6]); hem ranges 2.3999999814/1.9999999845 deg. m4 KILLED on hip_y_min, m4b on hip_y_max, m4c on hem_range in this scene. | `TEST_PYTHON="$TOON_PYTHON" heavy-run prototypes/imagine-cutout/tests/runner.sh clips` | 1 | 1 | 2026-11-01T15:56:29Z → 2026-11-01T15:56:50Z |
| CL5 | hd | RED; 1 PASS / 1 FAIL / 0 ERROR | departure FAIL: f01_deg=0.0, f02_deg=0.0, all seven sampled deviations 0.0 versus >=1.0 deg at f01 or f02 with overall peak by f02. settle GREEN: 0.0 versus <=0.1 deg inclusive; m5 KILLED on settle in this scene. | `TEST_PYTHON="$TOON_PYTHON" heavy-run prototypes/imagine-cutout/tests/runner.sh clips` | 1 | 1 | 2026-11-01T15:56:29Z → 2026-11-01T15:56:50Z |
| CL1 | pixel | GREEN; 84 PASS / 0 FAIL / 0 ERROR | All rotations inside manifest limits; m1 KILLED on idle:hem_left in this scene. | `TEST_PYTHON="$TOON_PYTHON" heavy-run prototypes/imagine-cutout/tests/runner.sh clips` | 1 | 1 | 2026-11-01T15:56:29Z → 2026-11-01T15:56:50Z |
| CL2 | pixel | RED; 1637 PASS / 85 FAIL / 0 ERROR | 85 keys FAIL: gap_pixels 1–7 versus 0 background pixels; nonempty stencil except root. Affected joints: torso, coat, hem_left, right_upper, right_fore, right_hand, left_arm. Example CL2:pixel:idle:f06:torso has 3 gap pixels in 27 stencil pixels. m2 changes HD only; no pixel kill is claimed. | `TEST_PYTHON="$TOON_PYTHON" heavy-run prototypes/imagine-cutout/tests/runner.sh clips` | 1 | 1 | 2026-11-01T15:56:29Z → 2026-11-01T15:56:50Z |
| CL3 | pixel | RED; 104 PASS / 6 FAIL / 0 ERROR | Six FAIL keys: idle-aim and cooldown-idle, each torso 0.00610865233466029, hem_left 0.0209439508616924, hem_right 0.0174532923847437 rad versus <=1e-06 rad. Other 104 keys GREEN; m3 kills idle-loop:torso, m3b kills aim-fire:right_upper in this scene. | `TEST_PYTHON="$TOON_PYTHON" heavy-run prototypes/imagine-cutout/tests/runner.sh clips` | 1 | 1 | 2026-11-01T15:56:29Z → 2026-11-01T15:56:50Z |
| CL4 | pixel | GREEN; 3 PASS / 0 FAIL / 0 ERROR | Hip range 2.0 native px (inclusive [1,2]); hem ranges 2.3999999814/1.9999999845 deg. m4 KILLED on hip_y_min, m4b on hip_y_max, m4c on hem_range in this scene. | `TEST_PYTHON="$TOON_PYTHON" heavy-run prototypes/imagine-cutout/tests/runner.sh clips` | 1 | 1 | 2026-11-01T15:56:29Z → 2026-11-01T15:56:50Z |
| CL5 | pixel | RED; 1 PASS / 1 FAIL / 0 ERROR | departure FAIL: f01_deg=0.0, f02_deg=0.0, all seven sampled deviations 0.0 versus >=1.0 deg at f01 or f02 with overall peak by f02. settle GREEN: 0.0 versus <=0.1 deg inclusive; m5 KILLED on settle in this scene. | `TEST_PYTHON="$TOON_PYTHON" heavy-run prototypes/imagine-cutout/tests/runner.sh clips` | 1 | 1 | 2026-11-01T15:56:29Z → 2026-11-01T15:56:50Z |


The command, rc, attempt and UTC interval in every case row refer to the
unmutated clip acceptance invocation. The overall rc 1 does not make its GREEN
keys RED. All killed-mutant credits refer to the separate clip-mutants command
above: rc 0, attempt 1, 2026-11-01T15:56:50Z → 2026-11-01T15:59:27Z.
Its fresh baseline has exactly the same 3,842 key records as the clip acceptance
invocation (3,743 PASS, 99 FAIL, zero ERROR).

Every RED key and exact verdict reason is retained in
[red-verdicts.txt](launcher/red-verdicts.txt), the full clip log and clips.json.
The six chaining differences per scene correspond to about 0.35, 1.2 and 1.0
degrees on each of idle-aim and cooldown-idle. No wrapped endpoint was substituted.

| Mutant | Verdict | HD target GREEN → RED | Pixel target GREEN → RED | New RED / new GREEN keys (all cases) |
|---|---|---|---|---|
| m1 | KILLED | `CL1:hd:idle:hem_left` | `CL1:pixel:idle:hem_left` | 4 / 0 |
| m2 | KILLED | 27 right_fore CL2 keys (82 eligible at baseline) | Not targeted; no credit | 27 / 0 |
| m3 | KILLED | `CL3:hd:idle-loop:torso` | `CL3:pixel:idle-loop:torso` | 7 / 1 |
| m3b | KILLED | `CL3:hd:aim-fire:right_upper` | `CL3:pixel:aim-fire:right_upper` | 2 / 1 |
| m4 | KILLED | `CL4:hd:hip_y_min` | `CL4:pixel:hip_y_min` | 2 / 28 |
| m4b | KILLED | `CL4:hd:hip_y_max` | `CL4:pixel:hip_y_max` | 20 / 14 |
| m4c | KILLED | `CL4:hd:hem_range` | `CL4:pixel:hem_range` | 2 / 8 |
| m5 | KILLED | `CL5:hd:settle` | `CL5:pixel:settle` | 4 / 1 |

[Target verdicts](launcher/mutant-target-verdicts.txt) retain each baseline PASS
and planted FAIL measurement. [mutants.json](launcher/snapshot/trenchcoat-clips/mutants.json)
retains every target, eligible GREEN key, kill key, changed disposable file and
new RED/new GREEN key. [mutant-deltas.tsv](launcher/mutant-deltas.tsv) exposes
all differences for review. Only newly RED named targets count as kills.
m5's added fire-cooldown right_fore failures are off-target; m4c's eight corrected
chaining keys are improvements from the plant, never red-first or kill credit.
No mutant SKIPPED, SURVIVED or produced an ERROR verdict.

CL6 remains withdrawn as a new case. The unchanged body suite's exact command,
rc 0, attempt 1 and UTC interval are in the ledger table. Its log line 8 is
`PASS body facing: 0 failures`; the HD body snapshot retains 82 passing samples.
No separate pixel-facing case or mutant-f rerun is recorded by this ledger;
those are NOT-RUN/deferred, not newly passed or killed. Existing mutant f's
historical kill is not represented as a current-head run.
CL7 expressions is not applicable: no expression/face-swap declaration exists.

The legacy suite passes original tests 1–5 and all 84 native joint-limit checks.
The body suite passes manifest, completeness, per_joint, combined and facing.
Its retained body-parts/red-first.json is the passing body-suite baseline at
2026-11-01T15:56:24.207408+00:00; its historical filename is not a RED verdict.
The body pose plan includes 42 single, 840 pairwise and 200 seeded random poses.

[LEDGER.tsv](launcher/LEDGER.tsv) preserves exact original bytes and commands.
The four sanitized complete attempt logs are [legacy](launcher/legacy.a1.log),
[body](launcher/body.a1.log), [clips](launcher/clips.a1.log) and
[mutants](launcher/mutants.a1.log).
[snapshot/](launcher/snapshot/) retains every supplied snapshot file: 1,685 files,
including all 1,640 native PNG atlases, without rerendering or recomputing an
acceptance result. Original-source and retained SHA-256 values and sizes for
all supplied evidence are in [SHA256.json](launcher/SHA256.json).
Host identifiers become <HOST>; ANSI formatting and trailing whitespace are
removed from text. Relative source identities avoid exposing private paths.
The numerical observations, timestamps, thresholds and verdicts are preserved.

Earlier unmutated development observations remain in
[iterative-summary.md](iterative-summary.md), iterative-ledger.tsv and their
linked artifacts. Their pending-mutant statements describe that earlier phase;
the formal evidence above supplies the current results.

This phase ran no heavy-run, suite, test runner, mutation driver, Xvfb or Godot.
Only evidence under this directory and the appended TESTS.md clip results table
are changed; frozen assertions, limits, thresholds and harnesses are unchanged.
No push or forge operation was performed.
