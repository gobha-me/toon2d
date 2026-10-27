# PROVENANCE

Sample-asset provenance for `gobha-me/toon2d` (private until v0.1).
Built from **git-tracked** media in this repository (and any still-unmerged feature branches noted below). AI stills are credited to Grok Imagine (SpaceXAI); see §2. Nothing derived from any private project ships.

License files: `LICENSE` (Apache-2.0 for code/skill), `LICENSE-ART` (CC BY 4.0 hand-made/code-drawn art + docs; CC0 for AI samples), `NOTICE`.

## Licenses (decided 2026-10-27)

| Kind | License |
|---|---|
| Code and the skill (SKILL.md, scripts, engine JS) | Apache-2.0 |
| Documentation text/HTML under `docs/` and hand-made / code-drawn / procedurally drawn sample art | CC BY 4.0 |
| AI-generated sample art | CC0 1.0; each entry lists model + date; credit "Generated with Grok Imagine (SpaceXAI)" |
| Private-project-derived art | **excluded** (does not ship) |

## Summary counts

- Hand-made / code-drawn / derived-from-code-drawn (tracked media rows): **227** (CC BY 4.0)
- AI-generated source stills: **22** (CC0 1.0; 21× Grok Imagine via cursor `GenerateImage`, 1× local mirror derived from one of them)
- Derived from AI sources (atlases, shots, work, prototype binaries): **147** (CC0 with sources)
- Private-project-derived included: **0**
- Real-person / likeness stills included: **0** (see §2 real-person check)


## Docs media inventory (`docs/`: CC BY 4.0, except the AI-derived lifelike face atlases, CC0 1.0)

Static demo pages (`docs/index.html`, `docs/guide.html`, `docs/play/`, `docs/lifelike/`) plus captured guide clips:

| Path | Kind | Notes |
|---|---|---|
| `docs/index.html`, `docs/guide.html`, `docs/play/**`, `docs/lifelike/*.html`, `docs/lifelike/*.js`, `docs/lifelike/face.json` | docs text/HTML + playable demo | CC BY 4.0 (docs) / Apache-2.0 (demo engine JS copied from skill) |
| `docs/lifelike/face-n.webp`, `face-c.webp`, `face-e.webp`, `face-f.webp` | byte-identical copies of `prototypes/lifelike/prototype/face-*.webp` (derived from the AI stills, §2b) | **CC0 1.0**. Generated with Grok Imagine (SpaceXAI); source stills, model and dates in §2a |
| `docs/media/style-*.mp4`, `docs/media/tech-*.mp4` | derived captures | Same runtime rig, deterministic inputs; captured for the field guide (CC BY 4.0) |
| `docs/favicon.ico` | icon | CC BY 4.0 |

Engine JS under `docs/play/engine/` is a published copy of `skills/toon2d-runtime-animation/templates/starter/engine/` (Apache-2.0).

## 1. Hand-drawn / code-drawn (CC BY 4.0)

### Evidence

- Toon prototype: `README.md` / `REVIEW-styles.md` — canvas character painted by code (`paint.js`, `limbmesh.js`, `pixelface.js`); `parts.json` uses `"image": null`.
- Skill fixture: `skills/toon2d-runtime-animation/evals/fixtures/make_vex_sheet.py` generates Vex pixel parts with Pillow.
- Eval runs: cold Codex/Claude captures of builds from that skill + fixture.

| Path | Branch | Source | Date | Date source |
|---|---|---|---|---|
| `evals/runs/cold-run-c/eval/capture/expressions.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-c/eval/capture/expressions.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-c/eval/capture/idle.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-c/eval/capture/jump.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-c/eval/capture/run.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-c/eval/capture/runjump.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-c/eval/capture/sheet-idle.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-c/eval/capture/sheet-jump.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-c/eval/capture/sheet-run.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-c/eval/capture/sheet-runjump.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-c/eval/capture/sheet-turn.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-c/eval/capture/turn.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-c/z-sheet-jump.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-c/z-sheet-turn.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-a/eval/capture/expressions.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-a/eval/capture/expressions.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-a/eval/capture/idle.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-a/eval/capture/jump.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-a/eval/capture/run.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-a/eval/capture/runjump.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-a/eval/capture/sheet-idle.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-a/eval/capture/sheet-jump.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-a/eval/capture/sheet-run.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-a/eval/capture/sheet-runjump.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-a/eval/capture/sheet-turn.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-a/eval/capture/turn.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-b/eval/capture/expressions.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-b/eval/capture/expressions.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-b/eval/capture/idle.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-b/eval/capture/jump.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-b/eval/capture/run.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-b/eval/capture/runjump.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-b/eval/capture/sheet-idle.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-b/eval/capture/sheet-jump.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-b/eval/capture/sheet-run.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-b/eval/capture/sheet-runjump.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-b/eval/capture/sheet-turn.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-b/eval/capture/turn.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-b/z-sheet-jump.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-b/z-sheet-run.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-e/eval/capture/expressions.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-e/eval/capture/expressions.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-e/eval/capture/idle.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-e/eval/capture/jump.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-e/eval/capture/run.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-e/eval/capture/runjump.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-e/eval/capture/sheet-idle.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-e/eval/capture/sheet-jump.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-e/eval/capture/sheet-run.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-e/eval/capture/sheet-runjump.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-e/eval/capture/sheet-turn.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-e/eval/capture/turn.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-e/zoom-run.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-d/eval/capture/expressions.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-d/eval/capture/expressions.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-d/eval/capture/idle.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-d/eval/capture/jump.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-d/eval/capture/run.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-d/eval/capture/runjump.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-d/eval/capture/sheet-idle.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-d/eval/capture/sheet-jump.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-d/eval/capture/sheet-run.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-d/eval/capture/sheet-runjump.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-d/eval/capture/sheet-turn.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-d/eval/capture/turn.gif` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-d/expr-copy.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `evals/runs/cold-run-d/zoom-run.png` | import/skill-lifelike | derived capture of skill/Vex code-drawn character (eval run) | 2026-10-27 | git committer date on HEAD |
| `shots/01-idle-neutral.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/01-idle-neutral.png` | import/skill-lifelike | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on HEAD |
| `shots/01-idle-neutral.png` | master | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on master |
| `shots/02-running-happy.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/02-running-happy.png` | import/skill-lifelike | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on HEAD |
| `shots/02-running-happy.png` | master | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on master |
| `shots/03-midjump-surprised.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/03-midjump-surprised.png` | import/skill-lifelike | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on HEAD |
| `shots/03-midjump-surprised.png` | master | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on master |
| `shots/04-debug-face-sliders.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/04-debug-face-sliders.png` | import/skill-lifelike | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on HEAD |
| `shots/04-debug-face-sliders.png` | master | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on master |
| `shots/anim/style-cel-expr.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-cel-idle.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-cel-jumpland.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-cel-run.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-cel-turn.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-chibi-expr.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-chibi-idle.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-chibi-jumpland.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-chibi-run.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-chibi-turn.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-ink-expr.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-ink-idle.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-ink-jumpland.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-ink-run.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-ink-turn.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-pixel-expr.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-pixel-idle.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-pixel-jumpland.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-pixel-run.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-pixel-turn.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-toon-expr.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-toon-idle.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-toon-jumpland.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-toon-run.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/style-toon-turn.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/tech-all-jumpland.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/tech-all-run.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/tech-ease-jumpland.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/tech-ease-runstop.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/tech-idle-idle.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/tech-mesh-run.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/tech-pixel-run.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/tech-pixel-turn.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/tech-smear-run.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/tech-springs-jumpland.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/tech-springs-runstop.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/tech-turn-turnslow.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/anim/tech-twos-run.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-cel/idle.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-cel/jump.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-cel/land.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-cel/run.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-cel/turn.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-chibi/idle.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-chibi/jump.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-chibi/land.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-chibi/run.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-chibi/turn.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-ink/idle.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-ink/jump.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-ink/land.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-ink/run.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-ink/turn.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-pixel/idle.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-pixel/jump.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-pixel/land.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-pixel/run.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-pixel/turn.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-toon/idle.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-toon/jump.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-toon/land.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-toon/run.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/after-toon/turn.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/ap-expr.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/ap-idle.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/ap-jump.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/ap-land.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/ap-run.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/ap-turn.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/before/idle.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/before/jump.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/before/land.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/before/run.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/before/turn.gif` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/compare-expr.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/compare-idle.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/compare-jump.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/compare-land.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/compare-run.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/compare-turn.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-cel-expr.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-cel-idle.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-cel-jump.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-cel-land.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-cel-run.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-cel-turn.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-chibi-expr.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-chibi-idle.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-chibi-jump.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-chibi-land.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-chibi-run.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-chibi-turn.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-ink-expr.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-ink-idle.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-ink-jump.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-ink-land.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-ink-run.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-ink-turn.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-pixel-expr.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-pixel-idle.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-pixel-jump.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-pixel-land.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-pixel-run.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/iter-pixel-turn.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/telling-faces-all-styles.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/telling-joints-hands.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/telling-lineup-game-scale.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `shots/styles/telling-turn.png` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `skills/toon2d-runtime-animation/evals/fixtures/vex/preview.png` | import/skill-lifelike | procedurally drawn by make_vex_sheet.py (Pillow) | 2026-10-27 | git committer date on HEAD |
| `skills/toon2d-runtime-animation/evals/fixtures/vex/sheet.png` | import/skill-lifelike | procedurally drawn by make_vex_sheet.py (Pillow) | 2026-10-27 | git committer date on HEAD |
| `web/media/style-cel-expr.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-cel-idle.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-cel-jumpland.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-cel-run.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-cel-turn.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-chibi-expr.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-chibi-idle.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-chibi-jumpland.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-chibi-run.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-chibi-turn.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-ink-expr.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-ink-idle.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-ink-jumpland.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-ink-run.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-ink-turn.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-pixel-expr.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-pixel-idle.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-pixel-jumpland.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-pixel-run.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-pixel-turn.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-toon-expr.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-toon-idle.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-toon-jumpland.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-toon-run.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/style-toon-turn.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/tech-all-jumpland.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/tech-all-run.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/tech-ease-jumpland.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/tech-ease-runstop.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/tech-idle-idle.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/tech-mesh-run.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/tech-pixel-run.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/tech-pixel-turn.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/tech-smear-run.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/tech-springs-jumpland.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/tech-springs-runstop.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/tech-turn-turnslow.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |
| `web/media/tech-twos-run.mp4` | feat/styles-antipuppet | code-drawn procedural canvas character (or capture thereof) | 2026-10-26 | git committer date on feat/styles-antipuppet |

## 2. AI-generated (CC0 1.0)

### License and credit

All 22 lifelike `src/` stills ship under **CC0 1.0**. Credit: **Generated with Grok Imagine (SpaceXAI)**.

Per [xAI FAQ](https://x.ai/legal/faq) and [xAI Terms of Service](https://x.ai/legal/terms-of-service): the user owns the outputs; attribution to Grok is required. That attribution is the credit line above (and on the README / demo credits).

### Evidence (tool / model)

Traced 2026-10-27 UTC against box originals and the Tween agent attachment store:

| Bucket | Count |
|---|---|
| Files under `prototypes/lifelike/src/` | **22** |
| cursor `GenerateImage` → **Grok Imagine** (C2PA `softwareAgent` / `claim_generator_info.name`; author org SpaceXAI) | **21** |
| Local horizontal flip of an AI still (no new generation; no C2PA) | **1** (`gen2/turnR20_mirrorL20.jpg`) |
| Venice or other tools | **0** (no evidence) |
| Exact prompt text recovered | **0** → recorded as **prompt not recorded** |

Method: SHA-256 match of 21/22 stills to store attachments; JPEG APP11/C2PA manifests name `Grok Imagine`; attachment mtimes **2026-10-26 UTC** (primary date). C2PA X.509 `notBefore` is ~24h earlier on every AI still (likely signer-clock skew); noted in Evidence, not used as the generation date. Exact GenerateImage `description` prompts are not in C2PA, not in-tree, and not in an accessible Oct 26 transcript — do not invent them.

### Real-person check

**None of the faces depict a real person or were prompted from one.** Evidence:

- `prototypes/lifelike/README.md`: "`src/` | The AI source art (**fictional character**)."
- `prototypes/lifelike/LESSONS-face.md`: "one AI portrait plus AI-made versions of it"; prompt *pattern* "Edit this photo, change only the expression" with the **original front-facing AI portrait** as the first reference (not a photograph of a person).
- `prototypes/lifelike/REVIEW.md` / `bust.html`: fictional AI-generated character; no celebrity, likeness, or photo-reference notes.

No still was left out. If a future still's notes suggest a real person, celebrity, or photo reference, do **not** ship it — leave it out of the repo and report it.

### 2a. Source stills

| Path | Tool | Model | Date (UTC) | Date source | Prompt | Evidence | License | Credit |
|---|---|---|---|---|---|---|---|---|
| `prototypes/lifelike/src/expr_sheet.jpg` | cursor GenerateImage | Grok Imagine (SpaceXAI) | 2026-10-26T20:38:04Z | attachment mtime | prompt not recorded | C2PA softwareAgent=Grok Imagine; store att byte-identical | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/src/face_eyes_closed.jpg` | cursor GenerateImage | Grok Imagine (SpaceXAI) | 2026-10-26T20:38:28Z | attachment mtime | prompt not recorded | C2PA + store att byte-identical | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/src/face_front.jpg` | cursor GenerateImage | Grok Imagine (SpaceXAI) | 2026-10-26T20:37:34Z | attachment mtime | prompt not recorded | C2PA + store att byte-identical | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/src/fullbody_side.jpg` | cursor GenerateImage | Grok Imagine (SpaceXAI) | 2026-10-26T20:37:33Z | attachment mtime | prompt not recorded | C2PA + store att byte-identical | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/src/parts_sheet_attempt.jpg` | cursor GenerateImage | Grok Imagine (SpaceXAI) | 2026-10-26T20:38:33Z | attachment mtime | prompt not recorded | C2PA + store att byte-identical | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/src/rig_side.jpg` | cursor GenerateImage | Grok Imagine (SpaceXAI) | 2026-10-26T20:40:13Z | attachment mtime | prompt not recorded | C2PA + store att byte-identical | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/src/walk_sheet.jpg` | cursor GenerateImage | Grok Imagine (SpaceXAI) | 2026-10-26T20:38:03Z | attachment mtime | prompt not recorded | C2PA + store att byte-identical | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/src/walk_sheet2.jpg` | cursor GenerateImage | Grok Imagine (SpaceXAI) | 2026-10-26T20:40:41Z | attachment mtime | prompt not recorded | C2PA + store att byte-identical | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/src/gen2/distressed_t1.jpg` | cursor GenerateImage | Grok Imagine (SpaceXAI) | 2026-10-26T21:10:53Z | attachment mtime | prompt not recorded | C2PA + store att byte-identical | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/src/gen2/pain_t1_painterly_REJECTED.jpg` | cursor GenerateImage | Grok Imagine (SpaceXAI) | 2026-10-26T21:48:09Z | attachment mtime | prompt not recorded | C2PA + store att; LESSONS: first pain without edit framing → painting | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/src/gen2/pain_t2.jpg` | cursor GenerateImage | Grok Imagine (SpaceXAI) | 2026-10-26T21:48:33Z | attachment mtime | prompt not recorded | C2PA + store att byte-identical | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/src/gen2/turnL10_t2.jpg` | cursor GenerateImage | Grok Imagine (SpaceXAI) | 2026-10-26T21:11:40Z | attachment mtime | prompt not recorded | C2PA + store att; LESSONS: prompted ~10° came out ~20° | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/src/gen2/turnL20_t1.jpg` | cursor GenerateImage | Grok Imagine (SpaceXAI) | 2026-10-26T21:10:28Z | attachment mtime | prompt not recorded | C2PA + store att byte-identical | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/src/gen2/turnL5_t3.jpg` | cursor GenerateImage | Grok Imagine (SpaceXAI) | 2026-10-26T21:13:44Z | attachment mtime | prompt not recorded | C2PA + store att; LESSONS: near-frontal / gaze-only | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/src/gen2/turnR20_mirrorL20.jpg` | local horizontal flip of `turnL20_t1.jpg` | n/a (derived from Grok Imagine still) | 2026-10-26T21:13:55Z | src mtime | prompt not recorded | No C2PA; pixel-near-equal to ImageOps.mirror(turnL20_t1); LESSONS pose-reference note | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/src/gen2/turnR20_t1.jpg` | cursor GenerateImage | Grok Imagine (SpaceXAI) | 2026-10-26T21:10:29Z | attachment mtime | prompt not recorded | C2PA + store att byte-identical | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/src/gen2/turnR20_t4.jpg` | cursor GenerateImage | Grok Imagine (SpaceXAI) | 2026-10-26T21:14:23Z | attachment mtime | prompt not recorded | C2PA + store att byte-identical | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/src/gen2/turnR25_t2.jpg` | cursor GenerateImage | Grok Imagine (SpaceXAI) | 2026-10-26T21:11:35Z | attachment mtime | prompt not recorded | C2PA + store att; LESSONS: prompted 25° ≈ 10° | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/src/gen2/turnR30_t3_hairdrift.jpg` | cursor GenerateImage | Grok Imagine (SpaceXAI) | 2026-10-26T21:13:31Z | attachment mtime | prompt not recorded | C2PA + store att; LESSONS: rejected (hair → pixie) | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/src/gen2/winded_t1.jpg` | cursor GenerateImage | Grok Imagine (SpaceXAI) | 2026-10-26T21:10:44Z | attachment mtime | prompt not recorded | C2PA + store att byte-identical | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/src/gen2/yell_angry_t1.jpg` | cursor GenerateImage | Grok Imagine (SpaceXAI) | 2026-10-26T21:31:08Z | attachment mtime | prompt not recorded | C2PA + store att byte-identical | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/src/gen2/yell_project_t1.jpg` | cursor GenerateImage | Grok Imagine (SpaceXAI) | 2026-10-26T21:31:11Z | attachment mtime | prompt not recorded | C2PA + store att byte-identical | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |

### 2b. Derived from those sources

Atlases, cuts, shot GIFs/JPGs, and `work/` comps produced by `tools/cut_body.py`, `tools/prep_face.py`, `tools/prep_walk.py`, `scripts/shots.mjs` (and similar) from the stills above.

| Path | Derived from | Date | Date source | Credit |
|---|---|---|---|---|
| `prototypes/lifelike/prototype/body-atlas.webp` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/prototype/face-c.webp` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/prototype/face-e.webp` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/prototype/face-f.webp` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/prototype/face-n.webp` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/prototype/walk-frames.webp` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/blend-demo.gif` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/body-idle.gif` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/body-run-compare.gif` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/body-walk-compare.gif` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/body-walk-sheet.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/breathing-ramp.gif` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/bust-live.png` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/debug-face.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/debug-walk.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/distracted-eyes-only.gif` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/distracted-test.gif` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/face-compare.gif` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/face-f1-warp.gif` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/face-f2-expressions.gif` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/gambit-reel-sheet.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/gambit-reel.gif` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/gambit-stills.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/lip-doubling-fix.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/live-page.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/live-page.png` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/pain-demo.gif` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/pain-sheet.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/speech-intents.gif` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/still-angry.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/still-mid-smile.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/still-neutral.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/still-sad.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/still-smile.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/still-surprised.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/shots/talking-compare.gif` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/atlas_dark2.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/bust.png` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/cs_gambit-reel.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/cs_pain-demo.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/cs_speech-intents.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/cut_exploded.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/cut_exploded2.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/cut_exploded3.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/dbg-happy-0.6.png` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/dbg-neutral-0.3.png` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/dbg-neutral-0.6.png` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/dbg-neutral-0.png` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/eyes_band.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/eyes_cmp.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/eyes_cs.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/eyesgif_cs.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face-f-v1.png` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face2_angry.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face2_distressed.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face2_grid.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face2_mouth_project.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face2_mouth_surprised.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face2_mouth_yell.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face2_pain.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face2_project.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face2_sad.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face2_smile.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face2_surprised.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face2_turnL1.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face2_turnL2.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face2_turnR1.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face2_turnR2.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face2_winded.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face2_yell.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face_closed_check.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face_grid.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face_reg_all.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face_reg_angry.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face_reg_sad.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face_reg_smile.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/face_reg_surprised.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g.png` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_blend_sheet_b.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_bot.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_breath_ext.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_breath_sheet_b.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_dbg.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_dbg2.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_dbg3.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_distract_sheet_a.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_distract_sheet_b.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_gambit_sheet_a.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_gambit_sheet_b.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_grid_row3.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_hd_a.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_hd_b.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_hd_c.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_lips_a.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_mouths.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_mouths_b.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_mouths_c.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_pain.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_smouth.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_smouth2.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_smouth3.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_smouth4.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_smouth5.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_speech.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_sstill.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_sstill3.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_sstill4.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_stills_a.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_t5.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_take.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_talk.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_talk2.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_talk3.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_talk4.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_talk5.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_talk6.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_top.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_turn_a.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_turn_b.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_turn_c.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/g_turn_d.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/gen2_reg.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/gen2_t1.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/grid_body.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/grid_body.png` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/hand_check3.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/live-bust.png` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/live-index.png` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/overlay.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/parts_check.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/parts_check2.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/rv-face1.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/rv-face2.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/rv-head.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/rv-knees.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/rv-run.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/surp_mouth.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/v1-debug-walk.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/v1-still-mid-smile.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/v1-still-smile.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/v1-still-surprised.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/v2-mid.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/v2-smile.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/v2-walk.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/walk_strip.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/walk_strip_v3.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/lifelike/work/walk_strip_v4.jpg` | AI stills in `prototypes/lifelike/src/` | 2026-10-27 | git committer date on HEAD | Generated with Grok Imagine (SpaceXAI) |

## 3. Private-project-derived (excluded)

None included in this repository.

- Private game prototype trees on the box were out of scope and not copied.
- Skill doc citations that named a private prototype path were rewritten on import to `prior-cutout-proto` (copy only; box originals unchanged). No art from that prototype was imported.
- Lifelike bulk dumps left on the box only (not in git):
  - EXCLUDE_DIR 91M work/raw
  - EXCLUDE_DIR 291M work/raw2
  - EXCLUDE_DIR 4.7M work/raw3
  - EXCLUDE_DIR 293M work/raw4
  - EXCLUDE_DIR 1.4M work/raw5
  - EXCLUDE_DIR 417M work/raw6
  - EXCLUDE_DIR 38M work/raw7
  - EXCLUDE_DIR 93M work/raw8
  - EXCLUDE_DIR 540M work/raw9
  - EXCLUDE_DIR 27M work/eyes
  - EXCLUDE_DIR 27M work/eyes2
  - EXCLUDE_DIR 393M .venv
  - EXCLUDE_DIR 29M node_modules

## 4. Unknowns

- Exact prompt text and seed for the 21 GenerateImage stills: **prompt not recorded** (not in C2PA, not in-tree, Oct 26 generation transcript not accessible). Do not invent prompts.
- Why C2PA `notBefore` is ~24h earlier than attachment mtime on every AI still: unexplained (likely signer-clock skew); generation date uses attachment mtime (2026-10-26 UTC).

## 5. False-positive audit notes (not private-project content)

| Match | Where | Judgment |
|---|---|---|
| `grain` ("paper grain lines") | `prototype/scene.js` | English word *grain* (not a project name) |
| `authoritative` (contains `train`) | `prototype/springs.js` | English word |
| `constrained_intra=0` | `web/media/*.mp4` | MP4 encoder ASCII; not a project reference |
| accidental 4-letter ASCII in compressed bytes | `shots/styles/after-toon/land.gif` | GIF bitstream noise (false positive on substring scan) |
| `trainIdx` | `prototypes/lifelike/tools/prep_face*.py` | OpenCV match index field |
| `terrain-aware` | skill `reference/pipelines.md` | English *terrain* |
| `Brain (Node)` / `restrained` / `constraint` | eval NOTES/GODOT/reviews | English words |

_Updated 2026-10-27 (UTC): AI still model/date filled from GenerateImage/C2PA trace; CC0 1.0 final; real-person check added._
