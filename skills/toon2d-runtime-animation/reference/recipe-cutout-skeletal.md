# Recipe: cutout skeletal from a pose / parts sheet

Input: a side-view sheet with the character's parts (head, torso, upper arm, forearm, hand, thigh, shin, foot,
optional coat tail/hair), or a full pose you cut apart. Output: a playable, scoreable character.

## 1. Prepare the sheet
- **Cut along the silhouette, never a box.** Anything inside the cut polygon moves with the bone (a box-cut arm
  carried a slab of coat with it). Trace the sleeve/limb outline; leave the torso's cloth on the torso.
- **Paint what parts hide.** AI or single-pose art has no hidden layers: fill the torso behind the arm (palette-locked
  to the torso), extend each part ~2-3 px past its joint so it can rotate without exposing a corner.
- **Caps at every joint**: an overlap disc (or rounded end) centred on the pivot, so any angle covers the joint.
- **Mark joints** with single pixels: `#FF00FF` pivot (joint to parent), `#00FFFF` tip (joint to child), `#FFFF00`
  face anchor on the head (centre of where eyes+mouth go). List rects in a `sheet.json` `{parts:{name:{rect:[x,y,w,h]}}}`.
- **Cost of the fix vs drawing** (prior cutout prototype): re-cut + caps + torso fill ≈ 1 h per limb, then zero art cost
  per frame, and took the arm from puppet 4 to 2 (1 = reads drawn). Drawn whole-arm keys swapped by nearest pose
  (≈ 20-40 min each, 4-8 h per arm set) scored only 2.5: they read "vector" next to painted parts and pop at the
  key-set edges. Full-body in-betweens are 2-4 artist-days per walk+run facing; that is frame animation, not a rig.
  Default: re-cut along the silhouette + caps; buy drawn keys only from an artist who matches the source rendering.
- Head: leave the face area as blank skin if the face will be procedural (recommended at pixel scale); at least
  ~9×8 px of skin for a pixel face.

## 2. Extract
```
node <skill>/scripts/sheet-markers.mjs sheet.png sheet.json --out <project>
```
Writes `sheet.clean.png` (markers painted out: markers must never render), `parts.json` (rect, pivot, tip, len,
face, `palette`) and prints a suggested `rig.draw.face {along, perp}` for the head.

## 3. Rig (`rig.json`)
- Keep the contract bone names. Set each bone's `len` to its part's pivot→tip `len` (validate-rig warns if they
  differ: that is how joints gap or overlap). Set `sprite: '<part>'` on bones; `endSprite` on limbs for hand/foot.
- Attach points `at: [along, perp]` on the parent: shoulders near the top of the spine (`along ≈ spine.len - 1`),
  head at the spine end, legs at the hip ±1 px.
- `rig.sheet = {image: 'sheet.clean.png', parts: 'parts.json'}`; the sheet palette is kept by the quantizer
  automatically (parts.json `palette`), so do not hand-merge colours.
- Leg length drives everything: `configureBody(rig)` scales hip height, stride and lift. Override with
  `rig.body = {hipY, stride, lift, stanceW}` only if needed; keep standing hip-to-ankle ≈ 0.92 × leg length.
- Draw order: far arm, far leg, near leg, torso, head, near arm (F = near = drawn over the torso). Far limbs darker.
```
node <skill>/scripts/validate-rig.mjs <project>/rig.json --contract
```

## 4. Animate
Poses are procedural (`poses.js`), driven by state, speed and events; tune numbers, don't add keyframes. Order of
value: anticipation + squash on jump/land → springs on hair/coat/scarf/arms → head-first turns → idle noise and breath
→ asymmetry. Upper body on 2s for runs; feet every tick.

## 5. Verify
`lint.mjs`, `score.mjs` (feet.slip, gaps.*, turn.not_instant, idle.alive...), `capture.mjs`, then the rubric.
Look at `sheet-run.png` for knee direction and leg identity, `sheet-turn.png` for pops, `expressions.png` for faces
landing on skin.

## Coats, skirts, long tails (chain parts)
- 2-4 chained segments as bones (`coat0..n`, so they show in `state().joints`), each a sprite with a cap at its
  pivot, drawn behind the near leg, simulated in **world space** (verlet `stepChain`) anchored at the hip.
- Three inputs, all needed: anchor motion (lag on start/stop/turn/land, free with world-space verlet), gravity
  (hang), and **speed drag** (`restAngle` leans back with |vx|, or `wind: -vx * k`) so the hem trails at a run.
  Damping so it settles in ~0.5-1 s. On a turn, mirror the rest angle with the facing, not instantly the points.
- Widen toward the hem (a panel, not a ribbon); a 1-2 px ribbon reads as a scarf.

## Known limits of cutout (see pitfalls.md)
Single side-view parts are the top remaining puppet tell: when the character turns, a side-view torso just flips.
Draw 3/4 and front head/torso parts and swap them by yaw (`faceYaw`) if turns are frequent. A rigid coat reads as a
tube: split it into 2-3 chained parts on springs.


## Built into the starter (0.1.0)

- **Take-off crouch:** `physics.js` arms a 4–6 tick squat at walk/stand (fewer at full run) before the jump impulse; `crouchPose` supplies hip drop, knee bend, lean, and squash; `jumpPose` stretches on release. The jump buffer stays armed so the press still feels responsive.
- **Face-slide clamp:** `face-clamp.js` + the pixel/vector drawers keep eyes/mouth inside the head ellipse and drop the far eye on peak turns. Prefer real 3/4 head art when you can afford it.
