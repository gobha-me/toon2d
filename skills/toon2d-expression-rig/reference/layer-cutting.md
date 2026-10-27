# Cutting a face into layers from an AI-generated model sheet

Goal: turn one consistent character sheet into swappable or deformable face parts that the
param vector can drive. Free tools are enough: Krita or GIMP, plus an optional background remover
(rembg) and an inpainting model for the hidden areas.

## 1. Generate the right source
- Ask for a **model sheet**: front + 3/4 + side turnaround, neutral face, flat cel shading, plain
  background, consistent line weight, and **an expression sheet** of the same character (8–12 heads:
  the preset list above, plus closed eyes, `^ ^`, `> <`, and mouth A/I/U/E/O/closed).
- Use the 3/4 head your game camera uses. Keep the head the same size across the expression sheet.
  Re-generate or upscale until eye shape, iris color and hairline match exactly. **Consistency beats
  detail.**

## 2. Cut the base head (neutral 3/4)
Export each part as its own transparent PNG at the SAME canvas size and origin (makes pivots trivial):
1. `hair_back` – everything behind the head.
2. `head_skin` – face + ears with eyes, brows and mouth **painted out**. Inpaint skin where features
   were. This blank face is the most important layer.
3. `bangs` – the fringe, cut along hair strands, with the forehead under it painted as skin on `head_skin`.
4. `eye_white_L/R` – the sclera shape at full open, used as a **mask**.
5. `iris_L/R` – a full circle/ellipse iris painted complete, even the part normally hidden under the lid,
   so it can slide.
6. `eye_highlight` – separate, so it stays fixed to the light.
7. `lash_upper_L/R`, `lash_lower_L/R` – lines only.
8. `brow_L/R` – separate strokes. Put them ABOVE `bangs` in the z-order.
9. `mouth_*` – frames from the expression sheet: closed-smile, closed-frown, A, I/E, O, U, M, grin,
   and the `D` open smile. Same canvas and pivot at the mouth center.
10. Marks: `blush`, `sweat`, `anger`, `tears`, `gloom`. Usually easier to paint fresh than to cut.

## 3. Map params to layers
| param | raster approach | mesh approach |
| --- | --- | --- |
| eyeOpen / eyeSmile | quantise to 4 frames per eye (closed, 1/3, 2/3, open) + `^` frame | deform lid mesh |
| eyeShut | swap to `> <` frame | swap |
| pupilX/Y, pupilSize | move/scale `iris` inside the `eye_white` mask | same |
| brows | rotate + translate the brow sprite | bend 3-vertex mesh |
| mouth* | pick the nearest frame in (open, curve, width) space; cross-fade 2 nearest | deform |
| marks | alpha = param | alpha = param |

Nearest-frame lookup for the mouth: define each frame's (open, curve, width) coordinates, then pick
the closest frame to the live params (weighted distance). Optionally alpha-blend the top two for
smoothness.

## 4. Pivots and manifest
Record the pivot of every PNG (the pixel that sits on the bone origin) in the parts manifest:
`{ name, bone, z, image, pivot:[x,y], offset:[x,y], scale }`. With a shared canvas size you can
record one pivot for the whole head set.

## 5. Quality checklist
- Line weight on cut edges matches the drawn lines. Re-stroke cut edges that lost their outline.
- No halo: remove anti-aliased background fringe (defringe / alpha erode 1 px).
- Iris fully painted, so nothing is clipped when looking sideways.
- Test every preset at gameplay zoom before cutting more frames.
