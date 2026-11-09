# Imagine courier verification

Code checked: `37a544b9ab475eae098d432b6e4e97c194d6bc02`. The guarded batch
completed at **2026-11-09T19:35:24Z**. Its exit 0 checks the expected individual
command exits below; actual char2 acceptance remains RED.

| Check | Exit | Observed result |
|---|---|---|
| Light oracle/source controls | 0 | 23/23 PASS; includes the complete historical trenchcoat pose equality check |
| Xvfb lifecycle and heavy policy | 0 | 3/3 PASS; recorded server PID, lock and scratch gone on normal exit and TERM |
| Godot observer parse check | 0 | PASS; isolated prototype copy, no parse/script errors |
| Provenance-only fixture mutants i–t | 0 | **12/12 KILLED**, green control; each expected new failure recorded |
| Actual-source provenance mutants i–t | 1 | RED control: subject missing; 12 CANNOT_PLANT, zero actual mutants planted |
| Rendered body mutants e/f/g/h | 1 | RED control: scene/subject missing; 4 CANNOT_PLANT, zero rendered mutants planted |
| Actual full body admission | 1 | Manifest/source authentication GREEN; provenance, completeness, per-joint, combined and facing RED; zero captured poses |

The light and lifecycle transcripts were recorded before the final observer-only
assertion. The guarded syntax check and mutation batch used the code revision
above. No geometry or numerical acceptance rule changed afterward.

The provenance fixture has small test-only image derivatives and declarations,
with **no scene or bones**. Its kills establish provenance-validator sensitivity.
They do not certify character geometry or substitute for the four rendered
mutants. Every planted mutant was killed. Actual-source and rendered mutation
commands return failure while their control is red; unavailable mutants cannot
count as success.

Current acceptance rejects absent `scenes/char2.tscn` and
`characters/char2/parts.json`. The provenance group additionally reports every
missing required slot. All **15 committed Imagine sources authenticate**.
The planned slot tally is **0 usable + 4 merged + 9 split = 13 Imagine-derived
required slots**, from six required source files, plus **one SCRIPTED (flagged)**
satchel. Current observed runtime slot count is zero.

## Retained evidence

- `verification.json`: code hashes, individual exits and report UTC timestamps.
  JSON timestamps are report-emission times, not invented per-check start times.
- `provenance-fixture-mutants.json`: green control and all twelve specific kills.
- `provenance-mutants.json`: actual-source red control and unavailable scenarios.
- `../char2/body.json`, `body.poses.json`, `body.godot.txt` and `mutants.json`:
  the fresh actual control and four unavailable rendered mutants.
- `light-suite.txt`, `harness-policy.txt`, the three mutation transcripts and
  `char2-observer-syntax.txt`: command output.
- `red-first.*`: the earlier source-aware missing-rig admission; its complete
  650-pose plan/hash matches the fresh mutation control.
- `guarded-attempt-1.txt`, `guarded-attempt-147.txt` and
  `guarded-attempt-148.txt`: selected sanitized guard transcripts.
  Queued attempts 1–147 returned 75 before executing; attempt 148 then waited
  for the shared mutation lock before admission. No refused attempt is a test
  failure or a mutant kill.

Ephemeral paths are replaced by `<TMPDIR>`/`<REPO>`; guard owner names and
unrelated job arguments are omitted. Original transcripts remain unchanged in
private scratch. All frozen char2 geometry, facing vectors, N=200, seed=20261031
and pose values remain unchanged; the trenchcoat manifest is byte-identical.

## Reproduction

Run from the repository root with a private `TMPDIR`, Python/Pillow/NumPy,
Godot and Xvfb. Resolve the deployment's **absolute** heavy wrapper and shared
mutation lock. The installed wrapper accepts a command, not an option parser.
The private `-j2` adapter below supplies the two-worker environment while
preserving the required `heavy-run -j2 <command>` invocation. It changes no
installed wrapper, memory check, lock, quiet period or deadline.

```bash
export HEAVY_RUN="$(command -v heavy-run)"
export MUTATION_LOCK=/coord/engine-mutation.lock
mkdir -p "$TMPDIR/worker-adapter"
cat > "$TMPDIR/worker-adapter/-j2" <<'ADAPTER'
#!/usr/bin/env bash
set -euo pipefail
export MAKEFLAGS=-j2 OMP_NUM_THREADS=2 OPENBLAS_NUM_THREADS=2 LP_NUM_THREADS=2
exec "$@"
ADAPTER
chmod 755 "$TMPDIR/worker-adapter/-j2"
export PATH="$TMPDIR/worker-adapter:$PATH"
export TEST_PYTHON=python3 PYTHONDONTWRITEBYTECODE=1
export MAKEFLAGS=-j2 OMP_NUM_THREADS=2 OPENBLAS_NUM_THREADS=2 LP_NUM_THREADS=2
prototypes/imagine-cutout/tests/runner.sh oracle --character char2
python3 prototypes/imagine-cutout/tests/test_harness_policy.py
"$HEAVY_RUN" -j2 prototypes/imagine-cutout/tests/run_body_tests.sh --character char2
flock "$MUTATION_LOCK" "$HEAVY_RUN" -j2 python3 prototypes/imagine-cutout/tests/run_imagine_mutants.py --fixture --output prototypes/imagine-cutout/tests/results/char2-imagine/provenance-fixture-mutants.json
flock "$MUTATION_LOCK" "$HEAVY_RUN" -j2 python3 prototypes/imagine-cutout/tests/run_imagine_mutants.py --output prototypes/imagine-cutout/tests/results/char2-imagine/provenance-mutants.json
flock "$MUTATION_LOCK" "$HEAVY_RUN" -j2 prototypes/imagine-cutout/tests/runner.sh body-mutants --character char2
```

Run these sequentially. Exit 75 defers execution; exit 78 stops the session.
The last two commands currently return 1. Once the real rig is supplied,
acceptance must pass and all four rendered mutants must be KILLED.

The executed guarded batch used the same prefix with
`bash <TMPDIR>/char2-mutation-batch.sh`. It ran the following syntax preparation
and check first, then the three mutation commands above sequentially. Their
individual exits were 0/1/1. The final two 1s were explicitly required for this
missing-rig control; they were not converted into passing mutation results.
Literal deployment paths and the exact batch text are retained in the private
handoff.

For the isolated syntax check, copy the prototype with `tests/driver.py:clone`
to a fresh directory under `TMPDIR` (that helper sets the worker pool to two),
and set `SYNTAX_PROJECT` to that copy's prototype directory. With
`XDG_DATA_HOME`, `XDG_CONFIG_HOME` and `XDG_CACHE_HOME` beneath private scratch,
the checked command was:

```bash
(cd "$SYNTAX_PROJECT" && timeout --signal=TERM --kill-after=10 600 godot --headless --single-threaded-scene --path "$SYNTAX_PROJECT" --script res://tests/check_body_parts.gd --check-only)
```

That command ran **inside** the absolute heavy wrapper. Standalone repetition
must use the same guard. Its 600-second limit and 10-second termination grace
match the existing driver. Scratch was checked for core dumps before cleanup;
none were found. No timeout or deadline was raised or disabled. The parse check
does not exercise the new rendered-texture binding assertion without a real rig.

No new generation, paid service, production rig/tool or CI change was used.
