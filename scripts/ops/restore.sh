#!/usr/bin/env bash
# My OS — database restore (Operations Sprint O1, Workstream 7).
# Restores a gzipped pg_dump backup into the Postgres container. DESTRUCTIVE: the dump was created with
# --clean --if-exists, so it drops and recreates objects before restoring. Requires explicit
# confirmation. Always takes a fresh safety backup first.
#
#   scripts/ops/restore.sh [path/to/backup.sql.gz]   # defaults to the newest backup
#
# Env: PG_CONTAINER (myos-postgres-1) · PG_USER (myos) · PG_DB (myos) · BACKUP_DIR (./backups)
#      FORCE=1 to skip the interactive prompt (for scripted recovery)
set -euo pipefail

PG_CONTAINER="${PG_CONTAINER:-myos-postgres-1}"
PG_USER="${PG_USER:-myos}"
PG_DB="${PG_DB:-myos}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

file="${1:-}"
if [ -z "$file" ]; then
  file="$(ls -1t "$BACKUP_DIR"/myos-*.sql.gz 2>/dev/null | head -1 || true)"
fi
if [ -z "$file" ] || [ ! -f "$file" ]; then
  echo "[restore] ERROR: no backup file found (looked in $BACKUP_DIR)" >&2
  exit 1
fi
if ! gzip -t "$file" 2>/dev/null; then
  echo "[restore] ERROR: $file is not a valid gzip archive" >&2
  exit 1
fi

echo "[restore] target DB '$PG_DB' in container '$PG_CONTAINER'"
echo "[restore] source   $file"
if [ "${FORCE:-0}" != "1" ]; then
  read -r -p "[restore] This OVERWRITES the current database. Type 'restore' to continue: " ans
  [ "$ans" = "restore" ] || { echo "[restore] aborted."; exit 1; }
fi

# Safety net: back up the current state before overwriting it.
echo "[restore] taking a safety backup of the current database first …"
PG_CONTAINER="$PG_CONTAINER" PG_USER="$PG_USER" PG_DB="$PG_DB" BACKUP_DIR="$BACKUP_DIR" \
  "$(dirname "$0")/backup.sh" || echo "[restore] WARN: safety backup failed; continuing per your confirmation."

echo "[restore] restoring …"
gunzip -c "$file" | docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -v ON_ERROR_STOP=1 >/dev/null

echo "[restore] done. Restart the app so it reconnects cleanly:"
echo "          docker compose -f infra/docker-compose.yml restart web worker"
