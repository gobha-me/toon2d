# Verification evidence review

Launcher STATUS=COMPLETE. Overall verification: **FAIL**, due to item 03. COMPLETE means all scheduled commands finished, not that every check passed.
Base: 3c514a1e9067102c4f0af5d1e266f513a6644df2.
Phase A UTC window: 2026-10-31T12:26:50Z to 2026-10-31T12:33:14Z.
Eight items: 5 PASS, 2 expected-RED, 1 FAIL, 0 still-deferred, 0 not-run. Each had exactly one launcher attempt; no launcher 75/79 retries or 78 stop occurred.

Phase B reviewed existing ledger, per-attempt logs and generated evidence only. No heavy command, test, runner, comparison helper or Godot was executed in Phase B. No assertion, tolerance, oracle, manifest, test code or kill criterion was edited.

## 01-old-harness-baseline: expected-RED

rc: 1; attempts: 1 (attempt 1, note: ran).
UTC start: 2026-10-31T12:26:50Z; UTC end: 2026-10-31T12:27:01Z.

Exact launcher command (copied from ledger):

```bash
heavy-run $TEST_PYTHON prototypes/imagine-cutout/tests/test_harness_policy.py --baseline dffcb51
```

Old harness dffcb51 reproduced five failures across three tests: injected retry interval/cap ignored in two cases, exit 78 returned 1, and no recorded Xvfb PID on normal exit or TERM. This is the requested red-first baseline.

Evidence: `01-old-harness-baseline.a1.log`.

## 02-char2-red-first: expected-RED

rc: 1; attempts: 1 (attempt 1, note: ran).
UTC start: 2026-10-31T12:27:01Z; UTC end: 2026-10-31T12:27:02Z.

Exact launcher command (copied from ledger):

```bash
TEST_PYTHON=$TEST_PYTHON heavy-run prototypes/imagine-cutout/tests/run_body_tests.sh --character char2 --output prototypes/imagine-cutout/tests/results/char2/red-first.json
```

Manifest PASS; completeness, per_joint, combined and facing RED because scenes/char2.tscn and characters/char2/parts.json are missing. Captured poses: 0. The 30 single + 420 pair + 200 random poses are a plan, not captured evidence.

Evidence: `02-char2-red-first.a1.log`.

## 03-harness-policy: FAIL

rc: 1; attempts: 1 (attempt 1, note: ran).
UTC start: 2026-10-31T12:27:02Z; UTC end: 2026-10-31T12:27:08Z.

Exact launcher command (copied from ledger):

```bash
heavy-run $TEST_PYTHON prototypes/imagine-cutout/tests/test_harness_policy.py
```

Unexpected failure: both Xvfb normal-exit and TERM lifecycle checks failed at the prerequisite "real X server did not acquire its lock". Cleanup/no-orphan success is therefore unproved. The driver retry-policy control passed: stub [75,0] -> rc 0 / 2 calls; [75] -> rc 79 / 4 calls; [78] -> rc 78 / 1 call. Those are internal stub calls, not launcher attempts. The available log does not establish why the lock was absent; retain FAIL without changing the test or guessing a cause.

Evidence: `03-harness-policy.a1.log`.

## 04-oracle: PASS

rc: 0; attempts: 1 (attempt 1, note: ran).
UTC start: 2026-10-31T12:27:08Z; UTC end: 2026-10-31T12:27:09Z.

Exact launcher command (copied from ledger):

```bash
TEST_PYTHON=$TEST_PYTHON heavy-run prototypes/imagine-cutout/tests/runner.sh oracle
```

All six frozen-oracle, exhaustive-pose coverage and character-index schema controls passed.

Evidence: `04-oracle.a1.log`.

## 05-trenchcoat-legacy: PASS

rc: 0; attempts: 1 (attempt 1, note: ran).
UTC start: 2026-10-31T12:27:09Z; UTC end: 2026-10-31T12:27:25Z.

Exact launcher command (copied from ledger):

```bash
TEST_PYTHON=$TEST_PYTHON heavy-run prototypes/imagine-cutout/tests/run_tests.sh --character trenchcoat
```

Legacy tests 1-5 passed for HD and pixel modes, with zero joint gaps and nonempty stencils at all reported limits.

Evidence: `05-trenchcoat-legacy.a1.log`.

## 06-trenchcoat-body: PASS

rc: 0; attempts: 1 (attempt 1, note: ran).
UTC start: 2026-10-31T12:27:25Z; UTC end: 2026-10-31T12:29:36Z.

Exact launcher command (copied from ledger):

```bash
TEST_PYTHON=$TEST_PYTHON heavy-run prototypes/imagine-cutout/tests/run_body_tests.sh --character trenchcoat
```

Manifest, completeness, per_joint, combined and facing passed. Full pose plan: 42 single + 840 pair + 200 random = 1,082 poses.

Evidence: `06-trenchcoat-body.a1.log`.

## 07-verdict-compare: PASS

rc: 0; attempts: 1 (attempt 1, note: ran).
UTC start: 2026-10-31T12:29:36Z; UTC end: 2026-10-31T12:29:37Z.

Exact launcher command (copied from ledger):

```bash
heavy-run $TEST_PYTHON prototypes/imagine-cutout/tests/compare_body_verdicts.py
```

Fresh trenchcoat verdict bytes and pose hash match retained validation/v2/body/body-parts/red-first.json. Body rc 0 at 12:29:36Z satisfied the comparison prerequisite before it started.

Evidence: `07-verdict-compare.a1.log`.

## 08-trenchcoat-mutants: PASS

rc: 0; attempts: 1 (attempt 1, note: ran).
UTC start: 2026-10-31T12:29:37Z; UTC end: 2026-10-31T12:33:14Z.

Exact launcher command (copied from ledger):

```bash
TEST_PYTHON=$TEST_PYTHON heavy-run prototypes/imagine-cutout/tests/run_mutants.sh --character trenchcoat
```

Seven mutants KILLED: a,b,d,e,f,g,h. Mutant c is explicitly SKIPPED (not-run, not a kill): raw Segments PNG inputs including original.png are absent. Mutant h increased right_fore gaps from 0 to 124 / 140. The aggregate rc 0 permits this explicit skip; it does not mean all eight were planted.

Evidence: `08-trenchcoat-mutants.a1.log`.

## Unavailable work and evidence limits

Char2 mutants: **not-run / CANNOT_PLANT** pending the rig and declaration. No char2-mutant command appears in the launcher ledger: exact executed command = none, rc = N/A, attempts = 0, start/end UTC = N/A. This is an unscheduled limitation, not a ninth executed item or a kill. Its state was reviewed against the completed 2026-10-31T12:26:50Z to 2026-10-31T12:33:14Z evidence window.

Mutant c: not-run / explicit SKIP within item 08, no separate command or rc; parent invocation rc 0, attempts 1, UTC 2026-10-31T12:29:37Z to 2026-10-31T12:33:14Z. No per-mutant timestamps are recorded.

The provided mutant log shows sequential results but contains no launcher process-check transcripts or boundary-check timestamps. This review cannot independently certify those checks from the provided logs. It does not infer an overlap.

The unexpected harness failure leaves M1 lifecycle proof and the rig evidence gate unresolved. Existing earlier deferral transcripts remain historical evidence; the classifications above supersede their pending runtime status. No rerun was attempted in Phase B.

## Retention

LEDGER.tsv and STATUS are copied unchanged. Attempt logs retain their output with repository, scratch and machine identity replaced by <REPO>, <SCRATCH> and <HOST>. Trailing whitespace in retained text output is normalized. source-log-sha256.json contains hashes of the original local logs for provenance. Generated char2 and trenchcoat result files are retained in their sibling directories without changing acceptance data.
