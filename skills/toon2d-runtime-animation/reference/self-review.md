# Bounded visual review

Use this after changing art or posing. It implements the author-side loop in #5;
the human-rated calibration set, reference style images, hidden judge and blind
comparison are still separate work. It does not promote the advisory take-off
check or change the grader.

Run the motion checks first. For deterministic pass/warn observations and
per-signal evidence before writing
the critique, use the [measured visual diagnostic](visual-signals.md):
`node scripts/visual-review.mjs <project> --out <new-evidence-dir>`.
Its warning count is advisory and does not fill or score the critique form.

Then capture a fresh critique round through the harness:

```bash
node scripts/self-review.mjs capture <project> --out <review-dir>
```

The default seeded scenario captures idle, run, crouch, take-off, apex and land.
Jump poses follow observed events and geometry, rather than hard-coded times.
Each `round-N` directory contains:

- `keyposes.png`: six poses at native game-buffer scale, in the order above.
- `keyposes-3x.png`: the same pixels enlarged 3x with nearest-neighbour sampling.
- `motion.png`: six ordered run frames, for consistency across time.
- `frames.json`: seed, query, view and selected jump/motion ticks.
- `review.json`: an unscored critique form.

Open all three images and compare them with [the taste rubric](taste-rubric.md).
Write the reviewer's name, set `role` to `author`, `independent` or `human`, and
record the three filenames in `images_seen`. Fill all eight axis scores with
integers from 1 to 5, together with a concrete visual observation for each axis.
For example: "Take-off: the front arm merges into the torso at native scale."
Use `--query "mode=smooth"` when capturing another supported rendering mode.

```bash
node scripts/self-review.mjs assess --out <review-dir>
```

Assessment saves `critique.json` beside the images. Scores below 3 identify the
first lowest axis to fix. Make one art or pose change, run the motion checks,
and invoke `capture` again with the same review directory. It creates a new
round and preserves previous captures and critiques. Assessment rejects changed
pixels, missing axes, missing observations and unacknowledged image views.

The loop stops when every axis reaches 3 (`author-pass`) or after three
unsuccessful rounds (`budget-exhausted`, exit 1). Invalid commands, incomplete
critiques and capture errors exit 2. Capture and assessment of a valid ongoing
round exit 0; that status alone does not mean the art passed. A failed capture is
kept as evidence and stops that review; inspect it before starting a fresh review
directory. There is no automatic retry or paid model call.

Author reviews are marked provisional. The image acknowledgements record the
reviewer's claim; this tool cannot establish that a person looked at an image or
that a score is honest. Use an independent reviewer or a human before treating
the result as evaluation evidence. The calibrated grader must judge rendered
pixels separately and must not read these scores or critiques.
