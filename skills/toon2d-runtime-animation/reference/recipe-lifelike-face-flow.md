# Recipe: lifelike face (F2 flow morph; speech and pain layers)

For **painterly/photo-real AI faces in dialogue busts, HUD live portraits, comms/video-call windows, crew or party
panels, interrogation close-ups, visual-novel portraits and menus.** Never for gameplay bodies (see the end).

## Ground truth: the owner's side-by-side ranking
F1 = local warp rig on one portrait, F2 = two-way optical-flow morph between AI expression versions, F3 = crossfade.

| Clip | Best → worst |
|---|---|
| Smile, Surprised | **F2** ≫ F3 ≫ F1 (F1 far worse: one portrait cannot invent teeth, cheeks, crow's feet) |
| Angry | **F2** > F3 > F1 |
| Sad | F2 = F1 > F3 |
| Talking | **F1 local warp best**; F2 ghosts (teeth/tongue show through mid-morph); F3 fails hard |

**Default: F2 flow morph** (the owner's final review: F2 wins most). For talking, F1's local jaw warp read best in
the first comparison, but the **F4 hybrid** built from that (F2 expressions + a local-warp speech layer with real
teeth, hard-switched yell/project mouths) **was tried and mostly rejected in the owner's review: it fails quite a
bit.** Don't make F4 the default; if a project needs talking, prototype it on top of F2, keep it minimal, and get
a human side-by-side before shipping. The speech/pain notes below are what was tried, kept for reference.

## Build steps
1. **Generate a consistent set** from the front neutral portrait with "edit this photo, change only the
   expression" wording and the original as first reference (a second reference for pose/style). Versions: eyes
   closed, happy, angry, sad, surprised, plus speech versions (angry-yell, projecting) and pain. Expect ~70% usable
   (~85% keep identity). **Hair drifts almost every time**, so the morph masks hair out (it needs its own motion).
2. **Align** each version to neutral: ORB features + similarity transform with RANSAC (OpenCV).
3. **Two-way optical flow** neutral↔version (DIS). One-way flow leaves a cheek crease at full smile. Pack flows
   in an atlas; never hard-code atlas sizes in the shader (it broke silently when keys were added).
4. **Shader (F2)**: weights w_j per version; sample each key at the chain-consistent position
   `q + Σ w_j B_j − B_i` and blend. (**Lip doubling** came from sampling at `q + (1−w)B`, a sign bug, not a limit
   of morphing.) Mask to the feathered face oval.
5. **Procedural life on top**: blink (sample the eyes-closed version *through the current expression's eye
   geometry*, not a dissolve back to neutral, or the angry blink looks off), gaze (warp iris in an eye mask),
   breathing, head sway/tilt.
6. **Speech layer (tried in F4, mostly rejected; experimental)** = intent × intensity, on top of any expression:
   - **talk**: jaw drop hinged at the lip seam (F1 warp), ~4.6 syllables/s, ~1.7 s phrases; the opening is filled
     with the real teeth/tongue from the surprised version with a hard edge; **keep the expression's own mouth
     width** (warping toward a narrow O left dark dimples at smile corners).
   - **angry-yell**: the yell version's whole mouth (lips, teeth, tongue) flow-aligned and switched in hard;
     angry brows/eyes on the upper face; jaw forward + drop; tension shake; faster, bigger shapes.
   - **project** (noisy room): project version's wide round mouth; brows up ~0.35; head forward and up; slower
     phrases with held vowels and big breaths.
   - **interject**: 0.35 s take (sharp inhale, lean in, brows up, mouth slightly open), ~2 s raised voice, then
     settle to talk.
   - While a wide speech shape is open, ease the expression's lower face back by up to 60% (else a seam appears
     beside the yell mouth).
7. **Pain from gameplay**: `hit(intensity)` snap flinch (attack 0.04-0.09 s, heavier = faster; pain version:
   eyes squeezed, brows down, nose wrinkled, teeth clenched; head snaps back ~3.5% smaller, up and aside, recovers
   with slight overshoot over 0.3-0.8 s; gasp; suppress blinks). `hurting(level)`: pain at ~0.3 on the upper face,
   distressed brows, breathing ≥ 0.55, random winces every 1.6-4 s; blends with winded/distressed.
8. **Distracted = eyes only.** Let the gaze wander around the room (saccades to random points, holds of
   0.4-2 s, occasional return to camera; blink on big jumps). **Head-turn images don't work** in the owner's
   review: AI turned versions drift hair/identity (hair changes beyond ~25°), prompted angles are unreliable
   ("10°" came out at 20°), and the swap reads as a different picture. Don't generate turn versions.
9. Expression changes are **takes**: anticipation (brief squint/brow dip), fast move to slight overshoot, settle
   (≤ 0.2 s). A slow linear morph reads as a ghost.

## Keep / toss (lifelike prototype scores, 1-5)
Keep: F2 neutral/happy/angry/sad/surprised, distressed, blink + breath, winded, **eyes-only gaze wander for
distracted**, hit/hurting pain (worker scores 3-4, not yet owner-reviewed one by one).
Tried, mostly rejected by the owner: **F4 hybrid talking/yell/project/interject**, head-turn versions for distracted
(one or two per side), 3/4 turns ≥ 30°.
Toss: talking by crossfading mouths (ghost teeth), half-blink squint take, additive colour deltas for
turn+expression (streaks, doubled irises).

## Not for gameplay bodies
The same art on a cutout/mesh body fails (baked lighting, rubber knees). **Never use AI frame flipbooks for gameplay
locomotion** (scale drift, near/far legs swap = "4 legs"). Pair a lifelike bust/portrait with a stylised, pixel or
3D-rendered gameplay sprite, and drive the bust from the same gameplay events (hit → `hit()`, low HP → `hurting()`).

Implementation reference (read-only): `prototypes/lifelike/` (`LESSONS-face.md`, `prototype/`, `bust.js`).

## Provenance sidecar (required)

For every AI generation you add under a project (expression stills, turn references, rejected takes):

- Write a sidecar next to the image: `<name>.gen.json` (or `.gen.md`) with **prompt**, **tool**, **model**, and **date** (UTC). If the exact prompt was lost, write `prompt not recorded` — never invent one.
- Do not generate (or commit) faces of real people, celebrities, or photo likenesses — fictional characters only.
- Update the repo `PROVENANCE.md` and keep the demo/README credit line in sync (lifelike samples: Generated with Grok Imagine (SpaceXAI), CC0 1.0).
