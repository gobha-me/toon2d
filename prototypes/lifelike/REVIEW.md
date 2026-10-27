# Lifelike AI art, animated: critical review

Serve locally from `prototypes/lifelike` (see README).

I reviewed frames from `work/raw` (deterministic captures). The GIFs and stills are in `shots/`.

## Scores (1-5, higher is better on every axis)

"Puppet" 5 means it doesn't look like a puppet. "Uncanny" 5 means it isn't uncanny. "Cost" 5 means cheap to produce.

| Approach | Believable | Puppet | Uncanny | Face expr. | Cost | Verdict |
|---|---|---|---|---|---|---|
| A. Cutout parts on bones | 2 | 2 | 3 | n/a (rigid head) | 4 | Clear pose reads. Looks like a paper doll up close |
| B. Skinned mesh (Live2D-style) | 3 | 3 | 2 | n/a | 3 | The most "alive" in idle. Rubber knees in walk/run |
| C. AI-generated frames | 3 | 4 | 3 | n/a | 2 | Each frame looks great. The motion is choppy and pops |
| F1. Warp rig (1 portrait) | 3 | 3 | 3 | 2 | 3 | Blink, gaze and head sway sell it. The big expressions don't |
| F2. Flow morph (AI keyframes) | 4 | 4 | 4 | 4 | 3 | The best. Viable for dialogue |
| F3. Crossfade (same keys) | 3 | 4 | 2 | 3 | 5 | Fine on holds. Ghosts during every change |

## What I saw in the frames

**A. Cutout**
- Poses read clearly, and the feet stay planted (IK on a moving floor, so no sliding).
- Every piece keeps its baked lighting. When the thigh swings 30°, the shading on its front fold rotates with it, so the light seems to move with the leg.
- There are hard seams at the knee and elbow overlaps.
- The torso's back half, which was hidden by the arm, had to be painted in from nearby cloth. It repeats the pocket and placket. You only see it when the arm swings back.
- Light hair fringe: the hair edge still carries the grey studio background. On a dark background that shows as a halo (I unmatted and choked the alpha, which helped but didn't fix it).

**B. Mesh**
- Breathing (chest expands, shoulders rise) and hair sway make the idle believable at a glance. This is the only body method with any "life" while standing.
- In the walk and run, the knee and elbow bend like rubber. Blended skin weights squash the photo texture, and the cargo pocket bends into a banana. Photographic detail makes this read as uncanny far more than it would on flat-shaded art.
- Same baked lighting and painted-fill problems as A.

**C. AI frames**
- Cloth folds and weight look right in every frame.
- But the AI gave only 6 frames per cycle, which plays at about 6 fps.
- The head bobs about 10% of body height (real walking is about 2-3%). The AI drew frames 2 and 5 crouched.
- The near and far legs swap identity between frames.
- There is no idle and no run. "Run" here is just the walk sped up, and it's obviously wrong.
- The crossfade toggle doubles the legs.
- Each new action means another AI batch plus cleanup, and the batch won't match the character exactly.
- The first walk sheet was unusable: six near-identical poses.

**F1. Warp rig**
- Blinks (the eyes-closed version swept in as the lid), eye movement (warping the iris inside an eye mask) and small head turns/tilts are convincing at bust size.
- The smile only lifts the corners: no cheek mass and no crow's feet, so it reads as a polite smirk.
- Surprised has no mouth interior, so I painted a dark gap with a hint of teeth. That's the weakest frame.
- Angry and sad work moderately well. Brows are easy.

**F2. Flow morph**
- At the held poses it shows the real AI version: wrinkles, teeth and eyelid creases, which no hand warp can invent.
- The first, one-way flow version left a crease across the cheek at full smile. The fix was two-way flow, so both end poses are the exact versions.
- Mid-transition, the lip edges briefly double up and freckles slide a bit.
- The hair differs between the AI versions, so the morph is masked to the face oval. Without the mask the hair "swims".
- Talking reuses the mouth region of "surprised", with region masks. It works, but it's one mouth shape, so it isn't lip-sync.

**F3. Crossfade**
- Fine on holds.
- During each 0.35 s change you see two mouths and two sets of brows. Classic ghosting.

## Conclusion: when is lifelike AI art viable?

- **Yes: dialogue busts, portraits, visual-novel and cutscene stills, menus.** Use F2: AI expression versions, aligned to a neutral, morphed with optical flow, region-masked. Add F1-style idle layers on top (blink, gaze, breathing, head sway).
  - A small set of 5-8 expressions plus eyes-closed is enough.
  - The cost is a consistent keyframe set. This prototype got there with 3 prompt passes (consistency is the bottleneck), plus about a day of tooling.
- **Marginal: large on-screen gameplay sprites with a small, fixed moveset** (idle, walk, one action), shown small and never zoomed. Use B for idle and A or B for walk, and accept the baked lighting. The more photographic the art, the worse the rubber/paper-doll look.
- **No: a full gameplay moveset with lifelike fidelity.**
  - Approaches A and B fall into the uncanny valley as soon as limbs rotate far.
  - Approach C can't hold the character, scale or leg identity steady across frames. Each move costs another AI batch and manual cleanup.
  - For that, use 3D rendered to sprites, or stylise the AI art (paint it over toward flat shading) before rigging.

## The face gambit (expressions, behaviours, speech, pain)

Full lessons are in **LESSONS-face.md**. The main points:

**Jeffrey's ranking (ground truth, near-verbatim):**
- Neutral: tied.
- Smile: F2, F3, ...... F1 (F1 far worse).
- Angry: F2, F3 (F3's blink is a little off), F1 (not as bad here).
- Surprised: F2, ...... F3, ...... F1.
- Sad: F2 and F1 tie, ..... F3.
- Talking: F1 works way better. F2 might be better but has a lot of ghosting (you can see teeth and tongue). F3 fails hard.

**What changed because of it:**
- **F4 hybrid is now the default.** It uses F2 for the expression and puts speech on top as its own layer: an F1-style jaw drop for talking, and a hard-switched real mouth for yelling and projecting. No mouth pixels are crossfaded.
- **F3's angry blink is fixed.** F1, F2 and F3 can still be picked in the view selector (F1 | F2 | F4 talk compare, F1 | F2 | F3, and the F4 head-turn test).
- **The lip doubling was a sign bug** in how each expression version was sampled mid-change. The chain-consistent formula fixes it. A faint crease is left at the corner of the smile.

**Scores (1-5):**

| Item | Verdict | Score |
|---|---|---|
| Five expressions + distressed | Keep | 4 |
| Blink, eye movement, breathing, out of breath | Keep | 4 |
| Distracted: one head-turn version per side | Keep | 4 |
| Distracted: two per side | Toss | 2 |
| Distracted: eye look + warp only | Eye darts only | 3 |
| Blends | Keep | 3-4 |
| F4 talking | Keep, default | 3 |
| F2 talking | Toss | 2 |
| Angry yell | Keep | 4 |
| Projecting | Keep | 4 |
| Interject | Keep | 3 |
| Pain hit | Keep | 4 |
| Hurting | Keep | 3 |

**Findings:**
- **Distracted needs one AI head-turn version per side.** A second version per side adds nothing visible and costs another hair change.
- **Talking is the weakest of the speech modes.** The opening is a stretched jaw, not true lip shapes, and there is no viseme set, so it reads as "talking", not as lip-sync.
- **Yell and project hold up well.** Their mouths are the AI versions' own pixels, aligned by the flow.
- **Pain reads instantly.** The flinch lands within 1-3 frames, and the head snapping back sells the hit.

## Jeffrey's verdict after watching (26 Oct 2026, ~10:27 PM UTC)

> "turning the head distracted doesn't work, so simpler, eyes looking around the room"
> "F2 wins most and F4 fails quite a bit"

**What changed:**
- **F2 is now the default.** That applies to the live page (view "F2 (default) | F1 | F4") and to `createBust` (`method: 2`). F1, F3 and F4 stay selectable.
- **Head-turn distraction is rejected by the user.** Distracted is now eyes only:
  - the gaze wanders around the room in 1-3 held fixations (0.35-1.2 s each), mostly to one side and sometimes across;
  - it returns to the viewer, sometimes with a blink on the way back;
  - the upper lid follows a downward look slightly;
  - the eye travel was widened (x 7 → 9.5 px, y 3 → 3.8 px) so the look reads.
- **The head keeps only its idle sway.** `distract()` and `glance()` are eyes only. The head-turn images stay in the atlas but are off the default path. They show only in the view "rejected: F2 head turn".
- **This supersedes** the earlier "1 turned key per side" recommendation and F4 as the default.
