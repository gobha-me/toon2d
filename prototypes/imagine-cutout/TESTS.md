# Independent rig acceptance tests

Run `prototypes/imagine-cutout/tests/run_tests.sh` from any directory. Run
`prototypes/imagine-cutout/tests/run_mutants.sh` for all eight planted-mutant scenarios (explicit skips are reported).
The repository's `.venv/bin/python`, Godot, Xvfb, Pillow and NumPy are required.
The runners enforce quiet hours, at least 5 GiB free on the repository and `/tmp`,
two CPU workers, a fresh `/tmp/tween-<runid>` and EXIT cleanup. Every Godot process
and preparation run goes through `heavy-run`; exit 75 is retried after 30 minutes
(up to four attempts, stopping before 23:40 ET), then reported DEFERRED/79.
Only temporary copies are imported or mutated. No existing render is an oracle.

## Frozen acceptance rules (written before the first joint test)

1. Resolve every bone from its recursively specified JSON parent, under
   `Skeleton2D`; resolve every part under its JSON `parent_bone`. Bones must be
   `Bone2D`, parts `Sprite2D`, with an actual texture. `gun` is named `Gun` and
   other parts `Part_<id>`, as declared by the scenes. Check both scene instances.
2. Expected lengths are idle 48/24 seconds, aim 10/24, fire 6/24 and cooldown
   14/24. Idle must loop. Length and key alignment tolerance is **0.000001 s**,
   sufficient for serialized Float32 key times but 41,667 times smaller than one
   frame. Check every key of every track of every animation, including endpoints.
3. Sample actual AnimationPlayer state at every integer frame and the endpoint
   of every animation. Only fire may show MuzzleFlash, for at most **3 frames**.
   Endpoint visibility is checked separately and must be off. Both modes count.
4. Gun scale `(1,1)` and skew zero use **0.000001** numerical tolerance.
   Resolve every animation track's target, including disabled tracks, and reject
   the gun itself, its properties, and targets below it. Transform the texture's
   nontransparent pixel bounding rectangle into the hand's local coordinates at
   every sample; every edge must stay within **0.001 native pixels** of rest.
   This admits Float32 world-transform roundoff, not a visible pixel movement.

### Joint stencil and tolerances

These values are fixed before running test 5 and must never be relaxed following
a failure. Native source-pixel coordinates are used, without camera zoom.

* Pivot disk radius: **32 HD pixels**, **3 pixel-mode pixels**. The HD disk covers
  the immediate seam rather than distant silhouette motion; the pixel disk rounds
  up 32 times the JSON pixel scale (about 2.37 pixels).
* Reference alpha threshold: **128/255**, inclusive. A half-opaque silhouette
  supplies dependable coverage; faint antialias fringes do not define interiors.
* Allowed background pixels: **0**. A single exposed native pixel is a gap.
* Key colour: **RGB (255,0,255)**. Colour-match tolerance: **3/255 per channel**,
  inclusive, to allow framebuffer conversion rounding. No image erosion,
  dilation, component-size filter, or post-failure adjustment is used.
* Disk membership uses pixel centres and the inclusive squared-radius comparison;
  no positional or angular tolerance is applied to the specified limits.

For each JSON bone and each limit, independently reset every bone to its authored
rest transform. Render the actual whole scene at that limit on flat magenta.
Build an independent local coverage stencil by rendering only sprites attached
directly to the parent and child bones at rest, on transparent backgrounds. Their
union is U. Transport that entire rest union once with the parent frame and once
with the child frame, rotating about the actual joint pivot. The tested interior
is the intersection of these two transported unions and the pivot disk. This
reduces moving exterior-boundary effects while retaining places covered
by the rest assembly in both frames where articulation can open a seam. Count
magenta pixels inside that interior in the actual, complete posed scene. Other
real parts can legitimately supply backing; they remain in the actual render.
Save the two references, actual image, and marked failing pixels in temporary
storage, and persist counts and stencil sizes in `tests/results/real.json`.

All 17 JSON joints are reported, including hip: hip has no parent-bone sprite,
so its child-only union moves as a whole. This root check has no mating seam.
An empty stencil is explicitly a failure for every non-root joint, rather than
silently certifying an unobserved seam. Only the root may have no tested pixels.
These are local rest-coverage checks, not proof about all simultaneous poses,
external silhouette aesthetics, or gaps that were already absent from both rest
reference unions. Every observed gap stays a failure.

## Independence and mutations

Authored from the supplied brief, JSON, scene resources, project settings and
README run commands. No rig commit diff/history was read. Production scripts
were searched only for node names/paths. The harness drives real scene instances;
there are no mocked rigs or production-code imports into the Python oracle.

GDScript has no Stryker/Gremlins/Mull equivalent, so this planted-mutant run stands in for mutation testing.

Each mutant gets a fresh prototype copy without `renders/` or `.godot/`. The
zero-overlap mutant additionally copies tools and source art into its temporary
repository and invokes the documented preparation command with `--overlap-px 0`.
Mutants change serialized animation/scene resources or regenerated temporary
assets only. The original JSON and test expectations remain the oracle for
bone-removal detection. Because a baseline joint failure is possible, the mutant
report distinguishes expected-test rejection from new/increased joint failures.

## Historical PoC execution (before this kit)

Final real run: **2026-10-30T15:58:57.357715+00:00**, Godot 4.7.2; exit **1**.
Both initial and final real runs produced the same joint counts. All frozen
tolerances and the coverage-stencil algorithm were retained.

| Test | Real result | Evidence |
|---|---|---|
| 1 Hierarchy | PASS, both scenes | All 17 bones and 18 textured parts resolve under their specified parents. |
| 2 Timing | PASS, both scenes | 48/10/6/14 frames; idle loops; all track keys on 1/24 s boundaries. |
| 3 Flash | PASS, both scenes | Fire frames 0, 1, 2 only; all other playback frames and all endpoints hidden. |
| 4 Gun rigidity | PASS, both scenes | Unit scale, zero skew, no gun-targeting tracks, constant hand-local texture bbox. |
| 5 Joint gaps | FAIL | 58/68 limits pass; one uncovered pixel and nine empty non-root stencils. |

There are **164 animation-state samples** across both scenes, including eight
endpoints. Joint testing produced **204 fresh native captures**: parent-frame
reference, child-frame reference and actual pose for each of 68 limits.

The one uncovered HD boot pixel is near the actual outer outline. It is an
exposed pixel inside the frozen expected-coverage stencil, not evidence of
an enclosed hole. The intersected reference unions reduce but cannot eliminate
all silhouette/raster boundary effects. The strict failure is retained.
Nine empty stencils cannot certify their joints: both limits of hem_center
and hem_right in both modes, plus pixel leg_left at its maximum. No radius
was enlarged, pixel allowance increased, or failure filtered out.

Per-joint entries below are **minimum / maximum**. `FAIL E` means an empty
non-root stencil; `FAIL 1` means one exposed background pixel. `PASS` means
zero background pixels within a nonempty stencil (hip has no mating parent).

| Joint | Limits (degrees) | HD min / max | Pixel min / max |
|---|---|---|---|
| hip | -3, 3 | PASS / PASS | PASS / PASS |
| torso | -4, 4 | PASS / PASS | PASS / PASS |
| head | -8, 8 | PASS / PASS | PASS / PASS |
| hair | -5, 5 | PASS / PASS | PASS / PASS |
| collar | -4, 4 | PASS / PASS | PASS / PASS |
| coat | -3, 3 | PASS / PASS | PASS / PASS |
| hem_left | -8, 8 | PASS / PASS | PASS / PASS |
| hem_center | -6, 6 | FAIL E / FAIL E | FAIL E / FAIL E |
| hem_right | -8, 8 | FAIL E / FAIL E | FAIL E / FAIL E |
| right_upper | -12, 85 | PASS / PASS | PASS / PASS |
| right_fore | -18, 20 | PASS / PASS | PASS / PASS |
| right_hand | -12, 12 | PASS / PASS | PASS / PASS |
| left_arm | -8, 8 | PASS / PASS | PASS / PASS |
| leg_left | -7, 7 | PASS / PASS | PASS / FAIL E |
| leg_right | -7, 7 | PASS / PASS | PASS / PASS |
| boot_left | -6, 6 | FAIL 1 / PASS | PASS / PASS |
| boot_right | -6, 6 | PASS / PASS | PASS / PASS |

The native references, posed images and green-marked uncovered pixels for
rejected limits are in [tests/results/pre-fix2/real-images](tests/results/pre-fix2/real-images).
Counts are summarized in [tests/results/pre-fix2/SUMMARY.md](tests/results/pre-fix2/SUMMARY.md);
`tests/results/real.json` now holds the post-fix run. The enlarged boot review
image uses nearest-neighbour scaling only; native PNGs are authoritative.

Final planted-mutant run: exit **0**; **4/4 KILLED**.

| Mutant | Temporary change | Expected red test | Observed red tests | Result |
|---|---|---|---|---|
| a | Fire flash off-key moved from 3/24 to 5/24 s in both scenes | 3 | 3, 5 | KILLED |
| b | hair bone and its attached part removed from both scenes | 1 | 1, 5 | KILLED |
| c | Prepared parts regenerated with --overlap-px 0 | 5 | 5 | KILLED |
| d | First idle rotation key moved from 0 to 0.01 s in both scenes | 2 | 2, 5 | KILLED |

Test 5 is already red on the real rig. For mutant c, rejection additionally
requires an increased gap count, rather than credit for that existing failure.
Ten joint limits worsened; nine newly expose pixels, and HD boot_left/min
increases from one to two pixels. The largest increases are HD right_fore:
**0 -> 161** at minimum and **0 -> 180** at maximum. Other increased counts
and the exact changed filenames are recorded in [mutants.log](mutants.log)
and [tests/results/mutants.json](tests/results/mutants.json).

Each mutant has full observed results and Godot logs under `tests/results/`.
The zero-overlap preparation transcript is `tests/results/mutant-c.prep.txt`.
Every temporary project, source-art copy, import cache and render was
discarded; the retained files are test evidence only. No core dump occurred.
No heavy-run bypass, parallel Godot pool, paid service, network/forge
operation, or production rig/preparation/animation modification was used.

The remaining inability is certification of gap-free joints: the frozen
test rejects the real rig, including the nine empty observation regions.
These results are reported without changing production assets or thresholds.

## Post-fix re-run (after change commit "Back real waist, left hip and boot seams with garment underlaps")

The test code, frozen rules and tolerances above were not edited. The first
recorded execution above is the pre-fix baseline; its summary, mutant table and
failing-joint images are preserved under
[tests/results/pre-fix2/](tests/results/pre-fix2/) (its bulky per-run JSON and Godot
logs were dropped from this PR for size).

One gap-fix change (Codex A session, change commit) added two Segments-derived
backing parts (`coat_lining`, `hip_backing`), extended `hem_center`, `hem_right`
and `coat_yoke` up to the waist seam, moved the `leg_left` pivot from x=488 to
x=535 (onto the thigh seam) and extended `boot_left` backing. The suite and the
mutant run were then re-run unmodified by the supervising agent, not by Codex A:

| Test | Post-fix result |
|---|---|
| 1 Hierarchy | PASS, both scenes (17 bones, 20 parts) |
| 2 Timing | PASS, both scenes |
| 3 Flash | PASS, both scenes |
| 4 Gun rigidity | PASS, both scenes |
| 5 Joint gaps | PASS, 68/68 limits, zero gap pixels, no empty stencil |

Post-fix planted-mutant run: exit **0**; **4/4 KILLED**. With test 5 green on the
real rig, every mutant is now judged against an all-green baseline.

| Mutant | Expected red test | Observed red tests | Result |
|---|---|---|---|
| a: flash 5 frames | 3 | 3 | KILLED |
| b: hair bone removed | 1 | 1, 5 | KILLED |
| c: --overlap-px 0 | 5 | 5 (11 limits newly gapped; HD right_fore 0 -> 161 / 180) | KILLED |
| d: idle key shifted 0.01 s | 2 | 2 | KILLED |

Test 5 remains a local rest-coverage check at each joint's limits, not proof
that every combined pose is gap-free.

## Issue 16: packaged mutant runner

The runner resolves `tools/prep_parts.py` inside this prototype. Raw Segments
PNGs are absent from the public clone (only provenance sidecars are committed).
Mutant c therefore reports **SKIPPED**, naming `src/parts/raw-hd` and
`original.png`; it is never credited as killed. A, b and d still run against
fresh scene copies. No original assertion, coverage rule or tolerance changed.
Godot uses one scene thread and a worker pool capped at two in scratch projects.
Public logs replace temporary/repository/interpreter paths and omit host identity.
Use `TEST_PYTHON=<existing Python with Pillow and NumPy>` if no local venv exists.

## Body-part kit: test lane contract and red-first run

`body_parts.yml`, the new observers and all evidence live beside the existing
prototype tests. This keeps the PoC project self-contained for disposable copies
and fresh-clone proof; no production scene, script, tool or asset is changed.
The manifest is JSON-compatible YAML 1.2, readable with the existing Python
standard library and Godot JSON parser. No additional dependency is needed.

Run from the repository root, with `TEST_PYTHON` set if needed:

```bash
prototypes/imagine-cutout/tests/run_body_tests.sh       # full HD acceptance, expected exit 1 on PoC
prototypes/imagine-cutout/tests/runner.sh oracle       # small oracle and sampler controls
prototypes/imagine-cutout/tests/run_tests.sh           # original HD + pixel acceptance
prototypes/imagine-cutout/tests/run_mutants.sh         # original a-d plus new e-h
prototypes/imagine-cutout/tests/runner.sh body-mutants  # e-h with a full fresh baseline
```

The kit applies to HD. The original pixel tests remain intact as regressions;
no pixel assets are created. The manifest freezes 14 slots and 21 joints,
including the existing hip, torso and garment joints. `bone`/`part_parent_bone`
name the slot's owning bone; `parent_bone` names that joint's skeletal parent.
Each slot has a source-pixel pivot, limits, overlap and reasons. Existing values
come from the committed PoC `parts.json`. Proposed left elbow/wrist and knee
pivots and limits are labeled **v2 proposal**. Feet retain their PoC pivots and
limits but require knee parents. The head/face is the single `head_face` slot.
The gun remains a rigid prop with its original zero-dilation exception.

Completeness observes the loaded HD scene directly, checking each required
Bone2D, its actual parent, source-space rest pivot and limits, each textured
slot's owning bone, nonempty texture, and the subject's declared pivot, offset
and overlap. Deleting a declaration cannot reduce the expected inventory.
Changing a test-owned pivot, limit or tolerance requires a tests commit.

### Poses, native rendering and frozen oracle

`body_driver.py` freezes **COMBINED_RANDOM_N = 200** and
**COMBINED_SEED = 20261030**. There are 42 single-joint limit poses. The combined
set always contains all **840** cases from `C(21,2) * 4` min/max combinations,
**in addition to** the 200 random poses. Pairwise cases leave the other joints
at rest; each random case draws every joint within its manifest limits. Missing
joints remain scheduled and fail; they are never removed from the pose plan.
The complete 1,082-pose plan and its SHA-256 are retained with the run evidence.

For each pose and each manifest joint, the independent observer instantiates the
real HD scene, stops animation and restores every actual bone before assigning
the scheduled rotations. It renders three **72 x 72 native-pixel** tiles: the
parent-transported rest union U, the child-transported U, and the actual complete
posed scene over magenta. U consists of the real sprites directly on the joint
and its parent. In combined poses the reference transforms are
`posed_parent * inverse(rest_parent)` and `posed_child * inverse(rest_child)`;
both therefore include all ancestor rotations. Crops follow the actual posed
joint pivot. Other actual parts remain visible and can provide real backing.

Tiles are clipped individually into one atlas per pose, avoiding tens of
thousands of separate framebuffer saves. Native texture filtering and the
original test-5 stencil are retained: radius **32**, reference alpha **>=128**,
magenta tolerance **3** per channel and allowed gap pixels **0**. An empty
non-root stencil fails. No erosion, dilation, image cleanup, error allowance or
post-failure tolerance change is applied. The root has no mating seam.
The observer reports missing manifest bones or parent chains as failures rather
than attempting to implement or synthesize them.

The atlas and original observer agree exactly on gap and stencil counts for all
30 comparable HD limits; see
[atlas-calibration.txt](tests/results/body-parts/atlas-calibration.txt). The
comparison uses fresh-clone mutant-d captures: its timing mutation cannot alter
joint captures, which explicitly reset all bones to rest. Five independent
controls pass: one-pixel rejection, alpha/key boundaries, empty-stencil rejection,
exterior-pixel exclusion and exhaustive/deterministic pose coverage.

Facing observes the real head and gun sprite transforms at all **82** animation
frames/endpoints. The visually reviewed head axis is image-right. Gun direction
uses the frozen PoC grip/muzzle points in gun-texture coordinates, including
inherited transforms and sprite flip flags. The transformed horizontal axes must
have matching signs; a numerical zero is unobservable and fails. This is a
sagittal left/right test for this cutout's frozen artwork, not general image
recognition. Changing the artwork requires a new reviewed test-owned facing axis.

### Current PoC evidence

[red-first.json](tests/results/body-parts/red-first.json) and its Godot log retain
the complete failing run, with every pose/seam count, missing-feature error,
facing sample, manifest hash and pose hash. `red-first.poses.json` retains all
angles. The initial command transcript is
[body-first-run.txt](tests/results/body-first-run.txt). Representative native
atlases for single, pairwise and random poses are retained in `red-first-images/`.
The full mutant command transcript is `tests/results/mutants-body-run.txt`.

| Check | PoC result | Reason |
|---|---|---|
| Manifest schema/inventory | GREEN | 14 frozen slots and 21 joints, reasons and fixed tolerances validate. |
| Completeness | RED, 10 errors | Left lower arm/hand and both lower-leg slots absent; left elbow/wrist and both knees absent; boots remain directly on thigh bones. |
| Per-joint gaps | RED, 252 of 882 seam observations | Six required joint/parent chains are missing in each of 42 poses. All 630 observable seam observations have zero gap pixels. |
| Combined gaps | RED, 6,242 of 21,840 seam observations | 6,240 missing-chain errors plus two observable failures: `random/057` hem_right has 1 gap pixel; `random/148` hem_right has 2. |
| Facing | RED, 25 of 82 samples | Head looks right while the raised weapon arm points left during aim, fire and cooldown samples. |
| Oracle/sampler controls | GREEN, 5 checks | Strict pixel rejection and complete, reproducible extreme coverage. |

The new reds are expected test-first requirements. No rig feature was added,
no gap was filtered, and no missing or unobservable feature was certified.

### Fresh-clone issue-16 proof

[fresh-clone.txt](tests/results/issue16/fresh-clone.txt) records a fresh local
`git clone --no-hardlinks`, detached checkout of tests commit
`f8e38b9fe2fc86165d8bb35060b503491d9b2545`, and the mutant command's **exit 0**.
Fresh Godot imports, observations and native renders killed **a, b and d** in
their expected tests. **c SKIPPED** with a clear missing `src/parts/raw-hd`
Segments PNG / `original.png` message. Its tool is committed in the prototype;
the raw source images are not. Per-mutant JSON and Godot transcripts from that
clone are retained under `tests/results/issue16/`. The baseline existing tests
were green, and no original assertion or tolerance changed. This is a controlled
skip, not a claim that all four original mutants can run from a public clone.

### Planted mutants stand in for mutation testing

The existing runner is extended to a-h. Every mutation is applied exclusively
to disposable scene/asset copies; the manifest, limits, tolerances, N and seed
remain unchanged. Each trial runs all 42 per-joint poses and the completeness
and facing checks. Combined acceptance is always run in full on a fresh
baseline; these focused mutant trials do not certify combined poses.

| Mutant | Planted subject change | Relevant result |
|---|---|---|
| a | Fire flash off-key shifted to 5/24 s | KILLED by original flash test 3. |
| b | Hair bone and its sprite removed | KILLED by original hierarchy test 1. |
| c | Regenerate from raw sources with overlap 0 | SKIPPED: public clone has no raw Segments PNGs. |
| d | First idle key shifted to 0.01 s | KILLED by original timing test 2. |
| e | Remove only the head/face sprite, retaining its bone | KILLED: new `slot/head_face` completeness failure. |
| f | Flip only the head sprite horizontally | KILLED: 57 newly failing animation samples, including previously green idle poses. |
| g | Remove a knee bone | CANNOT_PLANT: `knee_left` is already absent. Existing red checks are not credited as a kill. |
| h | Clear all source-space alpha shared by the right upper/lower arm from the lower arm; set that part's overlap declaration to 0 | KILLED: new native gap pixels at the right elbow's min and max limits. |

Mutant h is a test-only zero-physical-overlap carve of the committed textures,
not a claim to reproduce the source-based preparation command of mutant c.
Its report records 1,127 removed shared pixels and right elbow gaps rising
from 0 to 124 pixels at minimum and 0 to 140 at maximum.
The kill requires an increase in actual gap pixels; a changed overlap declaration
or existing missing knees alone cannot kill it. The cut uses the same source
pivots and offsets as the committed textures and clears their entire shared alpha
region, leaving zero shared coverage for this arm pair at rest.

Because the baseline already fails v2 completeness and facing, e/f/g must add
specific failure keys absent from the baseline. Flipping the head corrects some
raised-arm mismatches but introduces 57 other failures; those newly red samples
are the evidence for f. Full per-mutant JSON and Godot logs are under
[tests/results/body-parts/](tests/results/body-parts/); `mutants.json` there records
e-h, while `tests/results/mutants.json` records a-d. A **zero mutant-run exit**
means every plantable trial was killed and every unavailable trial was explicitly
reported; it does not mean the real rig passes acceptance or all eight were
planted. Skipped c files are overwritten with SKIPPED evidence, so earlier
historical kills cannot be mistaken for a current run.

No paid/generation/forge operation was used. All commits are local test-lane
commits. V2 rig implementation and source-image regeneration remain outside this
lane; the red tests and unplantable knee mutation are the handoff to that work.

### Final committed-source verification

[final-fresh-clone.txt](tests/results/final-fresh-clone.txt) records a second clean
local clone, detached at `e8a64c7b64773e33a721c6c760a58b82449a22e4`.
The entire verification command ran under `heavy-run`, with each Godot child
also guarded and at most two workers. Original tests **1-5 all pass** (68/68
joint limits, zero gaps, no empty stencils); all five oracle controls pass.
The full extended mutant run exits **0**, reproducing six kills and the two
explicit unavailable scenarios. The committed-source HD kit baseline reproduces
all expected reds and exactly the same 1,082-pose plan and three gap pixels.
The current results and skipped-c evidence were copied back from that clone.

Final scope verification confirms no production scene, script, tool, part,
`parts.json` or project setting changed. Commit authors/committers and the exact
required trailers were checked. The full change diff passes whitespace,
private-path/host-name-pattern and redacted secret scans. No network/forge
operation, installation, paid service, core dump or heavy-run bypass occurred.

### Deferred suite verification after the review fixes

The launcher executed all three previously deferred suites against
`f3418a43e865d61af21e8d2618a91a53aacc13a1`. Its verdict is **PASS** for F1,
F2 and F3, each with **rc 0 on one attempt**, and it records **PUSHGATE=OPEN**.
The supplied verdict has no `STATUS`; final scope and hygiene status remains
launcher-owned. No push was performed.

[Verification evidence](tests/results/verify-fix19/SUMMARY.md) records every
exact ledger command and start/end UTC time, sanitized complete attempt logs,
the full final results snapshot, the launcher verdict and original-source hashes.
The original tests 1-5 and all five body acceptance checks pass. Mutants
**a, b, d, e, f, g and h are KILLED**; **c is explicitly SKIPPED** for missing
raw Segments PNG inputs and is not credited as killed or passed. No suite is
NOT-RUN in this launcher verdict; any NOT-RUN result remains deferred.

The final snapshot's historical `body-parts/red-first.json` filename contains
the passing fresh baseline from the mutant suite, not the earlier PoC reds or
a separate saved body-suite attempt. Historical observations above remain
historical. This phase only read and recorded existing evidence; it ran no
tests, runners, suites or Godot, and changed no assertion, tolerance or harness.

## Clip acceptance (frozen before the first clip test run)

This contract is committed before any clip acceptance run. It adds only CL1-CL5,
for both `hd` and `pixel`; rules 1-4 and the joint stencil above remain frozen.
The manifest `body_parts.yml` supplies all 21 bones, their parents and rotation
limits. JSON `parts.json` supplies the joint inventory for the seam observations.
Clip order is idle, aim, fire, cooldown: 48, 10, 6, 14 frames at 24 fps. Observe
actual AnimationPlayer state at every integer frame n/24, n=0..frames-1, and
at each endpoint. Duplicate each Animation, set its loop mode to LOOP_NONE,
and sample the duplicate at its length, including idle at 2.0 seconds. Never
alter the source scene to observe endpoints. A wrapped idle endpoint is invalid.

Every key below receives exactly one stable-order `PASS <key>` or
`FAIL <key>: <measured> vs <threshold>` verdict, plus a summary per case and
scene. An unevaluable key, missing resource, parse failure or process crash
produces `ERROR <key>: <why>` and exit 2, distinct from acceptance RED (exit 1)
and all GREEN (exit 0). ERROR never counts as RED or as a mutant kill.

| Case | Keys and frozen acceptance |
|---|---|
| CL1 limits | `CL1:<scene>:<clip>:<bone>` for all manifest bones and all four clips. Every sampled rotation must lie inside its manifest limits, inclusive, with only 0.000001 rad roundoff tolerance. |
| CL2 gaps | `CL2:<scene>:<clip>:<sample>:<joint>` for every JSON joint and sample (`f00`..`f47` as applicable, or `end`). Render the actual whole pose on flat magenta. Apply the frozen rest-union stencil transported with the posed parent and child, including all ancestor transforms; radius 32 HD or 3 pixel native pixels, reference alpha >=128, RGB (255,0,255) tolerance 3 per channel, inclusive pixel-centre disk. Allowed background pixels 0; empty non-root stencil fails; only the root may have an empty stencil. No image filtering or morphology. |
| CL3 chaining | `CL3:<scene>:<pair>:<bone>` for every rotation track and `CL3:<scene>:<pair>:hip.position` for the hip position track. Exactly five pairs: idle-loop (idle endpoint to idle f00), idle-aim (idle f00 to aim f00), aim-fire (aim endpoint to fire f00), fire-cooldown (fire endpoint to cooldown f00), cooldown-idle (cooldown endpoint to idle f00). Rotation difference <=0.000001 rad; position distance <=0.001 native px. Endpoints use nonlooping copies. |
| CL4 idle motion | `CL4:<scene>:hip_y_min`, `CL4:<scene>:hip_y_max`, `CL4:<scene>:hem_range`. Hip local y range is inclusive [1.0,6.0] HD native px or [1,2] pixel native px, with 0.001 px roundoff tolerance on both bounds. Do not convert pixel units to HD. At least one of hem_left/hem_right has rotation range >=1.0 degree. |
| CL5 recoil | `CL5:<scene>:departure`: right_fore differs from aim endpoint by >=1.0 degree at fire f01 or f02 (peak of those two no later than f02). `CL5:<scene>:settle`: fire endpoint is within 0.1 degree of aim endpoint, inclusive. The shoulder is not the elbow and cannot satisfy departure. |

CL6 is withdrawn: rerun the existing body-facing suite unchanged through the
launcher; its historical red record above stays historical. CL7 expressions
is not applicable: the manifest declares no expression or face-swap parts.

The pinned rig is unchanged. Expected baseline from serialized data: CL1 GREEN;
CL3 RED on idle-aim and cooldown-idle torso, hem_left, hem_right in each scene
(0.35, 1.2, 1.0 degrees respectively), with all other chaining keys GREEN;
CL4 GREEN (hip ranges HD 6, pixel 2; hem ranges 2.4/2.0 degrees);
CL5 departure RED (0 degrees), settle GREEN. CL2 is unverified until rendering.
These are expectations, never substitutes for actual observations.

### Frozen clip mutants and target-key accounting

`tests/runner.sh clips` drives the new observer. `tests/runner.sh clip-mutants`
is reserved for the launcher. Each mutant starts from a fresh prototype copy;
only disposable scenes/assets change. The same invocation first runs a fresh
unmutated baseline. Exactly these eight mutants are supported:

| Mutant | Plant | Required target keys, GREEN at baseline |
|---|---|---|
| m1 | Set one idle hem_left rotation key to its manifest max +0.5 degree (8.5 degrees), both scenes. | `CL1:<scene>:idle:hem_left` |
| m2 | Reproduce the existing zero_overlap arm-alpha carve: clear the entire rest shared right_upper/right_fore alpha from HD right_fore only; declare joint_overlap_px 0. Pixel texture stays unchanged. | At least one `CL2:hd:<clip>:<sample>:right_fore` |
| m3 | Add 1 degree only to the idle t=2.0 torso rotation key, both scenes. | `CL3:<scene>:idle-loop:torso` |
| m3b | Add 1 degree only to fire f00 right_upper (75 to 76 degrees), both scenes. | `CL3:<scene>:aim-fire:right_upper` |
| m4 | Set every idle hip position key to its f00 value, both scenes. | `CL4:<scene>:hip_y_min` |
| m4b | Move only idle hip position t=0.5 y by -1 native px (HD 677 to 676, pixel 49 to 48); preserve t=0 and t=2.0. | `CL4:<scene>:hip_y_max` |
| m4c | Set every idle hem_left and hem_right rotation key to 0, both scenes. | `CL4:<scene>:hem_range` |
| m5 | Add 1 degree only to fire endpoint right_fore (8 to 9 degrees), both scenes. | `CL5:<scene>:settle` |

A kill requires a target key GREEN in this baseline and RED after planting.
Existing reds, ERRORs, off-target new failures and corrected old failures cannot
supply credit. Report all newly RED and newly GREEN keys separately. If no target
is GREEN at baseline, print `SKIP mutant <id>: target keys RED at base [<keys>]`;
a skip is never a kill and makes the invocation nonzero. In particular m2 needs
at least one HD right_fore baseline GREEN and newly RED CL2 key; otherwise it
SKIPs and requires review without relaxing the stencil or redefining the plant.
Before each plant print `Running mutant <id>`, then exactly one terminal line:
`PASS mutant <id>: KILLED [<new keys>]`, `FAIL mutant <id>: SURVIVED`, or
`SKIP mutant <id>: <why>`. Exit 0 requires all eight KILLED, exit 1 indicates a
survivor/skip, and exit 2 indicates a harness error. All five cases must be RED
for their own specified reason or covered by their named killed mutant(s).

Phase B writes and checks the harness only, with no mutation execution. The
launcher owns existing-suite, body-suite, clip-baseline and clip-mutant runs.
Their command, rc, attempt and UTC ledger, per-scene classifications and mutant
evidence belong in the later appended clip results table. No measured runtime
results are claimed by this frozen acceptance commit.

### Clip observer execution details

CL5 departure's "peak no later than frame 2" also requires the maximum sampled
fire deviation (frames 0-5 and endpoint) to be reached at frame 1 or 2; an early
1-degree departure followed by a larger late peak does not pass. The frozen
1-degree departure and 0.1-degree settle thresholds are unchanged.

A heavy-run refusal produces ERROR observations, stops further heavy steps and
returns the original 75 or 78 to the caller. There is no internal wait/retry or
unguarded fallback; the launcher owns its subsequent retry/stop policy.

### Clip development observations before launcher acceptance

[Iterative evidence](tests/results/trenchcoat-clips/SUMMARY.md) records three
sequential, guarded Godot steps (import, observe, render), each rc 0 on its first
attempt, and light evaluation of their raw outputs. There were no exits 75/78,
no retry and no mutation run. The evaluator yields acceptance rc 1, no ERRORs,
3,842 key verdicts and 164 fresh native atlases. These development observations
are distinct from the launcher's later formal suite ledger and kill verdicts.

| Case | HD | Pixel | Interpretation |
|---|---|---|---|
| CL1 | GREEN, 84 keys | GREEN, 84 keys | Limits hold; m1 pending launcher. |
| CL2 | GREEN, 1,722 keys | RED, 85 of 1,722 keys | Pixel samples expose 1-7 background pixels; HD right_fore has 82 GREEN m2 targets. m2 has not run. |
| CL3 | RED, 6 of 110 keys | RED, 6 of 110 keys | idle-aim and cooldown-idle torso/hem_left/hem_right discontinuities; all other pairs and positions GREEN. |
| CL4 | GREEN, 3 keys | GREEN, 3 keys | Hip range 6 HD / 2 pixel native px; hem range about 2.4/2.0 deg. m4/m4b/m4c pending. |
| CL5 | RED departure, GREEN settle | RED departure, GREEN settle | No elbow recoil (0 deg); endpoint returns to aim. m5 pending. |
| CL6 | Existing check unchanged | No new case | Body-facing rerun belongs to launcher. |
| CL7 | Not applicable | Not applicable | No expression/face-swap declaration. |

All eight clip mutants remain unrun, including m3/m3b for chaining. No kill is
claimed from existing reds or this baseline alone. Full formal acceptance and
mutation results await the launcher. The harness change requires review.

### Clip results from final launcher suites

The launcher tested committed head `37c78463a2fbf6aefb6b3a3c48505241cb177133`;
RIG-EQUALS-BASE=yes against `cf702b44326db2a9891eb4059372a13e6765cfce`.
These formal results supersede the pending-launcher status of the development
observations above. [Full evidence](tests/results/trenchcoat-clips/SUMMARY.md)
retains the exact ledger, all attempt logs, complete snapshot, hashes and every
RED verdict reason. No suite was run during this evidence-only phase.

| Item | Result | rc | Attempt | Start UTC | End UTC | Exact ledger command |
|---|---|---|---|---|---|---|
| Legacy suite (T1-trenchcoat-legacy) | GREEN | 0 | 1 | 2026-11-01T15:54:01Z | 2026-11-01T15:54:17Z | `TEST_PYTHON="$TOON_PYTHON" heavy-run prototypes/imagine-cutout/tests/run_tests.sh` |
| Body suite (T2-trenchcoat-body) | GREEN | 0 | 1 | 2026-11-01T15:54:17Z | 2026-11-01T15:56:29Z | `TEST_PYTHON="$TOON_PYTHON" heavy-run prototypes/imagine-cutout/tests/run_body_tests.sh` |
| Clip acceptance (T3-clips-red-first) | RED (acceptance verdicts) | 1 | 1 | 2026-11-01T15:56:29Z | 2026-11-01T15:56:50Z | `TEST_PYTHON="$TOON_PYTHON" heavy-run prototypes/imagine-cutout/tests/runner.sh clips` |
| Clip mutants (T4-clip-mutants) | All eight KILLED | 0 | 1 | 2026-11-01T15:56:50Z | 2026-11-01T15:59:27Z | `TEST_PYTHON="$TOON_PYTHON" heavy-run prototypes/imagine-cutout/tests/runner.sh clip-mutants` |

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

All named mutant credits use the clip-mutants ledger row: rc 0, attempt 1,
2026-11-01T15:56:50Z → 2026-11-01T15:59:27Z. Exactly m1, m2, m3, m3b, m4, m4b,
m4c and m5 are KILLED on target keys GREEN in that invocation's fresh baseline.
m2 has 82 eligible HD right_fore targets, 27 newly RED; pixel is not targeted.
The baseline matches all 3,842 clip-acceptance key records; zero ERRORs occur.
GREEN counts within an overall RED case retain their own status; existing reds,
off-target failures and newly GREEN keys do not supply mutant kill credit.

CL6 is withdrawn as a new case. The unchanged body suite passes HD facing,
`PASS body facing: 0 failures` (log line 8; 82 samples), using its ledger command,
rc 0, attempt 1, 2026-11-01T15:54:17Z → 2026-11-01T15:56:29Z.
No separate pixel-facing case or mutant-f rerun is recorded here: NOT-RUN/deferred,
never newly passed or killed. CL7 expressions remains not applicable.
There are no NOT-RUN items among the four supplied ledger rows; any NOT-RUN
result is deferred. No refusal 75/78 or retry is recorded. Clip acceptance stays
RED, and **REVIEW=required** applies to the final evidence head because the
runner modes changed. No final launcher completion verdict was supplied.

## Issue 18: recorded Xvfb ownership (M1)

The runner starts Xvfb with `-displayfd`, writes its child PID immediately to
`$TMPDIR/xvfb.pid`, exports DISPLAY, then stops and waits for that recorded
child before removing scratch. EXIT, INT and TERM share this cleanup. Drivers
render on this display without `xvfb-run`. An active heavy child receives TERM
through its recorded process group and is waited for before X server cleanup.

The allowlisted `xvfb_no_orphan_normal_exit` and `xvfb_no_orphan_on_term` checks
use a quick consumer in a disposable copy of the runner. They require a real
X server, retain the PID from its pidfile, and assert that `kill(pid, 0)` fails,
its display lock is absent and scratch is removed after the runner exits.
The old runner fails the recorded-PID ownership contract before any process
lookup; these controls never discover a server by name or display number.

`driver_heavy_defer_policy` invokes the real `driver.heavy` with a PATH stub:
75/0 must succeed after two attempts, persistent 75 must produce DEFERRED/79
at four attempts, and 78 must stop immediately. The default retry interval is
1,800 seconds, injectable through `DRIVER_HEAVY_RETRY_SECONDS` for this test.
Retries stop before 23:40 ET and never enter quiet hours. Every 75 is UTC dated.

Red-first command (exported old harness at dffcb51):

```bash
heavy-run <PYTHON> prototypes/imagine-cutout/tests/test_harness_policy.py --baseline dffcb51
heavy-run <PYTHON> prototypes/imagine-cutout/tests/test_harness_policy.py
```

Execution is **deferred (heavy-run 75)**, including red-first proof and current
lifecycle/policy verification. The refusal is retained in
`tests/results/harness-policy-red-first.txt`; it is not a red test result.
Shell syntax and Python parsing pass. No existing assertion was edited in M1.

## Issue 18: character contracts (M2)

`characters.yml` is a test-owned JSON-compatible YAML index. It selects the
manifest, HD scene, subject declaration, legacy scene modes, required slot/joint
inventories, random count and seed. Every runner accepts `--character` (default
`trenchcoat`). Evidence now goes to `tests/results/<character>/`, preserving the
historical PoC red-first evidence. `--output` selects the body/legacy result file.
The observer receives the selected contract through scratch `manifest.json`;
no production manifest, scene, script or part is rewritten.

| Character | Canvas | Joints | Required slots | Singles | Pair extremes | Random N / seed |
|---|---|---|---|---|---|---|
| trenchcoat | 1152 x 1728 | 21 | 14 | 42 | 840 | 200 / 20261030 |
| char2 | 512 x 768 | 15 | 14 | 30 | 420 | 200 / 20261031 |

Trenchcoat's original `body_parts.yml`, pivots, limits, overlap, tolerances and
pose generation order/values are unchanged. The parameterized coverage control
compares its entire pose plan with the retained historical plan. The fresh
trenchcoat verdict comparison requires a heavy-run execution and is pending.

Char2 is an original fictional stocky courier carrying a rigid satchel. Each
pivot, limit and overlap has a reason and `v2-new, chosen` basis. The head axis
and satchel handle axis are provisional design requirements until actual art
can be reviewed. No artwork or rig is invented, and no placeholder is needed
for the missing-scene test. The same zero-pixel tolerance and oracle apply.

Mutants a,b,d use character-selected scene paths; e,f,g,h use the selected
manifest, head part, knee, arm textures and subject declaration. A non-gun prop
uses `Part_<id>` rather than `Gun`. Char2 mutants cannot be planted until its
rig and subject declaration exist; no missing-scene result counts as a kill.
Mutation comparisons still require newly relevant failures or increased gaps.

Existing assertion edits in M2 (line numbers refer to this commit):

- `tests/body_driver.py:88-90`: fixed slot count/inventory and joint tuple ->
  character-index inventory; the trenchcoat index is additionally checked
  against the same frozen Python constants. Reason: independent per-character
  inventories while preserving the old trenchcoat requirements.
- `tests/body_driver.py:139`: fixed random count in pose-count assertion ->
  selected count (index validates N >= 200); trenchcoat remains exactly 200.
- `tests/body_driver.py:214-216`: fixed atlas joint tuple/width -> selected
  manifest tuple/width. Reason: char2 has 15 joints, trenchcoat still has 21.
- `tests/test_body_oracle.py:62-71`: fixed 200 random poses, 840 pairs and
  fixed joint-name set -> selected N, exhaustive pair formula and selected
  inventory. The full historical trenchcoat pose equality assertion is added.
- `tests/driver.py` animation mutation's fixed hair removal assertion keeps
  the same removal count (two nodes), with a character-selected leaf name.

No numerical tolerance, gap rule, alpha threshold or mutation kill criterion
was relaxed. All new checks are the brief's allowlisted schema, parameterized
existing acceptance/coverage checks, or lifecycle/heavy-policy checks.

## Issue 18: char2 red-first admission (M3)

The char2 command is recorded in `tests/results/char2/red-first.txt`.
It is **deferred (heavy-run 75)**: the guard refused to start, so no acceptance
verdict is reported. On admission, the expected results are manifest GREEN and
completeness, per-joint, combined and facing RED because `scenes/char2.tscn`
and `characters/char2/parts.json` do not exist. This is an expected missing-rig
failure, with zero captured poses; no synthetic raster results are substituted.
The planned schedule remains 30 singles + 420 pair extremes + 200 random poses.

M4, including fresh trenchcoat legacy/body verdicts, byte-equivalent verdict
comparison, all mutants, current lifecycle proof, and old-harness red-first
policy proof, remains **deferred (heavy-run 75)**. Exact guarded reruns and last
refusal timestamps are in the local `.codex-q/DEFERRED.md` handoff.
The driver also appends capped deferrals there automatically for runner calls.
The mutation entrypoints inspect `ps -eo pid,pgid,sid,etime,args` first and
refuse concurrent mutation work from another invocation. They never signal
those processes. No existing assertion changed in this M3 follow-up; the new
source-canvas equality check adds a completeness failure when a subject uses
the wrong selected canvas. Static shell/Python/JSON checks pass; runtime
verification remains deferred and the overall status is DEFERRED, not PASS.

The refused current-validation batch is retained in
`tests/results/current-validation-deferred.txt`. No command in that batch
executed. `tests/compare_body_verdicts.py` compares fresh trenchcoat `tests`
objects as canonical JSON bytes, plus the complete pose hash, against the
retained v2 acceptance. It requires a full green run and returns DEFERRED/79
when that fresh result is absent. This is the existing acceptance regression
comparison, not an additional kind of rig test.

The final static audit parsed every Python test/helper, checked every shell
runner with `bash -n`, parsed both new manifest files, and confirmed the
trenchcoat manifest is byte-identical to the starting revision. Stubbed policy
cases inject a fixed daytime clock so the 75/0, 75-forever and 78 expectations
are deterministic without replacing `driver.heavy`. These static checks do
not establish runtime green or red results. Refusal logs survive scratch
cleanup, and the driver enforces the 23:40 ET cutoff before starting an attempt.

## Verification evidence review

The runtime deferrals above are superseded by the [Phase B evidence review](tests/results/verify-char2/README.md). All eight scheduled commands completed in one attempt each on 2026-10-31, 12:26:50Z-12:33:14Z. Launcher STATUS=COMPLETE; overall verification **FAIL**. The current harness policy returned rc 1: normal-exit and TERM lifecycle checks both failed because the real X server lock was absent. The driver retry-policy control passed, but lifecycle cleanup remains unproved and the cause is unresolved. No assertions or tolerances were changed.

The old harness dffcb51 and char2 missing-rig acceptance are **expected-RED** (rc 1 each). Char2 manifest passed; its four runtime acceptance groups rejected missing inputs and captured zero poses. Oracle controls, trenchcoat legacy 1-5 in both modes, full trenchcoat body acceptance and verdict/pose-hash equality all **PASS** (rc 0 each). Trenchcoat mutation **PASS** (rc 0): a,b,d,e,f,g,h killed, c explicitly skipped for absent raw source PNGs. Char2 mutants remain **not-run / CANNOT_PLANT** without a rig; no kill is claimed.

Exact ledger commands, return codes, attempt counts, UTC intervals and sanitized per-attempt logs are retained under `tests/results/verify-char2/`. Phase B executed no tests or heavy commands. The lifecycle failure leaves the rig evidence gate unresolved.

## Issue 18: real Xvfb lock repair verification

The [Xvfb lock evidence](tests/results/xvfb-lock/README.md) supersedes the earlier
unresolved lifecycle result. The verification controller recorded item **03
GREEN**: the fixed harness returned **0**, with normal-exit, TERM and retry-policy
checks all passing; old harness `dffcb51` returned **1**, with both lifecycle
checks failing at the recorded-PID assertion (plus three retry-policy failures).
All five scheduled probe/policy items ran once, from **2026-10-31T21:38:55Z**
to **2026-10-31T21:42:52Z**. The evidence records each command, rc and UTC interval.

The initial display-fd server had a socket but no real lock. Change commit
`4141db3e6a2dfa12b957945ee82ae51603d69882` uses an explicit display candidate and
SIGUSR1 readiness while retaining recorded-PID ownership. The fixed probe shows
its real lock contains that PID. Existing desktop resources remained unchanged.
No assertions or timing budgets changed. This evidence review ran no tests or
heavy commands; sanitized logs and controller-verdict hashes are retained beside
the report. Any controller completion or review gate is recorded separately.

## Issue 18: authenticated Imagine inputs and provenance acceptance

The chosen source is post `be6a80c1-cdb2-43ee-848c-8b8d1d0cd7a8`. All 15 chosen outputs (one base JPEG and 14 Segments PNGs) and their sidecars are committed under [imagine-source](characters/char2/imagine-source/README.md). Their SHA-256 values match the supplied checksum list. The provenance README records all three used calls, the unintended alternate Segments run, and the approximate times for calls 2 and 3. No generation call remains and no generator was invoked.

The new test-owned [source contract](tests/data/characters/char2/imagine_contract.json) pins every chosen output hash and the verbatim call metadata. `imagine_provenance.py` adds a separate `provenance` acceptance group to the existing char2 body suite. It checks source bytes and sidecars, slot-to-source links, derived texture hashes, licence/credit, and explicit scripted fallback flags. All additional declared torso, hair and backing parts must also disclose provenance. The light controls also require the source files and sidecars to be tracked in Git.

These are declared-provenance checks. They do not prove a claimed algorithm produced particular pixels, certify visual quality, or replace the existing real-scene completeness/gap/facing observers. In particular the supplied head faces front: the unchanged facing test measures the frozen sprite-axis convention and held-prop transforms, not a visibly established sideways gaze.

### Reviewed slot map

The issue-18 convention calls a scripted split from either a Segments export **or the Imagine base image** `Segments-split`. A wholly scripted part with no Imagine-derived input must instead be `SCRIPTED (flagged)`. The gloves must be merged with base-image fingers; jacket sleeves and paired leg layers are not pre-separated limbs. Left/right below use the frozen rig names: left hand is image-right.

| Slot | Part | Classification | Required authenticated sources |
|---|---|---|---|
| head_face | `head` | Segments-split | `call1-base-best.jpg` |
| upper_arm_left | `left_arm` | Segments-split | `seg-be6a-teal-cropped-jacket.png` |
| lower_arm_left | `left_fore` | Segments-split | `call1-base-best.jpg` |
| hand_left | `left_hand` | Segments-merged | `call1-base-best.jpg`, `seg-be6a-black-fingerless-gloves-2.png` |
| upper_arm_right | `right_upper` | Segments-split | `seg-be6a-teal-cropped-jacket.png` |
| lower_arm_right | `right_fore` | Segments-split | `call1-base-best.jpg` |
| hand_right | `right_hand` | Segments-merged | `call1-base-best.jpg`, `seg-be6a-black-fingerless-gloves-1.png` |
| upper_leg_left | `leg_left` | Segments-merged | `seg-be6a-black-shorts.png`, `seg-be6a-gray-leggings.png` |
| lower_leg_left | `shin_left` | Segments-split | `seg-be6a-gray-leggings.png` |
| foot_left | `boot_left` | Segments-split | `call1-base-best.jpg` |
| upper_leg_right | `leg_right` | Segments-merged | `seg-be6a-black-shorts.png`, `seg-be6a-gray-leggings.png` |
| lower_leg_right | `shin_right` | Segments-split | `seg-be6a-gray-leggings.png` |
| foot_right | `boot_right` | Segments-split | `call1-base-best.jpg` |
| held_prop_satchel | `satchel` | SCRIPTED (flagged) | None; explicit scripted fallback reason required |

Planned required-slot tally, in the same form as #17: **0 usable + 4 merged + 9 split = 13 Imagine-derived required slots**, from **6 distinct required source files**; **1 SCRIPTED (flagged) fallback**. This includes base-image derivations and does not claim 13 direct Segments limbs. Hair, torso and other backing parts are outside the 14 required slots and get a separate declaration check. The current rig is absent, so its **observed slot tally is zero**, not the planned tally.

The existing 512 x 768 rig canvas, all 15 pivots, joint parents, limits, overlaps, tolerances, N=200, seed=20261031 and 650-pose order/values remain frozen. The source image is 1408 x 1408; implementation must describe its coordinate mapping. Manifest text now describes the supplied red-haired courier and the absent satchel rather than the earlier provisional stocky design.

### Runtime part/sidecar interface

Each `characters/char2/parts.json` part retains the existing geometry/texture fields and adds `classification` and Boolean `scripted_fallback`. Required-slot classifications and source sets are frozen in the map above. Optional extra Imagine sources may be listed; required sources may not be omitted. A scripted part also has a nonempty `fallback_reason`.

When a char2 rig is present, completeness also requires each actual Sprite2D texture path to match that part's authenticated `texture_hd`. This binds the provenance declaration to the texture actually rendered. The existing geometry, alpha coverage and facing checks remain unchanged.

Each derived `texture_hd` is a PNG below `characters/char2/`, outside `imagine-source/`, with a sibling `<stem>.gen.json`. The sidecar includes the same classification and fallback flag, the output file SHA-256 as `output_sha256`, a nonempty `derived_from` description of the split/merge/matte, and the existing source licence/credit/rights strings. `imagine_sources` is a list of `{"file": "call1-base-best.jpg", "sha256": "5078c4f3b201620847503a9b9c2b12812fd72c5cde8f5ba0388998f587d609d2"}` records (file names only). Each record must match a committed source and its authenticated sidecar. `Segments-usable` requires one call-2 Segments output; `Segments-merged` requires at least two disclosed inputs. A wholly scripted fallback has `imagine_sources: []` and the same `fallback_reason` in both records.

Unsafe relative paths and symlinks escaping the declared directories fail before reading the selected artifact. No credential location is used in controls. Source files remain unmodified. The wrapper still records its spawned Xvfb PID immediately and terminates/waits for exactly that child on EXIT; scratch now lives under the caller-provided private `TMPDIR`.

### Planted provenance mutants and rendered rig mutants

`run_imagine_mutants.py --fixture` plants twelve independent regressions into disposable provenance-only control subjects made from the committed inputs. The control is explicitly labelled **NOT rig acceptance**; its small derivative textures are never committed or supplied as a character rig. Each kill requires its specific newly failing case, with a green control. Missing baseline, zero mutants, CANNOT_PLANT or a surviving mutant returns failure.

| Mutant | Planted regression | Required rejection |
|---|---|---|
| i | Remove base source | source image |
| j | Remove source sidecar | source sidecar |
| k | Change source bytes | authenticated source hash |
| l | Drop approximate-time flag | approximate timestamp disclosure |
| m | Remove derived sidecar | derived sidecar |
| n | Erase head source trace | required Imagine inputs |
| o | Clear scripted satchel flag | explicit fallback flag |
| p | Replace Imagine head with scripted fallback | reviewed slot class |
| q | Remove head declaration | required head slot |
| r | Add unclassified backing | all-part provenance |
| s | Change runtime texture bytes | output hash |
| t | Invent a recorded prompt | verbatim source prompt |

The existing rendered char2 mutants remain **e missing head sprite, f flipped head, g removed knee, h zero physical elbow overlap**. They are evaluated against the real rig, never the provenance fixture. The char2 runner now requires **4/4 KILLED**; an absent rig or CANNOT_PLANT does not count as success. Trenchcoat historical skip policy is unchanged. Every planted mutant must be killed; existing baseline reds are never counted as a kill. The actual-source provenance run (without `--fixture`) similarly returns failure until its baseline is green.

### Commands and current observations

From the repository root, with a private `TMPDIR` and Python/Pillow/NumPy available:

```bash
TEST_PYTHON=python3 prototypes/imagine-cutout/tests/runner.sh oracle --character char2
python3 prototypes/imagine-cutout/tests/test_harness_policy.py
TEST_PYTHON=python3 prototypes/imagine-cutout/tests/run_body_tests.sh --character char2
```

The last command currently takes only the missing-input path and starts no Godot process. Run it under the required heavy guard once a rig exists. Run each mutation command under the shared mutation lock and absolute heavy wrapper, with two workers:

```bash
python3 prototypes/imagine-cutout/tests/run_imagine_mutants.py --fixture --output prototypes/imagine-cutout/tests/results/char2-imagine/provenance-fixture-mutants.json
python3 prototypes/imagine-cutout/tests/run_imagine_mutants.py --output prototypes/imagine-cutout/tests/results/char2-imagine/provenance-mutants.json
TEST_PYTHON=python3 prototypes/imagine-cutout/tests/runner.sh body-mutants --character char2
```

Light verification: **23/23 oracle/source controls PASS** and **3/3 harness policy/lifecycle controls PASS**. The real char2 acceptance run returns **1 (expected RED)**: manifest passes; provenance rejects missing `characters/char2/parts.json` and all 14 missing slot declarations; completeness, per-joint, combined and facing reject missing `scenes/char2.tscn` and `characters/char2/parts.json`. It captures zero poses and fabricates no rasters. Source authentication itself is green.

Existing test edits and reasons: `body_driver.py` adds provenance to acceptance and tightens char2 mutation success from allowed CANNOT_PLANT to four required kills; `driver.py` includes the new provenance controls in the existing oracle entrypoint and resolves the heavy executable to an absolute path; `runner.sh` uses the caller-provided private temporary root. No existing numerical or geometry assertion is deleted, no timeout/deadline changes, and no production rig, tool or CI change is included.

### Guarded Imagine verification completed

The [Imagine verification evidence](tests/results/char2-imagine/README.md)
records the completed guarded batch on code `37a544b`, ending
**2026-11-09T19:35:24Z**. Godot observer syntax **PASS**; provenance-only fixture
mutants **12/12 KILLED** with a green control. All planted mutants are killed.
The prior **23/23 light** and **3/3 lifecycle/policy** controls remain green.

Actual char2 provenance and rendered-mutation commands both return **1**:
the actual provenance control is red and its twelve scenarios are CANNOT_PLANT;
the four real rendered mutants e/f/g/h are CANNOT_PLANT without the scene and
subject. These are failures, with zero actual mutants planted, and are never
credited as kills. Actual acceptance remains expected-RED in provenance,
completeness, per-joint, combined and facing, with zero captured poses.
All fifteen committed sources authenticate; the fresh 650-pose plan/hash
matches the retained source-aware red-first admission.

The observer now binds each real char2 Sprite2D texture to the authenticated
declaration; syntax passes, while execution of that assertion awaits the actual
rig. The executed commands, two-worker adapter, selected sanitized admission
logs, individual exits and source-code hashes are retained beside the reports.
Queued refusals did not execute tests. No existing assertion, tolerance or
timeout changed in this evidence-only update.
