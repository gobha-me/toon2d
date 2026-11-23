# Take-off calibration handoff (#13)

The visual diagnostic from #5 stays advisory. It measures crouch depth and
exposes silhouette/spacing warnings, but it does not select take-off lean
limits. `takeoff.mjs`, `score.mjs` and the required-check count are unchanged.

A generated clean/adverse fixture is an algorithm test, not an independent
human-rated calibration sheet. The teaching SVGs illustrate poses and rubric
axes; they do not supply the first eight airborne runtime ticks needed to
calibrate peak pitch or unwind. Pixel and smooth renders of one rig are also
one animation family, not independent calibration observations.

Before proposing required limits:

1. Capture clean and cluttered runtime references, including standing and
   running jumps, at native and nearest-neighbour scales. Keep variants of the
   same rig/clip together in the preassigned calibration or held-out split.
2. Have independent humans judge anticipation and whether launch reads as a
   dive, blinded to implementation, author critique and measured angle. Keep
   negative-space and background-readability observations alongside the keys.
3. Record deepest grounded crouch pitch/depth, all first eight airborne torso
   pitches, maximum forward/backward pitch and final checked pitch using the
   unchanged `takeoff.mjs`. Retain frame/tick evidence, facing, seed and hashes.
4. Compare proposed limits with human decisions, report false warnings and
   misses separately for calibration and held-out sheets, and document margins
   rather than tuning to a single starter. The separate grader owner can then
   propose a required-check change with tests under #13.

A single starter passing with a narrow angular margin is a regression smoke
check. It does not establish how much headroom is appropriate across styles.
The proxy warning count must not be converted into independent taste ratings.

## Measured starter smoke result (2026-11-09)

The unchanged `takeoff()` routine was run on the public starter in pixel and
smooth modes, seed 1, after CPU-only headless capture with plain Chrome for
Testing 158.0.8127.18. All eight advisory checks pass in each mode.

| Mode / jump | Crouch ticks | Crouch pitch | Hip drop | Peak first-eight-tick pitch | Eighth-tick pitch |
| --- | --- | --- | --- | --- | --- |
| pixel / standing | 6 | 28.0° | 59.6% | 28.0° | 3.5° |
| pixel / running | 4 | 28.0° | 40.4% | 28.0° | 3.5° |
| smooth / standing | 6 | 28.0° | 59.6% | 28.0° | 3.6° |
| smooth / running | 4 | 28.0° | 40.4% | 28.0° | 3.6° |

At the routine's reported precision, the peak has **2.0° headroom** beneath the
unchanged 30° forward limit; final checked pitch has 11.5°/11.4° headroom beneath
15°. This confirms the narrow margin described in #13, without selecting a new
limit. The routine's standing hip baseline is 20.007 world pixels after 30
settling ticks. The visual diagnostic uses median idle height in another
scenario, so its crouch-depth fraction is slightly different.

The archived
[sample and raw results](https://github.com/gobha-me/toon2d/tree/feat/visual-self-review/evals/taste/visual-proxy-smoke)
include the eight launch pitches for both jumps and both modes. These four
measurements remain one animation family, with no independent human ratings.
The visual diagnostic also warns on closed silhouettes and small stop
overshoot in both modes, and on per-tick arm spacing in pixel mode. Its
warnings illustrate style dependence; no required-check status is changed.
