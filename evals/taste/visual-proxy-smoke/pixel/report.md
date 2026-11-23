# Visual self-review (advisory)

3 warnings. These measurable proxies do not establish artistic approval. Inspect the evidence against the eight-axis taste rubric.

[Key poses at game scale](keyposes.png) · [Nearest 3x](keyposes-3x.png) · [Black silhouettes](silhouettes.png) · [Run motion](motion.png)

| Signal | Result | Measurements | Evidence |
| --- | --- | --- | --- |
| silhouette | warn | {"min_component_share":1,"max_box_fill":0.72222,"min_split_rows":0,"empty_frames":0,"clipped_frames":0,"flagged_frames":53,"frames":285} | [frames](silhouette.png) |
| spacing | warn | {"acceleration_p95":0.51423,"acceleration_max":0.58325,"worst_joint":"armLF","max_joint":"armLF","max_motion_span":1.02713,"samples":460,"complete":true} | [frames](spacing.png) |
| anticipation | pass | {"depth_fraction":0.61014,"crouch_ticks":6,"launch_tick":6,"land_tick":42,"airborne_ticks":36} | [frames](anticipation.png) |
| overshoot | warn | {"initial_offset_degrees":10.50656,"excursion_degrees":1.41389,"tail_range_degrees":0.0935} | [frames](overshoot.png) |
| holds | pass | {"max_hold_ticks":1,"pose_runs":60,"frames":60} | [frames](holds.png) |
| jitter | pass | {"reversal_fraction":0.08696,"worst_joint":"armUB","samples":460,"complete":true,"moving":true} | [frames](jitter.png) |
| pixel_grid | pass | {"max_partial_alpha_fraction":0,"integer_scales":true} | [frames](pixel_grid.png) |

Frame columns and zero-based segment ticks are listed in frames.json. Each evidence strip follows that listed order.

- **silhouette:** Alpha-mask connectivity, box fill and separated lower-body spans; skirts and crossed limbs need visual review.
- **spacing:** Worst-joint 95th-percentile and maximum endpoint acceleration in standing hip-heights/tick²; root-relative, run ticks 12 onward.
- **anticipation:** Grounded jump-squat depth and duration, followed by observed airborne flight and a grounded landing.
- **overshoot:** Stop torso crosses its final pitch, then settles during the final five ticks; not required in every style.
- **holds:** Consecutive identical root-follow character rasters at 60 Hz; ones/twos/threes accepted, long run freezes flagged.
- **jitter:** Worst-joint fraction of significant endpoint steps immediately reversing by more than 120°; deliberate impacts can warn.
- **pixel_grid:** Integer buffer/display scales and binary character-edge alpha; does not establish screen filter quality or joint snapping.

Warnings exit 0: fix the worst observed problem, then re-render into a new directory. Use self-review.mjs for the bounded human/author critique log.
