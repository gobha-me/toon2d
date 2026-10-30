# Independent rig acceptance tests

Run `prototypes/imagine-cutout/tests/run_tests.sh` from any directory. Run
`prototypes/imagine-cutout/tests/run_mutants.sh` for the four planted mutants.
The repository's `.venv/bin/python`, Godot, Xvfb, Pillow and NumPy are required.
The runners enforce quiet hours, at least 5 GiB free on the repository and `/tmp`,
two CPU workers, a fresh `/tmp/tween-<runid>` and EXIT cleanup. Every Godot process
and preparation run goes through `heavy-run`; exit 75 is retried after 30 seconds.
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

## Recorded execution

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
