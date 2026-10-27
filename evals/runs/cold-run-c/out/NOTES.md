# Vex (cyberpunk courier): playable pixel character, NOTES

Run: `node ../skill/scripts/serve.mjs .` (or any static server on `out/`), open `index.html`.
Keys: ←/→ or A/D run · Space/W/↑ jump (hold = higher) · P anti-puppet on/off · T timing (ones/twos/threes) ·
1-8 pin expression, 0 = automatic director · H hurt. URL: `?mode=smooth`, `?ap=0`, `?expr=happy`, `?seed=N`, `?harness=1`.

## What I did

1. `doctor.mjs`: node 22 + Brave found, smoke OK.
2. Pipeline: **cutout skeletal + low-res pixel buffer** (the sheet is pixel art and side-view parts).
   I copied `skill/templates/starter` into `out/` and kept every check passing while changing it.
3. `sheet-markers.mjs fixture/sheet.png fixture/sheet.json --out out` → `out/sheet.clean.png` (markers painted
   out) and `out/parts.json` (pivots, tips, lens, 14-colour palette). The fixture is untouched.
4. `rig.json`: the contract bones with lengths from the markers (spine 12, head 13, upper arm 6, forearm 5,
   thigh 8, shin 8), shoulders at `spine 11 ±0.5`, legs at `hip ±1`, head at the spine tip. Every bone uses its
   sheet sprite (`torso, head, upper_arm, fore_arm, thigh, shin`), and `hand`/`foot` are `endSprite`s. Far limbs are
   darkened to 0.72. The face anchor is `{bone: head, along 5, perp 2}`, exactly as `sheet-markers` suggested.
   `configureBody` rescales hip height, stride and lift from the 16 px legs.
5. **Coat tail (new)**: the sheet's `coat_tail` part is split into 2 chained pieces (`rig.draw.coat.pieces`) on
   bones `coat0`/`coat1`, attached at the back of the hip. They are driven by a world-space verlet chain
   (`character.js`) with gravity, **speed drag** (rest angle leans back up to ~40° at full run, more in the air) and
   damping, and are clamped so the hem never swings in front of the legs. With anti-puppet off the coat becomes a
   stiff tube. The chain bones show up in `state().joints`.
6. **Removed the template's vector scarf.** Vex has no scarf, and the task wants sprites, not template shapes.
   Nothing on the character is drawn by the template's vector code in pixel mode.
7. **Pixel face rewritten for Vex's skin patch** (`engine/face-pixel.js`). On the sheet, the skin is rows 10-16 and
   cols 8-17 of the head part, and the chin edge is row 17.
   - Brows are at fy −3, eyes at fy −2..0 and the mouth at fy +2 (+3 when open), with integer `floor` mapping so
     the anchor's pixel centre doesn't round off by one.
   - Shapes: open eyes 2×3 with a highlight and a teal iris, half-lid (lid line + iris), wide white eyes with a 1 px
     pupil, ^ smile arcs, >< squeezed shut, and a blink line.
   - Brows tilt for angry or worried; a raised far brow for smug; a steely glint for determined.
   - Marks: grin with teeth, grimace corners, tears, sweat, anger mark and blush.
   - The palette uses Vex's own colours: outline `#181228`, teal iris, dark brows (the hair is white).
   - The first build put the mouth on the chin/neck while every check passed, which is exactly the pitfall in the
     recipe. I fixed it after looking at `expressions.png`.
8. The head's overlap spring is clamped to ±0.14 rad because Vex's head is a 13 px lever. It was snapping back
   about 30° at the end of the turn.
9. **Backdrop lightened** (`main.js` theme). Vex's near-black trousers and gloves merged into the starter's navy
   background (independent review: Readability 2).
10. Kept from the starter, verified working: fixed 60 Hz deterministic sim, distance-locked run phase plus foot
    locks plus 2-bone IK, the state machine (idle/run/turn/jump/fall/land/hurt) with crossfades, and a head-first
    turn with body narrowing. Also: springs, breath, idle noise, asymmetry, upper body on 2s, the face director with
    take envelopes, auto blink and look-at, the `window.__toon` harness, and the 320×180 buffer → palette
    quantize → integer nearest upscale.

## Measured (skill scripts, final build)

- `node skill/scripts/lint.mjs out`: **OK** (16 files, 0 warnings; rig passes `--contract`, expressions ≥ 3).
- `node skill/scripts/score.mjs out --out out/shots`: **PASS 15/15** (`shots/score.md`). Key numbers:
  - feet.slip: mean 0 / p95 0 / max 0.451 px/tick. 1160 planted foot-ticks, 0 floating.
  - gaps: largest blob 1.000, joints covered 1.000.
  - idle.alive: mean diff 0.0785, distinct 1.00.
  - Blink closes to 0.00 and reopens. Turn is 10 ticks with 2 flips.
  - 7 expressions are distinct (head-pixel diff 22-44%).
  - antipuppet.toggle diff 0.439. Pixel mode is x3 with a nearest-upscale match of 1.0000. No console errors.
- `score.mjs out --query mode=smooth`: all pass too (smooth mode is secondary and uses the vector face).
- Marker check (my script): 0 pixels of `#FF00FF`/`#00FFFF`/`#FFFF00` in every capture PNG, with ap on and off.
- Captures: `shots/capture/` (default) and `shots/capture-ap0/` (anti-puppet off, for comparison).

## Rubric scores

The skill says one agent never grades its own work. I'm running unattended, so I spawned a fresh sub-agent
reviewer that saw only the captures, `review-rubric.md`, `score.md` and the source sheet.

| Axis | Independent review, pass 1 (before fixes 9 + face fix) | Independent review, pass 2 (final) | Mine (provisional) |
|---|---|---|---|
| Puppet | 3: no gaps or hinges, coat follows; the face slides across a fixed hair mass mid-turn (turn 6-7) | 3: no gaps, coat follows (run 7-9); the face still slides mid-turn (turn 6-7) | 3: same reasons; single side-view head |
| Appeal | 3: on-model palette and shapes; stiff idle arms | 3: palette on-source, the backdrop helps; idle still stiff | 3 |
| Readability | 2: dark legs and gloves merged into the navy background | 3: legs and gloves now separate from the backdrop (jump 2-5, run 5-9) | 3: after the lighter backdrop, legs separate in every cell of `sheet-jump.png` |
| Motion | 3: planted feet, landing crouch; no takeoff crouch | 3: planted feet, landing crouch; no takeoff crouch (jump 1→2), low idle motion | 3 |
| Face | 3: happy/sad/surprised instant; smug read as a bruise; determined ≈ angry | 3: 6/7 presets read; determined is too close to neutral | 3-4: smug is now half-lidded with a raised brow; determined has flat low brows, a glint and a firm mouth |

The 7 presets at game scale: happy, angry, sad, surprised and hurt read in pass 1; smug and determined did not and
were redrawn. Pass 2: happy, angry, sad, surprised, smug (weak, wants a mouth tilt) and hurt read; **determined does not** (reads as neutral). Six non-neutral expressions read, so the "≥ 3 that read" requirement is met..

Worst tell (pass 1): the turn. The face features slide across the side-view head because there's no 3/4 or front
head drawing.

## Known issues / decisions

- **Determined** still reads too close to neutral at 1× (review pass 2). Next face fix: a lower brow bar spanning both eyes plus a set jaw (mouth one row lower and wider).
- **Smug** would read more clearly with an asymmetric mouth tilt (the smirk corner is subtle at 1 px).

- **Single side-view parts**: the sheet has only side views, so turns use the starter's head-first turn plus
  narrowing, and the face slides across the head mid-turn. The real fix is a 3/4 or front head and torso part
  swapped by yaw, which needs new art; I didn't invent art beyond the sheet.
- **No takeoff crouch**: the jump fires on the press frame for game feel; anticipation is only the airborne tuck
  and the landing squash. A 2-3 tick visual crouch before liftoff would read better but adds input latency.
- **Idle arms are fairly stiff**: the noise amplitudes are the starter's. With a 6+5 px arm the motion is subtle at 1×.
- The `torso` sprite is drawn under the narrowing transform during turns, so during the 10-tick turn the art is
  squeezed horizontally by up to 22%. This is intended (it hides the flip) but slightly distorts the pixels.
- Smooth mode (`?mode=smooth`) works and passes the score, but it draws the starter's vector face over the sprite
  head. It isn't tuned; pixel is the default and the target.
- Decision: palette entries the starter used for its vector body (top/pants/shoe) stay in `rig.palette` (the
  quantizer keeps the sheet's 14 colours via parts.json). Sprite colours were checked against the sheet in
  `sheet-idle.png`: no hue remap.
- Decision: the coat is drawn behind everything (first in draw order), with its top band tucked under the torso hem.
