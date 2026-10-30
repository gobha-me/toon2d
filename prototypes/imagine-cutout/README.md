# Imagine cutout: HD and pixel PoC

Generated with Grok Imagine (SpaceXAI)

Godot **4.7.2.stable.official.ed1daf0bf**, Linux first. This is a working rigid-sprite
cutout prototype made from supplied Grok Imagine artwork. No new AI generation,
hand painting, paid service or network asset fetch was used.

## Run and rebuild

**Repository layout note.** This folder is a copy of a standalone working tree. The
tools and tests expect that tree's layout, with `tools/` (shipped here as
`prototypes/imagine-cutout/tools/`), `src/` (the supplied Grok Imagine Segments
exports and reference clip, *not* committed; see `provenance/` for their sidecars)
and a Python `.venv` (Pillow, NumPy, OpenCV-headless) at the root, next to
`prototypes/imagine-cutout/`. To regenerate, create a work directory, copy
`prototypes/imagine-cutout/tools` to `<work>/tools`, this folder to
`<work>/prototypes/imagine-cutout`, put the source exports in `<work>/src`, and run
the commands below from `<work>`. `heavy-run` is a local concurrency wrapper (two
render slots); on another machine, drop it or substitute your own. The Godot
project alone needs none of this: it already contains its runtime textures and
opens directly with `godot --path prototypes/imagine-cutout`. The test suite runs
in place with `TEST_PYTHON=<python with Pillow+NumPy> prototypes/imagine-cutout/tests/run_tests.sh`
(`heavy-run`, Godot and Xvfb on PATH); the mutant run additionally needs `<work>/src`.

**Per-frame dumps are not committed.** To keep this PR small, the per-frame PNG
folders under `renders/{hd,pixel}/` (`idle/`, `aim/`, `fire/`, `cooldown/`,
`keyposes/`, `joint_extremes/`) and the eight MP4 review videos (lossy duplicates of
the GIFs) are omitted; the contact sheets, per-joint close-ups (`joint_closeups/`),
GIFs, `manifest.json` and logs are kept. `./tools/render_sheet` regenerates every
frame and MP4 (as listed in `renders/manifest.json`) from the checked-in project.
References below to MP4s and to the 306 PNGs describe that full regenerated output.

```bash
# Interactive HD preview on a desktop with DISPLAY; Space fires, Tab switches.
# Keys 1/2/3/4 select idle/aim/fire/cooldown.
./tools/run heavy-run godot --path prototypes/imagine-cutout

# Start pixel directly. It uses a 128×144 logical viewport and nearest filtering.
./tools/run heavy-run godot --path prototypes/imagine-cutout res://scenes/pixel.tscn

# Display-free smoke run of the actual HD scene.
./tools/run heavy-run godot --headless --path prototypes/imagine-cutout --quit-after 48

# Recover/match parts, matte, extend joints and create pixel assets.
./tools/run heavy-run ./.venv/bin/python tools/prep_parts.py --pixel 120 --overlap-px 12 --defringe-px 2

# Import, bake, capture via Xvfb, and encode all eight MP4s and eight GIFs.
./tools/render_sheet

# Repackage existing PNG captures without rerunning Godot.
./tools/render_sheet --skip-capture
```

`tools/run` checks America/New_York quiet hours (23:55–03:00) and 5 GiB free space,
creates `TMPDIR=/tmp/tween-<runid>`, and removes it using `trap EXIT`. XDG data,
configuration and cache paths stay under this workspace's ignored `work/`.
Worker pools/encoders are capped at two; heavy jobs run through `heavy-run`.
Exit 75 means retry later; the shared coordination directory must be left alone.
The render utility imports/builds/captures a temporary project under TMPDIR,
excluding `tests/`, `TESTS.md` and `mutants.log`. It copies back only authored
scenes, texture imports/cache and render outputs, so editor-generated files never
land in the independently owned test tree.

## Preparation and rig

`tools/prep_parts.py` locates all 17 supplied HD Segments crops using RGB template
matching under opaque alpha, with a head-region search prior for hair. Scores and
offsets are in `matching.json`; amodally completed exports are not exact pixel
matches everywhere. Residual alpha from the original minus aligned known parts
seeds the missing-part recovery. Bbox/colour/row heuristics recover the face,
human left sleeve/hand and gun from `original.png`.

**OVERLAP_PX defaults to 12 HD pixels.** `--overlap-px 0` also completes successfully;
`diagnostics/zero-overlap-hd.png` retains the earlier fix1 zero-overlap example,
not the current fix2 acceptance evidence. Internal seam edges are dilated
and painted with nearest retained colour, with explicit joint gates. Split seams
extend into the original source silhouette. Back layers carry the extensions so
the adjoining front layer hides the stretched strip. Existing amodal body/leg,
collar/neck and boot/leg coverage also backs joints; this flag controls added paint,
not the source art's existing overlap. The gun receives **zero** joint dilation.

**DEFRINGE_PX defaults to 2 HD source pixels** (`--defringe-px 2`; zero disables
this added cleanup). After matching/cutting and before overlap painting, RGB in
semi-transparent pixels and the outer two-pixel strip is replaced from a deeper
opaque interior. An interior neighbourhood median prevents sampling an isolated
white hair strand and spreading it onto the outline. A six-pixel guard band also
recolours pixels more than 32 luma levels and 35% brighter than that reference.
Before pixel palette generation/quantization, a second pass pulls references
from deeper inside the part to suppress bright edge speckles. This changes RGB
only: alpha, silhouette, trim, pivots and gun geometry are retained. The gun
still receives no dilation and remains one fixed rigid sprite per mode.
`diagnostics/defringe-comparison.png` shows selected before/after edge details at
3× nearest on magenta. Bright painted interior highlights are not all removed;
the heuristic can also darken genuine highlights very close to an edge.

The scenes contain a native `Skeleton2D`, 17 `Bone2D`s, 20 rigid `Sprite2D` parts,
and an `AnimationPlayer`. Bones cover hip, torso, head, hair, collar, coat plus
three hem sections, mech upper/fore/hand, left arm, two legs and two boots.
`parts.json` stores each part's pivot, parent bone, z order, trim offset, rotation
limits, classification and `source`. The source gun was in the human hand: it is
transplanted to the mech hand by translation in preparation.

The waist attachments now include two hidden Segments-derived backing parts:
`coat_lining` is an amodal back/waist lining behind the body, and `hip_backing`
uses the bodysuit's pelvis behind both legs. The centre coat tail is completed
up to the real y=700 waist seam using nearest colours from that same back-tail
crop, then receives the normal 12px overlap under the lining. This structural
completion bridges source occlusion; it is separate from the 12px edge backing
and is explicitly recorded as procedural completion of Segments-derived art.
The right waist panel is retained when removing the sleeve, rather than cutting
all x>=700 pixels through y=800. Its existing waist seam now overlaps the yoke.
The left thigh merges pants and bodysuit underlap, with its hip pivot corrected
from (488,708), outside the garment, to the actual upper-thigh seam at (535,708).
The left leg also extends its bounded cuff backing by OVERLAP_PX behind the boot.
See `diagnostics/fix2-rest-attachments.png` for separate parent/child/rest views.

The gun is exactly **one Sprite2D named Gun under right_hand**. Its scale is `(1,1)`,
skew is zero, and no animation targets its position, rotation, scale, skew, texture
or visibility. Bone rotations move it as a rigid object. HD framing uses a camera,
not rig scaling. Pixel mode uses one prepared, fixed gun texture; raster stair
steps change under rotation, while the underlying sprite remains rigid. Pixel
vertex snapping is disabled to preserve its rigid quad; transform-origin snapping
and nearest sampling provide the integer raster grid.

## Timing at 24 fps

All authored keys and capture times lie on `1/24 s` boundaries. Timing is retimed
from `src/TIMING-SHEET.md`: the reference's long aim hold is removed, the raise and
lower are compressed, and its prolonged/morphing flash is replaced.

| Clip | Frames | Duration | Behaviour |
|---|---:|---:|---|
| idle | 48 | 2 s, loop | Vertical breathing, small torso rotation and three hem swings |
| aim | 10 | 0.416667 s | Raise to screen left, forward lean and secondary coat swing |
| fire | 6 | 0.25 s | Local shoulder recoil **+5°**, peak f2, return by f6; coat reaction |
| cooldown | 14 | 0.583333 s | Lower arm, settle torso/head and coat |

**FLASH_FRAMES = 3 at 24 fps** (0.125 s): visible on fire frames 0, 1 and 2;
hidden from frame 3. `MuzzleFlash` is a separate procedural node on the hand,
not part of the gun texture or sprite. Both the scene builder and preview name
this constant. Endpoints are separate key-pose PNGs, not extra MP4 playback frames.

## Pixel order

1. `matte_background()` removes a flat light background or border-connected baked
   light grey/white checkerboard before any quantization. Flat enclosed background
   islands are also removed by grey-palette and local-texture heuristics. It accepts RGBA or a flat
   RGB/JPG input. Existing transparency is retained, with fringe colour cleanup.
2. RGB-only defringing and bright-edge correction precede palette generation.
   A shared palette reserves 29 art colours plus three colours for the review
   background and flash: at most 32 total. Dithering is disabled.
3. Quantized layers are sampled with nearest neighbour onto one shared integer
   grid, then trimmed. Alpha is binary. Default figure height is about 120 pixels
   on an 85×128 source canvas; `--pixel` accepts heights 96–128. Pivots and offsets
   are rounded on the same grid. The native review viewport is 128×144.

Per-part raw-vs-grid comparisons are in `comparisons/`, including a whole-figure
comparison. Scripted recovery is labelled **SCRIPTED CUTOUT**, not Segments output.
The supplied flat JPG is matted in `diagnostics/matted-flat-jpg.png`; its report is
`diagnostics/matting.json`. The original pixel attempt was high-resolution painterly
art. It is retained as evidence; runtime pixel art is scripted from the HD parts.

## Per-part report and effort tally

Both HD and pixel runtime modes use these same 20 part identities:

| Part | Classification | Origin / operation |
|---|---|---|
| belt | Segments-usable | `black-belt.png` |
| hair | Segments-usable | `short-black-hair.png` |
| boot_left | Segments-usable | `black-combat-boots-2.png` |
| boot_right | Segments-usable | `black-combat-boots-1.png` |
| collar | Segments-merged | Outer `high-collar-1.png` + inner `high-collar-2.png` |
| torso | Segments-split | Bodysuit torso plus under-belt backing |
| hip_backing | Segments-split | Bodysuit pelvis, fixed behind both thigh seams |
| coat_yoke | Segments-split | Upper coat; human sleeve removed |
| coat_lining | Segments-split | Hidden back/waist lining; source-coat colour completion under body |
| hem_left | Segments-split | Coat lower left |
| hem_center | Segments-split | Coat lower centre; hidden back attachment completed up to waist |
| hem_right | Segments-split | Coat lower right |
| right_upper | Segments-split | Mech arm above elbow |
| right_fore | Segments-split | Mech arm elbow to wrist |
| right_hand | Segments-split | Mech hand below wrist |
| leg_left | Segments-merged | Pants left half plus bodysuit upper-thigh underlap |
| leg_right | Segments-split | Pants right half |
| head | SCRIPTED CUTOUT | Original face/neck, residual + bbox/skin recovery |
| left_arm | SCRIPTED CUTOUT | Original human sleeve and hand, gun excluded |
| gun | SCRIPTED CUTOUT | Original visible gun, grip exclusion, enclosed holes filled |

Effort tally: **4 usable + 2 merged + 11 split = 17 Segments-derived runtime parts**
from 10 distinct Segments input files; **3 scripted cutouts**. These three were
missing Segments outputs, so they are not counted as Segments successes. All 20
are trimmed, pivoted, assigned to bones, and given palette/grid variants by code.
Seven additional HD exports are dropped. New AI generations: 0; service spend: $0.

| Unused HD export | Classification | Reason |
|---|---|---|
| cyberpunk-woman.png | dropped | Whole figure would duplicate articulated parts |
| illegible.png | dropped | Stray text/crop |
| orange-glowing-accents-1.png | dropped | Glow already in mech arm |
| orange-glowing-accents-2.png | dropped | Glow already in mech arm |
| orange-glowing-accents-3.png | dropped | Glow already in mech arm |
| orange-glowing-accents-4.png | dropped | Redundant/ambiguous tiny crop |
| orange-glowing-accents-5.png | dropped | Glow already in mech hand |

Every supplied pixel-attempt part is **dropped from the runtime rig** (evidence
only): `belt.png`, `black-tactical-pants.png`, `brown-trench-coat.png`,
`combat-boots-1.png`, `combat-boots-2.png`, `cybernetic-arm.png`,
`cyberpunk-woman.png`, `earring.png`, `high-collar-1.png`, `high-collar-2.png`,
`illegible.png`, `short-black-hair.png`, and `shoulder-patch.png`.
Its `original.png` and flat JPG are source/matting evidence, not runtime parts.

## Outputs and verification

`renders/hd/` and `renders/pixel/` each contain:

- `idle/`, `aim/`, `fire/`, `cooldown/`: 78 playback PNG frames in total.
- `idle.mp4`, `aim.mp4`, `fire.mp4`, `cooldown.mp4`: four 24 fps review videos.
- `idle.gif`, `aim.gif`, `fire.gif`, `cooldown.gif`: four looping GIFs generated
  by ffmpeg `fps=24`, `palettegen` and `paletteuse`, without dithering; pixel GIFs
  are enlarged 6× with nearest neighbour. `renders/hd/idle.gif` was re-encoded
  for size after review (384×448, 64 colours, all 48 frames; about 0.6 MB instead
  of 6 MB); the 768×896 PNG frames stay authoritative. Their provenance is in
  `<clip>.gen.json` (the MP4s are not committed).
- `keyposes/`: four authored endpoint PNGs.
- `key-pose-contact.png`: breathing, raise, recoil/flash transition and lowering.
- `joint_extremes/`: 34 PNGs, both prescribed rotation limits of every joint.
- `joint-extremes-contact.png`: labelled contact sheet of those 34 poses.
- `joint_closeups/`: 34 additional native captures centred on each moving joint
  pivot at both limits, on flat magenta. The render uses an independent 1:1
  viewport sharing the posed world, rather than enlarging the whole-figure image.
- `joint-closeups-contact.png`: all 34 labelled joint/limit crops. HD uses
  **200×200 source pixels shown at 2×**; pixel uses **32×32 shown at 8× nearest**.
  Background gaps are shown as rendered; none are filled or retouched.

Total: **306 render PNGs, eight MP4s and eight GIFs**. `renders/manifest.json` records frame
times, visible flash state, all bone poses and gun transforms/textures for external
review. It reports observations, without acceptance assertions. Logs are under
`renders/logs/`. The utility is a render smoke path; no rig-judging tests were
written by Codex A. Final captures and scene smoke runs were completed locally.
MP4 is a lossy viewing copy (pixel video enlarged 6× with nearest neighbour);
the native PNG frames are authoritative for palette, alpha and pixel inspection.
The independent suite was invoked **once for fix2** after regeneration: tests
1–5 all PASS; **68/68 joint limits have zero exposed pixels and nonempty stencils**.
[NOTES.md](NOTES.md#single-independent-fix2-execution) records every joint's exact
stencil counts. Fresh stdout/JSON/Godot logs are archived in the workspace's
`.codex-run/fix2-test-output/`. Protected test sources, results, TESTS.md and
mutants.log are preserved at their independent baseline after the requested
restore; that older baseline report intentionally still records the earlier red
run. No tolerance or test implementation was changed and no new tests were authored.

GIF stores time in centiseconds, so 24 fps input becomes alternating 40/50 ms
delays and short total durations can round by a few milliseconds. PNG/MP4 timing
remains the authoritative 24 fps reference; HD GIF also has palette banding.

## What works and remaining limitations

The missing face and human sleeve/hand recover recognizably; all four clips play,
the gun follows the mech hand rigidly, and the short separate flash is visible in
captures. The gun barrel/housing silhouette is cleanly separated from coat and
hand. Its grip was partly hidden by the source glove: the automatic row heuristic
conservatively clips that boundary, which is covered by the rig hand. This is a
usable visible-gun cut, not recovery of the unseen grip. The source trigger opening
is filled by nearest gun colour to meet the no-holes requirement.

This is a PoC, not a production asset pack. RGB defringing substantially reduces
the former white outlines and pixel speckles; some painted highlight patches
remain, and it is not a perfect semantic separation of sheen from export matte.
Hard seams, stretched edge paint and occlusion errors can remain outside the
measured joint interiors or when combining extremes. Closeups expose those
limitations even though the fixed local acceptance checks now pass. Nearest-colour
completion supplies hidden attachment coverage, not finished amodal fabric folds.
The face is not an amodal head; hair/collar hide
its bounded cuts. Small collar/shoulder fragments can move imperfectly. Legs are
rigid sections with no knee or walk cycle, and the long coat can intersect them
at large diagnostic poses. Not every extreme or combination is gap-free. The
source face looks toward screen right while the mech-side firing pose points
left; no alternate view or facial redrawing was invented. At 120 pixels, gun/face
detail is heavily reduced and rigid rotation gives ordinary pixel stair stepping.

The light-background matting heuristic is not a universal semantic matte: dark
checkerboards, coloured backgrounds or grey subject pixels connected to the edge
may need more constraints. The supplied JPG has a flat white background. The
separate checkerboard demonstration is synthetic evidence of the same function.

Every committed still has a `<name>.gen.json` sidecar (CONTRIBUTING format): prompt
“prompt not recorded”, tool Grok Imagine (SpaceXAI), model “not disclosed”, and the
UTC download time of its source post's Segments export as `date` (generation time was
not recorded), plus `source` (parent post id), `derived_from` and the values of the
earlier `*.sidecar.json` files they replace. Supplied source files remain read-only and
uncommitted, so their `.gen.json` sidecars are mirrored under `provenance/` with the
same relative paths; `provenance/source-sha256.json` records their hashes. Every still
is listed in the repository `PROVENANCE.md` §2c (CC0 1.0). Original fictional art only;
no real-person likeness. The build tools in `tools/` still emit `*.sidecar.json` when
re-run; convert those before committing new outputs.

See [NOTES.md](NOTES.md) for decisions, evidence and the duplicated per-part ledger.
