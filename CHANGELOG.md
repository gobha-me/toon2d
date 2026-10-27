# Changelog

All notable releases of this repository are listed here.
The skill's internal pre-release iteration notes (cold-eval driven) live under
`skills/toon2d-runtime-animation/CHANGELOG.md`.

## 0.1.0 — 2026-10-27

First public-candidate release of the **toon2d-runtime-animation** skill (repo remains
GitHub Pages workflow stays manual until public release).

### Added
- Apache-2.0 `LICENSE` for code and skill; `LICENSE-ART` / `NOTICE` for CC BY 4.0
  hand-made and code-drawn art + docs, and CC0 AI samples listed in `PROVENANCE.md`
- Root README with Claude Code / Codex / Grok install steps and quickstart
- Skill bundle at `skills/toon2d-runtime-animation` (starter template, lint/score/capture/doctor,
  recipes, pitfalls, anti-puppet + expression-rig subskills)
- Lifelike face-flow prototype at `prototypes/lifelike` (F2 optical-flow morph default)
- Cold-run proof captures under `evals/runs` (Codex and Claude; G1 30/30, G2 28/28)
- Starter take-off crouch and face-slide clamp
- Static demo under `docs/` (field guide, playable starter, lifelike bust) + manual-only Pages workflow

### Proven
- Codex and Claude cold runs: G1 **30/30**, G2 **28/28**, independent rubric ~**3/5**
- Grok cold run and lifelike **G3** task: not yet run on this candidate

### Known gaps
- Single side-view parts (turns still puppet-like without 3/4 / front art)
- No phoneme/viseme lip-sync
- House art style → v0.2

### Pre-release history (internal skill iterations v1.0–v1.6)

Summarized from the skill CHANGELOG; evidence was cold evals, not eval edits.

- **v1.0** — Starter self-checks (score 15/15 pixel); body scales with leg length; flat feet when
  grounded; sheet palette preserved; face-anchor hint from sheet markers.
- **v1.1** — CDP cleanup + `doctor.mjs` / broader Chrome discovery; airborne arm-through-face fix;
  `determined` expression; new pitfalls (arm/face, face overflow, merged legs). Codex G1 **30/30**.
- **v1.2** — Lifelike face-flow recipe (F4 hybrid recorded); game placement for faces; arm re-cut costs;
  never AI flipbooks for gameplay locomotion.
- **v1.3** — Coat/skirt secondary-motion guidance after G2 coat-as-banner tell. Codex G2 **28/28**.
- **v1.4** — Expression take envelope in starter (`delay`/`overshoot`/`settle`); unattended independent
  reviewer instructions. Claude G2 **28/28**.
- **v1.5** — Owner ranking: **F2** default; F4 mostly rejected; distracted = eyes-only gaze wander.
- **v1.6** — Matched G1 pair Codex/Claude both **30/30**; pitfalls for missing take-off crouch and
  face-slide on turns (addressed in the 0.1.0 starter fixes).
