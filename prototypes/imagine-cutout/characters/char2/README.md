# Imagine courier

Char2 uses the supplied fictional bike courier from post
`be6a80c1-cdb2-43ee-848c-8b8d1d0cd7a8`. The unmodified base image, 14 Segments
exports and their provenance are in [imagine-source/](imagine-source/README.md).
All three allowed Imagine calls were already used. This implementation makes
zero new generation calls and uses no paid service. Calls 2 and 3 were not
recorded at the instant of invocation; their approximate timestamps and the
unintended extra Segments run remain disclosed in the source README.

Required-slot tally: **0 usable + 4 merged + 9 split = 13 Imagine-derived
slots**, from six distinct supplied files; **1 SCRIPTED (flagged)** satchel.
The two additional runtime parts are a merged torso and split pelvis backing.
Across all 16 runtime parts: **0 usable + 5 merged + 10 split = 15
Imagine-derived parts; 1 SCRIPTED (flagged)**. These counts distinguish usable
Segments exports from later scripted splitting, fitting and material completion.

| Required part | Classification | Actual pixels used |
|---|---|---|
| head | Segments-split | `call1-base-best.jpg`: face, hair and neck |
| left_arm, right_upper | Segments-split | `seg-be6a-teal-cropped-jacket.png`: separate sleeve polygons |
| left_fore, right_fore | Segments-split | `call1-base-best.jpg`: exposed forearms |
| left_hand | Segments-merged | Base fingers/hand + `seg-be6a-black-fingerless-gloves-2.png` |
| right_hand | Segments-merged | Base fingers/hand + `seg-be6a-black-fingerless-gloves-1.png` |
| leg_left, leg_right | Segments-merged | Separate halves of `seg-be6a-black-shorts.png` + `seg-be6a-gray-leggings.png` |
| shin_left, shin_right | Segments-split | Separate calf sections of `seg-be6a-gray-leggings.png` |
| boot_left, boot_right | Segments-split | `call1-base-best.jpg`: orange sneakers and ankles |
| satchel | SCRIPTED (flagged) | None; wholly procedural prop |

The base prompt explicitly requested no prop. Neither Segments run supplied a
satchel, and no generation calls remain. The satchel is the complete list of
source-free scripted fallbacks. Its flag and reason appear in `parts.json`,
`gap-report.json` and its sidecar. Hidden joint backing on sourced parts borrows
material from those parts; it is scripted derivation, not recovered unseen art.

`tools/prep_char2.py` removes only border-connected near-white background from
the base, preserving enclosed shoe/eye whites. Explicit source polygons split
limbs; an affine centreline fit adapts their proportions to the frozen rig.
Premultiplied-alpha interpolation avoids dark fringes during fitting. Hands and
upper legs composite their declared sources. Each attachment receives
uniform source-interior material completion and the exact manifest overlap, clipped to a
joint-local oval boundary. `derivation.json` and every texture sidecar retain source hashes,
polygons, fitted axes, affine matrices, output hashes, sampled material colors/locations
and completion pixel counts. At shoulders, elbows, wrists and ankles the parent
and child carry paired local support shapes, each sampled from its own
retained source material. This closes rotating seams on both sides without
expanding only the child edge. Added backing samples an actual opaque interior
pixel closest to the local median; it avoids spreading source outlines into
striped joint caps. Elbow supports select existing low-chroma material above the pivot, including
cuff shadows and brown source edge paint; the exact pixel and criterion are recorded.
Source sidecars retain their original call metadata; derived dates describe
artifact creation only.

The canvas, 15 joints, pivots, hierarchy, limits and 12px overlap come from the
unchanged manifest selected by `characters.yml`. The satchel has no dilation;
its rigid handle endpoints remain texture coordinates (16,8) and (48,8). Left
hand means image-right. Leg labels retain the manifest's image-side convention.
The source face looks forward. The frozen facing test compares sprite and prop
transforms; it does not establish sideways gaze or an alternate camera view.

From the repository root, set `HEAVY_RUN` to the installed absolute guard and
`TEST_PYTHON` to a Python with Pillow, NumPy and OpenCV. Use a private temporary
root and two workers; environments whose guard treats `-j2` as the command need
an executable adapter of that name on a private PATH that sets the worker caps
and executes its arguments. Preserve the guard itself and all its checks.

```bash
export TMPDIR="$ONESHOT_TMP"
export PYTHONDONTWRITEBYTECODE=1 MAKEFLAGS=-j2 OMP_NUM_THREADS=2 OPENBLAS_NUM_THREADS=2 LP_NUM_THREADS=2
"$HEAVY_RUN" -j2 "$TEST_PYTHON" prototypes/imagine-cutout/tools/prep_char2.py
"$HEAVY_RUN" -j2 "$TEST_PYTHON" prototypes/imagine-cutout/tools/build_v2.py --character char2 --capture
"$TEST_PYTHON" prototypes/imagine-cutout/tools/validate_char2.py oracle
"$TEST_PYTHON" prototypes/imagine-cutout/tools/validate_char2.py harness
"$HEAVY_RUN" -j2 "$TEST_PYTHON" prototypes/imagine-cutout/tools/validate_char2.py legacy
"$HEAVY_RUN" -j2 "$TEST_PYTHON" prototypes/imagine-cutout/tools/validate_char2.py body
flock "$MUTATION_LOCK" "$HEAVY_RUN" -j2 "$TEST_PYTHON" prototypes/imagine-cutout/tools/validate_char2.py provenance-mutants
flock "$MUTATION_LOCK" "$HEAVY_RUN" -j2 "$TEST_PYTHON" prototypes/imagine-cutout/tools/validate_char2.py body-mutants
```

`MUTATION_LOCK` is the shared engine mutation lock. Run commands sequentially;
exit 75 means defer/retry, and 78 means stop for guard configuration investigation.
Baking uses a disposable project; validation runs the committed observers
unchanged and retains new evidence only in `validation/char2-imagine/`. Existing
test-owned red-first evidence remains untouched. The real rendered mutant check
must certify a green full baseline plus **4/4 KILLED**; the source-provenance
mutant suite must separately certify **12/12 KILLED** on the actual kit.

Open `scenes/char2.tscn` for the HD rig. Keys 1–4 select idle, aim, fire and
cooldown; Space presents and lowers the satchel. Compatibility clip names retain
the existing sampler. The fire capture also contains the pre-existing procedural
`MuzzleFlash` effect; its script hash and effect disclosure accompany captures,
separately from the body-part slot tally. Local oval seam backing and proportion changes are visible
at large diagnostic angles. This is a rigid cutout study, with no locomotion,
expressions or reverse/side art. Historical procedural-courier captures in
`validation/char2-rig/` predate this Imagine conversion.
