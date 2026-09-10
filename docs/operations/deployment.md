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
- `MYOS_HTTP_PORT` / `MYOS_HTTPS_PORT` — the **host** ports My OS's Caddy publishes. Defaults **8080** /
  **8443** so My OS coexists with anything already using 80/443 on this host. Container-side Caddy still
  listens on 80/443 — only host publishing changes.
- `MYOS_APP_URL` — the externally-reachable origin **including the host port**: `http://localhost:8080`
  for local production (matching `MYOS_HTTP_PORT`; `web:3000` is internal). Use `https://<your-domain>`
  with remote access. Do **not** use `:3000` in production; keep the port in sync with `MYOS_HTTP_PORT`.
- **Authentication (choose one — required in production):**
  - **Single-owner behind an external gate (simplest, no Clerk).** Leave both Clerk keys blank and set
    `MYOS_SINGLE_OWNER=true`. The app then trusts every request as the single owner, so it is **only**
    valid behind a gate that restricts who reaches the origin — either **Cloudflare Access** (email gate,
    tunnel path) or a **Caddy password prompt** (public-VM / DuckDNS path; see
    [remote-access.md](remote-access.md)). Never expose an `MYOS_SINGLE_OWNER=true` instance ungated.
    Without either an external gate or Clerk, production returns no owner and the app is inaccessible (a
    deliberate safety default).
  - **Clerk.** Set `CLERK_SECRET_KEY` + `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (both or neither). The app
    enforces sign-in itself; `MYOS_SINGLE_OWNER` is then ignored (real auth always wins).
- **Optional (per feature):**
  - **Cloud AI:** `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`,
    `VOYAGE_API_KEY`, `MYOS_AI_CREDENTIALS_SECRET`. Consumed server-side by `web` only; the OS runs
    fully on the offline Local provider with none of them.
  - **Connectors (Sprint 6.4):** `MYOS_CONNECTOR_SECRET` (32+ chars — `openssl rand -base64 48`).
  - **Live OAuth connectors (Stage B):** `MYOS_GOOGLE_CLIENT_ID` / `_SECRET` (covers Calendar + Gmail +
    Drive), `MYOS_GITHUB_CLIENT_ID` / `_SECRET`, `MYOS_SLACK_CLIENT_ID` / `_SECRET`. Blank = that
    provider stays in sample mode. **Register the prod callback in each provider's OAuth app:**
    `https://<your-domain>/api/connectors/oauth/callback/<provider>` (`<provider>` = `google-calendar` |
    `gmail` | `google-drive` | `github` | `slack`). Slack **requires** an HTTPS redirect, so it only
    works once the tunnel domain is live.
  - **Data-at-rest encryption (Stage C, Tier 1):** `MYOS_DATA_ENCRYPTION_KEY` (`openssl rand -base64 48`).
    Encrypts private free-text bodies (journal/notes/inbox/messages). ⚠️ **Back it up SEPARATELY from the
    database** — lose it and encrypted content is unrecoverable. The E2EE Secure Vault (`/vault`) needs no
    server key; its passphrase/recovery code are yours alone and the server cannot reset them.
  - **Always-on worker (Stage 6 / B):** `MYOS_INTERNAL_SECRET` (any long random string) enables the
    worker's background ticks — proactive evaluation + live-connector auto-sync. Unset = both disabled
    (the internal endpoints return 503). Crons default to every 15 min (`PROACTIVE_EVAL_CRON`,
    `CONNECTOR_SYNC_CRON`).
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
Open **http://localhost:8080** (the default `MYOS_HTTP_PORT`) — you should see My OS. Caddy serves plain
HTTP directly on the mapped port (the HTTP→HTTPS redirect is disabled so the non-standard port works);
HTTPS is available on `https://localhost:8443` with a local certificate, and remote access uses the
Cloudflare tunnel. If you set a custom `MYOS_HTTP_PORT`, use that port instead.

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
