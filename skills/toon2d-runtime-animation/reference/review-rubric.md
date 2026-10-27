# Critical review rubric (1-5 per axis, 5 = best)

Score from **captured evidence**, never from memory or a live session. The reviewer must not be the agent that
built it (one agent never grades its own work). Be harsh: 3 = "acceptable in a shipped indie game", 5 = "matches the
reference bar (SoR4/Hades/Children of Morta)".

| Axis | 1 | 3 | 5 | Look at |
|---|---|---|---|---|
| **Puppet** (5 = not a puppet) | Visible hinges, rigid plates, gaps, instant flip | No gaps/hinges; some rigid parts, single-view turn | Reads drawn: overlap, caps, turn hides construction, cloth follows | `sheet-run.png`, `sheet-turn.png`, `turn.gif` |
| **Appeal** | Off-model, muddy colours, mixed pixel density | Clear design, consistent palette | Strong shapes, pleasing proportions, style recognisable from one screenshot | `sheet-idle.png`, any GIF |
| **Readability** | Pose unclear at game scale; limbs merge | States readable; silhouette OK | Every state reads as a silhouette at 1×; contact/anticipation poses clear | 1× buffer frames, silhouette fill |
| **Motion** | Skating, pops, floaty or robotic timing | Planted feet, smooth transitions, some stiffness | Weight, anticipation, squash/stretch, overlap; speed changes feel physical | `run.gif`, `runjump.gif`, `jump.gif`, score feet.* |
| **Face** | Unreadable or static | Blink + 3 distinguishable expressions | Expressions read instantly at game scale, takes not crossfades, reacts to gameplay | `expressions.png/.gif`, `idle.gif` |

**Take-off (part of Motion):** on `sheet-jump.png` / `sheet-runjump.png`, the crouch leans the torso 5–30° forward
with a visible hip drop (≥ 15 % of standing hip height). The first airborne frames stay within 30° forward and
straighten to ≤ 15° within about 8 ticks. A launch frame at 40°+ reads as a dive: cap Motion at 2 and name the frame.
`node <skill>/scripts/takeoff.mjs <project>` measures this (advisory; not part of score.mjs).

Report: a table with score + one-sentence evidence per axis, the single worst tell, and the next fix.
Example: `Motion 3 - feet planted (slip 0.12 px/tick) but landing has no squash (jump.gif frames 40-44)`.

## Capturing evidence
```
node <skill>/scripts/score.mjs <project> --out <project>/shots          # score.json/score.md (objective)
node <skill>/scripts/capture.mjs <project> --out <project>/shots [--query mode=smooth] [--zoom 3]
```
capture writes into `<out>/capture/` (`--label` renames it): per segment `<seg>.gif` and `sheet-<seg>.png` (12 evenly spaced frames, crop follows the
character), `expressions.png/.gif` (each preset pinned, head crop), and `meta.json`. For before/after comparisons,
capture twice with different `--query` (e.g. `ap=0`, `timing=threes`) into different `--out` dirs and put the GIFs
side by side. Image viewers and LLM image tools may cache by path: write each capture to a new directory.

LLM reviewers: view `sheet-*.png` (stills are more reliable than GIFs for vision models), then `expressions.png`;
state what you see in specific frames before scoring.
