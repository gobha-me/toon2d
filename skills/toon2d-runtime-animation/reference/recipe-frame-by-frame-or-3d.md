# When to choose frame-by-frame or pre-rendered 3D instead

Rigging is not always right. Choose:

**Frame-by-frame (hand-drawn)** when:
- the move is a signature action whose silhouette must change shape (attacks, supers, transformations): use
  smears, multiples and hit-stop (SoR4). **Smears belong on attacks and dashes, not runs.**
- the art style is too painterly to rotate (baked light) and the moveset is small;
- the camera is close and the character turns a lot (rigs from one view look flat when turning).
Keep it reactive anyway: drive frame-by-frame actions from the same state machine, add a parameter face on top,
use IK only for foot plant correction, and scale playback by gameplay (speed, charge).

**Pre-rendered 3D → sprites** when:
- the moveset is large (dozens of moves) or needs 4-8 directions (Hades);
- you need lifelike fidelity in gameplay. Paint over or use toon shading so it doesn't read as plastic;
- consistent volumes in every direction matter more than reactivity.

**Never: AI-generated frame flipbooks for gameplay locomotion.** Measured: 6 frames per cycle (~6 fps), head bob
~10% of height (real walking ~2-3%), scale drift between frames, near and far legs swap identity ("4 legs"),
crossfading doubles legs, every new move is another batch that won't match the character. AI art is fine as source
for parts, keys to redraw, faces and busts.

**Hybrid (usually best)**: rigged locomotion + idle + face (reactive, cheap), hand-drawn or 3D-rendered frames for
attacks and special moves, sharing one state machine and one palette.
