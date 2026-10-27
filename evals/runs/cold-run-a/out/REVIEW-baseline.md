# Independent visual review — baseline

Reviewed by the separate `visual_review` agent, not the implementation agent. Evidence: `shots/baseline/sheet-idle.png`, `sheet-run.png`, `sheet-turn.png`, `sheet-jump.png`, `sheet-runjump.png`, `expressions.png`, and `score.md`. Frame numbers below count contact-strip cells from 1, left to right. These are still-image findings; the objective telemetry supplies foot-contact evidence, and this review does not claim to judge every temporal detail from GIF playback.

## Visible findings before scoring

- Idle cells 1–12 preserve the pale asymmetrical hair, teal jacket and dark pants, with consistent native pixel density. There are no obvious holes between body parts. The idle changes are modest at the body scale.
- Run cells 2–4 and 8–12 alternate recognizable knees and planted shoes, but the dark near/far trousers overlap into one dense zigzag in several passing poses. The torso remains a fairly straight, rigid plate.
- Turn cells 3–5 clearly change orientation, rather than presenting one identical pose mirrored across the whole strip. Cells 6–8 show a conspicuously tipped-back head/chest; the head still reads as the same profile drawing flipped.
- Jump cells 2–7 place a dark gloved hand directly over the eye/forehead. The expressive face is least visible during the airborne action. Run-jump cells 4–5 repeat that obstruction.
- The expression strip has an obvious happy face (cell 2), angry face (3), sad face (4), surprised face (5), smug face (6), and hurt face (7). Happy and surprised mouths sit at or below the chin edge; the enlarged open mouth feels pasted over the neck. Brows partly merge into the pale fringe in some cells. Determined (8) is weaker than angry.
- A small teal tail is visible behind the hip; the strip does not show much independent bending or lag, so it still resembles an attached rigid cutout.

## Rubric

A 3 means acceptable indie baseline, not parity with the named reference games.

| Axis | Score / 5 | Evidence |
| --- | --- | --- |
| Puppet | 3 | Run joints remain connected and turn has intermediate poses, but the rigid jacket, attached coat tab and mirrored single-view head expose construction (`sheet-run` 3–6, `sheet-turn` 4–8). |
| Appeal | 3 | The supplied hair/jacket design remains crisp and distinctive in every idle cell; oversized low mouths and dark tangled trouser poses reduce polish (`expressions` 2/5, `sheet-run` 3/9). |
| Readability | 2 | Run versus idle is clear, but the near glove hides the face throughout much of jump and run-jump; passing legs also merge (`sheet-jump` 2–7, `sheet-runjump` 4–5). |
| Motion | 3 | Measured planted-foot slip is excellent (mean 0.001 px/tick, p95 0, max 0.451; no floating plants), and crouched land/air poses exist, but the torso plate and turn recoil remain mechanical. |
| Face | 3 | At least happy, angry, sad and surprised are distinguishable; the blink metric reaches 0 and reopens. Mouth containment and arm occlusion prevent a higher grade (`expressions` 2/5 and `sheet-jump` 2–7). |

Worst tell: the raised near arm cuts directly across the face during the jump, turning the intended airborne expression into a dark jointed silhouette.

Next fix: move the near airborne arm away from the head, then fit the procedural mouth/eye layout inside the supplied skin patch. After that, give the supplied coat-tail sprite acceleration-driven lag and reduce the excessive turn head recoil. Keep the rig/foot lengths and crisp rendering, which already score well.

Objective baseline: 15/15 required checks pass. Visual review remains necessary because that pass does not detect face occlusion or mouth placement.
