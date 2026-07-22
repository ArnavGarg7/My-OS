# Troubleshooting Guide

Common issues and fixes for a personal deployment. Start every diagnosis with:

```powershell
scripts\ops\status.ps1
docker compose -f infra/docker-compose.yml logs --tail=100 web worker migrate postgres
```

## My OS won't open at http://localhost

- **Docker not ready.** After a reboot the engine takes a minute. Check `logs\startup.log`; confirm
  Docker Desktop is running.
- **Containers not up.** `docker compose -f infra/docker-compose.yml up -d`. Check `ps` for a service
  stuck `unhealthy`.
- **Port 80/443 in use.** Another app (IIS, Skype, another proxy) may hold the port. Stop it, or change
  Caddy's published ports in `docker-compose.yml`.

## `migrate` service failed / web won't start

- Read `docker compose ... logs migrate`. Web/worker **wait** on migrate succeeding, so a migration
  error blocks startup by design.
- Ensure Postgres is healthy first (`ps`). If the DB is fine but a migration errors, restore the latest
  backup ([Recovery](recovery.md)) and report the migration error — do not hand-edit applied migrations.

## Health endpoint returns "degraded" / db down

- Postgres isn't reachable. `docker compose ... restart postgres`, wait for `healthy`, then
  `restart web worker`.
- Disk full can stop Postgres — see below.

## Disk filling up

```powershell
scripts\ops\disk-check.sh          # or the disk line in status.ps1
docker system prune -f              # dangling images + build cache (safe)
```

Old backups auto-prune to 7. Logs auto-rotate. If still tight, `docker image prune -a -f` (images
rebuild on next `up`).

## Can't reach it from my phone / away from home

- **Same Wi-Fi:** use the PC's LAN IP (`ipconfig`) — `http://<ip>`. Windows Firewall may block inbound
  80/443; allow it for Docker, or just use the tunnel.
- **Away:** confirm the tunnel is running — `docker compose -f infra/docker-compose.yml --profile tunnel
  ps` shows `cloudflared`. Check `MYOS_TUNNEL_TOKEN` in `.env`; view `logs cloudflared`.
- **PWA won't install:** installation needs **HTTPS** — use the Cloudflare URL, not the LAN IP.

## Notifications not arriving

- Requires HTTPS (Cloudflare URL) + VAPID keys set in `.env` + permission granted. See
  [Notifications](notifications.md). On desktop, the browser/OS must allow notifications for the site.

## Update failed

`update.ps1` took a backup first — you're safe. Diagnose with the logs, roll code back to `v1.0.0`, or
restore the pre-update backup. Full playbook: [Upgrade](upgrade.md) + [Recovery](recovery.md).

## Dev pitfall: corrupted `.next`

Running a **production build** (`pnpm --filter @myos/web build`) against a **live `pnpm dev`** server
corrupts `.next` (Cannot find vendor-chunks/@clerk → queries hang). Fix: stop dev, `rm -rf
apps/web/.next`, restart. (Not relevant to the Docker deployment — the image builds in isolation.)

## Start clean (last resort, keeps data)

```
docker compose -f infra/docker-compose.yml down          # stop (pgdata volume preserved)
docker compose -f infra/docker-compose.yml up -d --build --force-recreate
```

Never add `-v` to `down` unless you intend to erase the database.
