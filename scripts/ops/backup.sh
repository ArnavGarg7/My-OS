#!/usr/bin/env bash
# My OS — database backup (Operations Sprint O1, Workstream 7).
# Daily-friendly pg_dump of the Postgres container to a local, gzipped, timestamped file. Retains the
# last N backups. Local storage only — no cloud. Idempotent and safe to run any time (dumps are
# read-only). Configure via env vars; defaults target the production compose stack.
#
#   scripts/ops/backup.sh
#
# Env: PG_CONTAINER (myos-postgres-1) · PG_USER (myos) · PG_DB (myos) · BACKUP_DIR (./backups) · RETAIN (7)
set -euo pipefail

PG_CONTAINER="${PG_CONTAINER:-myos-postgres-1}"
PG_USER="${PG_USER:-myos}"
PG_DB="${PG_DB:-myos}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETAIN="${RETAIN:-7}"

mkdir -p "$BACKUP_DIR"
stamp="$(date +%Y%m%d-%H%M%S)"
out="$BACKUP_DIR/myos-$stamp.sql.gz"

echo "[backup] dumping database '$PG_DB' from container '$PG_CONTAINER' …"
# --clean --if-exists makes the dump self-contained and restorable into an existing DB.
docker exec "$PG_CONTAINER" pg_dump -U "$PG_USER" -d "$PG_DB" --clean --if-exists \
  | gzip -9 > "$out"

# Verify the artifact is non-empty and a valid gzip stream.
if [ ! -s "$out" ] || ! gzip -t "$out" 2>/dev/null; then
  echo "[backup] ERROR: backup failed verification, removing $out" >&2
  rm -f "$out"
  exit 1
fi

size="$(du -h "$out" | cut -f1)"
echo "[backup] wrote $out ($size)"

# Retention: keep the newest $RETAIN, delete older ones.
mapfile -t all < <(ls -1t "$BACKUP_DIR"/myos-*.sql.gz 2>/dev/null || true)
if [ "${#all[@]}" -gt "$RETAIN" ]; then
  for old in "${all[@]:$RETAIN}"; do
    echo "[backup] pruning old backup $old"
    rm -f "$old"
  done
fi

echo "[backup] done. ${#all[@]} backup(s) present (retaining $RETAIN)."
