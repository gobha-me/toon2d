# Review step (human or LLM, never the agent that built it)

After `node evals/run-evals.mjs <task> <out> --out <evaldir>`:

1. Open `<evaldir>/results.md`. Any FAIL is a fail regardless of looks.
2. View, in this order: `capture/sheet-idle.png`, `sheet-run.png`, `sheet-turn.png`, `sheet-jump.png`,
   `sheet-runjump.png`, `expressions.png`; then the GIFs.
3. Score with `skill/reference/review-rubric.md` (puppet, appeal, readability, motion, face; 1-5 each). For each
   score cite the frame(s) you looked at. Name the single worst tell and the next fix.
4. Compare with the agent's own `NOTES.md` scores: a self-score more than 1 point above yours on any axis is a
   calibration failure worth noting.

Template:

| Axis | Score | Evidence (file, frame) |
|---|---|---|
| Puppet | | |
| Appeal | | |
| Readability | | |
| Motion | | |
| Face | | |

Worst tell: ...  Next fix: ...
