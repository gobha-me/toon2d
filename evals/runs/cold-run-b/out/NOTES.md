# Vex — Night Shift

Completed the supplied parts-sheet task as a standalone, playable Canvas game. All deliverables, project edits, tests and evidence are inside this task directory. `fixture/` and `skill/` were read without modifications. No dependencies, asset generation services or external resources are needed by the game.

## Run

From the task directory:

```sh
python3 -m http.server 8000 --directory out
```

Open `http://localhost:8000/`. Opening the HTML as a `file:` URL will not work because ES modules and JSON assets need a static server.

Controls: arrows or A/D run; Space, W or Up jump (hold for height); P toggles motion layers; T changes upper-body timing; 1–8 pin neutral/happy/angry/sad/surprised/smug/hurt/determined; 0 restores automatic acting; H triggers hurt. The pointer aims gaze. Buttons and an expression selector provide the same main controls. Reset returns to the starting position and automatic face, preserving the current motion-layer setting.

## Implementation and unattended decisions

- Followed the local `skill/SKILL.md` pixel/cutout pipeline; copied its starter and preserved the version-1 `window.__toon` API. `?harness=1` disables automatic simulation advancement. `tick`, `reset`, input, events, expressions, flags, gaze, joints, feet and three pixel layers are available.
- Used all nine supplied sprite parts: head, torso, upper arm, forearm, hand, thigh, shin, foot and coat tail. Arms/legs reuse the matching source part for both sides. Removed the starter's drawn scarf. The rendered body uses sprite parts, rather than the starter's vector body shapes.
- Extracted `sheet.clean.png` and `parts.json` using the supplied marker tool. Source marker lengths drive the rig: spine 12, head 13, upper arm 6, forearm 5, thigh/shin 8 each, coat tail 7.07 game pixels. The marked face anchor is along 5 / perp 2. The clean atlas has zero opaque pixels matching any of the three marker colours, verified by the extra checks.
- Retained the sheet palette. Far limbs are darker. The source's transparent silhouettes overlap at joints; runtime checks find one connected character and complete joint coverage.
- Default pixel mode renders into 320×180, quantizes character alpha/colours, draws the procedural pixel face afterward, then nearest-upscales by an integer. At the tested 1280×720 viewport, the display is exactly 640×360 (2×). No remote fonts or images are used.
- Simulation is fixed at 60 Hz, with a seeded blink scheduler. Feet use per-tick world locks and two-bone IK; run phase follows distance. Default held upper-body timing is the starter's 12 Hz `twos` style; foot contacts still update every tick.
- Motion layers default ON: independent idle sway, breath, acceleration-driven head/chest/arm springs, asymmetric run timing, held upper-body poses, turn narrowing and face parallax. The short sprite coat panel has its own spring, driven by acceleration, landing impulse and speed drag. It is a short panel, so I retained the single supplied piece rather than inventing a long segmented coat. P or `__toon.setFlags({ap:false})` disables the added motion.
- States include idle, run, turn, jump, fall, land and hurt. Jump poses change with vertical speed; ascent, apex and descending reach use different limbs. Landings compress the stance. The finite rooftop has one raised platform. World bounds retain a margin for the sprite and stop root velocity at the edges.
- Replaced the starter face renderer with clusters fitted to Vex's actual skin patch: higher mouth, dark brows, smaller open jaws, gaze-sensitive highlights/pupils, smile arcs, squeezed eyes, teeth, tears, anger and sweat marks. All facial features are procedural. Eight presets include seven non-neutral expressions; automatic blink and the gameplay mood/reaction director remain active. Hurt, jump and hard-land reactions use the existing anticipation/overshoot/settle envelope; no face-core rewrite.
- Added a muted rooftop scene and a compact control panel. Pointer capture handles held movement buttons; blur releases held controls; keyboard focus returns to the canvas after control changes.

## Measured validation

Environment doctor: Node v22.23.2, Brave Chromium, smoke launch OK. Subsequent browser profiles were directed to the task-local `.tmp/` with `TMPDIR`.

Final reports are under `shots/final/`:

| Gate | Final result | Evidence |
| --- | --- | --- |
| Skill lint | PASS, 17 JS modules, 0 warnings | `lint.txt` |
| Rig validator with contract | PASS, 12 bones, 0 warnings | `rig-validation.txt` |
| Expression validator | PASS, 7 strong non-neutral expressions | `expression-validation.txt` |
| Skill runtime score | **PASS 15/15** | `score.json`, `score.md` |
| Extra interaction/art checks | **PASS 10/10** | `interaction-checks.json` |

Selected final runtime measurements:

| Metric | Value |
| --- | --- |
| Planted-foot slip mean / p95 / max | **0.002 / 0 / 0.451 px/tick** |
| Planted foot-ticks / planted while floating | **1174 / 0** |
| Worst largest connected component share | **1.000** |
| Joint coverage | **1.000**, no misses |
| Idle change / distinct sampled frames | **0.0777 / 1.000** |
| Minimum eye openness during six-second idle | **0.00**, then reopens |
| Strong distinct expressions | **7** |
| Motion ON versus OFF run difference | **0.438** (required ≥ 0.04) |
| Screen match to exact nearest upscale | **1.0000** |
| Turn duration | **10 ticks**, with facing changes |
| Same-seed frame hash, repeated | **721db4cb / 721db4cb** |
| Visited states | idle, run, turn, jump, fall, land |
| Browser errors | **0** |

Extra checks dispatch a real ArrowRight keyboard event in realtime mode, compare opposite gaze targets in parameters and rendered pixels, check released-jump state progression, exercise hurt/recovery, walk to both world edges, click the motion toggle, change the expression selector and scan the atlas for markers. One early test assumed reset restored default flags; the harness intentionally preserves flags, so I corrected the test setup to explicitly set AP ON before testing an OFF toggle. The final extra suite passes.

Reproduce from the task directory:

```sh
node skill/scripts/lint.mjs out
node skill/scripts/validate-rig.mjs out/rig.json --contract
node skill/scripts/validate-expressions.mjs out/expressions.json --min 3
TMPDIR="$PWD/.tmp" node skill/scripts/score.mjs out --require pixel --out out/shots/recheck
TMPDIR="$PWD/.tmp" node skill/scripts/capture.mjs out --out out/shots --label recheck
TMPDIR="$PWD/.tmp" node out/tests/verify.mjs
```

The extra verifier depends on the adjacent supplied skill's browser/PNG helpers; the playable game itself only needs files inside `out/`.

## Capture review and iterations

I inspected the actual atlas, PNG contact sheets, native buffer, expression strips, whole-page capture and temporal sheets extracted from the GIFs. The final GIF inspection sheets are in `shots/final/inspection/`. Full captures are retained, including idle/run/turn/jump/runjump/expressions GIFs. `native-expressions.png` shows all eight full-body expression captures at 1×, in preset order.

1. **Baseline** (`shots/baseline/`): first marker-based sprite rig passed 15/15. Mean slip rounded to 0; maximum 0.451. Visual inspection still revealed a mouth on the lower chin, pale brows over silver hair, and the unwanted starter scarf. Passing numbers were insufficient.
2. **Refinement 1** (`shots/refinement-1/`): fitted the face, removed the scarf and added the sprite coat panel and scene. Again 15/15. A separate reviewer, seeing only captures and the rubric, scored Puppet/Appeal/Readability/Motion/Face **3/3/3/2/3**. Worst: a held knee/arm pose across most of the jump and exaggerated head rotation in turns.
3. **Final** (`shots/final/`): limited spring targets to keep the head upright; varied airborne arms/knees by vertical speed; retained the landing crouch; added reaction takes and finished interaction handling. Final score 15/15. The independent reviewer re-examined only visual evidence and raised Motion to 3. See `shots/final/independent-review.md` for frame-specific evidence and limitations.
4. **Motion OFF comparison** (`shots/motion-off/`): captured the same scenario with `?ap=0`. I inspected its run contact sheet alongside the final: removing overlap/idle/breath/holds makes posture more uniform and removes the trailing coat response. The objective toggle difference separately measures this change.

The reviewer was delegated because the supplied skill explicitly requires an independent agent for unattended visual grading. It did not inspect the implementation, task brief, measured scores or these notes.

## My provisional rubric scores

These are my own provisional judgments from captures, separate from the independent review. 3 means acceptable indie quality; this is not a claim to match the named reference games.

| Axis | My provisional score | Captured evidence |
| --- | --- | --- |
| Puppet | 3/5 | Final run joints remain connected; turn sheet cells 3–4 still expose the narrowed single-view head. |
| Appeal | 3/5 | Idle cells 1 and 8 preserve the source's white hair, teal jacket and yellow trim against a quieter background; trousers are visually heavy. |
| Readability | 3/5 | Run cell 4 and jump cells 2–4 have distinct silhouettes; at native scale dark passing knees and forearms merge in some frames. |
| Motion | 3/5 | Final jump GIF frames 3, 10, 17 and 20 show changing limb arrangements followed by crouch/recovery; measured planted-foot slip is low, but launch and apex could contrast more. |
| Face | 3/5 | Happy teeth, angry forehead/brows, surprised wide eyes and hurt chevrons remain distinguishable in the full-body expression GIF and native strip. Sad/smug/determined are subtler at 1×. |

Independent final scores: **Puppet 3, Appeal 3, Readability 3, Motion 3, Face 3**. That reviewer saw the neutral native buffer but did not independently verify the subsequently added all-expression native strip, quantitative foot planting or expressive take timing.

## Known issues and next improvement

- Worst remaining tell: the head narrows mechanically during the turn (GIF frames 2–3). The next art improvement is a dedicated intermediate-facing head/torso drawing with preserved head volume. The task supplies one view; I kept its original parts rather than inventing new viewpoints.
- The short coat panel is rigid within its own spring rotation. The dark legs can merge in passing poses. More extended launch/apex poses and a near-leg highlight would be useful visual refinements.
- Expressions read best at the normal integer-upscaled display. The subtlest presets have limited readability at a literal 1× buffer. Happy, angry, surprised and hurt provide the stronger non-neutral reads.
- Keyboard and harness interaction, desktop pointer controls and the default pixel renderer were validated. The inherited optional `?mode=smooth` debug renderer is not the target and was not visually validated.
- The canvas retains at least 2× integer scaling. On very narrow viewports the stage scrolls horizontally to preserve pixel sharpness; this is a desktop keyboard-oriented demo, not a fitted mobile layout.
- This is a playable character sandbox, not a complete courier game: no delivery objectives, enemies, sound or additional levels were requested.
