---
name: toon2d-expression-rig
description: Build a parameter-driven, layered 2D toon/anime face (eyes, lids, pupils, brows, mouth, blush, sweat/anger/tear marks) whose expressions are presets blended by weighted mix, smoothed per parameter, and layered with automatic blinking, look-at, and viseme lip-flap, then driven by gameplay events. Use when a 2D game character (cutout, skeletal, or sprite-based) needs reactive facial acting instead of canned frames, in any engine (web canvas, Godot, Unity, others), including cutting face layers from an AI-generated model sheet.
---

# toon2d expression rig

A recipe for **runtime facial acting** on 2D characters. The face isn't a set of
frames. It's a small vector of named floats (`eyeOpenL`, `browAngleR`,
`mouthCurve`, ...) that the renderer reads every frame. Expressions are sparse
presets over those floats, and procedural layers sit on top. One body pose then
works with any expression, and expressions mix (angry + surprised = shocked rage).

Files in this folder:

| file | what it is |
| --- | --- |
| `reference/face-core.js` | Dependency-free reference implementation (schema, presets, mixing, smoothing, blink, look-at, lip-flap, composition, gameplay director). Port it directly. |
| `reference/face-render-canvas.js` | Placeholder vector renderer for the face (Canvas 2D). Shows how each param maps to drawing. |
| `reference/expressions.json` | The same schema/presets/reactions as data, for engines that load JSON. |
| `reference/layer-cutting.md` | How to cut a face into layers from an AI-generated model sheet. |
| `reference/engine-notes.md` | Godot / Unity / web mapping notes. |
| `scripts/validate_expressions.mjs` | `node scripts/validate_expressions.mjs [file]` checks a presets file (unknown params, out-of-range values, bad reactions). |

## 1. Data model

```
FaceParam   { name, min, max, def, rate }       // rate = chase speed (1/s)
Expression  { [paramName]: value }               // SPARSE, absolute values; missing = neutral
Weights     { [expressionName]: 0..1 }           // the mix requested this frame
FaceState   { smoothed: Params, blink, look, speech, overrides }
Params      { [paramName]: number }              // the ONLY thing the renderer reads
```

Keep logic and rendering apart. Logic produces `Params`, and the renderer (vector
shapes, PNG part swaps, mesh deforms, Live2D/Inochi2D params, shader uniforms)
consumes them. Then you can swap placeholder art for real art without touching the acting.

## 2. Parameter list (starter set)

| param | range | default | meaning | rate |
| --- | --- | --- | --- | --- |
| eyeOpenL / eyeOpenR | 0..1.3 | 1 | lid aperture; >1 = wide (shock) | 14 |
| eyeSmileL / eyeSmileR | 0..1 | 0 | lower lid rises, giving the `^ ^` happy arcs | 10 |
| eyeShut | 0..1 | 0 | >0.5 switches to `> <` squeezed eyes (pain/effort) | 16 |
| pupilX / pupilY | -1..1 | 0 | iris offset inside the eye (look-at adds to this) | 18 |
| pupilSize | 0.4..1.4 | 1 | small = shock/fear, large = cute/awe | 10 |
| browAngleL / browAngleR | -1..1 | 0 | + = inner end down (angry), - = inner up (worried/sad) | 12 |
| browHeight | -1..1 | 0 | raise/lower both brows | 12 |
| mouthOpen | 0..1 | 0 | jaw | 16 |
| mouthCurve | -1..1 | 0.25 | smile (+) / frown (-) | 10 |
| mouthWidth | 0.3..1.6 | 1 | pursed "o" vs wide grin | 10 |
| mouthSmirk | -1..1 | 0 | asymmetric corner lift | 8 |
| blush | 0..1 | 0 | cheek ellipses + hatch lines | 2.5 (slow bloom) |
| sweat, angerMark, tears, gloom, sparkle | 0..1 | 0 | anime marks (sweat drop, cross-vein, tear streaks, forehead gloom lines, eye glint + "kira") | 3–6 |
| headTilt | -1..1 | 0 | feeds a small head-bone rotation | 6 |

Pick an L/R convention once (here, L/R = screen-left/right when the character faces right)
and mirror the whole head when flipping, so the params stay attached to the same drawn feature.

Presets shipped: neutral, happy, angry, sad, surprised, smug, hurt, determined
(see `reference/expressions.json`). An expression should change at least brows + eyes + mouth.
If it changes fewer, it reads weakly at gameplay scale. The validator warns about that.

## 3. Blending math

Mix **deltas from neutral**, not absolute values:

```
out[p] = neutral[p] + Σ_i  w_i * s * (preset_i[p] - neutral[p])
s      = 1 / Σw   if Σw > 1   else 1        // convex when over-subscribed
out    = clamp(out, min[p], max[p])
```

- Sparse presets compose. `happy` doesn't touch brows' angle much, so `happy + angry` keeps both intents.
- `neutral` is a legal weight. It adds to Σw without deltas, so it dilutes the others (`{neutral:1, happy:1}` = half happy).
- Never average absolute values across all params. That pulls every untouched param back toward the mean and turns the face to mush.

## 4. Transitions (time)

Smooth **per parameter**, not per expression weight:

```
smoothed[p] = damp(smoothed[p], target[p], rate[p], dt)
damp(c, t, r, dt) = c + (t - c) * (1 - exp(-r * dt))     // frame-rate independent
```

Fast rates on eyes/brows/mouth keep the acting snappy and anime-like. Slow rates on blush/tears let them
bloom and fade. That one table gives you staggered, organic transitions for free. Don't use
`lerp(c, t, 0.1)` per frame, because it changes speed with frame rate.

## 5. Procedural layers (applied AFTER smoothing, in this order)

1. **Look-at.** Add a saturating offset to the pupils: `g = d/(d + range/2)`, `pupil = dir * g`.
   The expression's own pupil offset (sad looks down) survives because it's additive. Optionally
   add a small clamped head turn toward targets in front. Mirror x by facing.
   Target priority: cursor/aim (recent) > point of interest (pickup, enemy, NPC) > ahead in the movement direction.
2. **Lip-flap.** Map text characters to coarse visemes (A/E/O/U/closed M-B-P/F-V/consonant/rest),
   smoothstep between consecutive chars at about 14–16 chars/s, and override `mouthOpen`/`mouthWidth` by the
   speech weight. Use the same clock for the typewriter bubble so mouth and text stay in sync. For
   recorded VO, swap the text source for an amplitude envelope or Rhubarb Lip Sync output.
3. **Blink.** Run a scheduler with a random 1.6–4.8 s interval, a 0.16 s blink, and about a 20% chance of a double blink.
   Curve: close fast (first 40%), open slower. Multiply `eyeOpen*` by `(1 - closed)`. Skip it when `eyeShut`
   is active, and suppress the scheduler while surprised or concentrating (pass a probability).
4. **Overrides.** Hard-set values from debug sliders or cutscenes.
5. **Clamp.**

Blink and lip-flap are NOT smoothed by the param rates. They have their own curves, and smoothing would blur them.

## 6. Driving it from gameplay (the "reactive, not canned" part)

Use an **expression director** with two layers:

- **Mood**: a sustained target chosen from state every frame (charging → determined, running > 0.35 s → happy,
  idle > 6 s → smug, falling fast → surprised). Mood weights `damp` toward their targets.
- **Transients**: event reactions with an envelope (fadeIn / hold / fadeOut) and an optional line to
  say. Examples: `hurt` on spikes, `apexHigh` at a jump apex or ledge walk-off over a big drop, `landHard`, `gem` pickup,
  `chargeFull`, `respawn`. A re-triggered event restarts instead of stacking.
- Final weights = `mood * (1 - min(1, Σ transient)) + transients`, and a debug `pinned` expression overrides everything.

All of it is pure: `stepDirector(state, snapshot, events, dt) -> { state, weights, lines }`.

## 7. Building the rig (any engine)

1. **Layer order** (back to front, all children of the head bone): back hair → head/skin → face-lower
   (blush, eyes, nose, mouth, tears) → bangs → **face-upper (brows, marks)** → front accessories.
   Drawing brows over the bangs is the standard anime readability trick.
2. **Eyes**: the white is a clip mask whose height = `eyeOpen`, and whose bottom rises with `eyeSmile`. Draw the iris
   and pupil inside the clip, offset by pupilX/Y. The highlights stay fixed to the light, not the pupil direction.
   Draw the upper lash line along the mask top and add an outer-corner wing. Below about 0.14 aperture, swap to
   a line (closed lid) or `^` (smile). When `eyeShut > 0.5`, swap to chevrons.
3. **Mouth**: two quadratic curves between corners. The corner y comes from curve + smirk, the top control from curve,
   and the bottom control from `curve + open`. Clip a tongue inside. Add a teeth strip on big grins.
   When `open < 0.06`, draw a single stroke.
4. **Brows**: a stroke whose inner end y = `+angle`, outer end y = `-angle/2`, and both shifted by `browHeight`.
5. **3/4 view**: shift the features toward the facing side and draw the far eye at about 0.8 width.
6. For **raster art**, every feature becomes either swap frames indexed by a quantised param (eye
   open 0/0.33/0.66/1, mouth shapes) or a deformable mesh (Live2D-style). The params don't change.
   See `reference/layer-cutting.md`.

## 8. Pitfalls

- Frame-rate-dependent lerps make transitions speed up at high FPS. Always use `damp` with dt.
- If blink is smoothed or applied before smoothing, blinks get eaten. It goes in the procedural layer, after smoothing.
- Normalising weights when Σw < 1 makes a 0.2 smile into a full smile. Only normalise when Σw > 1.
- If you forget to mirror look-at x when the character flips, the character looks away from the target.
- Brows and marks hidden under the bangs make expressions unreadable at gameplay zoom.
- Gameplay arm poses (jump/fall/hurt) that raise the near arm across the face hide the expression at exactly the
  moments it matters. Keep the near arm low or out in those poses.
- Tiny faces: features under about 6 px at final zoom stop reading. Push the extremes harder (bigger
  pupils change, chevrons, marks) instead of adding subtle params.
- If transients stack (spike damage every frame), the face gets stuck. Restart a transient on re-trigger instead.
- Keep the param list stable. Renaming params breaks every preset and every art asset keyed to them.
- Test logic modules headlessly. They're pure functions with no DOM and no engine types.

## 9. Verify

- Pin each preset and screenshot it. Each should read at gameplay zoom without the UI.
- Trigger every gameplay event and check the face reacts and returns to mood.
- Toggle sliders: overrides apply instantly and "release" hands control back.
- Run `scripts/validate_expressions.mjs` on any presets file you author.

## Engine notes

Short version below. See `reference/engine-notes.md` for details.

- **Web**: Canvas 2D like the reference, or PixiJS (`Container` per layer, `mask` for eyes).
- **Godot 4**: one `Node2D` per layer under a `Skeleton2D`/`Bone2D` head; eyes use `clip_children`;
  params live in a `Resource`; update in `_process(delta)`; or drive `AnimationTree` blend values.
- **Unity**: SpriteRenderer layers + `SpriteMask` for eyes, or 2D Animation package sprite swap via
  `SpriteResolver`; params live in a ScriptableObject; update in `Update()` with `Time.deltaTime`.
