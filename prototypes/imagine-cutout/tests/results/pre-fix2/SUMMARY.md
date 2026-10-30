# Pre-fix baseline (Codex B commit b5b0251, before the seam fix)

Bulky per-run JSON and Godot logs from this baseline run were dropped from the PR to save space;
this summary, `mutants.json` and the failing-joint evidence images in `real-images/` are kept.
The full files exist in the source working tree's history.

Run: 2026-10-30T15:58:57.357715+00:00 UTC; overall passed: False

| Test | Result |
|---|---|
| 1 hierarchy | PASS |
| 2 timing | PASS |
| 3 flash | PASS |
| 4 gun rigidity | PASS |
| 5 joint gaps | FAIL (10 limits) |

Failing joint limits:

| Mode/joint/limit | Angle | Gap px | Stencil px | Note |
|---|---|---|---|---|
| hd/hem_center/min | -6.0 | 0 | 0 | empty non-root stencil |
| hd/hem_center/max | 6.0 | 0 | 0 | empty non-root stencil |
| hd/hem_right/min | -8.0 | 0 | 0 | empty non-root stencil |
| hd/hem_right/max | 8.0 | 0 | 0 | empty non-root stencil |
| hd/boot_left/min | -6.0 | 1 | 3228 | uncovered pixel |
| pixel/hem_center/min | -6.0 | 0 | 0 | empty non-root stencil |
| pixel/hem_center/max | 6.0 | 0 | 0 | empty non-root stencil |
| pixel/hem_right/min | -8.0 | 0 | 0 | empty non-root stencil |
| pixel/hem_right/max | 8.0 | 0 | 0 | empty non-root stencil |
| pixel/leg_left/max | 7.0 | 0 | 0 | empty non-root stencil |

Joint limits passing: 58/68

Mutants (baseline already red on test 5):

| Mutant | Observed red | Status |
|---|---|---|
| a (flash) | 3, 5 | KILLED |
| b (bone) | 1, 5 | KILLED |
| c (overlap) | 5 | KILLED |
| d (timing) | 2, 5 | KILLED |
