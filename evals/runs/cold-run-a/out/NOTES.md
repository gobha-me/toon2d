# Vex / Night courier — delivery notes

Complete playable character: open `index.html` over a static HTTP server. No install, build step, external assets, network services, or dependencies are needed at runtime.

From the workspace root:

```sh
python3 -m http.server 8080 --directory out
```

Open `http://localhost:8080`. Alternatively, `npm --prefix out run serve` uses the supplied skill server. Opening through `file://` will not load the JSON and ES modules.

## Controls

- Left/right arrows or A/D: run and turn. Space, W, or up: jump; hold for height.
- Move the pointer over the game: look at its world-space position; leave the canvas to resume looking ahead.
- P or the Anti-puppet button: toggle the motion layers. They start **ON**.
- 1–8: neutral, happy, angry, sad, surprised, smug, hurt, determined. 0: automatic gameplay expressions. The Mood selector offers the same choices.
- H: hurt reaction; Reset: return to the starting position and automatic expression.
- T: cycle upper-body timing (twos → threes → ones). The default pixel presentation uses twos.
- Touch-capable devices also get left/right/jump buttons.

`window.__toon` implements the complete version-1 skill contract, including manual stepping, seed resets, inputs, flags, gameplay events, expression pinning, gaze, state telemetry, view, and all three pixel layers. `?harness=1` stops automatic simulation. Optional query parameters: `seed`, `ap=0`, `timing`, `expr`, `mode=smooth`.

## Implementation and unattended decisions

1. Followed `skill/SKILL.md`, runtime core, pixel/cutout recipes, face and anti-puppet subskills. Copied the starter into `out/`; all implementation and evidence writes remain inside this task directory. `fixture/` and `skill/` were not modified.
2. Used `sheet-markers.mjs` to produce `sheet.clean.png` and `parts.json`. Every visible body part comes from the supplied sheet: head, torso, both upper arms/forearms/hands, both thighs/shins/feet, and coat tail. The cleaning pass replaces markers with neighbouring art colours. The additional verification scans the cleaned image and finds **zero** magenta/cyan/yellow marker pixels.
3. Kept native sheet dimensions: torso 12, head 13, arm 6+5, leg 8+8, coat 7.07 game pixels between markers. Hands and feet are attached sprites. All sprite bones exactly match their extracted lengths. Preserved the sheet's 14-colour palette in quantization, including white hair, teal jacket, yellow zipper, and dark trousers. The face is entirely procedural.
4. Used the extracted head face anchor `{along:5, perp:2}`. Moved eye clusters upward and the mouth inward to fit the available skin. Added a separate dark brow colour, two-axis gaze, automatic seeded blinks, eight presets, and a tick-driven expression take: 0.05s anticipation → 0.16s movement with overshoot → settle. Preset head tilt feeds the head bone. Running, jumping, falling, and hurt feed the automatic director.
5. Kept fixed 60Hz simulation, distance-driven run phase, world-space foot locks, per-tick two-bone IK, crossfades, land compression, and variable-height/coyote/buffered jumps. The world is a bounded 640px rooftop with two one-way ledges. Ankle offset is -3px so the supplied boot soles meet the floor; standing hip is -17.8px, leaving IK slack.
6. Default anti-puppet layers are breathing, independent idle weight/noise, acceleration-driven head/chest/arm/coat springs, asymmetric run timing, held upper-body timing, and narrowing/parallax through a 10-tick turn. The original sprite outlines and overlap remain intact when motion layers are disabled. Replaced the starter scarf with the supplied coat tail; removed its unused scarf simulation/rendering. Kept continuous feet/IK when holding the upper body.
7. Refined the weakest visual axis twice. Round 1 moved the near jump/fall hand away from the face, contained mouths, reduced excessive head/chest recoil, and added coat lag/takes. Round 2 lowered the near hand further, made the far arm a bent raised silhouette, widened the idle stance, reduced swing-foot lift, and added the quiet rooftop backdrop and play controls. Preserved each round's captures.
8. Keyboard handlers track physical key codes, support simultaneous aliases, clear on focus loss, and ignore repeat events for toggles. The same character is driven by keyboard, controls, and harness. Small displays use a true integer ×1 rather than fractional scaling or clipped minimum ×2. Desktop scoring uses ×3.

## Validation and measured scores

Final runtime report: [`shots/final/score.md`](shots/final/score.md), machine-readable [`score.json`](shots/final/score.json). **15/15 required checks PASS.** No thresholds or skill scripts were changed.

| Check | Final measured result |
| --- | --- |
| Contract and deterministic replay | All API methods present; identical frame hashes `2aac2e66` / `2aac2e66` |
| Gameplay states | idle, run, turn, jump, fall, land all visited |
| Turn | 10 ticks, delayed facing changes |
| Planted-foot slip | Mean **0.001**, p95 **0**, max **0.222 px/tick** (limits 0.35 / 1 / 3) |
| Planted contacts | 1,174 sampled foot-ticks; **0 floating plants** |
| Joint coverage | **1.000**; no sampled joint misses |
| Connected character | Worst largest-component share **1.000** |
| Idle | Mean sample difference **0.0762**; distinct-frame fraction **1.000** |
| Blink | Eye openness reaches **0.00** and reopens during 6s idle |
| Expressions | **7/7 non-neutral presets** pass eyes+brows+mouth and pixel difference checks |
| Anti-puppet toggle | Run image difference **0.423**, versus minimum 0.04 |
| Pixel presentation | **320×180**, integer **×3**, nearest-upscale match **1.0000** |
| Browser console | No errors |

Non-neutral head-crop differences from the skill: happy 24.7%, angry 33.0%, sad 46.6%, surprised 45.9%, smug 22.6%, hurt 46.4%, determined 43.8%. These are the script's sampled head-region measurements, which also include natural pose movement; they are not isolated face-only differences.

Baseline also passed 15/15, but visual review caught faults those checks do not measure. Baseline maximum foot slip was 0.451; final is 0.222. Baseline expression pass count was 6; final is 7. The first refinement passed 15/15 with zero lint/validator warnings and is preserved separately.

Static gates, all PASS:

- Skill lint: **19 JavaScript/module files, 0 errors, 0 warnings**.
- `validate-rig --contract`: **12 bones, 0 warnings**.
- `validate-expressions --min 3`: **7 strong expressions**.
- Expression subskill validator: **22 params, 8 expressions, 7 reactions**.

Additional browser verification: [`shots/verification/checks.json`](shots/verification/checks.json), **11/11 PASS**. It dispatches actual keyboard events, verifies run/turn/stop, compares tap/held jumps (apex y=135.13 versus 102.50), lands on the y=104 ledge, tests both gaze axes and changed pixels, measures anticipation/overshoot/settle, checks hurt/recovery, exercises UI controls, checks world bounds, verifies a 390px viewport, and checks the console. The platform test deliberately holds the jump long enough to clear the 46px ledge; a short jump cannot reach it.

## Capture review and rubric

I opened and inspected all final contact strips (idle, run, turn, jump, run-jump), `expressions.png`, the desktop/mobile screenshots, the gaze comparison, and the native/enlarged silhouette sheet. The separate `visual_review` agent independently inspected baseline, both refinements, and final captures, and ran the final capture command. Its reports are [`REVIEW-baseline.md`](REVIEW-baseline.md) and [`REVIEW-final.md`](REVIEW-final.md). This supplies the independent review required by the skill; the task also explicitly requests my own scores below.

| Axis | My score / 5 | Evidence from final captures |
| --- | --- | --- |
| Puppet | 3 | No visible joint holes in run cells 2–12; coat tab lags behind the hip. Turn cells 3–6 still reveal one rigid head/jacket view being mirrored. |
| Appeal | 3 | Idle retains the supplied white-hair/teal/yellow design and consistent pixel density. This is a coherent small sprite, not reference-game level authored artwork. |
| Readability | 3 | Jump cells 2–7 and run-jump 2–6 keep both eyes/mouth clear; raised far arm and outward near arm make a different silhouette from run. Dark legs still merge in some passing poses. |
| Motion | 3 | Foot telemetry and run contacts show grounded weight; landing crouch is visible around jump cell 8, with reduced turn recoil. Rigid limbs and limited boot roll remain visible. |
| Face | 4 | Happy, angry, sad, shocked, smug, hurt and determined read distinctly in the eight-cell expression strip; blink, gaze and takes have measured evidence. Native size still limits nuance. |

The lowest baseline axis was Readability (independent score 2); the two refinement rounds brought it to 3. Face improved from 3 to 4. These are deliberately modest scores against the skill's demanding reference bar.

Capture directories:

- `shots/baseline/`: original sprite mapping, score, before captures.
- `shots/refinement-1/`: first corrections, score and captures.
- `shots/refinement-2/`: second corrections, captures.
- `shots/final/`: reviewed final captures/GIFs, metadata, score.
- `shots/layers-off/`: same seed/input sequence with master anti-puppet disabled.
- `shots/verification/`: full playable page, small viewport, native/silhouette sheet, gaze pair, expression-take samples, extra check results.

## Reproduce

Node 22+ and a Chromium-compatible browser are needed only for the development checks. This machine has Brave at the path below. The browser profiles are deliberately placed inside `out/.tmp`.

```sh
node skill/scripts/lint.mjs out
node skill/scripts/validate-rig.mjs out/rig.json --contract
node skill/scripts/validate-expressions.mjs out/expressions.json --min 3
node skill/subskills/toon2d-expression-rig/scripts/validate_expressions.mjs out/expressions.json

CHROME_PATH=/opt/brave.com/brave/brave TMPDIR="$PWD/out/.tmp" \
  node --import ./out/tools/fs-retry.mjs skill/scripts/score.mjs out --require pixel --out out/shots/final
CHROME_PATH=/opt/brave.com/brave/brave TMPDIR="$PWD/out/.tmp" \
  node --import ./out/tools/fs-retry.mjs skill/scripts/capture.mjs out --out out/shots --label final
CHROME_PATH=/opt/brave.com/brave/brave TMPDIR="$PWD/out/.tmp" \
  node --import ./out/tools/fs-retry.mjs out/tools/verify.mjs
```

The Node preload only retries temporary-profile removal on this filesystem. The unmodified skill runner kills Chrome and removes its profile immediately; intermittent `ENOTEMPTY` occurred during baseline capture and one second-round scoring attempt, after captures/evaluation had run. A full retry of the directory traversal fixes that environment cleanup race. The final score, final capture and extra verification all exited successfully. No evaluation result is fabricated from the interrupted attempts. Browser processes and temporary profiles are cleaned up at handoff.

## Known limits / next fix

The worst remaining tell is the rigid, single-view torso/head turn. The next art improvement is alternate front/three-quarter head and jacket drawings, and then a split deforming coat hem. I retained the supplied source rather than inventing replacement character parts. The short coat uses one spring-driven sprite, not a fabric simulation. Grounded boots stay flat without a full toe-roll cycle. Some dark leg passing poses merge at 1×; expressions are necessarily graphic and exaggerated in an approximately 8px face. Narrow-screen ×1 is crisp but small; desktop keyboard play is the primary presentation. The additional automated mobile check verifies fit, not actual-device touch ergonomics. The default pixel mode is the fully scored presentation; smooth mode is an optional inspection view, not separately scored. This is a character playground with ledges and reactions, with no combat, delivery objectives, sound, or saved progress.
