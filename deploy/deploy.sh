#!/usr/bin/env bash
# Example: build dist/ and apply generic manifests.
# Replace NAMESPACE / APP_NAME / EXAMPLE_HOST before use. No credentials here.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NS="${NAMESPACE:-demo}"
APP="${APP_NAME:-toon2d-demo}"
HOST="${EXAMPLE_HOST:-example.com}"

if [[ "${1:-}" == "--teardown" ]]; then
  echo "teardown: no deployed demo resources are managed by this placeholder script." >&2
  echo "Refusing to exit 0 so CI/scripts do not treat a no-op as success." >&2
  exit 2
fi

echo "Build dist/ first (see package.json / scripts). Then adapt manifests under deploy/"
echo "Placeholders: NAMESPACE=$NS APP_NAME=$APP EXAMPLE_HOST=$HOST"
echo "This script does not apply anything by default."
exit 0
