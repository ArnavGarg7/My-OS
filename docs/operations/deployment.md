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
- `MYOS_APP_URL` — `http://localhost` for local production (Caddy is the ingress on :80; `web:3000` is
  internal). Use `https://<your-domain>` with remote access. Do **not** use `:3000` in production.
- **Optional (per feature):**
  - **Cloud AI:** `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`,
    `VOYAGE_API_KEY`, `MYOS_AI_CREDENTIALS_SECRET`. Consumed server-side by `web` only; the OS runs
    fully on the offline Local provider with none of them.
  - **Connectors:** `MYOS_CONNECTOR_SECRET` (32+ chars — `openssl rand -base64 48`).
  - **Auth:** `CLERK_SECRET_KEY` + `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (both or neither).
  - **Notifications:** `MYOS_VAPID_PUBLIC_KEY`, `MYOS_VAPID_PRIVATE_KEY`, `MYOS_VAPID_SUBJECT`, and
    `NEXT_PUBLIC_MYOS_VAPID_PUBLIC_KEY` (same value as the public key).

Secrets live **only** in `.env` (gitignored). Never commit them.

> **Build-time values.** `NEXT_PUBLIC_MYOS_VAPID_PUBLIC_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` are
> **inlined into the browser bundle at image-build time** (they're `NEXT_PUBLIC_*`). Set them in `.env`
> **before** the build below, and rebuild (`--build`) whenever they change. Only these two public values
> are passed to the build (via `infra/docker-compose.yml` build args → `infra/Dockerfile.web`); every
> private secret stays runtime-only.

## 2. Start the stack

```
docker compose --env-file .env -f infra/docker-compose.yml up -d --build
```

`--env-file .env` ensures the root `.env` is used for the `NEXT_PUBLIC_*` **build args** (not just the
container runtime). This builds the web/worker/migrate images, runs migrations to completion, then
starts postgres, web, worker, and caddy. First build takes a few minutes; subsequent starts are seconds.

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
