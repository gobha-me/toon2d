# toon2d-runtime-animation (skill bundle)

Entry point: [SKILL.md](SKILL.md) (YAML frontmatter `name` + `description`, short body, depth in `reference/`).

## Loading it

| Harness | How |
|---|---|
| Claude Code | `mkdir -p ~/.claude/skills && cp -r toon2d-runtime-animation ~/.claude/skills/` (user) or `mkdir -p .claude/skills && cp -r toon2d-runtime-animation .claude/skills/` (project). Auto-selected by its description; or say "use the toon2d-runtime-animation skill". `claude -p` works the same. |
| Codex CLI | `mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills" && cp -r toon2d-runtime-animation "${CODEX_HOME:-$HOME/.codex}/skills/"`. Picked up by skill discovery; in `codex exec`, name it in the prompt to be sure. |
| Grok Bot | Point it at the folder: "Read /path/toon2d-runtime-animation/SKILL.md and follow it" (helper files are read by path), or save a short pointer skill whose body says to read that SKILL.md. |
| Any other LLM harness | Put the folder in the workspace and tell the agent to start at `SKILL.md`. Nothing is harness-specific: scripts are plain Node ≥ 22 ES modules with zero dependencies, plus a Chrome/Chromium binary for capture/score. |

The two sub-skills in `subskills/` have their own frontmatter and can also be installed alone.

Verified install: Claude Code lists `toon2d-runtime-animation` in its session `skills` when the folder is at
`<project>/.claude/skills/` (cold run init event).

### Cold-run proof (v0.1.0)

Same skill bytes + G1 brief, empty output dirs. Grader is `scripts/score.mjs` (**15** required checks):

| Task | Agent | score.mjs |
|---|---|---|
| G1 | Codex **0.163.0** (`gpt-6.1-sol`, high) | **15/15** |
| G1 | Grok **1.0.67** (`grok-4.7`, high) | **15/15** |
| G1 | Claude Code **2.1.311** (`claude-opus-5-5`) | **15/15** |

Older **30/30** / **28/28** figures in historical `evals/runs/` NOTES and earlier CHANGELOG entries used an internal aggregator on top of score.mjs; they are not the current public claim. See `CHANGELOG.md` and the repo-root README.

## Quick self-test
```
node scripts/doctor.mjs                                  # node + browser + smoke launch
node scripts/lint.mjs templates/starter
node scripts/score.mjs templates/starter                 # pixel mode: 15/15
node scripts/score.mjs templates/starter --query mode=smooth
node scripts/capture.mjs templates/starter --out /tmp/cap
```

## Proof of repeatability
`evals/` holds golden tasks, a fixture sheet and an objective grader. Give a *different* agent the bundle without
`evals/`, then grade its output with `evals/run-evals.mjs` and review GIFs with `evals/review.md`.
See `evals/README.md` and `CHANGELOG.md` for the cold-run history.
