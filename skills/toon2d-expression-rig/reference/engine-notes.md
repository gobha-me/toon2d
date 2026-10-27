# Engine notes

The logic (`face-core.js`) is plain math over dictionaries. Port it as-is, then write a thin
renderer adapter that reads the param dict every frame.

## Web (Canvas 2D / PixiJS)
- Canvas: draw in head-bone space (`ctx.setTransform(...)`, then `ctx.transform(boneMatrix)`), eyes with
  `ctx.save(); ellipse(); ctx.clip()`. See `face-render-canvas.js`.
- PixiJS: a `Container` per layer, `Graphics` mask for each eye, `sprite.texture = frames[i]` for
  quantised swaps. Update in `app.ticker.add((t) => step(t.deltaMS / 1000))`.
- Serve as ES modules with relative paths (`./face-core.js`) so it works under any sub-path.

## Godot 4
- Scene: `Skeleton2D` → `Bone2D` "head" → children `Sprite2D`/`Polygon2D` per layer, ordered
  by `z_index`. Brows and marks get a higher `z_index` than bangs.
- Eyes: put the iris under the eye-white node with `clip_children = CLIP_CHILDREN_ONLY`.
- Params: a `Resource` (`FaceParams.tres`) holding a `Dictionary`, plus presets in another Resource or JSON.
- Update in `_process(delta)`: `damp` = `lerp(c, t, 1.0 - exp(-rate * delta))`.
- Mesh deform: `Polygon2D` with bones/weights, or a shader with uniforms per param.
- Flip with `scale.x = -1` on the character root, and mirror look-at x in code.

## Unity (2D)
- Layers as `SpriteRenderer`s under the head bone (2D Animation package `SpriteSkin` for meshes),
  `sortingOrder` for z, `SpriteMask` on the eye white with iris `maskInteraction = VisibleInsideMask`.
- Swaps: `SpriteLibrary` + `SpriteResolver.SetCategoryAndLabel()` from the quantised param.
- Params: a `ScriptableObject` for the schema and presets. Runtime state is a `float[]` indexed by param id
  (avoids dictionary allocations in `Update()`).
- `damp`: `Mathf.Lerp(c, t, 1f - Mathf.Exp(-rate * Time.deltaTime))`.
- Gameplay events: C# events or UnityEvents → `director.Trigger("hurt")`.

## Others
- Spine: map params to slot attachments (swaps) and bone transforms (brows, pupils), or to
  additive animation tracks, one per param, set by `TrackEntry.Alpha`.
- Live2D / Inochi2D: the param names map 1:1 to model parameters. Use this logic as the driver.
