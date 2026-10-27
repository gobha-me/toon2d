# Findings inbox (where other workstreams fold in)

This skill aggregates lessons from parallel prototypes. Each entry: source → status → where it landed. Add new
findings here first, then move them into the right reference file and mark them folded.

| Source (read-only) | Finding | Status | Landed in |
|---|---|---|---|
| `toon2d/REVIEW-styles.md`, `toon2d/shots/anim/` | Low-res pixel buffer, spring secondary motion and anticipation + squash are the biggest cheap wins | folded | pipelines.md, recipe-pixel-lowres.md |
| `toon2d/shots/anim/` (tech-twos) | Animate on 2s is the run sweet spot; 3s is choppy | folded | pitfalls.md, recipe-pixel-lowres.md |
| `toon2d/shots/anim/` (tech-smear) | Smears belong on attacks/dashes, not runs | folded | pitfalls.md, recipe-frame-by-frame-or-3d.md |
| toon2d review | Single side-view parts are the top remaining puppet tell (need 3/4 + front drawings) | folded; **TODO** add yaw-swapped head/torso parts to the starter | pitfalls.md, recipe-cutout-skeletal.md |
| toon2d review | Expression changes need takes, not crossfades | folded; take envelope added to starter + subskill face-core (v1.4: `anticipate`, `overshoot`, `settle`) | pitfalls.md, recipe-lifelike-face-flow.md |
| `prior-cutout-proto/README.md`, `REVIEW.md` | Low-res buffer biggest win; runtime rotation ≈ baked RotSprite; twos skate fix (feet every tick); claw/accessory lag via springs; coat row-shift only partial; pixel faces unreadable at game scale; silhouette test exposes seams; snapAngle wrap bug | folded | recipe-pixel-lowres.md, pitfalls.md |
| `prior-cutout-proto/LESSONS-arm-cut.md` | Box-cut arm carried a coat slab; silhouette trace + caps + torso fill wins (puppet 4 → 2); drawn in-betweens only pay off if they match the source rendering (2.5, plus pops at key-set edges); costs 1 h/limb vs 4-8 h/arm set vs 2-4 artist-days | folded (costs added 2026-10-26) | recipe-cutout-skeletal.md, pitfalls.md |
| `tween/lifelike/LESSONS-face.md` + owner's F1/F2/F3 ranking | Talking: F1 best, F2 ghosts teeth, F3 fails; Smile/Surprised F2 ≫ F1; Sad F2=F1>F3; Angry F2>F3>F1. Owner's later review: F2 wins most, F4 hybrid fails quite a bit (tried, mostly rejected); distracted via head-turn images doesn't work → eyes-only gaze wander; hit()/hurting(); lip-doubling sign bug; placement (busts, HUD portraits, comms, crew panels, interrogation) | folded 2026-10-26 (file was still being written; re-read for later sections) | recipe-lifelike-face-flow.md, pipelines.md, pitfalls.md |
| `tween/lifelike/README.md`, `REVIEW.md` | F2 flow-morph face is "next level" for busts; mesh = best idle, rubber knees; cutout = baked light; AI walk frames = 4 legs, scale drift; server-side apply for > 256 KB ConfigMaps | folded | recipe-lifelike-face-flow.md, recipe-mesh-deform-lifelike.md, recipe-frame-by-frame-or-3d.md, deploy-notes.md |
| `prior-cutout-proto/` (future) | TODO: coat solution beyond row-shift (chain parts?), any new per-limb lessons | open | |
| `tween/lifelike/` (future) | TODO: re-read LESSONS-face.md when its author finishes; viseme set beyond jaw-drop; hair motion outside the face mask | open | |
| `toon2d/shots/anim/` (future) | TODO: per-style numbers (line weight, palette size) for our-style.md | open | |
