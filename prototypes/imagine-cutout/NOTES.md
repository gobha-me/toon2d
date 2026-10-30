# Decisions and work notes — 2026-10-30

The supplied brief was executed unattended. Work remained in this workspace;
`src/` was opened read-only. Temporary job directories were under `/tmp/tween-*`
and removed by EXIT traps. No forge/remote operations, new image generation,
paid calls, credential reads, pattern kills or owner identity were used.

## Decisions

- The first shallow inventory missed nested boots and collars. A recursive scan
  found both pairs before implementation; supplied Segments assets are used.
- Template matching uses opaque-alpha RGB SQDIFF, a one-third-scale search then
  full-resolution refinement. Hair gets a top-of-figure search region because
  dark clothing was a false global minimum. Amodal mismatches remain; retained
  hair score is about 0.083 and boot/coat offsets are approximate at hidden edges.
  `matching.json` preserves every crop result, including dropped crops.
- Face, left sleeve/hand and gun are SCRIPTED CUTOUTS from the original. The
  residual-alpha diagnostic supplies missing-region evidence; ROIs and skin/row
  rules constrain the actual cut. The human sleeve is deliberately restored from
  original RGB because it was merged into the coat export, then removed from
  the animated coat layer to prevent duplication. No outline was hand painted.
- The residual seed is explicitly applied to connected original-alpha components
  for both the arm and gun, then expanded only within their constrained ROIs.
  The original gun belongs to the human hand. Its visible gun pixels are
  transplanted to the mech hand. A monotone piecewise row boundary excludes the
  glove where colours cannot separate black glove from black weapon. Source
  alpha supplies the remaining silhouette. The largest component is kept and
  enclosed holes are filled with nearest gun colour (including trigger opening).
  The grip hidden by the glove is not inferred or newly painted.
- Gun has one Sprite2D under right_hand, one fixed texture per mode, local scale
  one, skew zero, and no direct animation tracks. Cameras frame the scene without
  node scaling. MuzzleFlash is a separate procedural Node2D, FLASH_FRAMES=3.
- Aim points to screen left: rotating the supplied hanging mech arm to its own
  side preserves the source silhouette. The original face still looks right;
  this view mismatch is an acknowledged limitation, not redrawn art.
- OVERLAP_PX=12 HD pixels is the default. Joint-gated dilation fills edge RGB with
  nearest retained colour. At split seams, added paint stays inside the source
  silhouette; back pieces extend behind front pieces. A first pass exposed a hip
  hole and rectangular coat-edge tabs. Torso under-belt backing, split-support
  masks and corrected z order removed that conspicuous rest-pose hole and reduced
  smear. Small extension/fringe/occlusion artifacts remain at diagnostic extremes.
  OVERLAP_PX=0 was actually run to completion, with the full temporary output
  removed and only diagnostics/zero-overlap-hd.png retained. Source amodal overlap
  is retained even when added paint is zero.
- Pixel processing order is matte -> shared palette -> nearest integer-grid
  sampling and binary alpha. Default figure height is ~120 pixels. There are 29
  art palette slots and three reserved review-background/flash slots (<=32 total).
  Native pixel frames observed at most 32 colours; part alpha is {0,255}.
  Transform origins snap to pixels; vertex snapping is OFF so the gun quad stays
  rigid. Comparison/contact/video enlargement uses integer nearest scaling.
- matte_background also accepts flat JPG. The supplied white JPG and a synthetic
  grey/white 48px checkerboard JPG were processed with the SAME function. Checker
  report detects grey modes 252/212; this is algorithm evidence, not a new AI art
  source. Visual review caught an enclosed arm/coat pocket that border flood alone
  missed. The final function additionally removes sufficiently flat enclosed islands
  matching the background greys. Dark checkers/coloured backgrounds and grey subject
  ambiguity remain outside this heuristic.
- All four clips and captures use 24 fps. idle=48 frames, aim=10, fire=6,
  cooldown=14. Clip timing is the brief's reference retimed for game response:
  no multi-second aim hold, +5 degree local shoulder recoil at fire f2, and flash
  f0-f2 only. All keys use integer frame indices divided by 24. Secondary hem
  swings accompany aim and fire. Endpoint PNGs are not extra video frames.
- Skeleton has 17 joints; each has minimum/maximum metadata and a captured pose
  at EACH endpoint. This is independent one-joint-at-a-time coverage, not proof
  that every simultaneous extreme combination is safe.
- Source sidecars are mirrored under provenance/ because src must stay read-only.
  Each derived image/part/video carries adjacent provenance. Original fictional
  art only; no real-person likeness. Source hashes are recorded for later review.

## Initial verification performed (before fix1)

The final native HD and pixel scenes loaded and ran headlessly. Real raster
captures used Xvfb + Godot compatibility rendering through heavy-run (llvmpipe).
Both modes produced all clips, endpoints and every joint extreme: 236 PNGs plus
8 MP4s. ffprobe observed 24/1 fps and frame counts 48/10/6/14 for both modes;
renders/media-info.json records that output. PNG palette/alpha observations and
zero-overlap command completion are in diagnostics/asset-observations.json.

The initial capture script had a GDScript type-inference parse error; then the
first packaging pass hit a Python dictionary-key quoting error. Both were fixed
and the capture/packaging pipeline completed. No core dump was encountered.
The remaining V-Sync warning is from Xvfb/llvmpipe; the manual sample times and
encoded 24 fps are unaffected. Logs are in renders/logs/.

A final full preparation into a trapped temporary output confirmed that explicit
residual seeding produced byte-identical runtime textures to the captured assets.
A subsequent pixel scene smoke run also loaded the final integer-stretch setting.

No tests that judge bones, timing, flash or gaps were written. The render utility
records observations and images for the separate acceptance agent; it has no rig
acceptance assertions. Visual inspection covered the complete HD/pixel contacts,
close-up gun, rest hip seam, firing pose, and representative joint extremes.
Limits/occlusion defects are honestly listed in README.md; universal gap-free
motion or production-quality pixel cleanup is not claimed.

## Per-part ledger and effort


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


## Handoff

See README.md for exact run commands and renders/manifest.json for raw pose data.
Project Godot pin: 4.7.2.stable.official.ed1daf0bf. No push was performed. Logical
commits separate initial preparation, refined assets, rig authoring, render outputs
and documentation. The final response lists their SHAs; `git log --oneline` is the
local authoritative commit ledger.

Implementation commits before the documentation handoff:

- `1bfbcba`: initial preparation and source provenance.
- `6a41303`: refined backing, palette and matting evidence.
- `a16345b`: native HD/pixel rigs and 24 fps animation authoring.
- `1d8dd1e`: complete renders, videos, contact sheets and capture utility.
- `23a1b40`: explicit residual-seeded recovery; runtime textures unchanged.

The initial documentation handoff was commit 87a2968. Follow-up commits are listed
in the corresponding final response and the local git log.

## Follow-up 1: reviewer fixes (codexA fix1)

- Added DEFRINGE_PX=2, exposed as --defringe-px and recorded in parts.json and
  part sidecars. Matching still uses the unmodified input crops. After cutting,
  semi-transparent and outermost two-pixel RGB colours come from an opaque core
  farther inside each part, using an interior median to avoid copying white
  strands outwards. A 6px guard recolours bright outliers (>32 luma steps and
  >35% brighter than their reference). The extra pre-palette pixel pass uses a
  deeper core. All changes are RGB-only. The gun has zero overlap dilation;
  its alpha silhouette, one-Sprite2D setup and fixed transforms were retained.
- The first defringe draft still propagated white hair strands via a nearest
  reference. Visual comparison prompted the interior median/bright-outlier
  refinement before the final capture. diagnostics/defringe-comparison.png
  compares the original committed parts (87a2968) with final cleanup, 3x nearest.
- Added a second Godot SubViewport sharing the posed world with a separate 1:1
  canvas transform. At every joint and both limits it centres on the current
  world pivot: HD 200x200 native source pixels, pixel 32x32. Capture starts with
  transparency and packaging composites flat magenta without filling gaps.
  joint-closeups-contact.png shows HD at exactly 2x and pixel at 8x nearest;
  there are 34 labelled panels per sheet. Full-figure contacts remain present.
- Added idle/aim/fire/cooldown.gif in BOTH renders/hd and renders/pixel, beside
  the existing MP4s. ffmpeg input and fps filter are 24 fps, palettegen and
  paletteuse run without dithering, pixel enlargement is 6x nearest. GIF-specific
  .gif.sidecar.json files avoid overwriting MP4 provenance.
- Ran prep with --overlap-px 12 --defringe-px 2 --pixel 120, then reran the full
  ./tools/render_sheet pipeline through its existing heavy-run wrapper. The final
  pass completed: 306 PNGs, eight MP4s and eight GIFs. Zero-overlap preparation was
  also regenerated with the new default defringe, retaining only its diagnostic
  assembly and removing the full temporary output through the EXIT trap.
- Reviewed the before/after edges, final firing/key-pose images, joint closeup
  sheets and individual head/elbow crops. Native pixel assets retain 32 colours
  and alpha values {0,255}; animation frame colour observations remain <=32.
  renders/media-info.json includes actual GIF frame counts/delays. GIF delays
  alternate 40/50ms: idle 2000ms, aim 420ms, fire 250ms, cooldown 580ms. These
  centisecond rounding limits cannot encode every 1/24-second interval exactly.
  PNG and MP4 remain the timing reference. The only capture warning was the
  existing unsupported V-Sync warning from Xvfb/llvmpipe; no core dump occurred.
- Honest remaining limits: some genuine bright paint remains and the heuristic
  can darken real edge highlights. The enlarged magenta crops expose pre-existing
  collar/neck holes, coat/hip seam gaps and blocky elbow overlap paint; no gap-free
  claim is made. Hidden grip recovery and rigid leg limitations remain unchanged.
  No tests or acceptance assertions were written for this follow-up.

## Fix2: real attachment seams after independent gap failures

The independent b5b0251 suite reported empty observation regions for centre/right
hems and the left thigh, plus one strict HD boot-boundary pixel. No test source,
tolerance or oracle is edited here. The supplied TESTS.md/results remain the
independent historical baseline after the required single follow-up execution;
new output is archived outside tests/ under .codex-run/fix2-test-output/.

- hem_center keeps its (563,700) waist pivot. The source tail began at y=871,
  disconnected from the yoke. A nearest-back-tail-colour structural continuation
  now connects it to the waist, behind torso/pants rather than over them. A new
  coat_lining part supplies a connected upper-back/waist silhouette under the
  visible body and coat panels. Both attachment pieces carry OVERLAP_PX=12 edge
  backing. Structural occlusion completion is disclosed separately from the edge
  overlap and both parts remain honestly Segments-derived, not supplied complete
  amodal exports or new AI art. The original source image is never modified.
- hem_right keeps (724,700). The old blanket x>=700 sleeve deletion had removed
  the waist coat panel down to y=800. A row-dependent sleeve boundary now keeps
  that real inner coat panel through the y=700 split and its 12px upper overlap.
  The fixed lining provides backing behind that junction during articulation.
- leg_left moves (488,708) -> (535,708). Inspection found both the pants and
  bodysuit transparent at the old pivot; at y=708 the real bodysuit spans x=512..
  703 and the pants begin at x=516/545. The new pivot sits on the actual upper
  left thigh/waist transition, not on the external coat or an arbitrary opaque
  patch. A fixed hip_backing from source bodysuit pelvis and a merged moving
  pants/bodysuit underlap create real common coverage around it. Child boot
  coordinates are recomputed relative to that pivot; rest placement is retained.
- boot_left keeps (424,1360). Its parent left-leg cuff now receives bounded
  OVERLAP_PX dilation/nearest-colour paint behind the boot. The old source-support
  clip is deliberately bypassed only in the cuff gate, otherwise it deleted the
  added underpaint beyond the original pants silhouette. The boot/gun originals
  and their source labels are not repainted or reclassified by this operation.

There are now 20 runtime sprites: 17 Segments-derived, 3 scripted cutouts. The two
added backing parts are Segments-split; leg_left is Segments-merged because it
combines pants and bodysuit pixels. All per-part ledgers and provenance reflect
this. Gun remains one rigid hand sprite. OVERLAP_PX=12, DEFRINGE_PX=2, the shared
32-colour pixel palette, all 17 joint limits, 24 fps key times, clip lengths and
FLASH_FRAMES=3 are retained.

Preparation and all HD/pixel frames, full/extreme/closeup contacts, GIFs and MP4s
were regenerated through heavy-run. Editor import uses a filtered TMPDIR project
copy excluding tests/ and the two protected documents, so it cannot create UID or
image-import stubs in the independent test tree. Only our scenes, texture imports,
cache and renders are copied back. Temporary files are removed by the launcher
EXIT trap. The independent runner was invoked exactly once after this work; its generated
evidence was archived and the protected tracked paths restored, as recorded below.

### Single independent fix2 execution

Timestamp: 2026-10-30T16:24:42.826534+00:00. Exit code: 0. Tests 1–5 all PASS; every
one of the 68 observed limits has zero exposed background pixels and a nonempty
coverage stencil. One heavy-run exit 75 was deferred by the existing runner;
this was still exactly one run_tests.sh invocation. No mutant run or second
suite invocation was performed.

Per-joint entries below are minimum / maximum **stencil pixel counts**. Every
entry has gaps=0 and PASS at both limits. These observations describe the frozen
local disks, not all possible poses or the complete external silhouette.

| Joint | HD min / max stencil | Pixel min / max stencil | Result |
|---|---:|---:|---|
| hip | 3228 / 3228 | 28 / 32 | PASS / PASS, both modes |
| torso | 2919 / 2919 | 27 / 27 | PASS / PASS, both modes |
| head | 3228 / 3228 | 32 / 32 | PASS / PASS, both modes |
| hair | 3228 / 3228 | 32 / 32 | PASS / PASS, both modes |
| collar | 3087 / 3086 | 30 / 30 | PASS / PASS, both modes |
| coat | 3133 / 3130 | 27 / 29 | PASS / PASS, both modes |
| hem_left | 2446 / 2445 | 24 / 24 | PASS / PASS, both modes |
| hem_center | 3228 / 3228 | 32 / 32 | PASS / PASS, both modes |
| hem_right | 2962 / 2962 | 28 / 24 | PASS / PASS, both modes |
| right_upper | 1432 / 786 | 13 / 6 | PASS / PASS, both modes |
| right_fore | 3228 / 3228 | 31 / 32 | PASS / PASS, both modes |
| right_hand | 3064 / 3065 | 27 / 24 | PASS / PASS, both modes |
| left_arm | 1974 / 1977 | 11 / 9 | PASS / PASS, both modes |
| leg_left | 3228 / 3228 | 32 / 30 | PASS / PASS, both modes |
| leg_right | 3228 / 3228 | 32 / 32 | PASS / PASS, both modes |
| boot_left | 3228 / 3228 | 32 / 32 | PASS / PASS, both modes |
| boot_right | 3228 / 3228 | 32 / 32 | PASS / PASS, both modes |

Full stdout (including every per-joint count), real.json, and the Godot transcript
are archived in .codex-run/fix2-test-output/. The tracked tests/, TESTS.md and
mutants.log were restored using the requested git checkout after archiving. No
regenerated test evidence is staged or committed. Their old red baseline records
remain intentionally unchanged; the new observations are reproduced above.

Known remaining limits: hidden lining/attachment paint uses nearest source colour
rather than artist-authored amodal folds; minor seams, cuff paint and occlusion
artifacts can remain outside the measured local coverage and in combined poses.
There is no claim of universal gap-free articulation, no new walk/knee rig, and
no improved recovery of the hidden gun grip. GIF centisecond timing limits and
possible edge-highlight darkening remain as documented for fix1.
