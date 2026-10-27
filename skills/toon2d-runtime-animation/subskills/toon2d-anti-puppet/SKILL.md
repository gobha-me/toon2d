---
name: toon2d-anti-puppet
description: Make a 2D cutout/skeletal character stop reading as a paper puppet by fixing hinge joints, rigid parts, constant line weight, mirrored and synchronous motion, still idles, instant turns and a flat 3/4 face, then verify the change with deterministic before/after captures and a harsh scorecard. Use when a 2D game character built from rigid parts (capsules, sprites on bones, Spine/DragonBones/Godot Skeleton2D/Unity 2D Animation cutouts) looks stiff, "puppety", or like a jointed doll, or when adding alternative render styles (chibi, cel, ink, pixel) to such a rig. Engine-agnostic; reference code is vanilla JS/canvas.
---

# toon2d anti-puppet

A cutout rig reads as a **puppet** when the viewer can see how it's built: hinges, rigid
plates, everything moving on one clock. Each fix below hides one of those tells. They're ordered
by how much they helped **in captured results**, not by how clever they are. Evidence comes from
`toon2d/REVIEW-styles.md` and `shots/styles/` (the prototype this skill was extracted from).

## Workflow

1. **Capture before you touch anything.** Use a fake clock, a fixed input script, and a crop that follows the
   character. Record idle, run, jump/land, turn and an expression strip. You'll need these for honest comparisons.
2. **Diagnose from the images.** Use the tell list below and write down which tells are present. Check your
   assumptions: in our case the crossfades were already smoothstep, so the stiffness was not "linear blends".
3. **Add each fix behind a flag** (`?off=mesh,smear`), with one master toggle. On/off strips of the
   same style are your strongest evidence.
4. **Review at game scale.** Zoomed crops lie. Put every variant side by side at the real
   on-screen size and score each one 1-5 on: puppet look, appeal, readability, motion, face.
5. **Iterate on the worst score at least twice.** Recapture after each round and keep the old label.
6. **Write down what didn't work** and what still looks like a puppet.

## Tells → fixes (ranked by visible effect)

| tell | fix | reference |
| --- | --- | --- |
| Pivot balls / overlapping capsules at elbows and knees | **Skinned limb outline**: one polygon root→joint→end. Use an inner-crease miter (line intersection of the offset edges), an outer arc around the joint, and a width profile with a muscle bulge. Draw the arm in one pass at the upper-arm slot and skip the forearm sprite. | `reference/limbmesh.js` `limbOutline`, `limbPolygon` |
| Rigid tube torso, shoulder cap pasted on top | **Bending torso outline** through chest, waist and hip (quadratic through-points), with front/back width profiles. Hide the shoulder joint under the sleeve root with an open root stroke. | `limbmesh.js` `torsoOutline` |
| Ball hands, egg feet | **Shape swaps by state**: fist when running, open in the air or when hurt, relaxed in idle. Feet are flat when grounded and pointed in the air (by bone angle). | `reference/motion.js` `handShapeFor`, `footShapeFor` |
| Still idle that only blinks | **Contrapposto + value noise** per bone at unrelated rates, plus **breathing** that speeds up with exertion. Measured idle motion span went from 10.7 to 24.6. | `motion.js` `idleNoiseLayer`, `breathLayer` |
| Everything moves in sync | **Overlap springs** (head, chest, arms) kicked by the facing-relative velocity change, plus a hem/cloth spring | `motion.js` `stepOverlap` |
| Mirrored F/B run | **Asymmetry offsets** per side | `motion.js` `RUN_ASYM` |
| Constant line weight (sticker look) | Stroke-behind outline, thicker on the far/bottom side via an offset stroke. Thin interior lines and a crescent shade/rim (clip + evenodd). | `reference/paint.js` `paint`, `detailLine` |
| Instant mirror flip on turn | **Head-first turn**: the body narrows `sx*(1-0.22k)` over 2-3 frames and the face yaws to camera before the flip. Decay rate 7/s; at 11 it was invisible. | `motion.js` `stepTurn`, `faceYaw` |
| Flat 3/4 face | **Feature parallax**: each feature shifts by its own depth with head yaw, and the far eye narrows | `../toon2d-expression-rig/reference/face-render-canvas.js` `featureAt`, `FEATURE_DEPTH` |
| Too smooth / "tweened" look | **Step-hold on 2s/3s**: sample the pose at 12/8 fps. Keep root, camera and chains smooth, and translate the held chains by the root delta. | `motion.js` `createHold`, `stepHold` |
| Big pose jumps on held timing | **Smears** only above a distance threshold. Filled in flat styles, dry-brush speed lines in ink. | `limbmesh.js` `smearPolygon` |

## Styles on one rig

A style is data: proportions (scale the bone lengths **and** the clip translations), palette, line
scale/weight, shade band, timing (smooth / 2s / 3s) and a background theme. The face must stay
param-driven in every style. For pixel art the downsampled vector face is mush, so draw a
**hand-placed pixel face** from the head matrix after quantizing (`reference/pixelface.js`).
For the pixel pass, render the character at 1/4 zoom, palette-quantize, run an outline pass, then
upscale nearest-neighbour (`reference/palette.js`).

## What did NOT work (with evidence)

- **Filled smears in ink** looked like torn paper scraps. Dry-brush speed lines worked.
- **Low smear thresholds**: on held timing, feet move 10-27 px per pose, so a threshold of 6-9
  smeared 90% of run poses and it became noise. We now use 24 on 2s and 5.5 when smooth. Smears should be accents.
- **A 1.5× chibi head** covered the torso and appeal dropped to 2. 1.3× with short, thick limbs worked.
- **A vector face in the pixel style**: brows were lost in the bangs and there were no ^ eyes. A hand-placed 2px-eye face with
  lash-slope brows fixed it.
- **A hard-coded brow colour**: per-style palettes need `pal.brow`. Otherwise ink got navy brows.
- **Hatching over skin** dirtied faces. Use a per-material hatch alpha (0.3 on skin).
- **Thin cel lines** disappear at game scale. Line scale below about .8 isn't readable.

## Still puppety after all of this (fix next)

- A 4-key run with pendulum arms is the biggest remaining tell. It needs authored passing/contact keys or a
  procedural stride with foot roll.
- A single-view cutout can't rotate the shoulder line. A real turn needs a front/back drawing or a turnaround.
- At game scale most gains only show **in motion**. Stills barely change, so don't sell this with screenshots.

## Files

- `reference/limbmesh.js`: limb/torso outlines and smears (pure geometry, no deps)
- `reference/motion.js`: overlap, idle noise, breath, step-hold, turn, hand/foot shapes (pure)
- `reference/paint.js`: Path2D painting with weight, shade crescent and boil
- `reference/palette.js`: palette quantize and pixel outline pass
- `reference/pixelface.js`: hand-placed pixel face driven by the face params

All of them are generated from the prototype by `node scripts/sync-skill.mjs`. Edit the prototype, then regenerate.
