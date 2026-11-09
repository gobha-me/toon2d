# Measured visual self-review

`visual-review.mjs` adds repeatable, inexpensive observations to the author-side
render → look → critique → fix loop from #5. It is a CPU-only diagnostic, not a
vision judge or a required grader. The eight-axis [taste rubric](taste-rubric.md)
remains the standard for art review; these proxies do not score proportions,
line weight, palette, lighting, on-model consistency or appeal.

From the skill directory:

```bash
node scripts/visual-review.mjs templates/starter --out shots/visual-pixel
node scripts/visual-review.mjs templates/starter --query mode=smooth --out shots/visual-smooth
```

For a resource-managed environment, run the same command through its workload
wrapper, for example `heavy-run node scripts/visual-review.mjs ...`. Capture is
serial: one headless browser, fixed 60 Hz manual stepping, GPU disabled by the
existing CDP driver. No model calls, API keys, downloaded art or new dependencies
are used. Any local prototype implementing the [runtime contract](harness-contract.md)
can replace `templates/starter`. This is a browser harness, not a native Godot
renderer; a Godot port needs the documented HTML export bridge or equivalent
capture adapter.

The seeded scenario runs idle 90 ticks, run right 60, stop 45, then jump 90
(release the button at jump tick 22). It captures the transparent character
layer every tick into the existing root-follow 72×72-world-pixel crop. Smooth
mode uses the runtime's buffer scale (`s=3` in the starter). Motion analysis uses
world-space bones, not an image-based pose estimator. Keep the fixed viewport,
Chrome version, query and runtime unchanged when comparing byte-level results.
Cross-platform browser rasterization is not guaranteed identical.

## Evidence

The output directory must not exist. Rendering and validation complete before
any files are written; a write failure can leave a partial new directory, which
must be inspected before choosing another directory. The tool never retries or
overwrites previous captures. It writes:

- `report.md`: short pass/warn table and links to evidence.
- `report.json`: versioned metrics, exact thresholds, advisory status, seed,
  warning count and SHA-256 hashes of every emitted image.
- `keyposes.png`: idle, run, deepest grounded crouch, take-off, apex, landing.
  Jump poses follow events and geometry. A malformed/incomplete jump uses
  fallback ticks, explicitly marked in `frames.json`, so it still has evidence.
- `keyposes-3x.png`: exact nearest-neighbour 3x enlargement of that sheet.
- `silhouettes.png`: the same poses, black alpha masks on white.
- `motion.png`: ordered run ticks 0, 10, 20, 30, 40 and 50.
- `<signal>.png`: up to six frames grounding each signal, including consecutive
  triplets around extreme acceleration or rapid reversal measurements. The
  silhouette signal shows black masks of its own observed frames.
- `frames.json`: seed, query, view, key-pose selection and ordered zero-based
  segment ticks for every evidence strip. Joint names identify motion samples.

Character images are alpha-composited over a constant light background;
partially transparent edges remain visible. The review is at native **buffer**
scale, without page HUD or environment pixels contaminating the character mask.
Palette separation from the actual game background still needs the existing
composite capture and human rubric review. The short strips are unlabeled in
pixels, with column labels kept in the manifest for blinded-review reuse.

## Signals and initial limits

Limits live in `VISUAL_LIMITS` in the script and are copied into each report.
They are explicit fixture-tested heuristics, not human-calibrated taste floors.
All applicable signals have status `pass` or `warn`. Pixel-grid analysis is
omitted in smooth mode. Missing motion geometry warns instead of establishing a
pass; malformed images, nonfinite geometry or sparse captures are errors.

| Signal | Pass condition | Evidence / interpretation |
| --- | --- | --- |
| silhouette | Every frame has visible, unclipped pixels; largest 8-connected component ≥97% of opaque area; opaque bounding-box fill ≤85%; ≥8% of lower-half rows have two separated opaque spans | Alpha ≥128. Catches empty, detached, solid-block and merged-leg fixtures. A skirt, crossed legs or an intentionally closed stance can warn; this is a separation proxy, not recognition of a pose. |
| spacing | Standing hip height available; at least one endpoint spans ≥2% of that height; worst joint's p95 acceleration ≤0.10 hip-heights/tick² and absolute maximum ≤0.35 | Root-relative bone endpoints, run ticks 12 onward. Second finite differences of 60 Hz samples. Normalization removes world scale and travel; the maximum catches isolated teleports and per-joint analysis avoids dilution by static bones. Does not prescribe an arc shape. |
| anticipation | Grounded crouch event 3–18 ticks before launch, minimum hip height at least 15% below median idle height, followed by airborne flight through a grounded land event | The deepest crouch and event boundaries are shown; airborne ticks are counted and event labels alone cannot establish a jump. Event timing and joint positions must describe the rendered animation honestly. Does not replace the separate take-off pitch check. |
| overshoot | Stop torso initially ≥2° from its final target, crosses it by ≥2°, final five pitches remain within 2° of their mean | Final five-tick mean is the target; signed pitch comes from the spine bone and facing direction. A deliberate hard stop can warn. This signal asks for secondary follow-through, not root travel past a destination. |
| holds | No identical run raster held longer than 6 ticks (100 ms); more than one raster run observed | Full root-follow RGBA equality at 60 Hz. Ones, twos and threes are all acceptable. Feet, breathing and expressions can break a full-body hold; this is a freeze warning, not a measurement of upper-body exposure timing. |
| jitter | Motion geometry and standing scale available; worst joint's immediate reversal fraction ≤15% | Both adjacent steps must exceed 1.5% hip height and reverse by more than 120°. Detects persistent alternating teleports. Slow deliberate reversals and static bones do not dilute a twitching limb; an impact may legitimately warn. |
| pixel_grid | Integer positive world→buffer and display scales; no frame has more than 0.1% partial-alpha pixels among visible character pixels | Catches antialiased silhouette edges and declared fractional scales. Does not establish RGB palette quantization, actual screen filtering or snapping of subpixel joint telemetry. `score.mjs` checks actual nearest screen upscale separately. |

The generated fixture in `tests/fixtures/visual-review.mjs` supplies auditable
clean pixels, a smooth limb arc, six-tick crouch, settling torso overshoot and
two-tick raster holds. Tests deliberately replace these with a solid rectangle,
merged legs, detached/empty art, limb teleports, shallow/missing anticipation,
a flat stop, a frozen run and translucent edges. No committed PNG is required
for the fixtures. Their known-good label is about those constructed properties,
not a human judgment of artistic quality.

## Use in the bounded loop

1. Run the required motion checks, then this diagnostic into a fresh directory.
2. Open the native and enlarged sheets, silhouettes and any warning strips.
   Read the manifest to identify exact ticks. Describe the worst visible issue
   against the eight-axis rubric, including any intentional proxy exceptions.
3. Use `self-review.mjs capture` / `assess` to retain the existing three-round
   critique log. Author scores remain provisional. Each changed art/pose pass
   gets fresh diagnostic evidence and a fresh critique round.
4. Stop when the rubric passes or the three-round budget is exhausted; retain
   all prior directories for review. A warning count is not the rubric score.

The diagnostic exits **0 even with warnings**, and **2** on invalid commands,
contract/render errors or output failures. It never changes `score.mjs` totals,
marks an author critique as independent, makes model calls or promotes
`takeoff.mjs`. Human-rated calibration, held-out agreement and the fresh blind
baseline comparison described in [taste calibration](taste-calibration.md)
remain separate work. See #13 before proposing required take-off limits.
