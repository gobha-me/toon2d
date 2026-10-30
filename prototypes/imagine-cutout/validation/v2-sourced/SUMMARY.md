# Final v2 acceptance — 2026-10-30 UTC

Tested assembly: `2f47284` (authoring/assets in `60709a0`; gap audit in `6f05705`).
All frozen test-lane files and `body_parts.yml` are byte-unchanged from `6e618d8`.
No generation, paid service, network/forge action, push, or real-person likeness.

| Check | Final result |
|---|---|
| Original 1 hierarchy | GREEN, HD and pixel |
| Original 2 timing | GREEN, HD and pixel |
| Original 3 flash | GREEN, HD and pixel |
| Original 4 rigid gun | GREEN, HD and pixel |
| Original 5 joint gaps | GREEN, 84 limits; zero gaps |
| Oracle/sampler controls | GREEN, 5 checks |
| Manifest and completeness | GREEN, 14 slots / 21 joints / 24 parts |
| Per-joint HD gaps | GREEN, 882 seam observations / 42 poses; zero gaps |
| Combined HD gaps | GREEN, 21,840 seam observations / 1,040 poses; zero gaps |
| Facing | GREEN, 82 animation samples |

Combined poses contain 840 pairwise extremes plus 200 random poses, seed
20261030. No empty non-root stencil passes. Pose SHA-256:
`523f3132753035168876660a4d364386eb87e4e5f84238babdb13448d922b5ce`. All four final commands exit 0. The extended mutant
runner also repeats a fresh full all-green baseline.

| Mutant | Kind | Result |
|---|---|---|
| a | flash | KILLED |
| b | bone | KILLED |
| c | overlap | KILLED |
| d | timing | KILLED |
| e | missing_slot | KILLED |
| f | flipped_facing | KILLED |
| g | removed_knee | KILLED |
| h | zero_overlap | KILLED |

Source exports were supplied read-only to scratch for c: seven joint limits
worsened and the actual gap test killed it. Source-free development evidence
explicitly reports c as skipped, not killed. Neither a knee nor a required slot
is absent in the final baseline; e–h all add relevant failures.

The gap report marks all 14 actual slots **scripted**, none **generate**.
An absent-source control separately marks 14/14 as generate and creates no art.
Preparation is byte-repeatable for runtime PNGs and metadata; all 20 existing
pixel PNGs remain unchanged. Source originals remain read-only and their three
out-of-zip date proxies are documented. See the adjacent command transcripts
and JSON, `../v2/preparation-check.json` and `../v2/VISUAL-REVIEW.md`.

Effort so far: 29.2 minutes wall time from change-lane start, including
validation and waiting; 0 minutes human intervention during execution. This
meets the existing-character 2-hour / 15-minute targets. A second new character
from the broader plan remains unvalidated: no different source/Segments kit was
supplied and generation was prohibited. The independent visual review also
retains shoulder source-cut edges and extreme-knee readability as polish limits.
No test/manifest disputes. Scratch exports and Godot projects are removed.
