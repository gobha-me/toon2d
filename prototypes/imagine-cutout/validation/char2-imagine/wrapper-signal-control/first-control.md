# Failed first synthetic wrapper TERM control

This is wrapper lifecycle evidence only; no oracle, Godot, provenance or mutation suite ran.

The synthetic child reached readiness. TERM sent only to the recorded wrapper PID stopped its child, but the wrapper did not exit within the control's unchanged 15-second bound. The controller then killed only its own wrapper PID. Both recorded PIDs are gone, and private scratch remains. No wrapper attempt verification or public transcript was persisted before that termination; the private child transcript is copied here explicitly as first-child-transcript.txt.

Investigation found reentrant Popen.wait in the signal handler: the interrupted outer wait already held the same non-reentrant waitpid lock. The correction moves cleanup after the original wait stack unwinds. The controller bound and the wrapper's existing 10-second termination grace are retained unchanged for retry.
