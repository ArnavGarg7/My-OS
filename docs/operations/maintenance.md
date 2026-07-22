# Maintenance Guide

Small, occasional habits that keep a personal deployment healthy for years.

## Daily (automatic)

- **Backups** run via the scheduled task ([Backup Guide](backup.md)).
- **Containers** self-heal (`restart: unless-stopped`) and are health-checked.
- **Logs** rotate automatically (json-file, 10 MB × 5 per container) — they can't fill your disk.

## Weekly (2 minutes)

```powershell
scripts\ops\status.ps1          # everything healthy? backups fresh? disk OK?
scripts\ops\verify-backup.ps1   # prove the latest backup actually restores
```

## Monthly (5 minutes)

- **Update** to the latest version: [Upgrade Guide](upgrade.md).
- **Reclaim disk** if `status` warns:
  ```
  docker system prune -f            # remove dangling images + build cache (safe)
  docker image prune -a -f          # remove ALL unused images (rebuild on next up)
  ```
- **Check disk headroom:** `scripts\ops\disk-check.sh` (or the disk line in `status.ps1`). Keep the
  working drive under ~85% used.

## Health & monitoring surfaces

- **App health endpoint:** `GET /api/health` → `{"status":"ok","db":"up"}` (503 when the DB is down).
  Caddy and `status.ps1` both use it.
- **Container health:** `docker compose -f infra/docker-compose.yml ps` shows `healthy`/`unhealthy` per
  service (postgres, web, worker all have healthchecks).
- **Worker heartbeat:** the worker logs a heartbeat every 60 s — `docker compose ... logs -f worker`.
- **Service status page:** `scripts\ops\status.ps1` is the single pane (containers + health + backups +
  disk).

## Secrets rotation

- Rotate `POSTGRES_PASSWORD`, `MYOS_*_SECRET`, and AI keys periodically by editing `.env` and
  `docker compose ... up -d` (recreates affected services). Note: changing `MYOS_CONNECTOR_SECRET` or
  `MYOS_AI_CREDENTIALS_SECRET` makes previously-encrypted credentials unreadable — re-enter connector /
  AI credentials in the app after rotating those.
- If any secret is ever exposed, rotate it immediately and never commit it (it lives only in `.env`).

## What NOT to do

- Don't run `docker compose ... down -v` (deletes your database volume).
- Don't run a production build against a live `pnpm dev` server (corrupts `.next`; see
  [Troubleshooting](troubleshooting.md)).
- Don't edit migrations that have already been applied — they're forward-only.
