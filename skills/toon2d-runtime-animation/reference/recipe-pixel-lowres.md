# Recipe: pixel art with runtime rotation in a low-res buffer

The single biggest quality win measured: render the rigged character into a **small buffer at native pixel
resolution** and upscale with nearest-neighbour, instead of rotating pixel sprites at screen resolution.

## Pipeline (starter `mode=pixel`)
1. Buffer 320×180 (or your native res). World px = buffer px. `imageSmoothingEnabled = false` everywhere.
2. Draw the character into its own layer, rotating parts freely (canvas rotation with smoothing off).
3. **Quantize** that layer: every pixel with alpha ≥ 110 snaps to the nearest palette colour (rig palette + the
   sheet's own palette + darker far-limb shades) and becomes fully opaque; the rest becomes transparent. This kills
   AA blends and mixed density, which is what makes rotated sprites look "not pixel art".
4. Draw the **pixel face after quantizing**: hand-placed 1-2 px clusters driven by face params (`face-pixel.js`).
   A vector face downsampled to ~12 px turns to mush; pixel faces need deliberate clusters and exaggerated shapes.
5. Composite over the background, then upscale by an **integer** factor k into a canvas whose backing pixels are
   exactly W·k × H·k, CSS size = px / devicePixelRatio, `image-rendering: pixelated`. Non-integer scale or CSS
   scaling = blur or uneven pixels. `score.mjs pixel.no_filter_blur` compares the real screen against a nearest
   upscale of the buffer.

## Rotation quality
- Runtime rotation in the buffer ≈ baked RotSprite for small parts; no need to pre-bake angles.
- Snap angles only if you want a crunchier look (and watch the wrap bug: snap the wrapped angle, `wrapAngle` first).
- Thin parts (1-2 px) shimmer when rotating: make limbs ≥ 3 px wide, or draw them as single capped strokes.
- Outline: draw parts with their outline baked in; overlaps at joints then read as one silhouette after quantize.

## Timing in pixel art
Animate the upper body on 2s (`timing: twos`) for runs: it reads like hand-drawn frames. 3s is choppy. Keep the
root, feet and IK on every tick or feet skate (the held upper body must not hold the feet).

## Faces at game scale
At ~40-60 px tall, a face is ~8×8 px. Readable: eye shapes (open dot, closed line, smile arc, wide 2×2 with
white), brow 1-2 px tilt, mouth 1-3 px (open block, smile curve). Exaggerate; add colour marks (anger red, sweat blue,
blush) because shape alone may not read.
Fit the face to the art: find the head part's skin box (the `faceAnchor` that `sheet-markers.mjs` prints is its
centre), keep every preset's clusters inside it with ≥ 1 px to the chin edge, and look at `expressions.png` before
scoring. A cold run's first build put mouths on the neck while all checks passed. For dialogue, show a separate bust (see lifelike face recipe).


## Face-slide clamp (starter 0.1.0)

Pixel faces use the same `face-clamp.js` ellipse clamp as smooth mode. Keep feature offsets in face-local units and let the clamp + peak-turn near-eye rule handle turns; do not push yaw past the skin patch by hand.
