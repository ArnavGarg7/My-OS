# Backup Guide

Your data lives in one place — the Postgres `pgdata` volume. Back it up daily; keep the last 7. Backups
stay **on your machine** (no cloud required).

## Manual backup

```powershell
scripts\ops\backup.ps1          # Windows
# or: bash scripts/ops/backup.sh
```

Writes `backups\myos-YYYYMMDD-HHMMSS.sql.gz` (a compressed, self-contained `pg_dump --clean --if-exists`)
and prunes to the newest 7. The `backups/` folder is gitignored.

Env overrides: `PG_CONTAINER` (default `myos-postgres-1`; use `myos-dev-postgres-1` for the dev DB),
`RETAIN` (default 7), `BACKUP_DIR` (default `.\backups`).

## Verify a backup (do this weekly)

A backup you can't restore is not a backup. Verify without touching live data:

```powershell
scripts\ops\verify-backup.ps1   # restores the newest backup into a throwaway DB, counts tables, drops it
```

Expect `OK - backup restored cleanly with N public tables.`

## Automate daily backups

**Task Scheduler (recommended):** create a daily task, e.g. at 02:00:

```powershell
$action  = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$PWD\scripts\ops\backup.ps1`""
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "My OS Daily Backup" -Action $action -Trigger $trigger `
  -Settings (New-ScheduledTaskSettingsSet -StartWhenAvailable) -Force
```

Run it from the repo root so the relative `backups\` path resolves there (or set `BACKUP_DIR` to an
absolute path in the action). Pair it with `verify-backup.ps1` weekly.

> The worker also owns a pg-boss cron seam for in-app backups (04 §11). The scripts above are the
> simple, external, always-available path and are what this guide recommends for a personal box.

## Where backups go / offsite (optional)

Everything is local by default (constraint: no cloud storage). If you *want* redundancy later, point
`BACKUP_DIR` at a synced folder (OneDrive/Drive/an external disk) — the scripts don't change. For a
single-user personal box, a local 7-day rotation plus the occasional copy to an external drive is
plenty.

## Restoring

See the [Recovery Guide](recovery.md).
