# G2 notes: coat tail + `scheming` / `pickup`

Built from `skill/templates/starter` (copied unchanged into `out/`, then edited). `skill/` was not modified.
Run it: serve `out/` (e.g. `node skill/scripts/serve.mjs out`) and open `index.html?mode=smooth`. Keys: arrows/AD move,
Space jump, **E = pickup**, H hurt, P anti-puppet, 1-9 pin expression (9 = scheming), 0 = auto.

## What I did
**Coat tail (requirement 2)**
- `rig.json`: bones `coat0 → coat1 → coat2` (5 px each, parent `hip`, `at [-2.5,-3]`, rest 112° = back and down),
  palette `coat/coatShade/coatLining`, `draw.coat` (widths, stiffness, gravity, damping), `coat` in `draw.order`
  between `legB` and `legF`, so it is drawn behind the near leg (and behind the torso).
- `engine/character.js` `stepCoat`: a 4-point verlet chain (`stepChain`, `springs.js`) pinned at the coat0
  origin and simulated in **world space** after FK. Rest direction is mirrored by facing. The hem is clamped above the floor.
  The chain points are written back into `ch.local.coat0..2`, so the coat bones are ordinary FK bones for the renderer,
  `worldJoints()` and `state().joints`. They are excluded from the turn "narrow" (they hang from the hip, like the legs).
  On the first step after a reset the chain is laid out at rest from the real anchor (this fixed a 5.6 px swing-in on reset).
- Anti-puppet: with `overlap` on, stiffness 0.05 / damping 0.92 (loose). With `ap=0`, stiffness 0.6 / damping 0.5 (near-rigid
  "tube"), so the toggle shows the coat difference too.
- `engine/render.js`: tapered ribbon (8 → 9.5 → 9 → 7.5 px) with a smooth outline, a lining strip and a shade band.
  It is not a plain stroke, because the first version (thin, three stripes) read as a stick at game scale. I widened it after looking at the sheets.

**Expression + gameplay event (requirement 3)**
- `expressions.json`: preset `scheming`. Eyes narrowed and asymmetric, half-smile lids, pupils small and glancing aside
  (eyes). Brows low with an inner-down angle, uneven (brows). A wide one-sided smirk on the opposite side to `smug`,
  slightly open (mouth). Plus a counter head tilt. Reaction `pickup`: `{expr: scheming, fadeIn 0.05, hold 1.4,
  fadeOut 0.6, line "Heh heh...", anticipate {surprised, 0.7, 0.08 s}, overshoot 0.3}`.
- `engine/face-core.js` director: reactions may carry `anticipate` (a short glance transient; the main transient
  starts after it, using negative age) and `overshoot`. `takeGain()` gives a sine bump right after the fade-in, and
  `amplifyParams()` pushes the mixed target past the preset; the face chases 1.8× faster during the take. The result is
  anticipate → overshoot → settle (a take, per the skill's non-negotiable), not a crossfade.
- `window.__toon.trigger('pickup')` works with no harness change: trigger → `extEvents` → director `reactions`.
  `main.js` adds the E key.

## Measured (all in `out/shots/`)
| | result |
|---|---|
| lint / validate-rig --contract / validate-expressions --min 3 | OK / OK (14 bones) / OK (8 strong) |
| `score.mjs --query mode=smooth` | **PASS 13/13**: slip mean 0.001 p95 0 max 0.438 px/tick, 1146 planted foot-ticks, 0 floating, largest blob 1.000, joints covered 1.000 (incl. coat joints), idle diff 0.165, blink 0.00, 8/8 expressions (scheming L1 6.48, 24.8 % head pixels), ap toggle diff 0.466, console clean |
| `score.mjs --query mode=pixel` | **PASS 15/15** (pixel mode was left as is, but the coat renders there too) |
| Coat probe `tools/probe.mjs` (`shots/probe-smooth.txt`): tip offset from coat root vs settled rest (−5.2, 14.1) | start run: peak 6.3 px at tick 6; stop: 3.7 px at tick 7; turn: 12.4 px at tick 3 (swings through); stop after turn: 2.7 px; jump+land: 7.0 px peaking at the landing (tick 39); back within ≤0.4 px of rest at the end of each segment |
| Pickup take (`shots/pickup-take.txt`, trigger at tick 200 idle) | eyeOpen 1.0 → 1.13 (anticipation, ticks 2-8) → 0.29 (overshoot, tick 19) → 0.42 (settled); mouthSmirk → −0.92 → −0.80; brows +0.49 → −0.41 → −0.35; back to neutral about 2.3 s later |

Captures: `shots/smooth/` (GIFs and sheets, ap on) and `shots/smooth-ap0/` (ap off) for before/after.

## Rubric self-scores (smooth mode)
The skill says one agent never grades its own work. These scores are my own and provisional; a separate reviewer
should re-score from `shots/smooth/*.png`.
| Axis | Score | Evidence |
|---|---|---|
| Puppet | 3.5 | No gaps (blob 1.000), round caps, head-first 10-tick turn. The coat now follows (sheet-turn: it trails, then swings across after the flip; sheet-jump: lifts in the air, settles after landing). Still a single side view. |
| Appeal | 3 | Consistent flat palette. The olive coat with a plum lining fits the red/navy scheme. Shapes are simple (starter design). |
| Readability | 3 | States read at 1×. The coat sits behind the near leg, so the leg silhouette stays clear. When the turn swings the coat out sideways it briefly reads like a bag (sheet-turn, last frame). |
| Motion | 3.5 | Feet locked (slip 0.001). The coat lags on start, stop, turn and landing, then settles in about 1 s. Squash on landing comes from the starter. |
| Face | 3.5 | Blink, 8 distinct presets, and a gameplay-driven pickup take (glance → overshoot → settle). At game scale `scheming` and `smug` are close cousins; mirrored smirk and sideways pupils separate them. |

## Decisions (made unattended)
- I modified the copy of `face-core.js` in `out/engine` (generated file in the skill) to add `anticipate`/`overshoot`.
  It is backward compatible: reactions without these fields behave exactly as before.
- Coat length is 15 px (3 × 5), hanging to just above the ankles at the 18 px hip height. "Long" without hitting the floor at rest.
- Coat joints are recorded in facing-local space like the other bones, so `worldJoints` mirrors them correctly.
- The coat chain steps every tick even when the upper body is held on 2s/3s (like the feet), because cloth on twos looked steppy.
- `pickup` is face-only (plus the line text). There is no body animation for the pickup itself, because the task asked for a face reaction.

## Known issues
- If a blink happens to fire inside the 0.08 s anticipation window, the glance is hidden (probe with trigger at
  tick 150). Fix: suppress or postpone blinks when a reaction starts.
- During a fast turn the coat swings well out to the side for a few frames (12 px peak). That is physically plausible, but a touch whippy.
- The coat has no collision with the legs, and in the air the floor clamp uses `level.floorY` (not platforms).
- The speech line ("Heh heh...") is produced by the director, but the starter has no speech-bubble UI to show it.
- The rubric scores above are self-assessed. An independent review was not possible in this unattended run.
