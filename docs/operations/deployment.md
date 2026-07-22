# Personal Deployment Guide

Bring My OS up as a production stack on your own machine. One-time setup, then it runs itself.

## Prerequisites

- **Docker Desktop** (Windows) with the WSL2 backend, running.
- This repository cloned locally (e.g. `D:\Projects\My OS`).
- ~2 GB free disk for images + your data + backups.

## 1. Configure secrets

```
cp .env.example .env
```

Edit `.env` and set at minimum:

- `POSTGRES_PASSWORD` — a strong password (the default `myos` is fine for a purely local box, but set
  a real one if you enable remote access).
- `MYOS_DOMAIN` — `localhost` for local-only; your Cloudflare hostname (e.g. `myos.example.com`) if you
  use the tunnel.
- `MYOS_APP_URL` — `http://localhost` locally, or `https://<your-domain>` with remote access.
- **Optional:** `MYOS_AI_CREDENTIALS_SECRET`, `MYOS_CONNECTOR_SECRET` (32+ chars each — generate with
  `openssl rand -base64 48`), AI provider keys, VAPID keys for push. All optional: the OS runs fully on
  the offline Local AI provider with none of them.

Secrets live **only** in `.env` (gitignored). Never commit them.

## 2. Start the stack

```
docker compose -f infra/docker-compose.yml up -d --build
```

This builds the web/worker/migrate images, runs migrations to completion, then starts postgres, web,
worker, and caddy. First build takes a few minutes; subsequent starts are seconds.

## 3. Verify

```
scripts/ops/status.ps1
```

Expect all containers `running`/`healthy` and the health endpoint returning `{"status":"ok","db":"up"}`.
Open **http://localhost** — you should see My OS. (Caddy serves plain HTTP on `localhost`; HTTPS is
automatic once `MYOS_DOMAIN` is a real domain, or via the Cloudflare tunnel.)

## 4. Make it automatic (recommended)

Follow the [Windows Installation Guide](windows-install.md) so the stack starts at logon with no
terminal. Then set up your first backup and (optionally) remote access.

## Stopping / restarting

```
docker compose -f infra/docker-compose.yml down      # stop; your data persists in the pgdata volume
docker compose -f infra/docker-compose.yml up -d      # start again
docker compose -f infra/docker-compose.yml restart web worker
```

`down` never deletes the `pgdata` volume. Only `docker compose ... down -v` would — don't run that
unless you intend to erase all data.

## Dev vs production

- **Development** (`infra/compose.dev.yml`) starts Postgres only; you run `pnpm dev` on the host.
- **Production** (`infra/docker-compose.yml`) runs the whole stack in containers. Use this for daily use.
