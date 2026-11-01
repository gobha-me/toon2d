# Deferred suite verification evidence

Tested source: `f3418a43e865d61af21e8d2618a91a53aacc13a1`.
The launcher executed the suites. This evidence-only phase read its ledger,
per-attempt logs, verdict and final results snapshot; it executed no test,
runner, suite, mutation driver or Godot process.

The launcher verdict is **PASS**, with **F1=PASS, F2=PASS, F3=PASS** and
**PUSHGATE=OPEN** as recorded in its verdict file. `STATUS` was not supplied
in that file; the launcher's final scope and hygiene checks occur after this
phase. No final launcher status is inferred, and no push was performed.
The retained verdict uses the neutral key `verification` for the overall result.

| Item | Launcher result | rc | Attempts | Start UTC | End UTC | Exact ledger command |
|---|---|---|---|---|---|---|
| F1-trenchcoat-legacy | PASS | 0 | 1 | 2026-11-01T03:18:57Z | 2026-11-01T03:19:13Z | `TEST_PYTHON="$TOON_PYTHON" heavy-run prototypes/imagine-cutout/tests/run_tests.sh` |
| F2-body | PASS | 0 | 1 | 2026-11-01T03:19:13Z | 2026-11-01T03:21:25Z | `TEST_PYTHON="$TOON_PYTHON" heavy-run prototypes/imagine-cutout/tests/run_body_tests.sh` |
| F3-mutants | PASS | 0 | 1 | 2026-11-01T03:21:25Z | 2026-11-01T03:25:07Z | `TEST_PYTHON="$TOON_PYTHON" heavy-run prototypes/imagine-cutout/tests/run_mutants.sh` |

Each item has one recorded attempt, note `ran`, and a heavy-run holding-slot
line in its attempt log. There are no deferred or NOT-RUN suite items in the
supplied verdict. Any NOT-RUN result must remain deferred rather than passed.

## Observations retained from the launcher

- F1: original tests 1-5 pass; all 84 HD/pixel joint-limit observations have
  zero gap pixels and nonempty stencils in `snapshot/real.json`.
- F2: manifest, completeness, per-joint, combined and facing checks each report
  zero failures in `body.a1.log`; its pose plan contains 42 single, 840 pairwise
  and 200 random poses, with seed 20261030.
- F3: a, b, d, e, f, g and h are KILLED. Mutant c is explicitly SKIPPED for
  missing raw Segments PNG inputs, including `original.png`; it is not killed
  or passed. This is the controlled skip accepted by the launcher for F3.
- The final body JSON is the fresh baseline inside F3, timestamped
  `2026-11-01T03:24:30.987417+00:00`, rather than a separate retained F2 JSON.
  Its historical filename `snapshot/body-parts/red-first.json` does not describe
  its current result: full acceptance passes, with 882 single-pose and 21,840
  combined-pose seam observations, zero gap pixels, and all 82 facing samples
  passing. The manifest and pose hashes remain in that JSON.
- Mutant JSON results are intentionally failing observations that support kills.
  The body mutant summary records e's missing head slot, f's 82 newly failing
  facing samples, g's four new completeness cases, and h's two worsened elbow
  seams (0 to 124 and 0 to 140 gap pixels; 1,127 shared pixels removed).
  The unresolved hair/knee animation-track warnings in the corresponding
  logs belong to those planted missing-bone mutants and are retained.

## Evidence handling

`LEDGER.tsv` preserves the source ledger bytes and exact commands.
`legacy.a1.log`, `body.a1.log` and `mutants.a1.log` retain all attempt output.
`snapshot/` retains every supplied snapshot file without regenerating results.
ANSI formatting and trailing whitespace are stripped from logs, temporary directory identifiers become
stable placeholders, and holding-slot host identities become `<HOST>`.
JSON observations, errors, tolerances, kill criteria and timestamps are retained.
`SHA256.json` records original-source and retained-file hashes; source identifiers
are neutral evidence roles and relative filenames.

No assertions, tolerances, manifests, test code, or harnesses were changed.
Only this evidence directory and the prototype's TESTS.md are updated.
