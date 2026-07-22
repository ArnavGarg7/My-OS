#!/usr/bin/env bash
# My OS — safe update workflow (Operations Sprint O1, Workstream 11).
# Updates a running deployment to a new version without risking data:
#   git pull → backup DB → build images → run migrations → start → health check.
# If the health check fails, your data is safe (a fresh backup was taken) and the previous images are
# still on disk to roll back to. Forward-only migrations apply automatically via the `migrate` service.
#
#   scripts/ops/update.sh
#
# Env: COMPOSE_FILE (infra/docker-compose.yml) · HEALTH_URL (http://localhost/api/health) · PROFILE ("")
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-infra/docker-compose.yml}"
HEALTH_URL="${HEALTH_URL:-http://localhost/api/health}"
PROFILE_ARGS=()
[ -n "${PROFILE:-}" ] && PROFILE_ARGS=(--profile "$PROFILE")

echo "== My OS update =="

echo "[1/6] git pull"
git pull --ff-only

echo "[2/6] backup database (safety net before any migration)"
"$(dirname "$0")/backup.sh"

echo "[3/6] build updated images"
docker compose -f "$COMPOSE_FILE" "${PROFILE_ARGS[@]}" build

echo "[4/6] apply migrations (one-shot migrate service) + start services"
# `up -d` runs the migrate service to completion first (web/worker depend on it), then (re)starts all.
docker compose -f "$COMPOSE_FILE" "${PROFILE_ARGS[@]}" up -d

echo "[5/6] wait for health"
ok=0
for i in $(seq 1 30); do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then ok=1; break; fi
  sleep 2
done

echo "[6/6] result"
if [ "$ok" = "1" ]; then
  curl -fsS "$HEALTH_URL" || true
  echo
  echo "[update] SUCCESS — My OS is online and healthy."
else
  echo "[update] WARNING — health check did not pass in time." >&2
  echo "         Your pre-update backup is in ./backups. Inspect logs:" >&2
  echo "         docker compose -f $COMPOSE_FILE logs --tail=100 web worker migrate" >&2
  echo "         To roll back, restore the latest backup: scripts/ops/restore.sh" >&2
  exit 1
fi
