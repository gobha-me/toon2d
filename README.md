# toon2d

Open-source, **agent-agnostic skill** for expressive **runtime** 2D toon / anime character animation.

Characters **react** to gameplay (speed, landings, hits, gaze, feeling) instead of playing fixed flipbook
frames. The reference implementation is engine-agnostic vanilla JS (browser). The quality bar is modern 2D
(Streets of Rage 4, Hades, Children of Morta, Rogue Legacy, Axiom Verge): beat 1990s fixed-frame fighters on
reactivity without looking like a paper puppet.

Primary deliverable: `skills/toon2d-runtime-animation/` — a loadable skill (SKILL.md + scripts + starter
template + graders) that Claude, Codex, and Grok can follow to rebuild the same result.

Secondary goal (later releases): a recognizable **house art style** across themes (cyberpunk, noir,
platformer). That work is tracked for **v0.2**, not this release.

## License

| Material | License |
|---|---|
| Code and the skill | [Apache-2.0](LICENSE) |
| Hand-made / code-drawn sample art and docs | [CC BY 4.0](LICENSE-ART) |
| AI-generated sample art | [CC0 1.0](LICENSE-ART) — **Generated with Grok Imagine (SpaceXAI)**; model + date in [PROVENANCE.md](PROVENANCE.md). Per [xAI FAQ](https://x.ai/legal/faq) / [ToS](https://x.ai/legal/terms-of-service): user owns outputs; attribution to Grok required. |

See [NOTICE](NOTICE) and [PROVENANCE.md](PROVENANCE.md). Nothing from private projects ships.


## Archived branches

`feat/styles-antipuppet` is an **archived prototype** exploring house-style / anti-puppet experiments.
It is **not part of v0.1** and is not merged to `master`. Kept as a branch for later reference (likely v0.2+).


## Install the skill

Clone this repo (or copy just the skill folder). `<skill>` below means
`skills/toon2d-runtime-animation`.

### Claude Code

Copy the skill into Claude's skills directory:

```bash
mkdir -p ~/.claude/skills && cp -r skills/toon2d-runtime-animation ~/.claude/skills/
# or, project-scoped:
mkdir -p .claude/skills && cp -r skills/toon2d-runtime-animation .claude/skills/
```

Claude auto-selects by the skill description, or say: `use the toon2d-runtime-animation skill`.
`claude -p` works the same way.

### Codex

Copy into `$CODEX_HOME/skills/` (default `~/.codex/skills/`):

```bash
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -r skills/toon2d-runtime-animation "${CODEX_HOME:-$HOME/.codex}/skills/"
```

Or point Codex at the entry file without installing: tell it
`start at skills/toon2d-runtime-animation/SKILL.md`.

### Grok

Tell Grok:

```text
Read skills/toon2d-runtime-animation/SKILL.md and follow it.
```

Use an absolute path if the workspace root is not the repo. Helper files are loaded by relative paths
from that SKILL.md.

### Any other harness

Put the folder in the workspace and tell the agent to start at `SKILL.md`. Scripts are plain
**Node ≥ 22** ES modules with **zero npm dependencies**. Capture/score need a Chrome/Chromium binary
(auto-found, or set `CHROME_PATH`).

## Quickstart

```bash
cd skills/toon2d-runtime-animation
node scripts/doctor.mjs                 # Node + browser smoke launch
cp -r templates/starter /tmp/my-char
node scripts/lint.mjs /tmp/my-char
node scripts/score.mjs /tmp/my-char     # pixel mode: expect all PASS
node scripts/capture.mjs /tmp/my-char --out /tmp/my-char/shots
node scripts/serve.mjs /tmp/my-char     # open the printed URL
```

Full workflow, pipeline chooser, recipes, and pitfalls: start at
[skills/toon2d-runtime-animation/SKILL.md](skills/toon2d-runtime-animation/SKILL.md).

## What's in the repo

| Path | What |
|---|---|
| `skills/toon2d-runtime-animation/` | **The skill** — SKILL.md, reference docs, starter template, lint/score/capture/doctor |
| `skills/toon2d-expression-rig/` | Older expression-rig notes (folded into the main skill's subskills) |
| `prototype/` | Browser cutout-rig playground used while developing the recipes |
| `prototypes/lifelike/` | Lifelike AI-portrait face-flow experiments (F2 default). Sample stills: **Generated with Grok Imagine (SpaceXAI)** (CC0 1.0; see PROVENANCE.md) |
| `evals/runs/` | Cold-run captures (Codex / Claude) used as proof |
| `docs/` | Static demo (field guide, playable starter, lifelike bust). Serve with `./scripts/serve`. Pages workflow is manual-only until public release |

## Proven (cold runs)

Same skill bytes (v0.1.0) + same G1 brief, empty output dirs, independent agents. Grader is `scripts/score.mjs` (**15** required checks).

| Task | Agent | score.mjs | Notes |
|---|---|---|---|
| G1 | Codex **0.163.0** (`gpt-6.1-sol`, high) | **15/15** | cold on v0.1.0 |
| G1 | Grok **1.0.67** (`grok-4.7`, high) | **15/15** | cold on v0.1.0 |
| G1 | Claude Code **2.1.311** (`claude-opus-5-5`) | **15/15** | cold on v0.1.0 |

Older **30/30** / **28/28** figures cited in historical `evals/runs/` NOTES used an internal aggregator on top of score.mjs; they are not the current public claim. Lifelike face task **G3** is a plan-text lint (see `evals/run-evals.mjs`), not a cold motion proof.

## Known gaps (v0.1)

- Single side-view parts: turns still read as a mirrored flat puppet until drawn 3/4 / front parts exist
- No phoneme / viseme lip-sync yet (talking is lip-flap + expression morph)
- House art style definition → **v0.2**
- Demo URL: serve `docs/` locally with `./scripts/serve`; GitHub Pages workflow is manual-only until public release

## Version

See [CHANGELOG.md](CHANGELOG.md) at the repo root (reset to **0.1.0** for this release) and
[skills/toon2d-runtime-animation/CHANGELOG.md](skills/toon2d-runtime-animation/CHANGELOG.md) for the
internal pre-release iteration history (v1.0–v1.6).
