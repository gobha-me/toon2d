# G1: PASS 30/30

| check | result | detail |
|---|---|---|
| files.index.html | pass | present |
| files.rig.json | pass | present |
| files.expressions.json | pass | present |
| files.NOTES.md | pass | present |
| lint | pass | 17 files clean |
| validate.rig | pass | ok (0 warnings) |
| validate.expressions | pass | 7 strong expressions |
| score.contract.api | pass | all methods present |
| score.determinism | pass | frame hash 8887f22d vs 8887f22d |
| score.states.visited | pass | visited: idle, run, turn, jump, fall, land (need idle, run, turn, jump/fall, land) |
| score.turn.not_instant | pass | turn runs (ticks): 10, facing flips: 2 |
| score.feet.slip | pass | mean 0.002 p95 0 max 0.451 px/tick (limits 0.35/1/3) |
| score.feet.planted | pass | 1174 planted foot-ticks, 0 planted while floating |
| score.gaps.connected | pass | worst largest-blob share 1.000 at  (min 0.97) |
| score.gaps.joints_covered | pass | joint samples on opaque pixels 1.000 (min 0.95); misses {} |
| score.idle.alive | pass | mean diff 0.0776 (min 0.01), distinct 1.00 (min 0.3) |
| score.face.blink | pass | min eye open in 6 s idle: 0.00 |
| score.face.expressions | pass | 7 expressions change eyes+brows+mouth params and >= 4% head pixels (7 distinct); happy:4.51/0.213 angry:5.36/0.276 sad:5.86/0.435 surprised:4.76/0.443 smug:4.14/0.203 hurt:5.49/0.457 determined:3.91/0.405 |
| score.antipuppet.toggle | pass | on vs off run diff 0.438 (min 0.04) |
| score.pixel.mode | pass | mode pixel, buffer 320x180, k 2 |
| score.pixel.no_filter_blur | pass | on-screen 640px / buffer 320px = x2; nearest-upscale match 1.0000 (min 0.98) |
| score.console.clean | pass | no console errors |
| capture.frames | pass | 6 non-trivial GIFs in evals/runs/cold-run-b/eval/capture |
| sprites.declared | pass | rig.sheet true, 11 bones with sprites (min 8) |
| sprites.sheet_clean | pass | 0 marker pixels left in sheet.clean.png (quantizing would recolour them, not hide them) |
| mode.pixel_default | pass | default view {"mode":"pixel","W":320,"H":180,"s":1,"k":2,"camX":0,"camY":0,"canvas":"#game"} |
| antipuppet.default_on | pass | flags {"ap":true,"idle":true,"breath":true,"overlap":true,"asym":true,"turn":true,"caps":true,"hold":true,"feetswap":true,"timing":"twos"} |
| sprites.rendered | pass | fixture jacket px 58 (min 25), hair px 87 (min 10) |
| sprites.scale | pass | character height 48 buffer px (fixture parts imply ~40-52) |
| sprites.markers_hidden | pass | 0 marker-coloured px across 12 run/jump frames |

Captures: evals/runs/cold-run-b/eval/capture
Next: human/LLM review with evals/review.md