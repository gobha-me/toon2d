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
