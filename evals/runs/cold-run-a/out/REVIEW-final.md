# Independent visual review — final

Reviewer: the separate `visual_review` agent, not the implementation agent. I ran the skill's final capture command myself and viewed the resulting evidence. This is an independent visual assessment, with objective scores quoted separately.

## Evidence inspected

- All five `shots/final/sheet-*.png` contact strips and `expressions.png`.
- Matching baseline and both `refinement-1` / `refinement-2` run, turn, jump and expression strips.
- `shots/verification/native-and-silhouette.png`, its enlarged counterpart, `playable-page.png`, `mobile-page.png`, and `look-at.png`.
- `shots/final/score.md`, `shots/verification/checks.json`, and the recorded expression take samples.

Cells below count left to right from 1. The capture command also produced GIFs; my visual judgments use the reliably inspectable contact strips and native raster, rather than claiming full temporal evaluation from still images.

## Visible findings before scoring

- The final idle strip retains Vex's pale swept hair, teal jacket, yellow zipper, dark trousers and flat shoes. Pixel clusters stay crisp. No marker dots or detached parts appear in the reviewed final images.
- Jump cells 2–7 now show both eyes and the mouth. The glove that covered the forehead in baseline jump 2–7 is moved clear of the face. Run-jump cells 3–6 retain a readable airborne face, unlike baseline 4–5.
- Turn cells 3–5 show the compressed orientation change; cells 6–8 keep the head close to upright. Baseline turn 6–8 had a pronounced backward tip. It remains recognizably a mirrored profile drawing rather than a fully drawn turnaround.
- Run cells 2–4 and 8–12 show a clear advancing knee, bent arms and alternating shoe contact. The native silhouette triptych distinguishes standing, running and airborne poses. Some passing trouser silhouettes still merge; there is limited negative space between the dark legs.
- The expression strip has clear happy arcs/open smile (2), angled angry brows and red mark (3), sad brows/tear (4), wide white shocked eyes (5), asymmetric smug eyes (6), squeezed hurt eyes (7) and narrowed determined eyes (8). Mouths sit higher and are less like blocks pasted over the neck than in baseline. The tiny face still favors exaggeration over subtle acting.
- The coat tab trails behind the hip in several run poses and clears the torso differently across the strip. This is a small secondary accent, not the impression of a fully bending coat.
- The desktop page gives the native sprite a coherent rooftop setting, with restrained contrast and a visible keyboard guide. On the captured narrow viewport it uses crisp integer ×1; the character and facial differences are necessarily much smaller there.

## Two refinement rounds

| Evidence | Baseline | Refinement 1 | Refinement 2 / final |
| --- | --- | --- | --- |
| Airborne face | Near glove covers the eye/forehead in jump 2–7 | Arms extend away from the face in jump 2–7; face readable | Clear face retained; raised rear arm gives a more distinct airborne silhouette in jump 2–4 and run-jump 2–5 |
| Turn recoil | Head tips visibly backward in turn 6–8 | More controlled head angle through turn 6–8 | Controlled turn retained against the final rooftop scene |
| Face layout | Happy/surprised mouths feel low; determined weak | Mouth raised/reduced; determined eyes and brows stronger | Seven readable non-neutral presets retained, with final gameplay-scale evidence |
| Presentation / contact | Plain starter scenery; max planted slip 0.451 px/tick | Same contact quality; clearer face/arms | Cohesive rooftop setting; final max planted slip 0.222 px/tick, with no visual foot gaps |

The second round is a smaller gain than the first. It improves presentation and preserves the recovered readability, rather than solving the remaining rigid cutout construction.

## Rubric

A 3 means acceptable indie baseline. A 5 would require the much stronger drawn acting and turn construction described by the skill; no axis earns 5 here.

| Axis | Baseline | Final / 5 | Evidence and limit |
| --- | --- | --- | --- |
| Puppet | 3 | 3 | Connected limbs, controlled turn and trailing cloth avoid exposed joints, but the straight jacket and single-view mirrored head/torso remain visible construction (`sheet-turn` 3–8). |
| Appeal | 3 | 3 | Supplied character identity and palette remain crisp, and the rooftop supports it; small rigid sleeve/torso shapes and crowded dark knees keep this below a highly polished drawn character (`sheet-run` 3/9, desktop page). |
| Readability | 2 | 3 | The main obstruction is fixed: jump 2–7 and run-jump 3–6 expose the face. Native silhouettes distinguish idle/run/air, though passing legs still merge. |
| Motion | 3 | 3 | Excellent measured planting and visible lowered landing/contact poses support weight; the compact cutout torso and simple stride remain mechanically limited (`sheet-jump` 8–9, `sheet-run`). |
| Face | 3 | 4 | Seven non-neutral presets are distinguishable, eyes blink/reopen, gaze changes pixels, and measured takes anticipate then overshoot; the compact skin patch still limits subtlety (`expressions`, take samples, gaze pair). |

Worst remaining tell: the rigid, single-view jacket/head changes direction by a compressed mirror turn. It is well hidden compared with baseline but still apparent.

Next fix: author matching front/three-quarter head and torso drawings for the existing sheet style and transition between those orientations through the turn. That is a future art expansion, not a condition for this task's functioning sprite rig.

## Objective result

Final skill score: **PASS 15/15**. Deterministic hashes match (`2aac2e66`); idle/run/turn/jump/fall/land all visited; turn lasts 10 ticks. Planted-foot slip mean 0.001, p95 0, max 0.222 px/tick, with 1174 planted foot-ticks and zero floating plants. Largest connected component and sampled joint coverage are both 1.000. Idle mean difference is 0.0762 with 100% distinct samples. Seven expressions pass; anti-puppet on/off difference is 0.423. The 320×180 buffer is displayed at integer ×3 with a 1.0000 nearest-upscale match and no console errors.

The supplemental verification reports all 11 checks passing, including real keyboard input, variable jump height, ledge landing, gaze, expression take, hurt recovery, controls, bounds and narrow viewport layout. The take samples show eye aperture anticipating down to 0.64 at tick 3, happy-eye overshoot to 0.887 at tick 9, and subsequent settling near the 0.85 target.

## Caveats to carry into NOTES

- This is a playable character demonstration, not a complete courier game with objectives, delivery interactions or sound.
- The source supplies one drawing per part; full perspective turns and fully deforming cloth are outside its present art coverage.
- Dark passing legs can merge at native resolution; seven faces read best at the default desktop integer enlargement.
- Small-screen layout is crisp at integer ×1, but the desktop keyboard controls and readable zoom are the intended primary presentation. No touch controls are shown.
- Baseline capture artifacts exist even though its initial process hit a temporary Chromium profile cleanup race. The independent final capture completed successfully using only the filesystem deletion retry preload; evaluation/capture logic was unchanged.
