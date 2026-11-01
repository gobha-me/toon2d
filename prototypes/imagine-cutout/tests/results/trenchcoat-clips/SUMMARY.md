# Clip harness: iterative unmutated observations

The frozen acceptance contract was committed first at `5ef5704`, before any
clip observation. The rig remains byte-identical to pinned base
`cf702b44326db2a9891eb4059372a13e6765cfce`. This evidence records three sequential,
individual Godot development steps, followed by light Python evaluation of their
raw observations. It is not the launcher's formal acceptance verdict.

Each Godot step returned **0 on attempt 1**. The independent acceptance evaluator
returns **1** for expected RED observations, with **no ERROR keys**. The
[ledger](iterative-ledger.tsv) retains sanitized exact commands and UTC end times;
start times were not captured for import/observe and are explicitly marked as
such. The render start and end were both captured. All work was sequential and
guarded, with at most two workers. The [installed heavy-run build](heavy-build.txt)
was SHA-256 `3bc14651d44b4438d3823dfa582f767094ca8a95681721e743be3b8a57011a0b`.
There were **no exits 75 or 78**, no waits/retries, no detached jobs and no
mutation execution. No existing test mode or suite was run in this phase.

| Case | HD observations | Pixel observations | Reason or pending named mutant |
|---|---|---|---|
| CL1 limits | GREEN, 84/84 keys | GREEN, 84/84 keys | All manifest rotations inside limits. m1 is reserved for the launcher. |
| CL2 native seam gaps | GREEN, 1,722/1,722 keys | RED, 85/1,722 keys | Pixel posed stencils expose 1-7 magenta pixels at torso, coat, hem_left, right_upper, right_fore, right_hand and left_arm. Every stencil is nonempty. HD m2 has 82 GREEN right_fore targets; its kill remains unverified. |
| CL3 five chaining pairs | RED, 6/110 keys | RED, 6/110 keys | idle-aim and cooldown-idle each differ on torso (0.35 deg), hem_left (1.2 deg), hem_right (1.0 deg). All other keys, including hip positions and nonlooping idle endpoints, are GREEN. m3/m3b remain unrun. |
| CL4 idle motion | GREEN, 3/3 keys | GREEN, 3/3 keys | Hip y ranges are 6 HD native px and 2 pixel native px, exactly on inclusive maxima; hem ranges are about 2.4/2.0 deg. m4/m4b/m4c remain unrun. |
| CL5 elbow recoil | RED departure; GREEN settle | RED departure; GREEN settle | Elbow deviation is 0 deg throughout fire, including frames 1-2 and endpoint. m5 targets the GREEN settle and remains unrun. |
| CL6 facing | Existing body check reserved for launcher | No new case | The existing body-facing test is unchanged; no new facing result is claimed. |
| CL7 expressions | Not applicable | Not applicable | No manifest expression/face-swap parts. |

The full [3,842 verdicts](iterative-verdicts.txt), [measured values](iterative.json),
[raw AnimationPlayer samples](clip-observed.json), [atlas metadata](clip-atlases.json)
and all [164 fresh native atlases](iterative-images/) are retained. There are
1,722 CL2 keys per scene: 82 clip samples/endpoints times 21 JSON joints. CL3
uses private LOOP_NONE copies, including the true idle endpoint at 2 seconds.
The observer log is [here](iterative-observe.txt), with separate
[import](iterative-import.txt) and [render](iterative-render.txt) transcripts.
The evaluator's source hashes are recorded in `iterative.json`.

No mutant was planted or run: m1, m2, m3, m3b, m4, m4b, m4c and m5 all remain
pending for the launcher. In particular, 82 GREEN HD right_fore baseline keys
establish only the m2 precondition; they provide no kill credit. The launcher
must rerun a fresh baseline in the same invocation and establish newly RED
targets. No threshold was relaxed and none of these iterative greens certifies
red-first coverage by itself.

Shell syntax, Python syntax, complete key inventory, source scope and additive
changes were checked using light work. Existing suites and the two new full
runner invocations remain launcher-owned. The runner dispatch is a harness
change, so **REVIEW=required** remains in force after launcher execution.
