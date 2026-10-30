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
export TMPDIR="/tmp/tween-tests-$(date -u +%Y%m%dT%H%M%S)-$$"
mkdir -p "$TMPDIR"
trap '"$python" -c '\''import os,shutil; shutil.rmtree(os.environ["TMPDIR"], ignore_errors=True)'\''' EXIT
export XDG_DATA_HOME="$TMPDIR/xdg-data" XDG_CONFIG_HOME="$TMPDIR/xdg-config" XDG_CACHE_HOME="$TMPDIR/xdg-cache"
export OMP_NUM_THREADS=2 OPENBLAS_NUM_THREADS=2 LP_NUM_THREADS=2 MESA_GLTHREAD=false
export PYTHONDONTWRITEBYTECODE=1
"$python" "$tests_dir/driver.py" "$@"
