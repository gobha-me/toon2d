# Recipe: mesh deform for painterly / lifelike AI art

Measured on a lifelike AI character (strict side view): **mesh deform (Live2D-style skinned mesh) gives the most
"alive" idle** (breathing chest, rising shoulders, hair sway) of any body method, and **fails in walk/run**.

## How
1. **Generate rig-friendly art**: strict profile, limbs separated from the body, no props, flat background.
   A 3/4 view with a bag was uncuttable.
2. Cut parts with generous overlaps at joints and paint in hidden areas (as cutout).
3. Triangulate each part (grid or contour mesh); weight vertices to 1-2 bones with smooth falloff near joints.
4. Deform on the GPU (WebGL batch) or in engine (Godot `Polygon2D` + `Skeleton2D` weights, Spine meshes).
5. Drive with the same runtime core: IK feet on the ground, springs for hair/cloth, breath on the chest bones.

## Where it fails (and what to do)
- **Rubber knees and elbows**: blended weights squash the photo texture, pockets bend into bananas. Photographic
  detail makes this uncanny far more than on flat art. → Keep joint bends small; use rigid parts (cutout) for limbs
  and mesh only for torso/hair/cloth; or stylise the art toward flat shading before rigging.
- **Baked lighting rotates with the part**: a thigh swinging 30° carries its highlight with it, so the light seems to
  move. → Small rotations only; or relight (normal maps) / flatten shading.
- **Painted-fill repeats** (the torso area hidden by the arm, invented from nearby cloth) show when limbs swing.
- **Halo**: light hair edges keep the old studio background. Unmatte and choke alpha; it helps but rarely fixes it.

## Verdict
Viable: idle-heavy characters, small fixed movesets, shown small. Not viable: a full gameplay moveset at lifelike
fidelity → pre-rendered 3D, or a stylised repaint. **Never** use AI-generated walk/run frames as a flipbook (see
recipe-frame-by-frame-or-3d.md and pitfalls.md).
