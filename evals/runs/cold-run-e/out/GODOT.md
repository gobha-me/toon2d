# Porting this character to Godot 4 (one page)

**Scene tree**
```
Character (CharacterBody2D)            # physics.js: maxSpeed 80, jump 300, gravity 900, coyote/buffer 6 ticks
├─ Rig (Node2D, scale.x = facing)      # flip only at the turn midpoint, never as the turn
│  ├─ CoatLayer (Node2D, z_index -1)   # drawn after the far leg, before the near leg (draw order below)
│  ├─ Skeleton2D
│  │  └─ hip (Bone2D) ─ spine ─ head, armUF/LF, armUB/LB ; legUF/LF, legUB/LB ; coat0 ─ coat1 ─ coat2
│  └─ Parts: Polygon2D/Line2D (round caps) or Sprite2D per bone, pivot pixel on the bone origin
├─ Face (Node2D, follows head bone global transform)
└─ Brain (Node)                        # SM, foot locks, springs, face director: GDScript ports of engine/*.js
```
Draw order = `rig.json draw.order`: scarf, armB, legB, **coat**, legF, torso, head, armF. In Godot set `z_index`
per part (or order children) so the coat sits behind the near leg and the torso.

**Physics tick.** Everything in `_physics_process` with `physics_ticks_per_second = 60` (the JS fixed `DT = 1/60`).
Order per tick is the same as `stepCharacter`: body → state machine → pose (held on 2s/3s if wanted) → breath/overlap
springs → foot locks → IK → FK → coat chain → face. `RandomNumberGenerator.seed` per character, `FastNoiseLite` for idle.
Nothing in `_process` except interpolation-free drawing.

**IK.** Port `ik.js` (analytic 2-bone, ~20 lines) and write the angles into `Bone2D.rotation`; it gives direct
control over bend side and the `reach` flag. (`SkeletonModification2DTwoBoneIK` works but hides reach failures.)
Foot locks: store world positions per foot (`footlock.js`), feed them as IK targets each tick; run phase advances by
distance (`abs(vx) * delta / (2 * stride)`), never by time.

**Springs and the coat.** Port `springs.js`. The coat is a 4-point verlet chain in *global* space pinned at
`coat0`'s origin (hip back): per tick integrate with damping 0.92 and gravity 320, pull toward the rest direction
(112° from facing, mirrored by `facing`) with stiffness 0.05, enforce segment length (4 iterations), clamp the
hem above the floor. Then set each `coat` Bone2D's `global_rotation` from consecutive points. Being simulated in
world space is what makes it lag on start/stop, swing through on turns and whip on landings. Alternative:
`SkeletonModification2DJiggle` on coat0..2 (stiffness ≈ 3, damping ≈ 0.75, gravity on) but it is frame-rate
sensitive and has no floor clamp; the hand port is deterministic. Draw it as a `Polygon2D` ribbon rebuilt
from the points each tick (widths 8/9.5/9/7.5 px) with a `Line2D` outline, or skin a `Polygon2D` to the 3 bones.
Head/arm overlap springs: `stepSpring` on facing-relative acceleration minus gravity in the air.

**Pixel / integer scaling.** Project: viewport 320×180, stretch mode `viewport`, aspect `keep`, scale mode
`integer` (4.2+), default texture filter `Nearest`. Render the character into its own `SubViewport`, quantize with
a canvas shader (palette texture lookup, `if (a < 0.43) discard;`), then draw the pixel face as a separate
CanvasItem *above* that quantized layer, positions snapped to integer pixels. Smooth mode = same scene at 960×540
with the vector face; no quantize pass.

**Face.** `face-core.js` → a `FaceRig` Resource (22 params with min/max/def/rate, presets from `expressions.json`
via `JSON.parse_string`) + `FaceDirector` Node (mood from snapshot, event transients with fadeIn/hold/fadeOut,
blink, lookAt, lip-flap). Reactions keep the JSON fields `anticipate` and `overshoot`: on `pickup` the director
queues a short `surprised` glance (0.08 s), then `scheming` delayed by it, and `takeGain` multiplies the mixed
target's distance from defaults by up to 1.3 before it settles (the take). Gameplay calls
`face_director.trigger("pickup")` from the item's `body_entered`. Render: vector face = `_draw()` on the Face
node using the params; pixel face = hand-placed clusters drawn after quantize. Expression changes stay takes,
never `AnimationPlayer` crossfades.

**Harness.** For HTML5 exports expose `window.__toon` via `JavaScriptBridge.create_callback` (reset, setInput,
trigger, tick, state with `joints` incl. coat0..2, pixels) so `scripts/score.mjs` runs unchanged.
