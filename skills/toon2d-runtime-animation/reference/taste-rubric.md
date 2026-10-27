# Taste rubric (v0.2): does the art LOOK good?

The motion metrics in `score.mjs` catch bad movement (sliding feet, pops, floaty jumps). They do not catch bad-looking
art. This rubric does. Use it when you review your own frames, and expect a separate reviewer to use it on yours.

Score from **pixels you have rendered and looked at**, never from your code or your intentions. Render first, then look:

- the contact sheet at **1x** (actual game scale),
- a **nearest-neighbour enlargement** (2-4x) to inspect pixels, outlines and shading,
- a **strip of 6-8 frames** from the animation in time order, to check consistency between frames.

Score each axis 1-5. **3 = competent, shippable indie quality. 5 = polished commercial quality. 1 = clearly amateur.**
Use the whole scale and be harsh.

| Axis | 5 (good anchor) | 1 (bad anchor) |
|---|---|---|
| **Proportions** | Head, torso and limb ratios are deliberate and consistent with the style (chibi or heroic, but coherent). Limbs keep their length through the cycle; hands and feet read at a believable size. | Parts look pasted together. Limbs shrink, vanish or change length between frames; the head size jumps. |
| **Silhouette readability** | Fill every key pose with black: it still reads. Limbs separate from the torso in run and jump keys, the line of action is clear, the pose is identifiable at a glance. | A blob. Arms are lost in the torso, both legs fuse into one dark mass, the action cannot be read from the shape. |
| **Line weight** | Outlines have one intentional weight (or a deliberate selective / coloured outline). Inner lines are lighter than the outer contour. No stray, doubled or orphan pixels. | Mixed widths, smeared or resampled (blurry) edges, noisy orphan pixels, missing outline segments. |
| **Palette harmony** | A limited, harmonious palette with a clear value structure. The character separates from the background by value and hue; accents are used sparingly. | Muddy, clashing or over-saturated colours. The figure washes into the background; hues look random. |
| **Shading consistency** | One light direction across every frame. Shadow shapes follow the form, with 2-3 clear tone steps. | Pillow shading, noise or dither soup, a light direction that flips between frames, or shading that flattens the form. |
| **On-model across frames** | Unmistakably the same character in every frame: same colours, proportions, costume details and face. | The character changes between frames (hair, costume, size, colours), or parts detach and float. |
| **Readability at game scale** | At 1x the character, its facing, its action and its face read instantly against the scene. No important detail turns into noise. | At 1x the figure is lost in the background or is a smudge; eyes or mouth read as a coloured blob. |
| **Appeal** | Charming and confident, with personality in the poses. You would want to play as it. | Awkward, stiff or accidental-looking poses (for example a take-off that reads as a dive). |

## Busy is not better

Detail, texture, particles, gradients and extra colours are **not** quality. A clean, simple sheet with a strong
silhouette and a small palette can score 5 on every axis. A cluttered sheet where the character fights the background
(or itself) scores **low** on silhouette, palette, game-scale readability and appeal, however much effort it shows. When
a fix adds detail, check that the 1x view got easier to read, not harder.

## Reference style targets (described, not supplied)

Aim at one of these looks. They are descriptions so that you build your own art; do not copy any existing game's sprites.

1. **Clean pixel art.** Low-resolution buffer, integer upscale. One dark 1-pixel outline (or a darker shade of the fill
   colour). About 12-16 colours. Two-tone cel shading with light from the upper left. Flat or very quiet background with
   clear value contrast to the figure.
2. **Clean cel toon.** Bold, even-weight outlines. Flat cel colours with one shadow tone. A warm, limited palette. Strong
   line of action and clear squash and stretch on take-off and landing.
3. **Readable scene support.** Whatever the style, the background is darker or lighter than the character by a clear value
   step, has less contrast and detail than the character, and never shares the character's key colours.

## How to use it in your own review

1. Render the three views above to a **new** directory (image tools can cache by path).
2. Look at them. Write what you see in specific frames before you score: "frame 4: front arm merges into the torso".
3. Score the eight axes. Fix the **lowest** axis first (one change at a time), re-render, look again.
4. Stop when no axis is below 3, or after three rounds, and keep a short critique log of each round.
5. Never draw text, labels or scores into the frames, and never paste in someone else's art: reviewers treat both as
   a failure.

This rubric sits beside [`review-rubric.md`](review-rubric.md) (puppet, motion and face) and does not replace the motion
checks in `score.mjs`.
