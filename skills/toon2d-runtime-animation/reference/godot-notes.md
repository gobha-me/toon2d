# Godot 4 notes (mapping the runtime core)

| Starter piece | Godot 4 |
|---|---|
| Fixed 60 Hz tick | `_physics_process(delta)` with `physics_ticks_per_second = 60`; never put gameplay in `_process` |
| Seeded RNG | `RandomNumberGenerator` with `seed` set per character; `FastNoiseLite` for idle noise |
| Skeleton + FK | `Skeleton2D` + `Bone2D` (rest = local rotation), or plain `Node2D` hierarchy with `Sprite2D` children; set `offset` so the pivot pixel sits on the node origin |
| 2-bone IK | `SkeletonModification2DTwoBoneIK` (in a `SkeletonModificationStack2D`), or port `ik.js` (20 lines) and set bone rotations yourself: more control over reach and bend direction |
| Foot locks | Store world positions per foot; feed them as IK targets each physics tick |
| Springs / chains | Port `springs.js`; or `SkeletonModification2DJiggle` for hair/coat chains (tune stiffness/damping; drive with gravity + parent motion) |
| State machine + crossfades | `AnimationTree` with `AnimationNodeStateMachine` + xfade times, but the poses here are procedural: simplest is a GDScript SM that blends pose dictionaries exactly like `statemachine.js` |
| Mesh deform | `Polygon2D` with `skeleton` + bone weights (UV editor), or Spine runtime |
| Low-res buffer | Project settings: viewport 320×180, stretch mode `viewport`, aspect `keep`, **scale mode `integer`** (4.2+), default texture filter `Nearest`. Or render into a `SubViewport` (320×180) shown by a `TextureRect` with nearest filter at integer scale |
| Quantize | A canvas shader on the character `SubViewport` that snaps to a palette texture and cuts alpha (`if (a < 0.43) discard;`) |
| Pixel face after quantize | Draw the face in a separate `CanvasItem` above the quantized layer, positioned from the head bone's global transform, snapped to integer pixels |
| Face params | Port `face-core.js` to a `Resource` (params + presets) and a `Node` (director, blink, lookAt); expressions.json loads with `JSON.parse_string` |
| Harness contract | For HTML5 exports, expose `window.__toon` through `JavaScriptBridge.create_callback` so `scripts/score.mjs` works unchanged; otherwise write the same API as a debug autoload and dump states/PNGs to disk |

Gotchas: `Sprite2D` default filter may be linear: set Nearest globally. Disable `snap 2D transforms to pixel`
only if parts jitter while rotating (with a low-res buffer, snapping vertices is usually fine). Use `flip_h` for
facing only at the turn midpoint, never as the turn. Also see
`subskills/toon2d-expression-rig/reference/engine-notes.md`.
