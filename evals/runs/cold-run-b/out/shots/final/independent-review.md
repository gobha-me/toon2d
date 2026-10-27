# Independent visual review — final

Reviewed only the supplied visual rubric, final PNG captures, GIF frames, capture metadata for expression order, and my previous independent review. No implementation, measured scores, tests, notes, or task brief were consulted. Sheet cells are numbered 1–12 from left to right; GIF frame numbers are zero-based. Extracted inspection sheets are in `review-frames/`.

## Visible evidence and comparison

**Airborne motion improved.** The earlier jump held nearly the same knee/forearm silhouette through frames 2–14. In the final `jump.gif`, frames 2–6 have an open leg split with a higher trailing arm; frames 8–11 bring the legs closer and the arms forward; frames 13–18 lower the leading foot and prepare the landing. `sheet-jump.png`, cells 2–7, now shows those changes, and `runjump.gif`, frames 3–10, has a similar progression. The changes are modest: much of the jump still uses a seated, bent-knee silhouette, but it no longer looks like one wholly fixed pose carried through the entire arc. Landing compression remains visible at `jump.gif` frames 21–24.

**The turn also improved.** The pronounced diagonal head swing called out in the earlier turn frames 5–8 is greatly reduced. The final `turn.gif` keeps the head more upright through frames 4–8 and uses a narrow intervening facing in frames 2–3. This feels more deliberate, but those narrow frames squeeze the face and hair into an unusually thin shape rather than giving a fully convincing change of view. `sheet-turn.png`, cells 3–4, exposes that remaining tell.

**The visual identity is stable.** `sheet-idle.png`, cells 1 and 8, preserves the white hair, teal jacket, small yellow accent, and heavy dark trousers. `native.png` establishes the actual 320×180 view: the hair and jacket separate clearly from the city backdrop, while individual dark limbs are much harder to distinguish. `playable.png` gives the larger presentation context without adding evidence for additional native-scale facial presets.

**Expressions remain distinct in the head crops.** Per capture metadata, `expressions.png` is neutral, happy, angry, sad, surprised, smug, hurt, determined. Happy (cell 2) has the conspicuous teeth, surprised (5) has wide eyes, smug (6) is asymmetric, and hurt (7) visibly changes the face. Sad and determined rely more on small brow/mouth changes. The neutral native-size capture does not establish that all eight expressions are immediately readable at 1×.

| Axis | Score | Evidence |
|---|---:|---|
| Puppet | 3/5 | Connected limbs and jacket overlap remain intact, and the upright turn improves on the prior diagonal swing, but the compressed head in `turn.gif` frames 2–3 still reveals mechanical deformation. |
| Appeal | 3/5 | `sheet-idle.png` cells 1 and 8 and `native.png` show a consistent palette and recognizable hair/jacket silhouette, with the same visually heavy dark trouser mass. |
| Readability | 3/5 | Run and jump remain distinguishable (`sheet-run.png` cell 4; `sheet-jump.png` cells 2–4), and the character separates from the background at 1×, but overlapping dark knees/forearms weaken individual pose clarity. |
| Motion | 3/5 | `jump.gif` frames 2–18 now progress through visibly different arm and leg arrangements before the compressed landing at frames 21–24, though the airborne shapes remain restrained and the turn's narrow intermediate frames remain conspicuous. |
| Face | 3/5 | `expressions.png` cells 2, 5, 6, and 7 are readily distinguishable and the movement sheets show facial reactions, but full native-scale readability and clear expressive takes across presets remain unproven by these captures. |

**Worst tell:** The head becomes unusually narrow in `turn.gif` frames 2–3 (`sheet-turn.png` cells 3–4), with crowded facial features under squeezed hair. The turn now avoids the earlier large tilt, but this narrow intermediate still looks mechanically compressed.

**Next fix:** Draw a dedicated intermediate facing with its own hair contour, eye spacing, cheek outline, and shoulder overlap; preserve the apparent head volume as the face turns. The following motion pass should push the contrast between extended launch, tucked apex, and reaching descent so the improved airborne sequence reads with more weight.

The final is an observable improvement over refinement 1, especially in airborne variation and head stability. The rubric scores remain at an acceptable indie level rather than the named reference bar. Quantitative foot planting and full native-scale expression coverage were not independently verified.
