# Face lessons

## Final user verdict (26 Oct 2026, ~10:27 PM UTC). This overrides the scores below.

Jeffrey, after watching the deployed gambit:
- "turning the head distracted doesn't work, so simpler, eyes looking around the room". Head-turn distraction is **rejected by the user**, and eyes-only is preferred. So the frames needed for distracted are **zero new images**: gaze wander plus held fixations, the idle head sway, and a slight lid follow.
- "F2 wins most and F4 fails quite a bit". **F2 is the default** (page and `createBust`), and F1/F3/F4 stay selectable.

The head-turn images (turnL1/L2/R1/R2) are kept in the atlas but unused by default. Where the table below says "1 key per side: keep 4" or "F4 talk: keep (default)", read it as superseded. The lesson is that a 2D AI image turned into a head turn did not convince the person who matters, even when it scored 4 in my own review. Ask early before investing in head turns.


What I learned building the "gambit" face for the lifelike prototype. It uses one AI portrait plus AI-made versions of it, morphed live in one WebGL shader. Serve this prototype locally (see README); the embeddable widget is `bust.html` / `bust.js`.

## Jeffrey's ranking is the ground truth

He watched F1 (warp rig), F2 (flow morph) and F3 (crossfade) side by side:

| | Ranking (best first) |
|---|---|
| Neutral | tied |
| Smile | F2, F3, ...... F1 (F1 far worse) |
| Angry | F2, F3 (F3's blink is a little off), F1 (not as bad here) |
| Surprised | F2, ...... F3, ...... F1 |
| Sad | F2 and F1 tie, ..... F3 |
| Talking | F1 works way better. F2 might be better but has a lot of ghosting (you can see teeth and tongue). F3 fails hard |

What that led to:
- **F4 hybrid (now the default).** F2 handles the expression. Speech is a separate layer on top of it that moves pixels and never crossfades mouths:
  - Talking is an F1-style jaw drop hinged at the lip seam. The opening is filled with the real teeth and tongue from the surprised version, with a hard edge.
  - Yelling and projecting take the whole mouth from their own AI version (lips, teeth and tongue), aligned with the same flow and switched in hard.
- **F3's blink on angry** is fixed: the eyes-closed version is now sampled through the expression's eye geometry, instead of dissolving the whole frame back to neutral.

## Frames needed per head turn (distracted)

- **One AI head-turn version per side (about 20°) is the answer.** I tested three options side by side:
  - P: no new art (eye look plus a parallax warp);
  - Q: one turned version per side;
  - R: two per side.
- **P** reads as a glance, not a turn, but costs nothing. It is still useful for quick eye darts.
- **Q** reads as a real turn. The eyes lead by 70 ms, the head follows, lingers and snaps back.
- **R** gave no visible gain, and the extra version adds one more hair or identity change mid-turn. The left "small turn" came out almost frontal with the eyes moved, which the procedural eye look already does. **Toss it.**
- **Turn angles cannot be controlled by prompt.** "10°" came out at about 20° and "25°" at about 10°. I measured the nose offset on every version and fed a mirrored version in as a pose reference to get the right-side 20°.

## Identity consistency (try counts)

| Version | Tries | Kept | Notes |
|---|---|---|---|
| Turn left | 3 | 2 (L20 used; L5 is gaze-only) | One "10°" came out at 20°, redundant |
| Turn right | 4 | 2 (R20 t1, R20 t4) | t3 at 30° (3/4 view) **rejected**: the hair turned into a straight pixie cut. t2 "25°" came out at about 10°, redundant |
| Winded | 1 | 1 | |
| Distressed | 1 | 1 | |
| Angry yell | 1 | 1 | Squared mouth, bared teeth. Zoomed-in framing; registration fixes the scale |
| Projecting | 1 | 1 | Wide round mouth, brows up. Reads a little "excited" |
| Pain | 2 | 1 (t2) | t1 **rejected**: it came out as a painting, not a photo |

- **Acceptance rate:** 9 of 13 new versions were usable (about 70%). Counting only identity failures, 11 of 13 kept the identity (about 85%): one failed on the hair and one on the style.
- **The face, freckles and jacket hold. The hair drifts almost every time** (straighter and spikier). It gets bad beyond about 25° of turn.
  - The expressions mask the hair out, so only the head-turn versions show the drift.
- **What helped:**
  - "Edit this photo, change only the expression" wording, with the original front-facing portrait as the first reference.
  - A second reference showing the pose or the style.
  - The first "pain" prompt without the edit framing drifted into a painting.

## Speech is a layer: intensity plus intent

There are four intents. Each one sits on top of any expression.

| Intent | What it drives |
|---|---|
| Talk | Jaw drop, 4.6 syllables/s, phrases of about 1.7 s, the expression keeps its own mouth width |
| Angry yell | The yell version's mouth (squared, bared teeth); the angry version's brows and narrowed eyes on the upper face; jaw forward (lean-in scale) and drop; a tension shake; faster, bigger mouth shapes |
| Projecting (noisy room) | The project version's mouth (wide, round); surprised brows at 0.35; head forward and tipped up; slower phrases with held vowels; big breaths in the gaps |
| Interject | A 0.35 s take (sharp inhale, lean-in, brows up, mouth opens slightly), then about 2 s of raised voice, then it settles into talking |

- **A wide speech shape owns the mouth:** the expression's lower face eases back by up to 60% while the mouth is open. Without that, the angry expression's tight lower lip left a seam beside the yell mouth.
- **Talking has to keep the expression's own mouth width.** My first version warped the lips into the surprised version's narrow O shape, which left dark dimples at the corners of a smile. The jaw-drop version keeps the corners where they are.

## Pain (driven by gameplay damage)

- **`hit(intensity)`** is the snap flinch:
  - The attack takes 0.04-0.09 s, which is 1-3 frames at 30 fps; heavier hits are faster.
  - The pain version shows the eyes squeezed shut, brows down, nose wrinkled and clenched teeth.
  - The head snaps back (shrinks about 3.5%), up and to one side, then recovers with a slight overshoot over 0.3-0.8 s (longer for heavier hits).
  - Breathing jumps (a gasp). Blinking is suppressed while the eyes are squeezed.
- **`hurting(level)`** is sustained pain:
  - pain version at 0.3 on the upper face;
  - distressed brows;
  - breathing pushed to at least 0.55 (labored);
  - random winces every 1.6-4 s.
  - It blends with distressed and with being out of breath.

## Keep / toss

| Item | Verdict | Score (1-5) |
|---|---|---|
| Neutral, happy, angry, sad, surprised (F2 morph) | Keep | 4 |
| Distressed | Keep | 4 |
| Blink, eye movement, breathing | Keep | 4 |
| Out of breath (winded version + faster, bigger breaths) | Keep | 4 |
| Distracted, one head-turn version per side | Keep | 4 |
| Distracted, two head-turn versions per side | Toss | 2 |
| Distracted, eye look + warp only | Keep for quick eye darts only | 3 |
| Squint before surprised | Keep (the half-blink version: toss) | 3 |
| Blends: distressed + winded, angry + winded | Keep | 4 |
| Blends: happy + distracted, sad + surprised | Keep, weaker | 3 |
| Talking, F4 jaw drop + real teeth/tongue | Keep (default) | 3 |
| Talking, F2 crossfade of the surprised mouth | Toss (ghosting) | 2 |
| Angry yell | Keep | 4 |
| Projecting | Keep | 4 |
| Interject | Keep | 3 |
| Pain: hit (light and heavy) | Keep | 4 |
| Pain: hurting | Keep | 3 |
| 3/4 head turns (30° and beyond) | Toss | 1 |

## What to toss or avoid

- A second head-turn version per side.
- Head turns of 30° or more (the hair identity breaks).
- The half-blink squint take (the eyes ghost).
- Crossfading mouth pixels while talking (teeth and tongue ghost through).
- Additive colour deltas for combining turns with expressions (streaks, doubled irises).

## Bugs worth remembering

- **Lip doubling was a sign bug, not an inherent limit of morphing.**
  - The key was sampled at `q + (1-w)B`, which pushed it the wrong way mid-change.
  - The chain-consistent form `q + Σw_j B_j - B_i` fixed it.
- **Hard-coded atlas sizes in the shader** broke silently when keys were added. The flow atlas is now 13 columns and the key atlas 4×4.
