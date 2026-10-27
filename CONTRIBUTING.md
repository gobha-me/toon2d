# Contributing

This repository is private until the v0.1 release. Prefer small squash-merged PRs; do not force-push `master`.

## AI-generated sample art

When you add any AI-generated still (or regenerate one):

1. **Do not depict or prompt from a real person**, celebrity, or photo likeness. Fictional characters only. If notes suggest otherwise, do not commit the file — report it.
2. **New** AI stills need a sidecar next to the file: `<name>.gen.json` (or `.gen.md`) with at least
   `prompt` (exact text; if lost, write `prompt not recorded` — never invent), `tool`, `model`, `date` (UTC ISO-8601).
   Optional: seed, reference image paths, C2PA urn.
   Existing lifelike stills already inventoried in `PROVENANCE.md` §2 may omit per-file sidecars until regenerated.
3. List every still in `PROVENANCE.md` with model, date, tool, prompt status, and license.
4. Credit the generator where the samples appear (README, demo pages). Lifelike stills: **Generated with Grok Imagine (SpaceXAI)** under CC0 1.0 ([xAI FAQ](https://x.ai/legal/faq), [ToS](https://x.ai/legal/terms-of-service)).

## Skill / code

Follow `skills/toon2d-runtime-animation/SKILL.md`. Never edit grader assertions to make a change pass. Keep any local box originals / scratch trees untouched; this git clone is the source of truth for edits.

## Release package

Build the skill tarball with `bash scripts/pack-skill.sh`. It ships `skills/toon2d-runtime-animation/` without `evals/` or internal work-state notes.
