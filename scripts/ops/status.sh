#!/usr/bin/env bash
# My OS — service status (Operations Sprint O1, Workstream 8).
# One-glance operational status: container state + health, the app health endpoint, backup freshness,
# and disk usage. Read-only. Use as your "is everything OK?" check.
#
#   scripts/ops/status.sh
set -uo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-infra/docker-compose.yml}"
HEALTH_URL="${HEALTH_URL:-http://localhost/api/health}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

echo "== My OS status — $(date '+%Y-%m-%d %H:%M:%S') =="

echo
echo "-- containers --"
docker compose -f "$COMPOSE_FILE" ps 2>/dev/null || echo "(compose not running)"

echo
echo "-- app health --"
if curl -fsS "$HEALTH_URL" 2>/dev/null; then echo; else echo "UNREACHABLE ($HEALTH_URL)"; fi

echo
echo "-- backups --"
if ls -1t "$BACKUP_DIR"/myos-*.sql.gz >/dev/null 2>&1; then
  latest="$(ls -1t "$BACKUP_DIR"/myos-*.sql.gz | head -1)"
  n="$(ls -1 "$BACKUP_DIR"/myos-*.sql.gz | wc -l | tr -d ' ')"
  echo "latest: $latest ($(du -h "$latest" | cut -f1)), $n total"
else
  echo "no backups found in $BACKUP_DIR — run scripts/ops/backup.sh"
fi

echo
echo "-- disk --"
"$(dirname "$0")/disk-check.sh" || true
