# Independent review

Reviewed by a separate agent from the implementation author. Scope: `TASK.md`, the skill's review rubric, the final smooth-mode idle/run/turn/jump/runjump contact sheets (`shots/final/capture`), the expression sheet, the dedicated pickup face/full-body strips and unblinked expression sheet in `shots/g2`, the saved smooth score, and source inspection of the coat simulation, render order, joints, preset, and pickup director path. I also captured an independent pickup sequence in `shots/review/pickup-independent.png` and parameter snapshots in `shots/review/pickup-independent.json`. No runtime files were changed for this review.

Cells below are numbered from one, left to right. Scores use the skill's demanding reference bar: 3 means acceptable indie-game quality, 5 means comparable to the named commercial references.

| Axis | Score / 5 | Captured evidence |
| --- | --- | --- |
| Puppet | 3 | `shots/final/capture/sheet-run.png` cells 3–8 show closed knees and elbows; `sheet-turn.png` cells 3–5 still reveal a flat side-view body flip, while cells 6–8 show useful cloth follow-through. |
| Appeal | 3 | `sheet-idle.png` cells 1–12 maintain a clean red/navy/gold palette and consistent proportions; the flared gold-edged coat tail adds identity but the round head and tube torso retain the starter's simple appearance. |
| Readability | 3 | `sheet-runjump.png` cells 2–3 clearly separate trailing cloth, bent legs, and scarf; `sheet-run.png` cells 4 and 6 crowd the two dark trouser legs during passing poses, though both white shoes remain identifiable. |
| Motion | 3 | `sheet-jump.png` cells 8–10 show contact and recovery, and `sheet-runjump.png` cells 2–4 show cloth moving independently of the hips; the sustained airborne body pose and simple turn remain mechanical. Saved smooth metrics report foot slip mean 0.001 px/tick, no floating plants, and a ten-tick turn. |
| Face | 4 | `shots/g2/pickup-face-sheet.png` cells 2–3 and 5–6 show asymmetric narrowed eyes, opposed brows and an off-centre smile; cells 8–10 return to open-eyed neutral. Angry/surprised/hurt also separate clearly in the standard expression sheet. The tiny mouth is less readable at full-body scale than in the head crop. |

**Single worst tell:** the head and torso keep the same side-view construction through a turn (`sheet-turn.png`, cells 3–5). **Next fix:** add front/three-quarter head and torso shapes, selected during the existing narrowing/yaw turn, while preserving the planted feet and world-space cloth.

## Correctness findings

- The rig declares `coatUpper`, `coatMid`, and `coatTip` with chained parents. The renderer uses the simulated endpoints, and `worldJoints` reports those same endpoints without upper-body turn narrowing. The coat is ordered after the far leg and before the near leg.
- Cloth state remains in world space across facing changes. The captured runjump and turn panels show lag rather than a single rigid appendage. The dedicated motion report records measurable start/stop/turn/landing response and convergence to rest; this review did not rerun the complete metric suite.
- `pickup` routes through a transient director reaction to the data-driven `scheming` preset. Pinning and automatic blinking remain separate layers. Independent snapshots show mouth smirk reaching -0.964 by event tick 30 and returning to -0.000399 by tick 140, with brow angle returning to 0.000009. No persistent-expression defect was found. The final dedicated G2 report passes all 15 checks, including retriggering and debug-pin priority; its pickup face sheet visibly shows automatic blink and reopening during the reaction.
- The default expression capture samples `scheming` during a blink. This is a capture-timing limitation, not a broken preset; `shots/g2/expressions-unblinked.png` cell 9 and both pickup sequences display the open-eyed expression. The same blink can invalidate a naive eye-openness comparison during a return-to-neutral test: at event tick 170, blink closedness is 0.997728 while brow and mouth have already returned to neutral.
- The final wider hem reads as a garment panel in idle and turn cells; it improves on the first narrow ribbon-like version. The coat has no body/environment collision, which limits cloth realism; no missing joints, visible seams or face-covering arms were observed in the reviewed smooth sheets.

The final smooth score artifact (`shots/final/score.json`) reports **13/13 PASS**, with connected-component share and joint coverage both 1.000 and an anti-puppet on/off pixel difference of 0.498. I read this artifact and reviewed the final capture; I did not independently rerun the entire scoring suite. The visual scores above are independent subjective review, not a claim that these simple starter shapes match the commercial reference bar.
