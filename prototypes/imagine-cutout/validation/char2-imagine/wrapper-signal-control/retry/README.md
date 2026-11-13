# Synthetic wrapper signal control

Synthetic wrapper TERM control only; NOT oracle, provenance, rendered-rig or mutant acceptance.

A private launcher imported the unmodified tools/validate_char2.py, selected an explicitly synthetic mode, and replaced only that mode's child command in memory with a private blocking Python fixture. The real wrapper main loop, signal handling, child process management, transcript sanitization and evidence persistence ran unchanged. The fixture never invoked Godot or any acceptance/mutation suite.

After the child wrote its own PID and readiness record, the controller sent TERM only to the wrapper PID it had started. Result: wrapper exit **143**, recorded child PID gone, sanitized transcript and interrupted attempt verification persisted, and private wrapper scratch retained. No existing timeout, deadline or guard was changed. The fixture scripts and raw audit stayed in private temporary storage.

Command description: python3 "$CONTROL_PRIVATE/control.py", with the private launcher importing tools/validate_char2.py and the synthetic child launched by python3 -c "import os,runpy; runpy.run_path(os.environ['CONTROL_CHILD'], run_name='__main__')".

See control.json, control-transcript.txt, and synthetic-term/verification.json. The synthetic attempt intentionally records exit 143 and passed: false; the controller's own passed: true certifies wrapper cleanup/persistence only. Empty report output is expected.
