#!/usr/bin/env bash
# Release: bump/tag/push with bumpp, then clear the changes/ notes that this
# release consumed. The tag still contains the notes, so release notes read at
# the tag include them; deleting after the tag only affects later commits.
set -euo pipefail
cd "$(dirname "$0")/.."

PREV="$(git describe --tags --abbrev=0 --match 'v[0-9]*' 2>/dev/null || true)"
bumpp "$@"

if [ -z "$PREV" ]; then
  echo "No previous tag; skipped changes/ cleanup."
  exit 0
fi
vpx scripts/changes.ts --clean --base "$PREV"
if git diff --quiet -- changes; then
  exit 0
fi
git add -A changes
git commit --no-verify -m "chore(release): clear released changes notes" -- changes
git push
