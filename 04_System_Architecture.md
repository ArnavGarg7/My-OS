# 04 — System Architecture

**Project:** My OS
**Goal:** production-quality architecture, optimized for exactly one user, runnable on one small VPS, fully operable unattended (jobs, notifications, backups). AI specifics live in `06_AI_Architecture.md`; schema in `05_Database_Design.md`.

---

## 1. Stack Summary & Rationale

| Layer | Choice | Rationale |
|---|---|---|
| Language | **TypeScript everywhere** (strict) | One language across web/worker/shared; end-to-end types |
| Monorepo | **pnpm workspaces + Turborepo** | Shared packages, cached builds |
| Web app | **Next.js 15 (App Router, React 19)** | SSR for fast first paint, RSC for read-heavy pages, single deployable for UI+API |
| API | **tRPC v11** over Next.js route handler (`/api/trpc`) | End-to-end type safety, zero codegen; perfect for single-consumer API |
| Client data | **TanStack Query v5** (via tRPC) + **Zustand** (ephemeral UI state) | Cache, optimistic updates, offline-read via persister |
| Styling | **Tailwind CSS v4** + CSS variables (tokens from DRD) + **Radix primitives** + **Framer Motion** | Accessible primitives, custom design system |
| Editor | **Tiptap** (notes, journal, descriptions) | Block editing, markdown shortcuts, JSON storage |
| Drag & drop | **dnd-kit** | Planner, boards, reorder |
| Charts | **Recharts** (themed wrapper) | Sufficient, small |
| Database | **PostgreSQL 16** + **pgvector** | Single source of truth incl. embeddings; FTS built in |
| ORM & migrations | **Drizzle ORM + drizzle-kit** | Typed SQL-ish, deterministic migrations |
| Job queue / cron | **pg-boss v10** (Postgres-backed) | Durable scheduling/retries **without Redis** — one less stateful service |
| Worker | Dedicated **Node 22 process** (`apps/worker`) | Isolation of jobs/schedulers from request path |
| Push | **Web Push (VAPID)** via `web-push` | Desktop + Android/iOS PWA notifications, no vendor |
| Realtime to client | **SSE** (`/api/events` stream) | One-way invalidation pings; simpler than websockets |
| AI | **Anthropic API** (`@anthropic-ai/sdk`), embeddings via **Voyage AI** | See 06 |
| File storage | Local disk volume `/data/uploads` (images) | Single user; S3-compatible only for backups |
| Reverse proxy / TLS | **Caddy** | Auto-HTTPS (push requires HTTPS) |
| Deployment | **Docker Compose** on a small VPS (2 vCPU/2GB) | One-command deploy; local dev mirrors prod |
| Observability | **Pino** structured logs, **Sentry self-hosted-compatible SDK (GlitchTip)**, pg-boss dashboard page | Enough for one operator |

**Explicit non-choices:** no Redis (pg-boss + Postgres LISTEN/NOTIFY suffice at single-user scale); no microservices (two processes: web, worker); no GraphQL; no Electron (PWA covers desktop notifications via browser); no Kubernetes.

## 2. Topology

```
                    ┌────────────────────────── VPS (Docker Compose) ─────────────────────────┐
   Browser/PWA ⇄ HTTPS ⇄ Caddy ─┬─▶ web (Next.js: UI + tRPC + SSE)  ─┬─▶ Postgres 16 (+pgvector)
   (desktop & mobile)           │                                    │      ▲
        ▲  Web Push             │                                    │      │ pg-boss queues,
        └───────────────────────┼──── worker (Node: jobs, schedulers,│──────┘ LISTEN/NOTIFY
             (push services:    │      notifications, automations,   │
              FCM/APNs/Mozilla) │      AI jobs, backups) ────────────┴─▶ Anthropic / Voyage APIs
                                └─▶ /data volume (uploads, backups staging)   └─▶ S3-compatible bucket (backups)
```

Two long-running app processes:
- **`web`** — serves UI, tRPC API, SSE stream, push-subscription endpoints. Stateless (sessions in DB).
- **`worker`** — owns pg-boss: cron schedules, queue consumers, the notification dispatcher, automation engine, AI background jobs, backups. Also stateless; safe to restart anytime (jobs are durable in Postgres).

Both import the same `packages/db` and `packages/core` so business logic is written once.

## 3. Monorepo Layout

```
myos/
├─ apps/
│  ├─ web/                     # Next.js app (UI + API)
│  │  ├─ app/                  # App Router routes (see 08 for full tree)
│  │  ├─ server/               # tRPC routers, auth, SSE
│  │  └─ public/               # PWA manifest, icons, sw.js
│  └─ worker/                  # Node worker entry, job handlers, schedulers
├─ packages/
│  ├─ core/                    # Domain logic: scheduling engine, prioritizer (deterministic),
│  │                           # recurrence, streaks, budgets math, automation rule evaluation
│  ├─ db/                      # Drizzle schema, migrations, query helpers, seed
│  ├─ ai/                      # Anthropic/Voyage clients, context engine, prompts, tools (06)
│  ├─ shared/                  # zod schemas, DTO types, constants, date utils
│  └─ ui/                      # Design-system components (tokens, primitives)
├─ infra/                      # docker-compose.yml, Caddyfile, backup scripts, runbooks
└─ (config: turbo.json, pnpm-workspace.yaml, tsconfig.base.json, .env.example)
```

## 4. Frontend Architecture

- **Rendering:** authenticated app is a client-heavy SPA shell; RSC used for first paint of read-heavy pages (dashboard, reviews), then tRPC/TanStack takes over. No public pages besides `/login`.
- **State layers:** server state = TanStack Query (per-entity query keys `['tasks', filters]`, normalized invalidation helpers); UI state = Zustand slices (palette open, selection, drawer, planner drag); form state = react-hook-form + zod resolvers from `packages/shared`.
- **Optimistic updates:** all common mutations (complete task, log water, move block, check habit) apply optimistically with rollback on error; mutation helpers standardized in `apps/web/lib/mutations.ts`.
- **Realtime:** client opens one SSE connection; server emits `{type:'invalidate', keys:[...]}` messages produced from the domain-event outbox (see §8), plus `{type:'notification'}` for in-app toasts. On message → targeted `queryClient.invalidateQueries`. Reconnect with backoff; on reconnect, full refetch of active queries.
- **PWA / Service worker:** Serwist. Precache shell + assets; runtime cache: static assets SWR, GET API responses NetworkFirst with 24h fallback (read-only offline per PRD). `push` event → `showNotification` with actions; `notificationclick` routes (complete/snooze/open call `/api/push/action` then focus/open client). **Web Share Target** (manifest): shared url/text/images POST to `/api/share` → Life Inbox capture screen. Background Sync deliberately not used in V1.
- **Code splitting:** per-route + heavy libs (Tiptap, Recharts, dnd-kit) dynamically imported. Budget: initial JS < 250KB gz.

## 5. API Layer (tRPC)

Routers (namespaces mirror features): `auth, settings, areas, tasks, projects, events, planner, college, internship, notes, journal, habits, routines, health.workouts, health.metrics (water/weight/sleep/nutrition), finance, goals, reviews, automations, notifications, timeline, search, ai, dataio, devices(push)`.

Conventions:
- Input/output zod schemas in `packages/shared` (single source, reused by forms).
- All procedures require session (`protectedProcedure`) except `auth.login`, `auth.setup`.
- Mutations that touch multiple tables run in a transaction and write `activity_log` + `domain_events` rows in the same transaction (outbox pattern, §8).
- List procedures: cursor pagination (`{cursor, limit≤100}`), consistent `{items, nextCursor}`.
- Errors: typed error codes (`NOT_FOUND, CONFLICT, VALIDATION, RATE_LIMITED, AI_UNAVAILABLE, AI_BUDGET_EXCEEDED`) mapped to UI messages.
- Rate limits (defense-in-depth even for one user): login 5/min/IP; AI procedures 20/min; everything else 120/min — token bucket in Postgres.

## 6. Scheduling Engine (deterministic core)

Lives in `packages/core/scheduling`; used by both manual planning helpers and as the skeleton/fallback for AI planning (06 wraps it).

**Inputs:** date; wake/sleep bounds; fixed items (events, class sessions, routines); candidate tasks (due/scheduled/prioritized, with estimates, energy, dependencies); user planning settings (PRD §6.3); today's energy check-in (Low/Med/High modifiers on block length, breaks, candidate filtering — PRD §4B); active season config (area weight overrides, protected block types, adjusted caps — PRD §17A).
**Algorithm:**
1. Build free intervals = day minus fixed items (± buffers).
2. Score candidates: `score = 4·urgency(due proximity, overdue boost) + 3·priority + 2·alignment(goal/weekly-priority × season area-weight) + 1·age − blocked penalty` (weights in config; season multipliers from `seasons.config`).
3. Greedy placement into intervals: deep-energy tasks into peak window first; chunk tasks > max-focus into multiple blocks with breaks; insert breaks after each focus block; respect daily deep-work cap; stop at sleep bound.
4. Emit blocks + unplaced list with reasons (`no_time, blocked, past_due_impossible`).
Pure function → unit-testable with golden fixtures. Also provides `shiftRemaining()` used by deterministic "rescue day".

**Recurrence materialization:** worker cron (daily 03:00 + on rule change) expands RRULEs (events, class sessions, recurring tasks, habit expectations) 12 months / 60 days (tasks) ahead into instance rows, honoring exdates/overrides (tables in 05).

## 7. Notification Engine

Design goals: exact-time (±30s), multi-channel, quiet-hours, actions, dedupe, full history. Implemented in worker.

**Pipeline:**
1. **Producers** create `notifications` rows (status `scheduled`, `scheduled_for`, type, payload, channel flags, silent, critical): reminder derivations (event/exam/habit/subscription scans), automations, AI proposals, system.
2. **Scanner** (pg-boss cron, every minute): `SELECT ... WHERE status='scheduled' AND scheduled_for <= now()+interval '60s'` → enqueue one `notifications.dispatch` job per row with `startAfter=scheduled_for` (second-precision), mark `enqueued`. Missed-while-down rows (past due) are picked up immediately on restart — late but never lost.
3. **Dispatcher** (queue consumer, concurrency 5):
   - Re-validate (source entity still exists, not completed, not snoozed/cancelled) — else mark `cancelled`.
   - **Quiet hours / focus / season check**: within quiet window and not `critical` → `held` (morning-digest job collects at quiet-hours end); an active focus session (open `focus_sessions` row) holds non-critical rows until session end (mini digest, PRD FR-NOTIF-9); active season notification profile (PRD §17A) holds its muted types the same way.
   - **Dedupe**: skip if identical `(type, entity_ref, minute)` already sent.
   - Deliver: insert in-app row → SSE ping; for each enabled channel, send Web Push (payload: title, body, tag, actions, deep-link URL; TTL by type). Record per-channel result in `notification_deliveries`.
   - Push failures: 404/410 → delete subscription + settings badge; 429/5xx → pg-boss retry (3×, exp backoff).
4. **Actions** endpoint (`/api/push/action`, authenticated by signed token embedded in payload): complete/snooze/log-water/open → performs mutation, marks notification `acted`.
5. **Snooze** updates `scheduled_for` + status back to `scheduled`.

History = the `notifications` table itself (90-day retention job). "Why?" = stored `source` ref (rule/entity).

## 8. Domain Events, Automations & Outbox

- Every significant mutation writes a `domain_events` row **in the same transaction** (outbox): `task.completed`, `task.overdue` (from scanner), `event.created`, `habit.missed`, `weight.logged`, `budget.threshold`, `plan.accepted`, etc.
- Worker consumes the outbox via pg-boss (`events.fanout`): (a) forwards invalidation pings to SSE (via NOTIFY channel the web process listens on), (b) feeds the **automation engine**, (c) triggers life-timeline auto-events, (d) enqueues embedding refresh for changed content.
- **Automation engine** (`packages/core/automations`): time-trigger rules get materialized pg-boss cron entries (`automation:{id}`); event-trigger rules are matched against fan-out events (indexed by event type). Evaluation: load rule → check conditions (pure functions over a context snapshot) → execute actions (create notification/task/etc., all stamped `origin='automation'`, which is excluded from re-triggering → loop-proof). Every run logged to `automation_runs`. Global caps per PRD FR-AUTO-6 enforced at dispatch.

## 9. Authentication & Security

- **Sessions:** opaque 256-bit token, SHA-256 hash stored in `sessions` (user agent, ip, expiry, last_seen). Cookie: `__Host-session`, httpOnly, Secure, SameSite=Lax. Sliding expiry. Revocation = row delete.
- **Login:** Argon2id (m=64MB, t=3, p=1). Lockout per PRD FR-AUTH-3 tracked in `login_attempts`. Recovery key = random 24-word-equivalent base32 string, Argon2id-hashed.
- **WebAuthn (optional):** platform authenticator as second factor / quick unlock on trusted devices (`webauthn_credentials`).
- **CSRF:** SameSite=Lax + custom header check on mutations (tRPC POST with `x-trpc-source`), push-action endpoint uses signed one-time tokens.
- **Headers:** strict CSP (self + api.anthropic.com/voyage endpoints for server only — browser never calls AI directly), HSTS, frame-deny, referrer-policy.
- **Secrets:** `.env` on server (root-only perms); never in repo; documented in `.env.example`.
- **AI key isolation:** Anthropic/Voyage keys exist only in server/worker env; all AI traffic is server-side.

## 10. Storage & Caching

- **Postgres** is the single source of truth (schema → 05). Connection pooling via pgBouncer-lite mode not needed; drizzle pool (web max 10, worker max 5) is fine.
- **Uploads:** images (notes/journal/timeline/avatar/inbox) + inbox voice memos. Images: client → upload route → sharp pipeline (strip EXIF GPS, downscale ≤2000px, re-encode) → `/data/uploads/{yyyy}/{mm}/{uuid}.webp`; 10MB cap. Audio: webm/opus recording stored as-is, 20MB / 5-min cap. All get `files` rows, served by web with auth check + long-cache immutable URLs.
- **Caching layers:** client TanStack cache (+persisted to IndexedDB for offline reads); HTTP immutable caching for static assets; server-side: no extra cache tier (Postgres + indexes are enough at this scale); AI prompt caching per 06.

## 11. Deployment & Operations

- **docker-compose services:** `caddy` (80/443), `web`, `worker`, `postgres` (pgvector image, volume `pgdata`), `backup` (cron sidecar running the backup script — or backup runs inside worker; chosen: **inside worker** via pg-boss cron for visibility, executing `pg_dump` against the db container).
- **Build/deploy:** GitHub private repo; CI (lint, typecheck, tests, build images) → GHCR; deploy = `docker compose pull && up -d` via SSH action or manual. Migrations run on web container start (`drizzle-kit migrate`, advisory-locked so only one runner).
- **Config:** single `.env` (DB URL, Clerk keys, VAPID keys, AI provider keys [ANTHROPIC/OPENAI/GEMINI/GROQ/VOYAGE], MYOS_AI_CREDENTIALS_SECRET, MYOS_CONNECTOR_SECRET, BACKUP_S3_*, APP_URL, TZ default). See `.env.example` for the authoritative list.
- **Health:** `/api/health` (db ping, boss ping, disk space) polled by Caddy + external uptime pinger (optional); worker heartbeats row every minute → web surfaces "worker down" banner in Settings if stale > 5 min.
- **Backups:** per PRD §24 — nightly `pg_dump -Fc` + uploads tar → `age`-encrypt → local rotation + S3 upload; weekly verify-restore into scratch schema; results in `backup_runs`.
- **Logs:** pino JSON → stdout → docker logging (rotated); errors additionally to GlitchTip.
- **Runbooks** in `infra/runbooks/`: restore, password reset CLI, key rotation, VPS migration.
- **Local dev:** `docker compose -f infra/compose.dev.yml up` (postgres only) + `pnpm dev` (turbo runs web+worker with hot reload); seed script creates demo data; VAPID/AI keys optional in dev (features degrade per NFR-9).

## 12. Performance & Capacity

Single user ⇒ everything fits comfortably: expected DB < 1GB after years (excluding images). Budgets: API p95 < 300ms (queries) enforced by indexes (05); planner render 60fps (virtualized timeline); worker jobs concurrency small (AI 2, push 5, default 3). The 2GB VPS ceiling (NFR-10) checked in CI via image size + a memory smoke test note in runbook.

## 13. Failure Modes & Degradation Matrix

| Failure | Behavior |
|---|---|
| Worker down | UI fully works; reminders delayed (delivered on restart); banner in Settings after 5 min heartbeat gap |
| Postgres down | App down — Caddy serves static error page; compose restarts pg |
| Anthropic API down/over budget | All [AI] affordances show deterministic fallback or disabled state (NFR-9); rest of app unaffected |
| Voyage down | Search = lexical only; embedding jobs retry with backoff |
| Push service rejects | Subscription pruned; in-app history always complete |
| Disk near full | Health check warns at 85%; backups abort safely with alert |
| Deploy migration failure | Web refuses to start on failed migration; previous images restorable; backups precede deploys (deploy script takes a pre-deploy dump) |
