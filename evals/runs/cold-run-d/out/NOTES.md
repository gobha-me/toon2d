# Delivery notes

The runnable project is `out/`, copied from the provided starter. No files in `skill/` were modified.
All project code, documentation, diagnostics, and saved captures are inside this task directory.

## Run and inspect

From `out/`, run `npm run serve`, then open the printed local URL with `?mode=smooth`.
Use A/D or arrows to run, Space/W to jump, E for a pickup reaction, P for anti-puppet,
1–9 to pin expressions (9 = scheming), and 0 to return to automatic expressions.
The required API is available: `window.__toon.trigger('pickup')`. In harness mode, call
`window.__toon.tick(n)` to advance it. Debug pins intentionally override gameplay reactions;
the E shortcut clears the pin before enqueuing pickup.

## Implementation and decisions

- Chose the starter's procedural cutout/vector pipeline and existing red/navy/gold palette.
  No external artwork, dependencies, generated frames, or paid assets were needed.
- Added three actual rig bones: `coatUpper → coatMid → coatTip`, each 5.5 world pixels long,
  attached at hip offset (-3, -0.5). `engine/coat.js` simulates four Verlet points in world space
  with gravity 360, damping 0.88, stiffness 0.035, and five constraint iterations at 60 Hz.
  The first point follows the posed hip; free points retain momentum through facing changes.
  Their endpoints drive both the drawn panel and `window.__toon.state().joints`.
- The outlined, gold-edged coat is drawn after the far leg and before the near leg. It uses the
  torso's red fabric and a darker fold. Turning narrows the upper body without transforming
  the world-space cloth twice. Turning off anti-puppet/overlap gives a static coat rest pose.
- Added the data-driven `scheming` preset with asymmetric narrowed eyes, side glance,
  opposing brow angles, and a broad asymmetric grin. Pickup uses the existing reaction
  director: 0.06 s fade-in, 1 s hold, 0.45 s fade-out. A short take squints first, sharpens the
  grin with an overshoot, then settles. Re-triggering restarts the reaction; it does not stack.
  Blink/look-at still compose afterward. External events now appear in harness `events`.
- Retained fixed-tick deterministic simulation, feet/IK, other reactions and expressions,
  smooth-mode timing on ones, and the pixel rendering pipeline. Updated package scripts for
  this directory layout. `GODOT.md` is a one-page port design, not an implemented Godot export.

## Validation and measured scores

Environment doctor: Node v22.23.2, Brave/Chromium found, smoke launch passed.
Final lint: **18 files, zero errors, zero warnings**. No installation is needed.

| Gate | Result | Saved evidence |
| --- | --- | --- |
| Unmodified starter, smooth | 13/13 PASS | `shots/baseline/score.json` |
| First coat version, smooth | 13/13 PASS | `shots/smooth/score.json` |
| Final widened coat, smooth | **13/13 PASS** | `shots/final/score.json`, `score.md` |
| Final coat, pixel regression | **15/15 PASS** | `shots/pixel/score.json`, `score.md` |
| Added coat/pickup browser checks | **15/15 PASS** | `shots/g2/checks.json` |

Final smooth foot slip is **0.001 mean / 0 p95 / 0.438 max world px per tick**;
1,146 planted foot-ticks, zero floating plants. Largest connected component and joint coverage
are both **1.000**. Turn duration is **10 ticks**. Idle mean image difference is **0.1740**,
distinct-frame ratio **1.000**. Blink closes and reopens. All eight non-neutral expressions
change eyes, brows, mouth and at least 4% of head pixels; scheming scores **6.33 parameter L1 /
24.3% head-pixel change**. Anti-puppet on/off run image difference is **0.498**. Console clean.
Pixel mode additionally has exact integer 3× scaling with **1.0000 nearest-upscale match**.

The dedicated checks measure 560 cloth states with idle noise/breath disabled to isolate settling.
Hem displacement is relative to the measured gravity-balanced rest shape, rather than an ideal
straight rest angle (gravity shifts that angle slightly).

| Cloth stimulus | Peak hem displacement from rest | Late settling error |
| --- | --- | --- |
| Start | 6.934 px | 0.000038 px after stop |
| Stop follow-through | 4.017 px | Included in start/stop settle above |
| Turn | 10.183 px | Less than 0.000001 px |
| Jump/landing | 4.867 px | Less than 0.000001 px |

All segment lengths remain within 1.51e-14 px of 5.5; adjacent endpoints coincide exactly.
At the facing flip, the hem moves 1.507 px and is 6.540 px away from the mirrored position,
confirming retained world momentum. Landing is observed at segment tick 38 and excites the cloth.

Pickup changes the head crop by **27.67%**. At reaction tick 30, eyeOpenL changes by -0.620,
browAngleL by +0.859 and mouthSmirk by -0.964. After expiry and blink reopening, the largest
tested parameter error from neutral is **0.0000033**. Re-triggering and debug-pin precedence pass.
`shots/g2/motion-traces.json` contains the per-tick cloth evidence; `pickup.gif`,
`pickup-sheet.png`, `pickup-face-sheet.png`, and `expressions-unblinked.png` show the face acting.

Reproduce from `out/`: `npm run lint`, `npm run check`, `npm run check:pixel`,
`npm run check:g2`, `npm run capture`. Browser profiles are directed into `out/.tmp` by the
package scripts. The final saved capture lives in `shots/final/capture`; `npm run capture`
writes a fresh capture under `shots/smooth/capture`.

## Rubric self-assessment, calibrated by independent review

The skill requires another reviewer. A separate agent inspected the captured frames and code,
and independently triggered pickup; its full report is `REVIEW.md`. I adopt its conservative
scores as the delivery self-assessment (3 = acceptable indie quality, 5 = commercial reference bar).

| Axis | Score / 5 | Evidence |
| --- | --- | --- |
| Puppet | 3 | Final run cells 3–8 have closed joints; turn cells 3–5 retain a flat side-view flip. |
| Appeal | 3 | Final idle preserves consistent red/navy/gold forms; the broader hem adds a readable garment shape. |
| Readability | 3 | Final runjump cells 2–3 separate cloth and legs; passing-pose dark legs still crowd in run cells 4/6. |
| Motion | 3 | Planted feet and cloth follow-through pass; final jump cells 8–10 show contact/recovery, but air poses remain simple. |
| Face | 4 | Pickup head strips show squint, opposed brows and grin, followed by neutral; mouth is small at full-body scale. |

The first coat was too ribbon-like. Following independent visual feedback, widened its panel
from [4.4, 4, 3.2, 2.2] to [5.8, 6.4, 6.2, 5.6] pixels, improving appeal/readability without changing
physics. Recaptured under a new path and reran both mode scores and targeted checks.

## Known limits and diagnostic decisions

- The main remaining puppet tell is the starter's single side-view torso/head during turns.
  The next substantial visual improvement would be front/three-quarter shapes during yaw.
- The coat has no cloth/body/environment collisions; extreme poses can overlap the body.
  It is a deliberately light three-segment secondary-motion model, not a cloth solver.
- The standard expression montage happens to sample scheming mid-blink. The unblinked montage
  resets before each preset and the pickup strips show the actual open-eyed expression. Preset
  order is saved in `shots/g2/checks.json` (scheming is ninth).
- Early custom assertions compared cloth to an unbalanced geometric angle and compared returning
  eyelids during a blink. Corrected the measurement to use the settled equilibrium and wait for
  full blink reopening; no runtime defect was hidden by relaxing thresholds. Final checks pass.
- This project passes the requested functional gates; the modest rubric scores explicitly reflect
  its simple starter artwork. Godot notes describe the intended port; no Godot runtime was tested.
