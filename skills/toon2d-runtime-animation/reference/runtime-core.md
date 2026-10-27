# Runtime core (what the starter does, and why)

Files are in `templates/starter/engine/`. All logic modules are pure (no DOM); only `render.js`, `harness.js`,
`face-pixel.js`, `face-vector.js` are tagged `// @dom`. lint enforces that.

## Loop
`main.js`: accumulate real time, step `stepCharacter` at fixed `DT = 1/60` (cap 0.25 s backlog), render once per
frame. Harness mode steps only when told. RNG = `mathx.rng(seed)` (mulberry32); noise = `noise1`.

## Skeleton (`skeleton.js`, `rig.json`)
- Bones: `{name, parent, len, rest (deg), at:[along, perp] on the parent}`. Angles are local, relative to the parent's
  world angle. y is down, so `rest: 90` = pointing down, `-90` = up, `0` = toward facing.
- `fk(rig, pose)` → per-bone `{x, y, a, ex, ey}` in root-local space (root = ground point; x = facing direction).
  Mirroring for facing left happens once at render (`scale(facing, 1)`), never in the pose.
- Units: world px = buffer px in pixel mode. Smooth mode renders the same world at scale s = 3.

## Legs: analytic 2-bone IK (`ik.js`) + foot locks (`footlock.js`)
- `solveTwoBone(rx, ry, tx, ty, l1, l2, bend)` → angles + `reach` flag. If `reach` is false the foot can't touch its
  target and will skate: lower the hip (`BODY.hipY`) or lengthen legs. `configureBody(rig)` derives BODY from leg length.
- Each foot has a world-space lock. While the pose says planted, the foot stays at its locked world point; it only
  re-steps (short arc, `stepTime` 0.1 s, `lift` 3) when drift exceeds `maxDrift` (5 px). **Never lock in the air**:
  a foot is snapped to ground before locking (this fixed "planted while floating" during crossfades).
- Run: phase advances by distance (`|vx| dt / cycleLength()`, cycle = 2 × stride) so the stance foot's backward
  motion equals root speed: zero slip by construction. Animation speed follows velocity, not time.

## Secondary motion (`springs.js`, `antipuppet.js`)
- `stepSpring(s, target, dt, k=120, c=14)` (semi-implicit), `createChain/stepChain` (verlet chain with length
  constraints, used for scarf/coat tail/hair). Drive springs from *world* acceleration of their anchor so they react to
  starts, stops, landings and turns.
- Overlap: arms, head and scarf lag the torso by spring, not by keyframe offsets.

## State machine (`statemachine.js`)
- States: idle, run, turn, jump, fall, land, hurt. `transition(sm, next, fromPose)` starts a crossfade from the last
  displayed pose with duration `FADES['prev>next']` (default 0.1 s; run>idle 0.18, idle>run 0.08, fall>land 0.03,
  land>idle 0.15, jump>fall 0.12). Contacts (landing) fade fast; settles fade slow. `blendPose(a, b, w)` lerps hip, angles (`lerpAngle`) and
  feet with `smoothstep(w)`.
- Turn is a real state (≥ 4 ticks): head turns first, then chest, then hips; the upper body narrows (`kick`) at the
  midpoint so the flip is hidden. An instant `scale.x = -1` flip is the #1 "pop".
- Physics (`physics.js`): maxSpeed 80 px/s, jump 300 px/s, gravity 900, coyote and jump buffer 6 ticks each,
  one-way platforms. Events (`jump`, `land`, `walkoff`, `bigJump`, `landHard` at vy > 400, `hurt`) feed the face
  director and anticipation/squash.

## Anti-puppet flags (`antipuppet.js`, master `ap`)
`idle` (layered noise sway/weight shift), `breath`, `overlap` (springs), `asym` (left/right timing and amplitude
differ), `turn` (head-first turn + kick), `caps` (round-capped single-path limbs: no hinge corners), `hold`
(upper body stepped on 2s/3s, feet every tick), `feetswap` (near/far legs swap draw order on turn).
Turning `ap` off must make the character visibly worse (score `antipuppet.toggle`, `idle.alive` fails with ap=0).

## Face (`face-core.js` = sub-skill face core)
22 params (`FACE_PARAMS`: eyeOpenL/R, eyeSmileL/R, eyeShut, pupilX/Y/Size, browAngleL/R, browHeight, mouthOpen,
mouthCurve, mouthWidth, mouthSmirk, blush, sweat, angerMark, tears, gloom, sparkle, headTilt), presets in
`expressions.json` blended by `mixExpressions(weights)`, per-param rate smoothing (`approachParams`), a director
(`stepDirector(dir, snap, events, dt, reactions)`: gameplay snapshot → mood + event reactions with
fadeIn/hold/fadeOut envelopes; `pinExpression` overrides), blink (`stepBlink`: 1.6-4.8 s, 0.16 s, 20% double),
`lookAt`, `lipFlap(text, t)` (viseme per character), `composeFace` (layers blink/look/talk over the mix). The
starter scales speed and vy ×3 into the director snapshot (world px are small). Pixel mode draws `face-pixel.js` (hand-placed 1-2 px clusters) **after**
quantizing; smooth mode draws `face-vector.js`.

Face anchor: `rig.draw.face {bone, along, perp}`: the centre of the eyes+mouth box in that bone's frame
(`perp` + = toward facing). The pixel face spans about fx -3..+4, fy -2..+4 px around it: keep it inside the skin.

## Render (`render.js`)
- `createRenderer(canvas, 'pixel'|'smooth')`: pixel = 320×180 buffer, s = 1; smooth = 960×540, s = 3.
- `fitDisplay`: integer k = floor(min(innerW/W, innerH/H) × dpr), canvas pixels = W·k × H·k, CSS size = px/dpr,
  `image-rendering: pixelated`, `imageSmoothingEnabled = false` on every context.
- Character drawn into its own layer (`r.chr`), quantized (pixel mode, palette = rig.palette + sheet palette),
  composited over the background, then nearest-upscaled to the display.
- Sprite parts: `rig.sheet {image, parts}` + `bone.sprite` / `draw.limbs.X.endSprite`; the part's pivot pixel goes on
  the joint and its pivot→tip direction follows the bone. Feet stay flat while grounded. Far limbs get
  `brightness(0.72)`.
