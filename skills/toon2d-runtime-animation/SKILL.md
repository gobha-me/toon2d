---
name: toon2d-runtime-animation
version: 0.1.0
description: Build and verify runtime-animated 2D game characters (cutout/skeletal, low-res pixel with runtime rotation, mesh-deform, lifelike AI-art busts) that react to gameplay instead of playing fixed frames - FK + 2-bone IK feet that never skate, spring secondary motion, state machine with crossfades, a parameter face (blink, look-at, lip-flap, expressions), anti-puppet layers - plus scripts that lint, validate, headlessly capture GIFs and score foot slip, joint gaps, idle liveliness and expressions. Use when making a 2D character playable/animated from a pose sheet or AI art, choosing between rigging, frame-by-frame and pre-rendered 3D, fixing a character that looks puppety, skates, gaps, pops or blurs, or reviewing 2D character animation critically. Engine-agnostic (vanilla JS reference, Godot notes).
---

# toon2d runtime animation

Goal: a character that **reacts** (to speed, landings, hits, where it looks, what it feels) and still reads as
*drawn*, not as a paper puppet. The bar is SoR4 / Hades / Children of Morta / Rogue Legacy / Axiom Verge, and
it must beat 90s fixed-frame fighters on reactivity. Everything here was learned by building it and
measuring it; the scripts prove a result instead of trusting a screenshot.

## Workflow (do these in order)

0. **Check the environment once**: `node <skill>/scripts/doctor.mjs` (Node ≥ 22, finds a Chromium-based
   browser, smoke-launches it). Fix what it reports before building.
1. **Pick the pipeline** (table below; detail in [reference/pipelines.md](reference/pipelines.md)).
2. **Copy the starter**: `cp -r <skill>/templates/starter <project>`. It already passes every check; keep
   it passing while you change it. Read [reference/runtime-core.md](reference/runtime-core.md) before editing the engine.
3. **Bring in the art** with the recipe for your pipeline (sheet → `parts.json` via `scripts/sheet-markers.mjs`,
   bone lengths from the markers, palette merged, face anchor placed).
4. **Gate continuously**: `node <skill>/scripts/lint.mjs <project>` then
   `node <skill>/scripts/score.mjs <project> --out <project>/shots` (all checks must PASS).
5. **Capture and look**: `node <skill>/scripts/capture.mjs <project> --out <project>/shots`, then open the GIFs and
   `sheet-*.png` and score them with [reference/review-rubric.md](reference/review-rubric.md). Numbers passing ≠ good;
   the rubric catches what metrics can't (appeal, readability).
6. Fix the lowest rubric axis first using [reference/pitfalls.md](reference/pitfalls.md), re-run 4-5, record before/after.

`<skill>` = the directory containing this file. All scripts are zero-dependency Node ≥ 22 ES modules; capture/score
need a Chrome/Chromium binary (auto-found, or set `CHROME_PATH`).

## Pipeline chooser

| Source / need | Pipeline | Recipe |
|---|---|---|
| Side-view parts or pose sheet, toon/flat art, gameplay moveset | Cutout skeletal + IK | [recipe-cutout-skeletal.md](reference/recipe-cutout-skeletal.md) |
| Pixel art, want rotation without hand-drawing every angle | Low-res buffer + runtime rotation + integer upscale | [recipe-pixel-lowres.md](reference/recipe-pixel-lowres.md) |
| Painterly / lifelike AI art, idle-heavy or small moveset | Mesh deform (skinned) | [recipe-mesh-deform-lifelike.md](reference/recipe-mesh-deform-lifelike.md) |
| Lifelike face: dialogue bust, HUD live portrait, comms window, crew panel, interrogation close-up | F2: AI expression set + optical-flow morph, procedural blink/breath, eyes-only gaze wander (F4 talking hybrid tried, mostly rejected) | [recipe-lifelike-face-flow.md](reference/recipe-lifelike-face-flow.md) |
| Big readable moves, art budget, or full lifelike moveset | Frame-by-frame or pre-rendered 3D | [recipe-frame-by-frame-or-3d.md](reference/recipe-frame-by-frame-or-3d.md) |

Hybrids are normal: rigged body + hand-drawn smear frames on attacks; frame-by-frame body + parameter face.

## Non-negotiables (each one was a measured failure)

- **Deterministic sim**: fixed 60 Hz tick, seeded RNG, no wall clock in logic. Required for the eval harness.
- **Feet**: run phase advances by *distance* with cycle = 2 × stride; world-space foot locks; IK must be able to
  reach (standing hip ≈ 0.92 × leg length). Score: `feet.slip` mean < 0.35 px/tick.
- **Pixel mode**: draw into a small buffer (320×180), quantize to the palette with an alpha cut, draw the pixel
  face *after* quantizing, upscale by an integer factor with nearest-neighbour. Never let the browser/GPU filter it.
- **Joints**: round caps / overlap discs at every joint; cut parts along the silhouette, never a box.
- **Timing**: hold the upper body on 2s for runs (3s reads choppy); feet and IK always run every tick.
- **Faces**: expression changes are *takes* (anticipate → overshoot → settle), never plain crossfades. The starter's
  reactions already support it: `{ expr, weight, fadeIn, hold, fadeOut, overshoot, settle, anticipate: { expr, weight, hold } }`
  in `expressions.json` (don't re-implement it in `face-core.js`).
- **Never use AI-generated frame flipbooks for gameplay locomotion** (scale drift, near/far legs swap = "4 legs").
- **One agent never grades its own work**: run the evals/review with a different agent or a human. Unattended
  with no second agent? Spawn a fresh sub-agent reviewer (Claude Code: Task/sub-agent; Codex: a new session) that
  sees only the captures + `reference/review-rubric.md`, record its scores, and label your own as provisional.

## Bundle map

- `templates/starter/`: runnable reference (index.html, main.js, rig.json, expressions.json, engine/*.js).
- `scripts/`: `doctor.mjs`, `lint.mjs`, `validate-rig.mjs`, `validate-expressions.mjs`, `sheet-markers.mjs`, `capture.mjs`,
  `score.mjs`, `serve.mjs` (`lib/` = CDP driver, PNG/GIF codecs, image metrics).
- `reference/`: [harness-contract.md](reference/harness-contract.md) (the `window.__toon` API the scripts drive),
  [runtime-core.md](reference/runtime-core.md), recipes, [pitfalls.md](reference/pitfalls.md),
  [review-rubric.md](reference/review-rubric.md), [godot-notes.md](reference/godot-notes.md),
  [deploy-notes.md](reference/deploy-notes.md), [our-style.md](reference/our-style.md),
  [findings-inbox.md](reference/findings-inbox.md).
- `subskills/toon2d-expression-rig/` (face params, presets, director, engine notes, layer cutting from AI sheets) and
  `subskills/toon2d-anti-puppet/` (the full anti-puppet catalogue and style variants). Read them when working on the
  face or on puppet tells; the starter already embeds their core.
- `evals/`: golden tasks + `run-evals.mjs` that grade a project objectively. See `evals/README.md`.
