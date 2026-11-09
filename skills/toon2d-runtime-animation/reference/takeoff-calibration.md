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
