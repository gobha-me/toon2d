# Clip seam and transition fixes

Refs #23 and #20. All 3,842 frozen clip checks pass: CL1 limits, CL2 pixel
coverage, CL3 endpoint chaining, CL4 idle life, and CL5 early elbow recoil.
Both HD and pixel modes pass. The five legacy rig cases also pass. Every
existing observer, assertion, manifest value, frame count, and fps is unchanged.

Idle now returns torso and hems to the neutral transition pose. Fire reaches
a two-degree elbow recoil at frame two and returns to its aim pose. The pixel
cutouts also need palette-matched material behind exposed rotating attachments;
keyframes alone did not close those seams. Caps include the rounding margin
needed by the preview's origin snapping. This extends the keyframe-only approach
in #20 to address the pixel coverage requirement in #23.

The native contact and its 3x nearest view show idle frame 6, aim endpoint, fire
frame 2, and cooldown frame 10, in that order. A visual pass replaced an exposed
bright wrist highlight with a local shadow tone. This is an author review;
passing coverage checks does not certify overall animation appeal.

All eight planted clip mutants were killed on the geometry/keyframe commit
before shadow-palette polish. Shapes, animation tracks and test inputs are
identical after that polish; final clip and legacy suites were rerun. The compact
summary records the subject commit and frozen test hashes. Full transient logs
and atlases are deliberately kept outside version control.

Commands (each Godot process in the drivers runs through `heavy-run`; set
`OMP_NUM_THREADS=2 OPENBLAS_NUM_THREADS=2 LP_NUM_THREADS=2 MAKEFLAGS=-j2`):

```bash
heavy-run python3 prototypes/imagine-cutout/tools/build_v2.py
python3 prototypes/imagine-cutout/tests/clip_driver.py clips --output "$TMPDIR/clips.json"
python3 prototypes/imagine-cutout/tests/clip_driver.py clip-mutants --output "$TMPDIR/mutants.json"
python3 prototypes/imagine-cutout/tests/driver.py suite --output "$TMPDIR/legacy.json"
```
