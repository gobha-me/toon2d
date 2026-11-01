# Courier authoring observations

These are provisional authoring observations. Final acceptance and mutation
results belong to the supervising launcher's subsequent suites and ledger.
No mutation testing, full suite wrapper, or harness-policy test was run during
this authoring pass. No test, index, manifest, seed, pose count, tolerance,
pivot, limit or overlap value was changed.

## Iterative checks

Two artwork iterations each used separate, sequential heavy-run admissions for
preparation, import, bake, observation, atlas rendering and review capture. Every
step returned 0 on its first invocation; no 75, 78, waiting or retry occurred.
The second iteration changed the artwork after independent visual feedback;
it was not a retry of a refused command. Installed admission build SHA-256:
`3bc14651d44b4438d3823dfa582f767094ca8a95681721e743be3b8a57011a0b`.

The commands used the checkout's existing Python and a disposable authoring
project. In these transcripts `<PROJECT>` means that scratch copy and
`<CAPTURES>` means its observer-output directory:

```bash
heavy-run <PYTHON> prototypes/imagine-cutout/tools/prep_char2.py
heavy-run godot --single-threaded-scene --headless --path <PROJECT> --editor --import --quit
heavy-run godot --single-threaded-scene --headless --path <PROJECT> --script res://scripts/build_rig.gd -- char2
heavy-run godot --single-threaded-scene --headless --path <PROJECT> --script res://tests/check_body_parts.gd -- observe <CAPTURES>
heavy-run xvfb-run -a godot --single-threaded-scene --path <PROJECT> --audio-driver Dummy --script res://tests/check_body_parts.gd -- atlas <CAPTURES>
heavy-run xvfb-run -a godot --single-threaded-scene --path <PROJECT> --audio-driver Dummy --script res://scripts/capture_v2.gd -- char2
```

Fixture construction and image analysis imported the committed manifest reader,
pose planner and `tile_oracle` unchanged. They scheduled exactly the frozen
char2 plan and applied its oracle to the observer's native atlas PNGs. No new
pose, test case or acceptance criterion was added. These individual operations
do not replace the launcher's complete body-suite execution.

| Character/check | Authoring observation | Final acceptance |
|---|---|---|
| char2 manifest | Frozen inventory used: 14 slots, 15 joints | Pending launcher |
| char2 completeness | GREEN, no observer errors | Pending launcher |
| char2 per-joint | GREEN, 30 poses / 450 seams / zero gaps | Pending launcher |
| char2 combined | GREEN, 420 pair + 200 random poses / 9,300 seams / zero gaps | Pending launcher |
| char2 facing | GREEN, 82/82 samples | Pending launcher |
| trenchcoat body | Not run during authoring | Pending launcher |
| trenchcoat legacy | Not run during authoring | Pending launcher |
| harness policy | Not run during authoring | Pending launcher |
| char2 mutations | Not run; zero kills claimed | Pending launcher |
| trenchcoat mutations | Not run; zero kills claimed | Pending launcher |

`authoring-observations.json` retains the final compact counts, facing samples,
manifest hash and frozen pose hash. Both iterations had the same passing counts.
`authoring-logs/` contains sanitized outputs, original local output hashes and
per-step return codes. Individual command start times were not recorded in this
provisional log set; no timestamps are inferred. The rendering warning about
unsupported V-Sync did not prevent atlas or review capture. No occupied-display
or signal-related failure was observed.

Supplied Xvfb lifecycle status was GREEN. The iterative renders used xvfb-run;
this pass does not separately certify server lifecycle, lock/socket removal,
TERM handling, or absence of orphan processes. The launcher owns the lifecycle
and final acceptance evidence.

## Scripted inventory and provenance

All slots are `scripted`, with no `generate` requests:

- head_face
- upper_arm_left, lower_arm_left, hand_left
- upper_arm_right, lower_arm_right, hand_right
- upper_leg_left, lower_leg_left, foot_left
- upper_leg_right, lower_leg_right, foot_right
- held_prop_satchel

The committed `characters/char2/gap-report.json` lists each slot's recipe,
manifest pivot, parent and overlap. Two additional scripted clothing panels
supply torso and pelvis backing. Every PNG has a direct sidecar with model
`none (scripted)`, prompt `not applicable (scripted)`, UTC date, relative script
source and hash. No external artwork, likeness, model or paid service was used.

## Independent visual review

An independent reviewer saw only the captures and the repository's
runtime-animation review rubric. `review-before/` and `review-final/` retain
unretouched Godot captures. Initial feedback identified rectangular protrusions
at knee/ankle backing. The revision clipped added backing to circular boundaries
and used cloth color at proximal limb attachments; final feedback confirmed
cleaner hands, boots and silhouette.

| Axis | Final review | Evidence/limit |
|---|---|---|
| Puppet | 2/5 | Circular knee/elbow overlaps still expose rigid joint construction. |
| Appeal | 3/5 | Consistent teal/yellow/brown palette and readable courier profile. |
| Readability | 3/5 | Rest, presentation and bent knees are clear; presentation/settle sampled stills nearly match. |
| Motion | Unscored | Stills do not prove timing, transitions, foot planting or weight. |
| Face | 1/5 for captured coverage | One neutral expression; blink and expression changes unverified. |

The head visibly points right. The satchel stays on the foreground hand, but
its obscured handle does not clearly communicate direction visually, despite
the matching numeric axes in all facing samples. The rear hand is occluded in
the bent-knees pose. No definite missing part was visible. Remaining polish:
blend the round knee/elbow overlaps into folded cloth. This is a simple scripted
cutout kit, without locomotion or expressive-face certification.

## Scope and remaining work

The test-owned path diff against the pinned tests head is empty:

```text
git diff --name-only <TESTS_HEAD> HEAD -- prototypes/imagine-cutout/tests/ prototypes/imagine-cutout/body_parts.yml prototypes/imagine-cutout/characters.yml
(no output)
```

Disputes: none. The pinned tests head is an ancestor. All authoring commits use
the required change role and attribution trailers. Final launcher suites,
mutation kills and lifecycle evidence remain pending; no such final result is
claimed here.

## Flash contract restoration follow-up

Rig implementation commit: `6a7b5c9`.
Baseline: `059f4ebf472a50a9917724723d42208495b1650f`.
Frozen tests head: `2e036060c9c42d235d0b5efb1b9d714651e36f2a`.
Earlier observations and launcher results remain historical; final acceptance
of this follow-up is pending the launcher's fresh suites.

The missing flash was a rig gap. At the baseline,
`scripts/build_rig.gd:126-135` only owned the effect for trenchcoat, omitted
visibility tracks from courier clips and freed the courier effect. Frozen
`tests/check_rig.gd:108,118-119` requires that node for every character;
`tests/driver.py:309-317` requires its fire visibility track and three keys.
The launcher proved this before authoring: char2 legacy returned 1 on its
first attempt, 2026-11-01T16:28:57Z through 16:29:08Z. Tests 1 hierarchy,
2 timing, 4 gun rigidity and 5 joint gaps passed with no errors. Test 3 flash
failed with exactly `hd: missing MuzzleFlash`. There was no infrastructure,
script or parse failure. No test or mutation definition was changed.

The builder now owns the procedural effect on the right hand for every
character and authors visibility in all four courier clips. The existing
`scripts/muzzle_flash.gd` is reused unchanged. Char2's frozen manifest supplies
`facing.muzzle_texture_px = [48, 8]`, so the hand-origin fallback is not used.
The satchel sprite's transform maps that texture point through its offset
`[-16, -8]` to hand-local `[32, 0]`; it has unit scale and zero rotation.
The effect is initially hidden, retains z=30 and its existing rotation policy,
and receives these discrete value tracks at 24 fps:

| Clip | Frames | Visibility values |
|---|---|---|
| idle | 0, 48 | false, false |
| aim | 0, 10 | false, false |
| fire | 0, 3, 6 | true, false, false |
| cooldown | 0, 14 | false, false |

Each heavy operation ran once, sequentially, in a disposable project inside
an owned `mktemp -d` subdirectory under `<TMPDIR>`. The project copied the
frozen manifest as input; no checkout imports or art were updated. Commands
below use `<PROJECT>` for that scratch project:

```text
heavy-run godot --single-threaded-scene --headless --path <PROJECT> --editor --import --quit
rc=0; first invocation; individual UTC boundaries not recorded

heavy-run godot --single-threaded-scene --headless --path <PROJECT> --script res://scripts/build_rig.gd -- char2
rc=0; first invocation; 2026-11-01T16:30:40Z through 16:30:41Z
Baked res://scenes/char2.tscn result=0
```

Admission build SHA-256:
`3bc14651d44b4438d3823dfa582f767094ca8a95681721e743be3b8a57011a0b`.
Neither operation returned 75 or 78; no wait or retry occurred. Both logs
contain no script, parse or error diagnostics. Only the builder-generated
char2 scene was copied back; the scene was never hand-edited. Scratch and
its launcher-owned ancestors were retained without removal or renaming.

Light checks passed: exactly one hidden effect node at `[32, 0]`, exactly
four visibility tracks, the keys above and unchanged bone animation tracks
in every clip. Existing art, bone and camera node properties match the base
after resolving regenerated resource IDs and ignoring node unique IDs.
Bone-track comparisons ignore trailing blank separators only.

Byte-identity checks against the baseline passed:

| File | SHA-256 |
|---|---|
| scenes/hd.tscn | `5d2416cf4fda9a5fd5912cd6eaf10976b4b9b48583d91b026597751b32381a63` |
| scenes/pixel.tscn | `910080c9c1937e32f918a744405b0592efd1d4ea1e3a63a9827781d22ce5b94c` |
| scripts/muzzle_flash.gd | `4a330dcf39fc48ba2c1ee85334047cee023cf785c52568e5c01e2767a61e535d` |

```text
git diff <BASE> HEAD -- prototypes/imagine-cutout/scenes/hd.tscn prototypes/imagine-cutout/scenes/pixel.tscn prototypes/imagine-cutout/scripts/muzzle_flash.gd
(no output)
git diff --name-only <TESTS_HEAD> HEAD -- prototypes/imagine-cutout/tests/ prototypes/imagine-cutout/body_parts.yml prototypes/imagine-cutout/characters.yml
(no output)
```

Both pinned heads remain ancestors. The changed paths are confined to the
builder, generated char2 scene and this validation directory. No art or tools
were changed. Disputes: none.

No runtime acceptance suite or mutation testing was run during this follow-up.
Fresh char2 body and legacy tests 1-5, trenchcoat body and legacy tests 1-5,
and both mutation suites remain launcher work. Per-id char2 kill results
a, b, d, e, f, g and h are all pending; zero new kills are claimed. The
char2 body numbers remain provisional until e-h are killed. Fresh harness
defer-policy subcases `[75, 0]`, `[75]`, `[78]`, normal-exit lifecycle and
TERM lifecycle are also pending the launcher. No fresh lifecycle or cleanup
success is claimed here; no recorded-PID rule or assertion was changed.
