# My OS — Operations (Personal Production Deployment)

This is the operations manual for running My OS as your **daily personal operating system** on your own
Windows machine, reachable from your laptop, your Android phone, and any browser away from home — at
**₹0/month** (no VPS, no cloud hosting). It wraps the frozen v1.0.0 application; it changes no product
code, schema, or architecture.

## What runs

Docker Compose starts five things (job queue is **pg-boss on Postgres — there is no Redis**):

| Service | Role |
| --- | --- |
| `migrate` | One-shot: applies forward-only DB migrations, then exits. |
| `postgres` | Database (pgvector/pg16). Your data lives here (volume `pgdata`). |
| `web` | Next.js app + tRPC API (port 3000, behind Caddy). |
| `worker` | pg-boss jobs, schedulers, notifications, backups. |
| `caddy` | Reverse proxy + auto-HTTPS + security headers (ports 80/443). |
| `cloudflared` | *(optional, `--profile tunnel`)* Free public HTTPS remote access. |

## Read these in order

1. [Personal Deployment Guide](deployment.md) — build and start the production stack.
2. [Windows Installation Guide](windows-install.md) — auto-start on boot, no terminal.
3. [Remote Access Guide](remote-access.md) — Cloudflare Tunnel vs Tailscale, and setup.
4. [Android Setup Guide](android-setup.md) — install the PWA on your phone.
5. [Backup Guide](backup.md) · [Recovery Guide](recovery.md) — protect and restore your data.
6. [Maintenance Guide](maintenance.md) · [Upgrade Guide](upgrade.md) — keep it healthy and current.
7. [Daily Usage Guide](daily-usage.md) · [Troubleshooting Guide](troubleshooting.md) — day-to-day.

## Reviews & report

- [Mobile / PWA readiness](mobile-pwa-review.md) (Workstream 5)
- [Notifications](notifications.md) (Workstream 6)
- [Security hardening](security-hardening.md) (Workstream 9)
- [O1 verification report](verification-report.md)

## Operational commands (cheat sheet)

```
# start / stop / status
docker compose -f infra/docker-compose.yml up -d          # start everything
docker compose -f infra/docker-compose.yml down           # stop (data persists)
scripts/ops/status.ps1                                     # health at a glance (PowerShell)

# data protection
scripts/ops/backup.ps1                                     # backup now (keeps last 7)
scripts/ops/verify-backup.ps1                              # prove the latest backup restores
scripts/ops/restore.ps1                                    # restore newest backup (destructive)

# updates
scripts/ops/update.ps1                                     # git pull -> backup -> build -> migrate -> health
```

Bash equivalents (`*.sh`) exist for every script for use from Git Bash / WSL / Linux.
