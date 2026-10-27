# evals: proving the skill is repeatable

Golden tasks (in `tasks/`) are given to a **different agent** than the one that wrote the skill, with only the
skill bundle (without this `evals/` dir's grader) and the fixture. The evaluator then grades the output objectively
with `run-evals.mjs` and subjectively with `review.md`.

| Task | What it proves | Objective checks (run-evals.mjs) |
|---|---|---|
| G1 pixel cutout from sheet | Pose sheet → playable pixel character with face + anti-puppet | files, lint, rig/expression validators (≥ 3 strong), all `score.mjs` checks (determinism, states, turn, foot slip, planted, gaps connected, joints covered, idle alive, blink, expressions, anti-puppet toggle, pixel mode, no filter blur, console), captures (≥ 5 GIFs), sprites declared + rendered (fixture colours), sheet free of markers, markers not on screen, scale, pixel + anti-puppet by default |
| G2 smooth + coat + reaction | Extending the runtime: springs, new bones, director events, Godot port | score in smooth mode, ≥ 4 strong expressions, `scheming` preset, `pickup` reaction drives the face, ≥ 2 `coat*` joints with secondary motion that settles, GODOT.md keywords |
| G3 lifelike plan | Plan-text **lint** (keyword regex; not a cold motion proof) | PLAN.md mentions flow morph, face mask, alignment, procedural layers, rejects AI flipbook locomotion, offers 3D/stylised/frame-by-frame, names baked-light/rubber risk, takes, verification |

## Running a cold eval
```
RUN=/somewhere/run-1; mkdir -p $RUN/out $RUN/fixture
rsync -a --exclude evals <skill>/ $RUN/skill/          # the agent gets the skill, not the grader
cp <skill>/evals/fixtures/vex/sheet.png <skill>/evals/fixtures/vex/sheet.json $RUN/fixture/
cp <skill>/evals/tasks/G1-*.md $RUN/TASK.md
# run the agent headless in $RUN with: "Read TASK.md and do it."
node <skill>/evals/run-evals.mjs G1 $RUN/out --out $RUN/eval
```
Then do `review.md`. Requirements: Node ≥ 22, Chrome/Chromium (`CHROME_PATH` or auto-detected, including the
Playwright cache), Python 3 + Pillow only to regenerate the fixture.

Fixture: `fixtures/make_vex_sheet.py` regenerates `fixtures/vex/sheet.png/json/preview.png` deterministically.

## Grader layout

`run-evals.mjs` imports `scripts/score.mjs`, `scripts/capture.mjs`, and `scripts/lib/*` from the skill bundle.
Always invoke them from that directory (or keep the whole `scripts/` tree co-located). Copying `score.mjs` alone into a project will fail on missing `./lib/` and `./capture.mjs` imports.
