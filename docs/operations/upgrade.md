# Upgrade Guide

Move to a new version (v1.0.1, v1.1.0, …) safely, without risking your data. This is Workstream 11's
zero-downtime-minded update flow.

## The flow

```
git pull  →  backup database  →  build images  →  run migrations  →  health check  →  online
```

One command does all of it:

```powershell
scripts\ops\update.ps1        # Windows
# or: bash scripts/ops/update.sh
```

Which runs:

1. **`git pull --ff-only`** — fetch the new version (fast-forward only; no surprise merges).
2. **`backup.ps1`** — a fresh, verified backup **before** anything changes. This is your rollback point.
3. **`docker compose build`** — build the updated web/worker/migrate images.
4. **`docker compose up -d`** — the one-shot `migrate` service applies new forward-only migrations to
   completion, then web + worker (re)start against the current schema.
5. **Health check** — polls `/api/health` for up to a minute.
6. **Result** — prints success, or tells you exactly how to inspect logs and roll back.

With the tunnel: `PROFILE=tunnel` (bash) or `$env:PROFILE="tunnel"` (PowerShell) before running.

## Why "backup before migrate" matters

Migrations are **forward-only** — there are no down-migrations. If a new migration or build misbehaves,
recovery is **restore-from-backup**, and step 2 guarantees you always have a just-taken one. Your data
is never on the line.

## If an update fails the health check

`update` exits non-zero and leaves clear instructions. In short:

```
docker compose -f infra/docker-compose.yml logs --tail=100 web worker migrate   # diagnose
git checkout v1.0.0            # roll code back to the last good tag
scripts\ops\update.ps1        # rebuild the previous version
# if the schema was already migrated forward and the old code can't read it:
scripts\ops\restore.ps1       # restore the pre-update backup, then restart
```

See the [Recovery Guide](recovery.md) for the full rollback playbook.

## Downtime

The web container restarts during `up -d`, so there's a brief (seconds) blip — acceptable for a
single-user personal deployment. True zero-downtime (blue/green) is unnecessary here and would add
complexity this sprint intentionally avoids. Your **data** has zero risk either way.

## After upgrading

```powershell
scripts\ops\status.ps1        # confirm healthy
```

Reinstall/refresh the PWA on your phone if prompted (the in-app update banner also appears).
