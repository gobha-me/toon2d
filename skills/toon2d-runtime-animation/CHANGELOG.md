# Changelog (skill iterations driven by cold evals)

Every change made because a cold agent stumbled is logged here with the evidence. The evals themselves
(`evals/tasks`, `evals/run-evals.mjs`) are not changed to make a run pass.

## 0.1.0 (2026-10-27) — first release candidate

- Version bump to **0.1.0** (Apache-2.0 / CC BY 4.0 / CC0 licensing at repo root).
- Starter take-off crouch (4–6 tick squat before jump impulse, speed-scaled, buffered) and face-slide clamp (`face-clamp.js`).
- Docs: absolute/internal paths stripped; demo page under `docs/` or `site/` (demo PR).
- Pre-release iterations below (v1.0–v1.6) are preserved as historical notes.

## Pre-release iterations

## v1.0 (pre-eval, author self-checks)
- Starter passes `score.mjs` 15/15 (pixel) and 13/13 (smooth); `ap=0` fails `idle.alive` (checks discriminate).
- Author-side fixes found while self-testing the sprite path in a scratch copy (not shipped as an answer):
  - `configureBody(rig)`: BODY (hip height, stride, lift) now scales with leg length; before, a character with
    shorter legs than the template would hover/skate.
  - `drawSprite` `rot` override: feet stay flat while grounded (they rotated with the shin).
  - Quantizer keeps the sheet's own palette (`parts.json.palette`); before, sprite colours were remapped to the
    template palette (teal jacket turned blue).
  - `sheet-markers.mjs` prints the suggested `rig.draw.face {along, perp}`; fixture face anchor moved to the
    centre of the eye-mouth box after the first placement put the mouth off the chin.

## v1.1 (after cold run A, in progress)
- `scripts/lib/cdp.mjs` close(): waits for Chrome to exit and retries the profile delete; cleanup failures warn
  instead of crashing. Evidence: the cold agent's `capture.mjs` crashed with `ENOTEMPTY rmdir .../Default` on the
  shared filesystem and it had to write an `fs.rmSync` monkey-patch (`out/tools/fs-retry.mjs`).
- `findChrome()` also checks Edge/Brave/snap/opt paths; new `scripts/doctor.mjs` prints the browser it will use
  and smoke-launches it. Evidence: the agent probed for `chromium`, found none on PATH, and hard-coded
  `CHROME_PATH=/opt/brave.com/brave/brave` for every call.
- Starter bug fixed: overlap springs used raw `ay`, so free-fall gravity (900 px/s²) held the arms ~-0.9 rad
  forward for the whole jump and the near arm rose through the face. Now the felt acceleration removes gravity in
  the air (`character.js`), and jump/fall poses keep the near arm below the eye line, far arm behind
  (`poses.js`, borrowed from the cold agent's fix). Evidence: cold baseline review "near glove covers the
  eye/forehead in jump 2-7"; starter re-capture shows a clear face in every airborne cell; score still 15/15.
- Starter `determined` expression now moves eyes+brows+mouth (lint warned; the cold agent had to fix it).
- `pitfalls.md`: new rows "Arm crosses the face in the air", "Face overflows the skin patch", "Merged dark legs"
  (all three were found by the cold run's visual review while every objective check passed).
- `recipe-pixel-lowres.md`: fit the pixel face to the sheet's skin box (mouths landed on the neck in baseline).
- SKILL.md workflow step 0: run `doctor.mjs`.

### cold run A result (Codex CLI, gpt-6.1-sol, reasoning high, cold, 14 min)
- Hidden grader `evals/run-evals.mjs G1`: **PASS 30/30** (historical internal aggregator; public claim is score.mjs 15/15) (slip max 0.222 px/tick, joints 1.000, idle 0.0762,
  7 strong expressions, pixel x3 nearest 1.0000, sheet clean, 0 marker px).
- Rubric (agent self / independent sub-reviewer / my review): puppet 3/3/3, appeal 3/3/3, readability 3/3/3,
  motion 3/3/3, face 4/4/3. Worst tell all agree on: single-view mirrored head/torso through the turn.

## v1.2 (new findings folded, 2026-10-26 ~21:58 UTC)
- `recipe-lifelike-face-flow.md` rewritten around the owner's F1/F2/F3 ranking → **F4 hybrid** (flow-morph
  expressions + local-warp jaw-drop speech with real teeth; speech intents talk/angry-yell/project/interject;
  `hit(intensity)` / `hurting(level)` pain; one ~20° AI turn per side; identity/hair drift rates; lip-doubling
  sign bug; keep/toss table). Source: `prototypes/lifelike/LESSONS-face.md` (still being written; TODO
  hook in findings-inbox.md to re-read).
- `pipelines.md` + SKILL.md chooser: where lifelike faces go in a game (dialogue busts, HUD live portraits, comms
  windows, crew panels, interrogation close-ups); never AI flipbooks for gameplay locomotion.
- `pitfalls.md`: lip doubling, ghost teeth when talking, hair masked out/drift.
- `recipe-cutout-skeletal.md`: arm re-cut costs vs drawn in-betweens (prior cutout prototype arm-cut lessons).

## v1.3 (after cold run D, judge review)
- G2 codex: hidden grader **PASS 28/28**; but `sheet-run.png` shows the coat hanging nearly straight down at full
  run (a banner, not a trailing coat), and its first coat was a thin ribbon (its own reviewer caught that).
  Fix (skill text, not eval): `pitfalls.md` Rigid coat row + new "Coats, skirts, long tails" section in
  `recipe-cutout-skeletal.md` (world-space chain, speed drag via restAngle/wind, widen toward hem, settle time).

## v1.4 (after cold run E, judge review)
- G2 Claude Code (`claude -p`, claude-opus-5-5, 44 turns, $1.81, 7.6 min): hidden grader **PASS 28/28**, same brief
  and same skill bytes as cold run D (diff verified).
- Stumble: both cold agents hand-built expression takes (codex G1 `face-take.js`; claude edited its copy of the
  generated `face-core.js` to add `anticipate`/`overshoot`). Fix: the take envelope is now in the starter and the
  expression subskill (`envelope()` with `delay`/`overshoot`/`settle`, `anticipate` transient, overshoot as a face
  `__gain` so it isn't normalised away); `gem`/`apexHigh` use it; SKILL.md non-negotiable documents the fields.
  Unit-checked (surprised 0.5 anticipation → happy with gain 1.25 → settles in ~0.3 s); starter 15/15 pixel,
  13/13 smooth, lint 0 warnings, subskill validator ok.
- Stumble: claude wrote "independent review not possible in this unattended run" (codex spawned a reviewer
  sub-agent). Fix: SKILL.md says how to get an independent reviewer unattended (fresh sub-agent with only the
  captures + rubric) and to label self-scores provisional.
- Stumble: claude's coat swung out sideways on turns ("reads like a bag"); covered by v1.3 coat section (mirror
  the rest angle with facing, not the points).

## v1.5 (owner's lifelike-face review, 22:27 UTC)
- Face recipe: **F2 flow morph is the default**; the F4 hybrid (local-warp speech) is recorded as tried and mostly
  rejected, not recommended. "Distracted" is eyes-only gaze wandering around the room; AI head-turn versions are
  rejected. Pitfalls (ghost teeth, hair drift, new head-turn row), pipelines table, SKILL chooser and
  findings-inbox updated to match.

## v1.6 (after matched pair cold run B / cold run C, same skill v1.4 bytes + same brief)
- Results: codex **G1 PASS 30/30** (14 min; no CHROME_PATH override, no ENOTEMPTY: doctor + cdp fixes held);
  claude **G1 PASS 30/30** (62 turns, $2.93, 16.4 min; no browser/cleanup issues). Both spawned an independent
  reviewer sub-agent (v1.4 SKILL text); in v1.0 the claude run had skipped it. Both kept the face clear in the air
  and the expressions inside the skin (v1.1 fixes).
- New stumbles → pitfalls rows: "No take-off crouch" (claude's reviewer, both passes), "Face slides off the head on
  turns" (claude turn cells 5-7, judge), backdrop value vs dark legs added to "Merged dark legs" (claude's reviewer
  readability 2 → 3 after lightening the backdrop).
