# Evidence summary: Imagine cutout PoC

This file records the evidence behind the PR write-up that is not otherwise in
the repo: the request-level Segments tally, the measured effort and the usage
figures. Paths are relative to this folder. Source logs that were not committed
are named as such; the figures below were copied from them unchanged.

## Verdict

- HD cutout pipeline: **conditional GO**. It works, but plan on scripted or
  generated body parts for every character.
- Pixel art from this route: **NO-GO**.

## Segments, request-level tally (two data points)

### This prototype: 7 of 8 requested parts usable

Grok Imagine Segments on the HD source post (Download All export). Parts are
amodally completed (hidden regions are painted in, e.g. full pants under the coat).

| Requested part | Result |
|---|---|
| hair | usable |
| coat | usable (open coat with a body hole; sleeves included) |
| pants | usable (full legs, amodal) |
| boot L | usable |
| boot R | usable |
| mech right arm | usable as one piece (shoulder to hand); split in a script at elbow and wrist |
| belt | usable |
| collar | usable but split in 2 (plus one listed entry with no file) |
| extras | bodysuit (torso and legs), 5 glow accents, whole figure, a stray text crop |
| **missing** | head/face, left arm and hand, the gun |

Score: **7 of the 8 requested parts usable**. Head/face, left arm and gun became
scripted cutouts. The final rig (see `parts.json` and README) has 15 parts from
Segments, 3 scripted cutouts and 2 backing parts (`coat_lining`, `hip_backing`)
added by the overlap fix; by classification that is 4 usable + 2 merged + 11 split
Segments parts plus 3 scripted cutouts.

The pixel attempt (a second post using the HD image as reference and asking for
16-bit pixel art) returned a painterly image, not pixel art. Segments behaved the
same way: hair, mech arm, coat, pants, 2 boots, collar ×2, belt, plus earring,
shoulder patch and a text crop; head/face, left arm and gun were again missing.
Its sidecars are in `provenance/parts/raw-pixel/`.

### Second data point: Luna's Imagine test (data credit: Luna)

Luna ran her own Grok Imagine test on a different character and shared the
results; the figures here are hers.

- Segments returned **17 clean RGBA parts**.
- Missing: head/face skin, hands and arms, separate legs. The cloak and tunic came
  back as overlapping shards.
- Her "pixel" output was not pixel art either: soft gradients, no palette or grid,
  and a JPG with the transparency checkerboard painted in.
- Her video added a background, a following camera and style drift, so it is a
  timing reference only.

Her files are not committed here, so this data point has no in-repo artifact.

**Pattern across both:** Segments isolates clothing and props well but drops skin
and body parts (head, arms, hands) and held objects, so body parts must be
scripted or generated.

## Effort for one character (measured from the run's phase log)

| Item | Figure | How it was measured |
|---|---|---|
| Wall time, start to PR | about 2 h 07 min (10:40 to 12:46 ET, 2026-10-30) | phase log timestamps |
| Codex time | about 82 min: rig build 43 (including its first fix), separate test session 12, overlap (gap) fix 27 | phase log; consistent with Codex log names and commit times |
| Supervision and PR work | about 45 min | self-reported sum of phase-log entries |
| Human time | 0 min, **excluding** the Imagine generation done in the browser | self-reported |

That meets the 2 h agent / 15 min human target for a first character, with the
caveat that the browser generation time is not counted. Later characters should be
faster because `tools/` is reusable.

## Usage

- Weekly usage was **2.1% before and 4.9% after** the run, a +2.8 point increase.
  This was measured across all bots and apps on the account, not this run alone.
- It stayed under the 6% stop. A later reading the same afternoon was 5.3%.
- Usage figures are self-reported from the account dashboard and cannot be
  verified from the repo.

## Test evidence (in this folder)

- `TESTS.md`, `tests/results/`: 5/5 tests pass; all 68 joint-limit poses (34 per
  mode) show zero gap pixels after the overlap fix.
- `tests/results/pre-fix2/SUMMARY.md`: the earlier failing run (58/68 passing;
  9 of the 10 failures were empty stencils where coverage did not overlap, 1 was an
  exposed pixel). The art was fixed, not the tolerances.
- `mutants.log`: 4/4 planted mutants killed (flash N+2, removed bone, dilation 0,
  shifted key). The mutant run needs `src/`, which is not committed.
- `renders/{hd,pixel}/joint-extremes-contact.png`: rotation-extreme contact sheets.
- `comparisons/`: HD vs scripted pixelation (120 px); the face becomes a blob and
  the gun loses detail.

## Caveats

- The face looks screen-right while the gun fires screen-left.
- The legs have no knees.
- The mech arm has a hard edge at the coat yoke.
- Test 5 checks each joint at its limits, not combined poses.
- Checkerboard matting was tested on a synthetic sample
  (`diagnostics/matted-checker-demo.png`) and real parts on flat backgrounds only.
- CI runs lint only and skips `prototypes/**`; the Godot tests run locally.
