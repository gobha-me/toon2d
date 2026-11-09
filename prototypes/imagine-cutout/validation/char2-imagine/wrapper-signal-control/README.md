# Synthetic wrapper TERM control

This evidence checks wrapper lifecycle and persistence only. No oracle, Godot, real-rig, provenance or mutant acceptance ran.

The first control failed: TERM stopped the synthetic child but the wrapper deadlocked by calling Popen.wait inside a signal handler that had interrupted the same locked wait. The original failed result and private child transcript remain in first-control.json, first-control.md and first-child-transcript.txt.

The implementation correction makes the handler raise first; cleanup runs after the original wait unwinds. The exact same private controller and fixtures were retried with the same **15-second control bound** and the wrapper's unchanged **10-second child termination grace**.

Retry result: **PASS** — wrapper exit 143, recorded child PID stopped, sanitized transcript and interrupted attempt verification persisted, and private scratch retained. See retry/control.json and retry/README.md. The wrapper's synthetic attempt correctly records passed: false and exit 143; the separate controller pass certifies cleanup/persistence only. All fixture scripts and raw audits remain private.
