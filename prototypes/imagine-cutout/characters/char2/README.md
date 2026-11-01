# Original scripted courier

Char2 is an original fictional courier drawn entirely by the procedural recipes
in `tools/prep_char2.py`. No external source artwork or generative service is
used. The gap report classifies all fourteen required slots as `scripted`.
Each of the sixteen PNGs, including the torso and pelvis backing panels, has a
sidecar identifying its script, UTC authoring date and image hash.

Preparation uses the frozen manifest selected by `characters.yml`: canvas,
joints, pivots, parents, limits and per-slot overlap are read from that input.
The v2 preparation helpers complete round material backing and apply the exact
manifest dilation at the proximal attachments. Added backing is clipped to a
round attachment to avoid rectangular gate edges. The satchel receives no
dilation; its handle grip and outer endpoint are texture coordinates (16, 8)
and (48, 8). The head profile and handle both face image-right.

From the repository root, with an existing Python providing Pillow, NumPy and
OpenCV:

```bash
heavy-run "$TEST_PYTHON" prototypes/imagine-cutout/tools/prep_char2.py
heavy-run "$TEST_PYTHON" prototypes/imagine-cutout/tools/build_v2.py --character char2 --capture
```

Preparation changes only char2's art, declarations and gap report. Baking uses
a disposable project and copies back char2's native scene and import sidecars.
The shared v2 builder retains the default trenchcoat mode. Each Godot step is
sequential; the tools contain no retry policy. Respect the caller's admission,
scratch-directory and quiet-hour rules.

Open `scenes/char2.tscn` to preview. Keys 1–4 select the compatibility clip names
idle, aim, fire and cooldown; Space presents, settles and lowers the satchel.
These names keep the existing facing sampler usable; the courier does not fire
a weapon. The prop stays rigid on the right hand. Animation targets are
fractions of the manifest limits, including knees, elbows and separate hands.

Authoring observations and visual limitations are documented in
`validation/char2-rig/`. Launcher acceptance and mutation results are recorded
separately after authoring. Passing seam checks does not certify animation
appeal, expressions, locomotion, or every possible pose.
