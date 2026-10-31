# Xvfb lock verification evidence

DECISION=FIX-CHANGE. Item **03 is GREEN**, as recorded by the verification
controller before this evidence review. The fixed harness passed both real-Xvfb
lifecycle checks; old harness `dffcb51` remains **RED** on both checks.
`verdict.txt` retains the controller-derived result and its original ledger/log
hashes. Those three hashes were checked against the supplied files before copying.

## Recorded attempts

Each item ran once; there were no controller retries. RED below describes a
command's outcome, including the deliberately red old-harness control.

| Item | Sanitized ledger command | rc | Attempts | Start UTC | End UTC | Result |
| --- | --- | --- | --- | --- | --- | --- |
| A1-probe | `heavy-run bash <REPO>/probe.sh` | 0 | 1 | 2026-10-31T21:38:55Z | 2026-10-31T21:39:01Z | GREEN: probe completed; real lock absent |
| A2-harness-policy | `heavy-run <PYTHON> prototypes/imagine-cutout/tests/test_harness_policy.py` | 1 | 1 | 2026-10-31T21:39:01Z | 2026-10-31T21:39:02Z | RED: both lifecycle checks failed at lock acquisition |
| C1-probe | `heavy-run bash <REPO>/probe.sh` | 0 | 1 | 2026-10-31T21:42:34Z | 2026-10-31T21:42:40Z | GREEN: real lock belongs to recorded PID |
| C2-harness-policy | `heavy-run <PYTHON> prototypes/imagine-cutout/tests/test_harness_policy.py` | 0 | 1 | 2026-10-31T21:42:40Z | 2026-10-31T21:42:41Z | GREEN: all three checks pass |
| C3-old-harness-baseline | `heavy-run <PYTHON> prototypes/imagine-cutout/tests/test_harness_policy.py --baseline dffcb51` | 1 | 1 | 2026-10-31T21:42:41Z | 2026-10-31T21:42:52Z | RED, expected: both lifecycle checks fail |

The stub's internal 2/4/1 policy attempts are separate from the single guarded
attempt of each ledger item. C2 ends with `Ran 3 tests in 0.759s` and `OK`,
with both Xvfb checks listed and no FAIL or ERROR. Both print recorded PID gone,
display lock gone and scratch removed, for normal exit and TERM respectively.
C3 ends with `FAILED (failures=5)`: both lifecycle checks fail at the recorded-PID
assertion; the three retry-policy subcases also fail. This old control does not
exercise the later lock assertion and does not demonstrate its cleanup behavior.

## Diagnosis and observed repair

The initial probe inherited desktop DISPLAY `:10.0`, while its consumer and
readiness file both selected `:0`. At 0, 0.5 and 2 seconds it records
`lock_from_DISPLAY: false`, `socket_from_DISPLAY: true`, and a live recorded
Xvfb PID `1610996`. The initial harness-policy failures match this observation:
`real X server did not acquire its lock`. The recorded PID is gone after the
probe runner exits.

The existing desktop lock and socket for display 10 are unchanged before and
after both probes: lock holder PID 43 remains alive with comm Xorg, owner
`<UID>` and mtime `1793137458`. No other X servers were listed before or after.
These read-only observations do not indicate a display collision or stale lock.
The consumer's DISPLAY matches the readiness number, excluding inheritance or
screen-suffix confusion in this observation. Lock absence persists for two seconds.

The verification controller header, probe, consumer and Xvfb all record mount
namespace `mnt:[4026535001]` and temporary-root device/inode `2097167:675086`.
The controller header was reviewed separately; consumer and environment records
are retained here. There is no recorded private-temporary-root mismatch.
Both stderr files contain only unresolved XF86 keysym warnings, ending with
`Errors from xkbcomp are not fatal to the X server`; runner output is empty.

The prior diagnosis identified X server `-displayfd` behavior disabling the
real lock. Change commit `4141db3e6a2dfa12b957945ee82ae51603d69882` replaces it
with one explicit display candidate and SIGUSR1 parent readiness. It refuses
existing lock/socket paths, retains the spawned PID, and uses that PID for
cleanup. No test assertion, timeout, deadline, sleep, wait or retry cap changed.

The fixed probe selects `:9547`; at all three observations its real lock text
is `1611942`, equal to `xvfb_pid`, and its socket exists while that PID is alive.
After normal runner exit the recorded PID is gone, and only the unchanged
desktop entries remain. The probe field `displayfd_number` is the unchanged
probe's name for the runner readiness-file value; the fixed runner uses a signal,
not a display fd. C2 supplies the separate normal-exit and TERM lifecycle proof.

## Provenance, sanitization and scope

`attempts.tsv` retains every ledger row with sanitized commands. The exact
original commands are retained in the private handoff. `<REPO>/probe.sh` stands
for the uncommitted verification probe; it is not a committed reproduction script.
`<PYTHON>` replaces the selected interpreter and its standard-library prefix.
`<TMPDIR>` replaces temporary paths, including the system temporary root in
lock/socket observations. `<HOST>` and `<UID>` replace host identity and user ID.
Test-owned Python child command arguments are omitted from timeout diagnostics;
trailing line whitespace is removed from copied attempt logs.
Other processes are represented only by recorded PID relationships and comm,
with no command arguments. All original logs and ledger were left unchanged.
`source-sha256.tsv` identifies their pre-sanitization contents; these hashes are
provenance identifiers and are not checksums of the sanitized copies.

This review performed only light file inspection, sanitization and commit checks.
It started no heavy command, probe, test, runner, X server or Godot. No mutants,
rig acceptance reruns or generation were performed. These results close the
observed item 03 lifecycle failure, without certifying unrelated acceptance work.
The final controller status and any review gate remain controller-owned.

The fix is a change-lane commit. This evidence and the TESTS.md update form a
separate tests-lane commit; no production or harness code is edited here.
