#!/usr/bin/env bash
set -euo pipefail
tests_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
exec "$tests_dir/runner.sh" suite "$@"
