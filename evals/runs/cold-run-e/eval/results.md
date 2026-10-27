# G2: PASS 28/28

| check | result | detail |
|---|---|---|
| files.index.html | pass | present |
| files.rig.json | pass | present |
| files.expressions.json | pass | present |
| files.NOTES.md | pass | present |
| lint | pass | 17 files clean |
| validate.rig | pass | ok (0 warnings) |
| validate.expressions | pass | 8 strong expressions |
| score.contract.api | pass | all methods present |
| score.determinism | pass | frame hash 9cceff47 vs 9cceff47 |
| score.states.visited | pass | visited: idle, run, turn, jump, fall, land (need idle, run, turn, jump/fall, land) |
| score.turn.not_instant | pass | turn runs (ticks): 10, facing flips: 2 |
| score.feet.slip | pass | mean 0.001 p95 0 max 0.438 px/tick (limits 0.35/1/3) |
| score.feet.planted | pass | 1146 planted foot-ticks, 0 planted while floating |
| score.gaps.connected | pass | worst largest-blob share 1.000 at  (min 0.97) |
| score.gaps.joints_covered | pass | joint samples on opaque pixels 1.000 (min 0.95); misses {} |
| score.idle.alive | pass | mean diff 0.1606 (min 0.01), distinct 1.00 (min 0.3) |
| score.face.blink | pass | min eye open in 6 s idle: 0.00 |
| score.face.expressions | pass | 8 expressions change eyes+brows+mouth params and >= 4% head pixels (8 distinct); happy:4.51/0.279 angry:5.36/0.274 sad:5.86/0.22 surprised:4.76/0.272 smug:4.14/0.234 hurt:5.49/0.286 determined:3.91/0.242 scheming:6.48/0.249 |
| score.antipuppet.toggle | pass | on vs off run diff 0.458 (min 0.04) |
| score.console.clean | pass | no console errors |
| capture.frames | pass | 6 non-trivial GIFs in evals/runs/cold-run-e/eval/capture |
| expr.scheming | pass | present, moves eyes+brows+mouth |
| expr.pickup_reaction | pass | {"expr":"scheming","weight":1,"fadeIn":0.05,"hold":1.4,"fadeOut":0.6,"line":"Heh heh...","anticipate":{"expr":"surprised","weight":0.7,"hold":0.08},"overshoot":0.3} |
| coat.exposed | pass | 3 coat* joints in state().joints |
| expr.pickup_drives_face | pass | L1 to scheming before 6.16 after 1.42 |
| coat.secondary_motion | pass | coat tip x rel. hip: range 6.00 px over 40 ticks after stop (min 1.5); late range 4.25 |
| coat.settles | pass | late range 4.25 < total 6.00 (springs must damp) |
| godot.notes | pass | missing: none |

Captures: evals/runs/cold-run-e/eval/capture
Next: human/LLM review with evals/review.md