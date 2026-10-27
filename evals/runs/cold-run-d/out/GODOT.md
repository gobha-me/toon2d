# Godot 4 port plan

Use this web implementation as the behavior reference; keep the same world units (one pixel-mode
buffer pixel) and fixed 60 Hz simulation. This is a port design, not a tested Godot project.

**Nodes and drawing.** Put movement/collision on a `CharacterBody2D`, with a visual `Node2D` and a
`Skeleton2D` containing the existing hip, spine, head, arm and leg `Bone2D` hierarchy. Add
`coatUpper → coatMid → coatTip` beneath the hip, each 5.5 units long. Use `Polygon2D` parts or custom
`CanvasItem` drawing with the current palette and round joint overlaps. A skinned tapered coat
polygon follows all three bones; render it after the far leg and before the near leg. Keep world-space
cloth state outside the mirrored visual node, converting its points into bone-local transforms each
tick. Mirror the visual only at the turn midpoint while the upper body narrows; retain the turn state
and head-first overlap. Preserve the scarf as a separate world-space chain.

**Physics, poses and IK.** Run movement, state transitions, distance-based run phase, foot locks, IK,
cloth and face in `_physics_process(delta)` with physics ticks set to 60 per second. Port the small
analytic two-bone solver to GDScript for explicit bend/reach control, or use the two-bone modification
in a `SkeletonModificationStack2D`. Store planted ankle targets in world space; solve every physics
tick, even if upper-body poses are held. Keep the standing hip at about 92% of total leg length. Unlock
feet in the air and snap to the supporting floor/platform before relocking. Use collision results and
incoming vertical velocity to produce jump, land and hard-landing events. Blend procedural pose
dictionaries with the existing state-specific fade times; feet retain their current contact flags.

**Secondary motion.** Port `stepChain` and its previous-position state. Pin the coat to the final hip
attachment after pose/IK; integrate free points with gravity 360, damping 0.88, rest-direction stiffness
0.035 and five length-constraint passes per tick. Parent motion supplies inertia automatically. Do not
mirror or reset the free points on facing changes. Initialize at the hip once, then preserve momentum
through starts, stops, jumps and landings. Disable cloth simulation for the anti-puppet comparison by
drawing its static rest shape. The built-in jiggle modification is an alternative, but must be tuned and
verified against the same lag/settle traces. The current design does not include cloth collisions.

**Smooth and pixel output.** Smooth mode can draw the same world at 3× into a 960×540 viewport with
vector features. For pixel mode, use a 320×180 `SubViewport`, nearest texture filtering and integer
display scaling with letterboxing. Palette-quantize the character layer and cut alpha, then draw the
hand-placed pixel face above that layer. Keep simulation positions fractional; snap final face pixels
and upscale the finished buffer once. Avoid fractional scaling of the finished pixel image.

**Face and verification.** Store the parameter schema/presets in a `Resource` or load the JSON. A face
director node chooses mood plus event envelopes; a pickup signal enqueues `pickup`, which plays
`scheming` (0.06 s fade-in, 1 s hold, 0.45 s fade-out). Preserve the squint/anticipation, grin overshoot,
per-parameter smoothing, then look-at and blink composition. Draw smooth eyes/brows/mouth under the
head transform; use pixel clusters in the pixel viewport. A debug pin overrides reactions. Seed all
randomness and expose equivalent reset/input/tick/state/pixels hooks through an HTML export bridge
or a native test adapter; rerun the feet, gaps, turns, idle, blink, expressions and coat/pickup checks.
