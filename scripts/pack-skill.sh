#!/usr/bin/env bash
# Build the release tarball of the runtime-animation skill.
# Usage: bash scripts/pack-skill.sh [OUT.tgz]   (default: toon2d-skill-<version>.tgz in the repo root)
# Ships the skill directory only. Excludes evals/ (grader and fixtures stay hidden from cold runs)
# and any internal work-state notes (STATE.md).
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION=$(node -p "require('./package.json').version")
OUT=${1:-toon2d-skill-${VERSION}.tgz}
case "$OUT" in /*) ;; *) OUT="$PWD/$OUT" ;; esac
tar -C skills --exclude='toon2d-runtime-animation/evals' --exclude='STATE.md' \
  -czf "$OUT" toon2d-runtime-animation
echo "$OUT"
sha256sum "$OUT"
