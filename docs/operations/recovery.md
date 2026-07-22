# Recovery Guide

How to get My OS back after data loss, a bad update, or a machine rebuild.

## Restore the database from a backup

```powershell
scripts\ops\restore.ps1                      # restores the NEWEST backup (asks for confirmation)
scripts\ops\restore.ps1 -File backups\myos-20260722-020000.sql.gz
scripts\ops\restore.ps1 -Force               # skip the prompt (scripted recovery)
```

The restore is **destructive** (the dump uses `--clean --if-exists`) but it first takes a **fresh safety
backup** of the current state, so you can never make things worse. After it finishes:

```
docker compose -f infra/docker-compose.yml restart web worker
```

Bash: `scripts/ops/restore.sh [file]` (env `FORCE=1` to skip the prompt).

## Recover from a bad update

`update.ps1` always backs up **before** migrating. If an update leaves the app unhealthy:

1. Check logs: `docker compose -f infra/docker-compose.yml logs --tail=100 web worker migrate`.
2. Roll code back: `git checkout <previous-tag>` (e.g. `v1.0.0`), then `update.ps1` again, **or**
3. Restore the pre-update backup: `scripts\ops\restore.ps1` and restart.

Because migrations are **forward-only**, "rolling back schema" means **restore-from-backup** — that's
why every update takes a backup first.

## Full machine rebuild (new laptop / fresh Windows)

1. Install Docker Desktop; clone the repo.
2. Copy your `.env` back (or recreate it from `.env.example`).
3. Copy your `backups\` folder onto the new machine.
4. Start the stack: `docker compose -f infra/docker-compose.yml up -d --build` (creates an empty DB and
   runs migrations).
5. Restore your data: `scripts\ops\restore.ps1 -File backups\<latest>.sql.gz -Force`.
6. `docker compose ... restart web worker`, then re-run [Windows auto-start](windows-install.md).

## Recover a container (not data loss)

- A single crashed container auto-restarts (`restart: unless-stopped`). To force it:
  `docker compose -f infra/docker-compose.yml up -d --force-recreate <service>`.
- Corrupted images (rare): `docker compose ... build --no-cache <service>` then `up -d`.
- The `pgdata`/`caddy_*` volumes survive `down`, rebuilds, and image changes. Only `down -v` deletes
  them — avoid it.

## Verify recovery

```powershell
scripts\ops\status.ps1        # containers healthy + health endpoint ok
```

Open My OS and spot-check a page with your data (e.g. Tasks or Journal). Then take a fresh backup.
