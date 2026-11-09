# Imagine courier: current acceptance evidence

Validated implementation: **b51137f8f9e1a6a1b8ec9e8fa8d533a094ba37cc**.
Evidence-only follow-up commits preserve that implementation. Every recorded
input hash was compared with the current checkout before this summary was written.
Use the named per-attempt records below; verification.json at this directory's
root describes only the latest invocation. [Machine-readable aggregate](acceptance.json).

| Check | Result | Evidence |
|---|---|---|
| Oracle/source controls | 23/23 PASS, exit 0 | [Transcript](oracle-4/transcript.txt) |
| Harness policy/lifecycle controls | 3/3 PASS, exit 0 | [Transcript](harness-3/transcript.txt) |
| Actual source provenance mutants | 12/12 KILLED, green baseline, exit 0 | [Report](provenance-mutants-5/results/char2/provenance-mutants.json) |
| Full body acceptance | 650 poses, 9,750 seam observations, zero gaps, all six checks PASS | [Report](body-4/results/char2/body.json) |
| Legacy hierarchy, timing, flash, rigid prop and joint gaps | 5/5 PASS, exit 0 | [Report](legacy-4/results/char2/real.json) |
| Rendered body mutants | Green full 650-pose baseline; e/f/g/h all KILLED, exit 0 | [Report](body-mutants/results/char2/mutants.json) |

The full baseline remains 30 single + 420 pair + 200 random poses, N=200, seed
20261031. Its 450 individual and 9,300 combined seam observations have zero
gap pixels. Both the standalone and mutant-control full baselines agree.

Pose SHA256: da555e908a46d1600cb8caee43e2807e961e5de9a12b7ca672626262e1529029.
Manifest SHA256: 0f85468bed3e00588992e890280ad1555f0d8a061f5dbd3d65b4ef9448c621e4.

## Actual mutations

| Mutant | Planted defect | Observed kill |
|---|---|---|
| e | Remove head slot sprite | New completeness failure slot/head_face |
| f | Flip facing sprite | New facing failures throughout sampled clips |
| g | Remove left knee bone | Missing bone, parent and pivot failures |
| h | Remove shared arm overlap | 2,871 actual pixels removed; right_fore/min increases from 0 to 38 gap pixels |

All 12 provenance mutants i–t target the actual source-derived kit, not the
oracle fixture. The rendered h kill requires increased observed gaps; its
metadata/provenance failures alone are not counted as proof. No mutant is
skipped, unplantable or surviving.

## Source tally and limitations

Required slots: **0 Segments-usable + 4 Segments-merged + 9 Segments-split = 13
Imagine-derived slots; 1 SCRIPTED (flagged)**. Six distinct retained source files
supply these slots. All 15 committed source files authenticate. The additional
torso and pelvis backing yield 0/5/10/1 across all 16 runtime parts.

Complete source-free kit fallback list: **satchel**. The base requested no prop,
neither Segments run supplied one, and all three allowed calls were already used.
This conversion made zero generation/paid-service calls. Calls 2/3 retain their
approximate-time disclosures, including the unintended third Segments call.

Scripted splitting, affine fitting and source-material joint underlays are
recorded derivations. They complete hidden coverage rather than recover unseen
anatomy or fabric folds. [Derivation ledger](../../characters/char2/derivation.json)
and sidecars retain the actual source pixel and support geometry. The source
face is frontal; the facing observer checks sprite-axis consistency, not gaze.
The existing procedural flash is disclosed separately from the kit fallback.

[Four native captures/contact](build/review-final/contact.png) preserve Godot
output without gap retouching. Broad cuffs and rigid limb proportions remain
visible; collision-free silhouettes, locomotion and finished animation appeal
are outside these joint-interior checks.

## Commands and environment

Executed from the repository root with a private TMPDIR, two workers, Pillow,
NumPy and OpenCV. HEAVY_RUN resolves the installed absolute guard; MUTATION_LOCK
resolves the shared engine lock. A private executable named -j2 only caps worker
environment variables and executes its arguments; the guard remains intact.

    export TMPDIR="$ONESHOT_TMP"
    export PYTHONDONTWRITEBYTECODE=1 MAKEFLAGS=-j2 OMP_NUM_THREADS=2 OPENBLAS_NUM_THREADS=2 LP_NUM_THREADS=2
    "$HEAVY_RUN" -j2 bash "$TMPDIR/prepare-and-bake.sh"
    python3 prototypes/imagine-cutout/tools/validate_char2.py oracle
    python3 prototypes/imagine-cutout/tools/validate_char2.py harness
    HEAVY_WAIT=55 flock "$MUTATION_LOCK" "$HEAVY_RUN" -j2 bash "$TMPDIR/char2-acceptance-batch.sh"

The preparation batch captures the repository path and executes the following
sequentially from private scratch; both commands exited 0:

    python3 "$repo_path/prototypes/imagine-cutout/tools/prep_char2.py" --project "$repo_path/prototypes/imagine-cutout"
    python3 "$repo_path/prototypes/imagine-cutout/tools/build_v2.py" --character char2 --capture

The guarded acceptance batch executes these sequentially under that same lock
and guard. It admits each rendered stage only when the nested guard has room.
Every final stage exited 0:

    python3 prototypes/imagine-cutout/tools/validate_char2.py provenance-mutants
    python3 prototypes/imagine-cutout/tools/validate_char2.py body
    python3 prototypes/imagine-cutout/tools/validate_char2.py legacy
    python3 prototypes/imagine-cutout/tools/validate_char2.py body-mutants

The wrapper invokes the unchanged observers:

    bash tests/runner.sh oracle --character char2
    python3 tests/test_harness_policy.py
    python3 tests/run_imagine_mutants.py --output tests/results/char2/provenance-mutants.json
    bash tests/run_body_tests.sh --character char2
    bash tests/run_tests.sh --character char2 --output tests/results/char2/real.json
    bash tests/runner.sh body-mutants --character char2

Those result paths exist only in private snapshots; committed copies are under
this validation directory. Test-owned sources, manifests, assertions and prior
reports are unchanged. No timeout, deadline, retry policy or pose count was raised
or skipped. Exit 75 defers; exit 78 stops. Direct build children preserve cores;
the immutable nested test harness can remove its own scratch before the outer
wrapper's core scan, as disclosed in PR #29.

## Retained failed evidence and effort

The inherited procedural kit was RED with 174 provenance errors despite
authentic source inputs. Earlier actual body attempts remain in body/, body-2/
and body-3/: 212, 74 and 1 exposed pixels respectively. Geometry and source
material completion were fixed while keeping the observers unchanged.
Legacy failed images and all source-mutation attempts are also retained.

The synthetic wrapper TERM control retains both the original failing attempt
and the passing repair under wrapper-signal-control/. The repaired control
keeps the same 15-second bound, child termination and evidence retention.

The conversion began at 2026-11-09T19:52:59Z; final evidence was assembled at
2026-11-09T23:00:23.819870Z. Wall time exceeds three hours including shared-guard
admission waits; no two-hour end-to-end result is claimed. No human intervention
was requested during this conversion. Earlier browser sourcing time and account
usage changes are not measured here. Review and merge decisions remain with
the owner; PR #29 stays a draft and no PR was merged.

Agent: Codex (gpt-6.1-sol)
