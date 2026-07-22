#!/usr/bin/env bash
# My OS — disk usage monitor (Operations Sprint O1, Workstream 8).
# Reports free space on the filesystem holding the repo/backups and the size of the Docker footprint.
# Warns (exit 1) when free space on the working filesystem drops below THRESHOLD_PCT.
#
#   scripts/ops/disk-check.sh
#
# Env: THRESHOLD_PCT (used% above which to warn, default 85)
set -uo pipefail

THRESHOLD_PCT="${THRESHOLD_PCT:-85}"

# Used% of the filesystem containing the current directory.
line="$(df -P . | awk 'NR==2')"
used_pct="$(echo "$line" | awk '{gsub("%","",$5); print $5}')"
avail="$(echo "$line" | awk '{print $4}')"
echo "working filesystem: ${used_pct}% used, ${avail} blocks free"

# Docker disk usage (images/containers/volumes/build cache).
if command -v docker >/dev/null 2>&1; then
  echo "docker footprint:"
  docker system df 2>/dev/null | sed 's/^/  /' || true
fi

if [ "${used_pct:-0}" -ge "$THRESHOLD_PCT" ]; then
  echo "WARNING: disk ${used_pct}% used (threshold ${THRESHOLD_PCT}%). Free space:" >&2
  echo "  - prune old backups (kept automatically, but check ./backups)" >&2
  echo "  - docker system prune -f   # removes dangling images/build cache" >&2
  exit 1
fi
echo "disk OK (below ${THRESHOLD_PCT}% threshold)."
