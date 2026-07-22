#!/usr/bin/env bash
# My OS — backup verification (Operations Sprint O1, Workstream 7).
# Proves a backup is actually restorable by restoring it into a throwaway database inside the same
# Postgres container, counting the restored tables, then dropping the scratch database. Never touches
# the live database. Run this weekly (or after any backup change) to trust your backups.
#
#   scripts/ops/verify-backup.sh [path/to/backup.sql.gz]   # defaults to the newest backup
set -euo pipefail

PG_CONTAINER="${PG_CONTAINER:-myos-postgres-1}"
PG_USER="${PG_USER:-myos}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
SCRATCH_DB="myos_verify_$$"

file="${1:-}"
if [ -z "$file" ]; then
  file="$(ls -1t "$BACKUP_DIR"/myos-*.sql.gz 2>/dev/null | head -1 || true)"
fi
[ -n "$file" ] && [ -f "$file" ] || { echo "[verify] ERROR: no backup found in $BACKUP_DIR" >&2; exit 1; }

echo "[verify] archive integrity: $file"
gzip -t "$file" || { echo "[verify] ERROR: corrupt gzip" >&2; exit 1; }

cleanup() { docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$SCRATCH_DB\";" >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "[verify] restoring into scratch database '$SCRATCH_DB' …"
docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d postgres -c "CREATE DATABASE \"$SCRATCH_DB\";" >/dev/null
# Extensions the schema relies on must exist in the scratch DB before the dump loads.
docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$SCRATCH_DB" -c "CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS citext;" >/dev/null 2>&1 || true
gunzip -c "$file" | docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$SCRATCH_DB" >/dev/null 2>&1

count="$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$SCRATCH_DB" -tAc \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")"
count="$(echo "$count" | tr -d '[:space:]')"

if [ "${count:-0}" -gt 0 ]; then
  echo "[verify] OK — backup restored cleanly with $count public tables."
else
  echo "[verify] ERROR — restore produced 0 tables; backup is NOT trustworthy." >&2
  exit 1
fi
