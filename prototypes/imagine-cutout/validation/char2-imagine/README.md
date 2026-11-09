# Imagine courier verification

This directory records the conversion of the inherited procedural courier to
supplied Grok Imagine artwork for issue #18. Test sources, manifests and old
red-first reports remain unchanged. The earlier `validation/char2-rig/` evidence
judged a procedural character and does not certify this conversion.

- `before-conversion-provenance.json`: actual inherited kit is RED with 174
  provenance errors while all 15 supplied source files authenticate. This is a
  provenance-only observation; it starts no Godot process.
- `oracle/` and `oracle-2/`: 23/23 independent source/oracle controls PASS.
- `harness/` and `harness-2/`: 3/3 lifecycle/policy controls PASS.
- `wrapper-signal-control/`: the synthetic TERM control initially found a wait
  deadlock; the unchanged 15-second control passes after correction. It verifies
  lifecycle/persistence only and cannot certify a rig.
- `verification.json`: latest wrapper invocation; each attempt also retains its
  own `verification.json` with timestamps, commands, return codes and input hashes.

Source fitting/baking, visual review, full 650-pose acceptance and the real
mutant suites are pending shared guarded admission. No deferred command is
counted as a pass. Required completion is a green full baseline, 4/4 rendered
mutants KILLED and 12/12 actual-source provenance mutants KILLED.

`tools/validate_char2.py` runs existing tests in isolated copies and copies their
reports here. It verifies the rendered mutant baseline independently of the
mutant command return code. No tolerance, pose plan, assertion or deadline is
changed. Direct build children retain cores; the immutable test harness may
remove its own nested scratch before the outer validator regains control, as
noted in PR #29. Any observed crash requires investigation.
