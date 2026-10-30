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
- Imagine cutout prototype (§2c): **33** Grok Imagine Segments source stills (not committed; `.gen.json` sidecars only) and **202** committed derived stills including v2 review/evidence (CC0 1.0)
- Derived from AI sources (atlases, shots, work, prototype binaries): **147** (CC0 with sources), plus the 202 imagine-cutout stills in §2c
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

All 22 lifelike `src/` stills ship under **CC0 1.0**. Credit: **Generated with Grok Imagine (SpaceXAI)**. The imagine-cutout stills in §2c are AI-generated sample art and derivatives built only from those stills, so they are CC0 1.0 with the same credit (`LICENSE-ART`).

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

### 2c. Imagine cutout prototype (`prototypes/imagine-cutout/`, branch `prototype/imagine-cutout`)

Grok Imagine (SpaceXAI) **Segments** exports from two Imagine posts, rigged in Godot (PR #15). Fictional character only; every sidecar records "Original fictional art only; no real-person likeness." C2PA in both source images names `Grok Imagine` (`c2pa.created`, `trainedAlgorithmicMedia`) and author organisation SpaceXAI; the model is not disclosed in the UI or the manifest.

- HD post `dc2b1c33-d3d0-4c3e-b927-c04cc4e91c38`: Download All zip entries stamped **2026-10-30T14:41:58Z**.
- Pixel attempt post `e8878ac2-6b8a-4873-bae2-12b21910230e` (the HD image as reference): zip entries stamped **2026-10-30T14:44:48Z**.
- **Three out-of-zip originals use proxy dates**, not measured original-file download times:
  `src/parts/raw-hd/original.png` uses the HD zip entry time above;
  `src/parts/raw-pixel/original.png` and
  `src/parts/raw-pixel/grok-image-e8878ac2-6b8a-4873-bae2-12b21910230e.jpg`
  use the pixel-post zip entry time. These files were obtained separately, outside
  Download All. Their own download and generation timestamps were not recorded.
  The association is with the same post, not a claim that the originals occurred
  in those archives. Their mirrored `.gen.json` files explicitly label the proxy.
- Exact prompt text and generation times were not recorded for either post, so every row uses **prompt not recorded** and the download time (CONTRIBUTING.md:10-11). Do not invent prompts.
- Each still has `<name>.gen.json` beside it (source stills: under `provenance/`, mirroring the uncommitted `src/` tree); each records `source` (the parent post id), `derived_from`, and, where an older `*.sidecar.json` existed, its tool/model/date values (`previous_sidecar`). The 41 pre-fix test evidence images had no sidecar before.

#### 2c-i. Source stills (Segments exports; not committed, sidecars only)

| Path | Tool | Model | Date (UTC) | Date source | Prompt | Evidence | License | Credit |
|---|---|---|---|---|---|---|---|---|
| `src/parts/raw-hd/black-belt.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | Segments export, post `dc2b1c33`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-hd/black-belt.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-hd/black-combat-boots/black-combat-boots-1.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | Segments export, post `dc2b1c33`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-hd/black-combat-boots/black-combat-boots-1.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-hd/black-combat-boots/black-combat-boots-2.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | Segments export, post `dc2b1c33`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-hd/black-combat-boots/black-combat-boots-2.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-hd/black-combat-pants.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | Segments export, post `dc2b1c33`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-hd/black-combat-pants.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-hd/black-tactical-bodysuit.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | Segments export, post `dc2b1c33`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-hd/black-tactical-bodysuit.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-hd/cybernetic-arm.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | Segments export, post `dc2b1c33`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-hd/cybernetic-arm.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-hd/cyberpunk-woman.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | Segments export, post `dc2b1c33`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-hd/cyberpunk-woman.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-hd/high-collar/high-collar-1.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | Segments export, post `dc2b1c33`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-hd/high-collar/high-collar-1.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-hd/high-collar/high-collar-2.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | Segments export, post `dc2b1c33`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-hd/high-collar/high-collar-2.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-hd/illegible.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | Segments export, post `dc2b1c33`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-hd/illegible.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-hd/long-brown-trench-coat.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | Segments export, post `dc2b1c33`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-hd/long-brown-trench-coat.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-hd/orange-glowing-accents/orange-glowing-accents-1.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | Segments export, post `dc2b1c33`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-hd/orange-glowing-accents/orange-glowing-accents-1.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-hd/orange-glowing-accents/orange-glowing-accents-2.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | Segments export, post `dc2b1c33`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-hd/orange-glowing-accents/orange-glowing-accents-2.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-hd/orange-glowing-accents/orange-glowing-accents-3.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | Segments export, post `dc2b1c33`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-hd/orange-glowing-accents/orange-glowing-accents-3.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-hd/orange-glowing-accents/orange-glowing-accents-4.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | Segments export, post `dc2b1c33`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-hd/orange-glowing-accents/orange-glowing-accents-4.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-hd/orange-glowing-accents/orange-glowing-accents-5.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | Segments export, post `dc2b1c33`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-hd/orange-glowing-accents/orange-glowing-accents-5.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-hd/original.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | associated Segments zip time proxy; original download/generation times not recorded | prompt not recorded | Outside-zip original, associated post `dc2b1c33`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-hd/original.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-hd/short-black-hair.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | Segments export, post `dc2b1c33`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-hd/short-black-hair.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-pixel/belt.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:44:48Z | download time; generation time not recorded | prompt not recorded | Segments export, post `e8878ac2`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-pixel/belt.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-pixel/black-tactical-pants.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:44:48Z | download time; generation time not recorded | prompt not recorded | Segments export, post `e8878ac2`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-pixel/black-tactical-pants.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-pixel/brown-trench-coat.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:44:48Z | download time; generation time not recorded | prompt not recorded | Segments export, post `e8878ac2`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-pixel/brown-trench-coat.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-pixel/combat-boots/combat-boots-1.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:44:48Z | download time; generation time not recorded | prompt not recorded | Segments export, post `e8878ac2`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-pixel/combat-boots/combat-boots-1.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-pixel/combat-boots/combat-boots-2.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:44:48Z | download time; generation time not recorded | prompt not recorded | Segments export, post `e8878ac2`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-pixel/combat-boots/combat-boots-2.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-pixel/cybernetic-arm.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:44:48Z | download time; generation time not recorded | prompt not recorded | Segments export, post `e8878ac2`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-pixel/cybernetic-arm.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-pixel/cyberpunk-woman.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:44:48Z | download time; generation time not recorded | prompt not recorded | Segments export, post `e8878ac2`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-pixel/cyberpunk-woman.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-pixel/earring.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:44:48Z | download time; generation time not recorded | prompt not recorded | Segments export, post `e8878ac2`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-pixel/earring.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-pixel/grok-image-e8878ac2-6b8a-4873-bae2-12b21910230e.jpg` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:44:48Z | associated Segments zip time proxy; original download/generation times not recorded | prompt not recorded | Outside-zip original, associated post `e8878ac2`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-pixel/grok-image-e8878ac2-6b8a-4873-bae2-12b21910230e.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-pixel/high-collar/high-collar-1.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:44:48Z | download time; generation time not recorded | prompt not recorded | Segments export, post `e8878ac2`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-pixel/high-collar/high-collar-1.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-pixel/high-collar/high-collar-2.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:44:48Z | download time; generation time not recorded | prompt not recorded | Segments export, post `e8878ac2`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-pixel/high-collar/high-collar-2.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-pixel/illegible.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:44:48Z | download time; generation time not recorded | prompt not recorded | Segments export, post `e8878ac2`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-pixel/illegible.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-pixel/original.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:44:48Z | associated Segments zip time proxy; original download/generation times not recorded | prompt not recorded | Outside-zip original, associated post `e8878ac2`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-pixel/original.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-pixel/short-black-hair.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:44:48Z | download time; generation time not recorded | prompt not recorded | Segments export, post `e8878ac2`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-pixel/short-black-hair.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `src/parts/raw-pixel/shoulder-patch.png` (not committed) | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:44:48Z | download time; generation time not recorded | prompt not recorded | Segments export, post `e8878ac2`; sidecar `prototypes/imagine-cutout/provenance/parts/raw-pixel/shoulder-patch.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |

#### 2c-ii. Committed stills derived from those sources

| Path | Tool | Model | Date (UTC) | Date source | Prompt | Evidence | License | Credit |
|---|---|---|---|---|---|---|---|---|
| `prototypes/imagine-cutout/comparisons/belt.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `belt.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/comparisons/boot_left.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `boot_left.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/comparisons/boot_right.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `boot_right.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/comparisons/coat_lining.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `coat_lining.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/comparisons/coat_yoke.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `coat_yoke.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/comparisons/collar.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `collar.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/comparisons/gun.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `gun.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/comparisons/hair.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hair.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/comparisons/head.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `head.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/comparisons/hem_center.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hem_center.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/comparisons/hem_left.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hem_left.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/comparisons/hem_right.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hem_right.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/comparisons/hip_backing.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hip_backing.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/comparisons/left_arm.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `left_arm.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/comparisons/leg_left.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `leg_left.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/comparisons/leg_right.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `leg_right.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/comparisons/right_fore.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `right_fore.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/comparisons/right_hand.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `right_hand.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/comparisons/right_upper.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `right_upper.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/comparisons/torso.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `torso.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/comparisons/whole-figure.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `whole-figure.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/diagnostics/assembled-hd.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `assembled-hd.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/diagnostics/assembled-pixel.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `assembled-pixel.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/diagnostics/baked-checker-demo.jpg` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `baked-checker-demo.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/diagnostics/defringe-comparison.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `defringe-comparison.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/diagnostics/fix2-rest-attachments.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `fix2-rest-attachments.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/diagnostics/matted-checker-demo.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `matted-checker-demo.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/diagnostics/matted-flat-jpg.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:44:48Z | download time; generation time not recorded | prompt not recorded | derived from post `e8878ac2`; `matted-flat-jpg.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/diagnostics/residual.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `residual.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/diagnostics/zero-overlap-hd.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `zero-overlap-hd.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/hd/belt.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `belt.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/hd/boot_left.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `boot_left.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/hd/boot_right.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `boot_right.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/hd/coat_lining.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `coat_lining.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/hd/coat_yoke.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `coat_yoke.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/hd/collar.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `collar.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/hd/gun.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `gun.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/hd/hair.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hair.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/hd/head.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `head.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/hd/hem_center.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hem_center.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/hd/hem_left.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hem_left.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/hd/hem_right.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hem_right.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/hd/hip_backing.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hip_backing.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/hd/left_arm.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `left_arm.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/hd/leg_left.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `leg_left.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/hd/leg_right.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `leg_right.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/hd/right_fore.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `right_fore.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/hd/right_hand.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `right_hand.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/hd/right_upper.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `right_upper.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/hd/torso.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `torso.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/pixel/belt.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `belt.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/pixel/boot_left.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `boot_left.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/pixel/boot_right.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `boot_right.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/pixel/coat_lining.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `coat_lining.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/pixel/coat_yoke.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `coat_yoke.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/pixel/collar.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `collar.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/pixel/gun.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `gun.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/pixel/hair.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hair.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/pixel/head.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `head.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/pixel/hem_center.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hem_center.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/pixel/hem_left.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hem_left.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/pixel/hem_right.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hem_right.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/pixel/hip_backing.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hip_backing.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/pixel/left_arm.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `left_arm.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/pixel/leg_left.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `leg_left.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/pixel/leg_right.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `leg_right.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/pixel/right_fore.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `right_fore.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/pixel/right_hand.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `right_hand.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/pixel/right_upper.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `right_upper.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/parts/pixel/torso.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `torso.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/aim.gif` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `aim.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/cooldown.gif` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `cooldown.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/fire.gif` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `fire.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/idle.gif` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `idle.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint-closeups-contact.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `joint-closeups-contact.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint-extremes-contact.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `joint-extremes-contact.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/boot_left_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `boot_left_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/boot_left_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `boot_left_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/boot_right_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `boot_right_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/boot_right_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `boot_right_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/coat_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `coat_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/coat_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `coat_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/collar_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `collar_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/collar_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `collar_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/hair_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hair_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/hair_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hair_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/head_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `head_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/head_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `head_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/hem_center_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hem_center_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/hem_center_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hem_center_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/hem_left_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hem_left_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/hem_left_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hem_left_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/hem_right_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hem_right_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/hem_right_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hem_right_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/hip_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hip_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/hip_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hip_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/left_arm_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `left_arm_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/left_arm_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `left_arm_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/leg_left_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `leg_left_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/leg_left_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `leg_left_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/leg_right_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `leg_right_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/leg_right_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `leg_right_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/right_fore_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `right_fore_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/right_fore_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `right_fore_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/right_hand_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `right_hand_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/right_hand_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `right_hand_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/right_upper_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `right_upper_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/right_upper_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `right_upper_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/torso_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `torso_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/joint_closeups/torso_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `torso_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/hd/key-pose-contact.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `key-pose-contact.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/aim.gif` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `aim.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/cooldown.gif` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `cooldown.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/fire.gif` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `fire.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/idle.gif` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `idle.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint-closeups-contact.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `joint-closeups-contact.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint-extremes-contact.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `joint-extremes-contact.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/boot_left_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `boot_left_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/boot_left_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `boot_left_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/boot_right_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `boot_right_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/boot_right_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `boot_right_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/coat_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `coat_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/coat_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `coat_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/collar_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `collar_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/collar_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `collar_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/hair_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hair_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/hair_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hair_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/head_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `head_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/head_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `head_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/hem_center_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hem_center_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/hem_center_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hem_center_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/hem_left_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hem_left_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/hem_left_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hem_left_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/hem_right_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hem_right_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/hem_right_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hem_right_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/hip_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hip_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/hip_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hip_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/left_arm_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `left_arm_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/left_arm_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `left_arm_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/leg_left_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `leg_left_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/leg_left_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `leg_left_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/leg_right_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `leg_right_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/leg_right_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `leg_right_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/right_fore_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `right_fore_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/right_fore_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `right_fore_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/right_hand_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `right_hand_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/right_hand_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `right_hand_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/right_upper_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `right_upper_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/right_upper_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `right_upper_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/torso_max.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `torso_max.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/joint_closeups/torso_min.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `torso_min.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/renders/pixel/key-pose-contact.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `key-pose-contact.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/hd-boot_left-min-actual.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hd-boot_left-min-actual.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/hd-boot_left-min-child.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hd-boot_left-min-child.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/hd-boot_left-min-marked.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hd-boot_left-min-marked.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/hd-boot_left-min-parent.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hd-boot_left-min-parent.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/hd-boot_left-min-review.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hd-boot_left-min-review.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/hd-hem_center-max-actual.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hd-hem_center-max-actual.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/hd-hem_center-max-child.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hd-hem_center-max-child.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/hd-hem_center-max-marked.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hd-hem_center-max-marked.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/hd-hem_center-max-parent.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hd-hem_center-max-parent.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/hd-hem_center-min-actual.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hd-hem_center-min-actual.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/hd-hem_center-min-child.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hd-hem_center-min-child.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/hd-hem_center-min-marked.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hd-hem_center-min-marked.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/hd-hem_center-min-parent.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hd-hem_center-min-parent.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/hd-hem_right-max-actual.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hd-hem_right-max-actual.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/hd-hem_right-max-child.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hd-hem_right-max-child.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/hd-hem_right-max-marked.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hd-hem_right-max-marked.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/hd-hem_right-max-parent.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hd-hem_right-max-parent.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/hd-hem_right-min-actual.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hd-hem_right-min-actual.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/hd-hem_right-min-child.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hd-hem_right-min-child.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/hd-hem_right-min-marked.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hd-hem_right-min-marked.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/hd-hem_right-min-parent.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `hd-hem_right-min-parent.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/pixel-hem_center-max-actual.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `pixel-hem_center-max-actual.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/pixel-hem_center-max-child.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `pixel-hem_center-max-child.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/pixel-hem_center-max-marked.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `pixel-hem_center-max-marked.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/pixel-hem_center-max-parent.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `pixel-hem_center-max-parent.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/pixel-hem_center-min-actual.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `pixel-hem_center-min-actual.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/pixel-hem_center-min-child.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `pixel-hem_center-min-child.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/pixel-hem_center-min-marked.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `pixel-hem_center-min-marked.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/pixel-hem_center-min-parent.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `pixel-hem_center-min-parent.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/pixel-hem_right-max-actual.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `pixel-hem_right-max-actual.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/pixel-hem_right-max-child.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `pixel-hem_right-max-child.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/pixel-hem_right-max-marked.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `pixel-hem_right-max-marked.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/pixel-hem_right-max-parent.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `pixel-hem_right-max-parent.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/pixel-hem_right-min-actual.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `pixel-hem_right-min-actual.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/pixel-hem_right-min-child.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `pixel-hem_right-min-child.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/pixel-hem_right-min-marked.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `pixel-hem_right-min-marked.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/pixel-hem_right-min-parent.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `pixel-hem_right-min-parent.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/pixel-leg_left-max-actual.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `pixel-leg_left-max-actual.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/pixel-leg_left-max-child.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `pixel-leg_left-max-child.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/pixel-leg_left-max-marked.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `pixel-leg_left-max-marked.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |
| `prototypes/imagine-cutout/tests/results/pre-fix2/real-images/pixel-leg_left-max-parent.png` | Grok Imagine (SpaceXAI) | not disclosed | 2026-10-30T14:41:58Z | download time; generation time not recorded | prompt not recorded | derived from post `dc2b1c33`; `pixel-leg_left-max-parent.gen.json` | CC0 1.0 | Generated with Grok Imagine (SpaceXAI) |

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
- Imagine cutout (§2c): exact prompt text and generation time for posts `dc2b1c33…` (HD) and `e8878ac2…` (pixel attempt): **prompt not recorded**; dates are the Download All zip entry times. Model: **not disclosed** (not shown in the UI or C2PA).
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
_Updated 2026-10-30 (UTC): §2c imagine-cutout stills added (prompt not recorded; download-time dates)._

### Body-part kit v2 scripted derivatives (2026-10-30 UTC)

The historical §2c still inventory above describes the PoC. V2 adds these
source-derived assets; none is a new AI generation. Tool: Python/OpenCV/Pillow
scripted derivation, source tool Grok Imagine (SpaceXAI), source model **not
disclosed**, prompt **prompt not recorded**, license **CC0 1.0**. Each new still
has an adjacent `.gen.json` recording its date basis and source. Existing HD
lining, hand, sleeve and thigh stills are rebuilt with the same provenance and
new scripted creation times. Existing pixel PNGs are unchanged.

| New stills | Source and operation |
|---|---|
| `prototypes/imagine-cutout/parts/hd/left_fore.png`, `left_hand.png` | Residual-seeded original sleeve/hand crop, split at manifest elbow/wrist with source-colour backing. |
| `prototypes/imagine-cutout/parts/hd/shin_left.png`, `shin_right.png` | Segments trouser crops, split at manifest knees with source-colour round caps. |
| `prototypes/imagine-cutout/parts/kit-inputs/{left_arm,leg_left,leg_right,coat_lining,right_hand}.png` | Exact retained PoC crop copies used as immutable preparation inputs; copied source provenance is adjacent. |
| `prototypes/imagine-cutout/validation/v2/review-final/{rest,aim,fire,knees,contact}.png` | Godot captures of these source-derived sprites; contact is a display reduction of the four native captures. |
| PNGs below `prototypes/imagine-cutout/validation/` | Unretouched native Godot test evidence, copied from disposable runs; adjacent sidecars identify the source-derived art. These do not replace historical test-lane evidence. |

See the v2 notes in `prototypes/imagine-cutout/NOTES.md` for the explicit zip-time
proxy dating of the three separately saved source originals. Derivation times
are not source generation times. Generated with Grok Imagine (SpaceXAI).
