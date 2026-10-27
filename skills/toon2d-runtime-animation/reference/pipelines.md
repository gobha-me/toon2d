# Choosing a pipeline

Reference bar (study these, they each answer a different trade-off):

| Game | Technique | What to steal |
|---|---|---|
| Streets of Rage 4 | Hand-drawn frame-by-frame at high res, many frames | Anticipation/impact poses, smears and hit-stop on attacks; readability at distance |
| Hades | Pre-rendered 3D → 2D sprites, painterly finish | Consistent volumes across 8 directions; when the moveset is huge, render it |
| Children of Morta | Pixel art frame-by-frame + dynamic lighting | Low-res with modern light; frame economy (few frames, strong keys) |
| Rogue Legacy (2) | Skeletal/cutout on painted parts | Many outfits/variants on one rig; runtime reactivity cheaply |
| Axiom Verge | Small pixel sprites, few frames | Silhouette clarity at tiny size; pixel discipline (no mixed density) |

The target: **beat 90s Mortal Kombat fixed frames** (digitised, canned, same jump every time) by being *reactive*:
speed-scaled gait, terrain-aware feet, look-at, faces that react to hits and big falls, springs that answer
acceleration, and no two idles alike, while staying as readable as a drawn frame.

## Decision guide

1. **How big is the moveset?** Locomotion plus a few actions → rig it. Dozens of attacks with unique silhouettes →
   frame-by-frame or pre-rendered 3D for the actions, rig only locomotion/face (hybrid).
2. **What is the art?** Flat/toon/cel or pixel → cutout + IK (pixel: in a low-res buffer). Painterly/photographic →
   rigging shows baked light and rubber joints; use mesh deform for idle/small moves only, render 3D for gameplay,
   or stylise the art toward flat shading first.
3. **How close is the camera?** Busts/portraits/dialogue → lifelike face flow-morph is viable. Gameplay scale
   (character ~40-60 px tall in a 320×180 buffer) → faces must be hand-placed pixel clusters or 2-3 strong shapes.
4. **How many views?** Rigs from a single side view look like puppets when they turn. Budget at least side + 3/4 +
   front drawings for head and torso if the character turns on screen often.

| Pipeline | Reactivity | Art cost | Typical tells | Use for |
|---|---|---|---|---|
| Cutout skeletal + IK | High | Low (parts once) | Hinges, rigid parts, single-view | Toon/flat platformer characters |
| Pixel low-res runtime rotation | High | Low | Mixed pixel density if not buffered; mush faces | Pixel games wanting rig reactivity |
| Mesh deform | Medium | Medium | Rubber knees, swimming texture, baked light | Idle/breath/hair on painterly art, busts |
| Lifelike face (F2 flow morph + procedural blink/breath/eye-wander) | Face only | Medium (consistent AI set, ~70% usable) | Ghosting teeth if mouths crossfade; hair drift on turns > 25° | Dialogue busts, HUD live portraits, comms windows, crew/party panels, interrogation close-ups |
| Frame-by-frame | Low (per frame) | High | Canned repetition, foot slide on varying speed | Attacks, signature moves, smears |
| Pre-rendered 3D | Medium (more anims) | Medium-High | Plastic look if unpainted | Huge movesets, many directions |

Measured on our prototypes: the low-res pixel buffer, spring secondary motion and anticipation + squash were the
biggest cheap wins; runtime rotation inside a low-res buffer looked about as good as baked RotSprite.

## Where lifelike faces go in a game
Use the lifelike face (F2) wherever the camera is close and the body is not moving through the world: dialogue
busts, HUD live portraits (reacting to hits and low HP), comms/video-call windows, crew or party panels,
interrogation and cutscene close-ups. The gameplay character stays a rig (pixel cutout, mesh or 3D-rendered).
**Never use AI frame flipbooks for gameplay locomotion** (scale drift, "4 legs").
