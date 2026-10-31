#!/usr/bin/env bash
set -euo pipefail
tests_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo=$(cd -- "$tests_dir/../../.." && pwd)
python=${TEST_PYTHON:-"$repo/.venv/bin/python"}
hour=$(TZ=America/New_York date +%H%M)
if (( 10#$hour >= 2355 || 10#$hour < 300 )); then
  echo 'Quiet hours: no test starts between 23:55 and 03:00 ET.' >&2
  exit 76
fi
for mount in "$repo" /tmp; do
  available=$(df -Pk "$mount" | awk 'NR==2 {print $4}')
  if (( available < 5242880 )); then echo "Under 5 GiB free: $mount" >&2; exit 77; fi
done
export TMPDIR=$(mktemp -d /tmp/"tween-tests-XXXXXXXX")
child_pid=
xvfb_pid=
cleanup() {
  status=$?
  trap - EXIT INT TERM
  if [[ -n "$child_pid" ]]; then
    kill -TERM "$child_pid" 2>/dev/null || true
    wait "$child_pid" 2>/dev/null || true
  fi
  if [[ -n "$xvfb_pid" ]]; then
    kill -TERM "$xvfb_pid" 2>/dev/null || true
    wait "$xvfb_pid" 2>/dev/null || true
  fi
  "$python" -c 'import os,shutil; shutil.rmtree(os.environ["TMPDIR"], ignore_errors=True)'
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
# The shell owns this child throughout its lifetime; no process discovery.
Xvfb -displayfd 3 -nolisten tcp 3>"$TMPDIR/display" >"$TMPDIR/xvfb.txt" 2>&1 &
xvfb_pid=$!
printf '%s\n' "$xvfb_pid" >"$TMPDIR/xvfb.pid"
for ((attempt=0; attempt<100; attempt++)); do
  [[ -s "$TMPDIR/display" ]] && break
  kill -0 "$xvfb_pid" 2>/dev/null || { echo 'Xvfb exited before readiness' >&2; exit 2; }
  sleep 0.05
done
[[ -s "$TMPDIR/display" ]] || { echo 'Xvfb readiness timeout' >&2; exit 2; }
export DISPLAY=":$(cat "$TMPDIR/display")"
export XDG_DATA_HOME="$TMPDIR/xdg-data" XDG_CONFIG_HOME="$TMPDIR/xdg-config" XDG_CACHE_HOME="$TMPDIR/xdg-cache"
export OMP_NUM_THREADS=2 OPENBLAS_NUM_THREADS=2 LP_NUM_THREADS=2 MESA_GLTHREAD=false
export MAKEFLAGS=-j2
export PYTHONDONTWRITEBYTECODE=1
driver_script="$tests_dir/driver.py"
# Clip modes have a separate observer and leave every existing mode untouched.
if [[ ${1:-} == clips || ${1:-} == clip-mutants ]]; then
  driver_script="$tests_dir/clip_driver.py"
fi
"$python" "$driver_script" "$@" &
child_pid=$!
status=0
wait "$child_pid" || status=$?
child_pid=
exit "$status"
