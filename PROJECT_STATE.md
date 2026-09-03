# My OS — Project State (handoff for V2)

**Status:** v1.0.0 shipped and complete (Phases 1–6). Deployed to personal production. About to begin **V2** (a 10-stage roadmap starting with a full UX/product redesign). This document is the fast-orientation reference for a fresh Claude Code session — read this before touching code.

---

## 1. What My OS is

A **single-user, self-hosted, deterministic personal life operating system**. Not a SaaS product (yet — V2 may change that). Core philosophy, unbroken since Sprint 1: **business logic is deterministic (pure functions, no AI, no randomness); AI explains and assists but never decides.** Every engine — planning, decisions, predictions, automation, personalization — is hand-written rule/scoring logic in `packages/core`. AI (when configured) reads derived, already-computed data and produces natural-language explanations or proposals; it never computes the underlying numbers and never executes a mutation without an explicit human-approved proposal.

Nine spec docs at the repo root (`01_Vision.md` … `09_Future_Versions.md`) are the original source of truth for V1's design; they're historical now but still accurate for what exists. `CHANGELOG.md` and `docs/release/` have the V1 release history.

---

## 2. Tech stack

- **Monorepo:** pnpm workspaces + Turborepo. Node 22. `packageManager: pnpm@9.15.4` (pinned via Corepack — respect this exactly, `pnpm deploy` flags differ across versions).
- **Web app:** Next.js 15 (App Router) + React 19 + TypeScript (strict, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`).
- **API:** tRPC v11 (typed, no REST layer).
- **DB:** PostgreSQL 16 + pgvector, via Drizzle ORM (`postgres-js` driver). Forward-only migrations.
- **Jobs/scheduling:** pg-boss (Postgres-backed queue — **no Redis anywhere in this stack**, deliberately).
- **Auth:** Clerk, behind an internal `IdentityService` abstraction — no app code imports `@clerk/*` directly.
- **Styling/UI:** Tailwind CSS v4 + a custom design-system package (`@myos/ui`).
- **AI:** provider-agnostic (`@myos/ai`) — Anthropic / OpenAI / Gemini / Groq, all optional, with a fully offline **Local** deterministic provider as default fallback (the app works with zero API keys).
- **Deployment:** Docker Compose, self-hosted, Caddy reverse proxy, Cloudflare Tunnel for remote access. ₹0/month hosting.

---

## 3. Directory structure

```
apps/
  web/            Next.js app — UI, tRPC routers, API routes
    app/(shell)/  32 authenticated routes (one folder per module)
    app/          sign-in, sign-up, onboarding, api/, root landing page
    components/   one folder per domain (chief/, morning/, planner/, shell/, …)
    server/       tRPC routers + repository/service per domain (mirrors packages/core modules)
    lib/          identity, platform (PWA/push), shell (nav/store), trpc client, security
  worker/         pg-boss worker (jobs, schedulers, notifications, backups) — src/index.ts is tiny
packages/
  core/           PURE domain logic, one subfolder per module, zero IO — see §4
  db/             Drizzle schema (packages/db/src/schema/*.ts, one file per domain) + migrations/
  shared/         zod env validation, constants, cross-cutting types
  ui/             design-system components (components/, hooks/, lib/, styles.css)
  ai/             provider-agnostic AI platform (assistant/, chief/, gateway/, providers/, tools/, …)
infra/            Dockerfiles (web/worker/migrate), docker-compose.yml (prod), compose.dev.yml (dev), Caddyfile
docs/             operations/ (10 ops guides), release/, security/, performance/, architecture/, adr/
scripts/          repository-audit.mjs + validators (export/migration/package-health/docs/security)
scripts/ops/      backup/restore/verify-backup/update/status/disk-check (bash + PowerShell), windows/ autostart
Google Stitch/    UI redesign source ZIPs already dropped here for Stage 1 (see §14)
```

**The module pattern (applies to all 25+ domains — memorize this, it's load-bearing):**
`packages/core/src/<module>/` (pure, injected `newId`/`now`, no IO/AI/randomness) → `apps/web/server/<module>/` (`repository.ts` DB access, `service.ts` orchestration, `router.ts` tRPC procedures, `import "server-only"` everywhere) → `apps/web/components/<module>/` (UI) → mounted in `apps/web/app/(shell)/<module>/page.tsx` and `apps/web/server/routers/_app.ts`.

---

## 4. Major features implemented (V1, all shipped)

**Phase 1 — Foundation:** monorepo, Clerk identity, PWA/service-worker/push, command palette.
**Phase 2 — Core Life OS:** Today, Morning Briefing, Decision Engine, Universal Inbox, Task Engine, Planner, Calendar, Projects, Health, Journal, Finance, Goals, Timeline (immutable event feed), Analytics.
**Phase 3 — Orchestration:** Tomorrow Studio (evening close/plan flow), Focus Mode, Notification Engine, Automation Engine (rule-based), cross-module Orchestration Engine.
**Phase 4 — Knowledge/Life/Resources/Intelligence:** Knowledge base (notes/wiki/flashcards/spaced repetition), Life platform (habits/routines), Resource & Relationship platform (assets/investments/CRM), Intelligence Dashboard (executive read-model layer, composition-only — imports no other domain).
**Phase 5 — AI:** `@myos/ai` core platform, AI Chief of Staff (`/chief`, the default homepage — "what should I do now?"), Conversational Chief, AI production-readiness (observability/security/reliability/cost).
**Phase 6 — Autonomous Intelligence:**
- **Events/Signals** (`@myos/core/events`) — environment changes → ranked explainable Signals. `/signals`.
- **Prediction** (`@myos/core/prediction`) — 8 deterministic forecast models. `/prediction`.
- **Autopilot** (`@myos/core/autopilot`) — proposal → approve → execute → verify → rollback → audit. `/autopilot`.
- **Connectors** (`@myos/core/connectors`) — Google Calendar/Gmail/GitHub/Drive/Slack/Weather as normalized event sources; **deterministic offline feed by default**, real OAuth is an injectable `liveFetch` seam not yet wired live. `/connectors`.
- **Adaptation** (`@myos/core/adaptation`) — learns a Personal Profile (preferences/habits/routines) from feedback; feeds Chief personalization. `/adaptation`.

**Ops (post-v1.0.0):** full personal production deployment — Docker Compose prod profile, Windows auto-start, Cloudflare Tunnel remote access, backup/restore/verify/update scripts, monitoring, 10 ops guides in `docs/operations/`.

**UX passes (Sept 2026, incremental — will likely be superseded by the Stage 1 redesign):** decluttered Today briefing (collapsed "More" disclosure), de-jargoned Chief home, calmed status bar, collapsible sidebar, dismissible "Get started" onboarding card, version/legend cleanup. All on `main`.

---

## 5. Key architectural decisions (do not violate without a deliberate ADR-equivalent decision)

- **Deterministic core, AI-adjacent.** Every `packages/core/<module>` function is pure: inputs → outputs, no `Date.now()`, no `Math.random()`, no fetch. Time and IDs are always injected as `deps`. This is what makes the whole system testable, replayable, and auditable.
- **Proposal-first mutation.** Nothing autonomous writes data. Autopilot proposals require explicit approval; Chief recommendations are surfaced, never auto-applied.
- **AI never owns truth.** AI reads derived/aggregated read-models only (`AI_SAFE_SURFACES` allowlist in `apps/web/lib/security/classification.ts`); raw `sensitive`/`private` rows never cross to a model.
- **Data classification is enforced by an automated audit.** Every schema file must be registered in `classification.ts` with a level (`public` < `internal` < `sensitive` < `private`). `scripts/security-audit.mjs` fails if any table is unclassified.
- **Single-barrel packages, no deep imports.** Each workspace package exports through `index.ts` / declared subpath exports only (`packages/core/package.json` "exports" map has ~46 entries, one per module). `scripts/export-validator.mjs` enforces this.
- **Single-user, no `user_id` scoping anywhere.** Deliberate. V2 Stage 8 (collaboration/multiplayer) is the only planned stage that would change this, and it's a big architectural shift when it happens.
- **Credentials never reach the client, never reach AI.** `MYOS_AI_CREDENTIALS_SECRET` and `MYOS_CONNECTOR_SECRET` are separate AES-256-GCM keys, deliberately isolated from each other. `NEXT_PUBLIC_*` vars are the only client-visible config and are baked in at **Docker build time**, not runtime — this has bitten deployments twice, see §11.
- **Migrations are forward-only.** No down-migrations. Rollback = restore-from-backup (`scripts/ops/restore.*`).
- **`repository-audit.mjs` is the release gate.** Checks: API contracts, dependency direction, schema classification, security classification, public-API exports, migration history, package health, documentation set. Must be 8/8 before merging anything structural.

---

## 6. API / backend structure

- tRPC routers, one per domain, mounted in `apps/web/server/routers/_app.ts` (currently ~30 sub-routers).
- Per-domain server folder = `repository.ts` (raw Drizzle queries) + `service.ts` (business orchestration, calls into `packages/core` for all actual logic) + `router.ts` (tRPC procedure definitions, thin — just wires input validation to service calls).
- `protectedProcedure` (auth required) is the default; identity comes from Clerk via `apps/web/server/identity`.
- Cross-module composition happens at the **service** layer via explicit "seams" (e.g. Chief's composer reads pre-computed inputs from other domains; Signals folds in Prediction's output via `extraSignals`) — never by one core module importing another's internals.
- Structured logging via a tRPC `observed` middleware; every request logs module/operation/duration/status.

## 7. Database structure

- **197 tables** (live, migrated), 41 migration files, `packages/db/migrations/` (Drizzle-generated SQL + snapshots, `0000` → `0040`).
- One schema file per domain in `packages/db/src/schema/`, re-exported from `schema/index.ts`.
- Every table is UUID-keyed, has classification metadata (see §5), and most domains have their own small enum set (Drizzle pg enums) rather than shared string unions.
- Extensions: `vector` (pgvector, embeddings-ready but not actively used for search — search is deterministic keyword/weight-based by design, ADR-008), `pg_trgm`, `citext`.
- Watch for **domain name collisions** across sprints — several tables were forced to add domain prefixes after drizzle silently dropped duplicate-named tables (e.g. `adaptation_weekly_reviews` vs Analytics' `weekly_reviews`). Always check `schema/index.ts` re-exports for name clashes before naming a new table.

## 8. Authentication / authorization

- **Clerk**, wrapped by `apps/web/lib/identity/` (`auth-provider.tsx`, `clerk-bridge.tsx`, `context.tsx`, `dev-bridge.tsx`). No other code imports `@clerk/*`.
- Both `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` unset = local single-owner dev mode (no sign-in, dev-bridge fakes an identity) — this is how the assistant runs the dev server for UI iteration without real auth.
- `requireUser()` server-side helper redirects unauthenticated visitors; first login goes through `/onboarding` (a real gated form, distinct from the dismissible "Get started" tip card added on Today).
- Minimal `auth_users` table; everything else (preferences, timezone, display name, feature flags) lives in `user_preferences`, DB is source of truth, not Clerk metadata.
- Single user in practice — no roles/permissions system exists yet (V2 Stage 8 territory).

## 9. Frontend architecture

- Next.js App Router, `apps/web/app/(shell)/` route group = the authenticated shell (sidebar + top bar + status bar + context panel), 32 routes/modules.
- Most module UIs follow a **"Center" pattern**: page title + one-line description + a `Tabs` component with several tab panels (Profile/Preferences/Habits/… style). This repetitive pattern is exactly what Stage 1's redesign is meant to break.
- State: mostly server state via tRPC + React Query (`@trpc/react-query`); light client state via `zustand` (`lib/shell/store.ts`) for shell UI state (sidebar collapse, context panel open/closed).
- `@myos/ui` is the design-system package — buttons, cards, badges, text, tabs, etc. All current UI is built from this; Stage 1 will likely replace or heavily extend it based on the Stitch designs.
- PWA: manifest + service worker + offline shell already production-ready (verified: installable, maskable icons, screenshots, safe-area handling). Push notifications need HTTPS + VAPID keys.

## 10. Important reusable components / conventions

- `components/framework/` — `PageContainer`, `PageContent`, `PageLoading`, `PageToolbar` (the layout primitives every module page uses).
- `components/shell/` — `status-bar.tsx`, `sidebar-content.tsx`, `top-bar.tsx`, `context-panel.tsx`, `quick-add-dialog.tsx` — recently simplified in the UX pass (status bar collapsed to one health indicator + tooltip; sidebar sections now collapsible).
- `components/decision/DecisionCard.tsx` — the canonical "one recommendation, act on it" card, reused across Chief and Today.
- `lib/platform/` — PWA/notifications/push/connection/updates, all behind hooks (`useConnection`, `usePlatform`, `useNotifications`, `usePush`, `useUpdates`) — **never call browser platform APIs directly**, always go through these providers.
- `lib/trpc/client.ts` — the typed tRPC client; `RouterOutputs`/`RouterInputs` types are how components get server type-safety.

## 11. Environment / setup requirements

- `.env` (gitignored, copy from `.env.example`) — `DATABASE_URL`, `MYOS_APP_URL` (must match `MYOS_HTTP_PORT`, see below), Clerk keys (optional), AI provider keys (all optional, Local works with none), `MYOS_AI_CREDENTIALS_SECRET` + `MYOS_CONNECTOR_SECRET` (two distinct 32+ char secrets), VAPID keys (optional), `MYOS_DOMAIN`, `MYOS_HTTP_PORT`/`MYOS_HTTPS_PORT` (default **8080/8443**, not 80/443 — this machine also runs an unrelated project, "APEX", on host port 80; My OS was deliberately moved off standard ports to coexist).
- **Dev:** `docker compose -f infra/compose.dev.yml up -d` (Postgres only) → `pnpm dev` (web + worker on host, ports 3000).
- **Prod:** `docker compose --env-file .env -f infra/docker-compose.yml up -d --build`. Services: `migrate` (one-shot) → `postgres`, `web`, `worker`, `caddy`, optional `cloudflared` (`--profile tunnel`).
- ⚠️ **`NEXT_PUBLIC_*` vars are baked in at Docker build time**, not read at runtime — always rebuild (`--build`) after changing `NEXT_PUBLIC_MYOS_VAPID_PUBLIC_KEY` or `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. Passed as compose `build.args` in `infra/docker-compose.yml`.
- ⚠️ **Merging a PR to `main` does NOT redeploy anything.** The running containers keep the old image until you `git pull` + rebuild + `up -d`. Use `scripts/ops/update.ps1`/`.sh` (git pull → backup → build → migrate → health check) — this is the safe, documented path.
- Safe update/backup scripts exist in both bash and PowerShell in `scripts/ops/`; full guides in `docs/operations/`.

## 12. Known limitations (honest, by design or not-yet-done)

- Connectors are **offline-simulated** — no real OAuth wired to Google/GitHub/Slack yet (the seam exists, the live integration doesn't). This is essentially V2 Stage 4's job.
- Adaptation learns from a **deterministic seed + real feedback**, not yet from real per-module behavioral observations (watchers not built).
- No embedding/vector search anywhere — deterministic keyword search only (pgvector extension is enabled but unused), by design (ADR-008).
- No always-on background scheduling — notification/automation/prediction cycles run on-demand per request, not on a live event bus.
- No voice, no native mobile, no offline-write queue, no real-time collaboration — all V2 territory (Stages 5, 6, 8).
- No app-side CSP (deferred — needs nonces + Clerk/PWA testing); no API rate limiting (accepted risk for single-user).
- Full `apps/web` vitest run OOMs — always run focused test paths.

## 13. Technical debt worth knowing about

- The "Center" UI pattern (title + tabs) is repeated ~15+ times and is the main reason the product "doesn't feel user-friendly" — Stage 1 exists specifically to fix this, likely by replacing large swings of `apps/web/components/*` UI (not the underlying tRPC/service/core layers, which are sound).
- Several Dockerfiles were **written but never actually validated** until the first real production boot (worker's `pnpm deploy --legacy` flag didn't exist in the pinned pnpm version; the web image's `node_modules` copy was incomplete; the Caddy config didn't actually bind HTTP on a non-standard port). All fixed now, but it's a signal to always `docker compose build` + run before trusting infra changes.
- Status bar / sidebar were overloaded with ~20 redundant per-module indicators until the recent UX pass; some per-module `*StatusIndicator` components may now be orphaned/unused — worth an audit before Stage 1.

## 14. Things that must NOT be changed without a deliberate decision

- The deterministic-core / AI-never-decides principle (§5) — this is the entire product's trust model.
- The module pattern and package barrel/export discipline — `repository-audit.mjs` will fail builds if violated.
- `pnpm@9.15.4` pin — Dockerfiles depend on its exact `deploy` flag behavior.
- The data classification registry and AI-safe-surfaces allowlist — security boundary.
- Single-user, no-`user_id` data model — until Stage 8 is deliberately scoped.
- `MYOS_HTTP_PORT`/`MYOS_HTTPS_PORT` defaults (8080/8443) — this machine's port 80 belongs to an unrelated project ("APEX") that must never be touched, stopped, or reconfigured by any My OS tooling.
- Forward-only migrations — never hand-edit an applied migration file.

## 15. V1 → V2 handoff notes

- The user has **already dropped 4 Google Stitch export ZIPs** into `Google Stitch/` at the repo root (`MY OS Command Center.zip`, `MY OS Tasks Engine.zip`, `MY OS Calender & Timeline.zip`, `My OS Core Emblem.zip`) — these are Stage 1 redesign source material, not yet unpacked or reviewed as of this writing.
- The recent incremental UX passes (status bar, sidebar, Today briefing, Chief home copy) are real, shipped, and currently live in production — but expect Stage 1 to significantly restyle or replace most of this UI layer. Don't be surprised if Stage 1 supersedes them; that's expected, not a regression.
- Production is deployed and was verified healthy as of the last session (`http://localhost:8080`, containers healthy, backed up).

---

## 16. What V2 is expected to accomplish (summary)

V2 is a **10-stage roadmap**, full detail in Claude's memory (`myos-v2-roadmap` / can be re-derived from user prompts) — work proceeds **one stage at a time, only when explicitly requested**:

1. **Product Foundation & UX Reset** — full redesign via Google Stitch → ZIP → Claude implementation workflow; real design system; UX overhaul; information architecture; mobile-responsive web. *(next up)*
2. **Personal OS Core** — unify Tasks/Notes/Calendar/Projects, real command-center dashboard, universal search, frictionless quick capture.
3. **AI-Native** — AI becomes an intelligence layer across the whole OS (not just `/chief/chat`), with safe confirmable actions and structured memory.
4. **Integrations + Automation** — real OAuth to Google/GitHub/Slack/etc. (builds on the existing Connector Platform seam), When-X→Y automation rules.
5. **Offline-First + Native Mobile** — offline writes/sync/conflict resolution; real Android + iOS apps.
6. **Voice + Productivity System** — voice interface, proactive assistant, Pomodoro, integrated productivity intelligence.
7. **Widgets + Weather + Personalization** — desktop/mobile widgets, contextual weather, learned UI/behavior personalization.
8. **Collaboration + Multiplayer** — shared workspaces, real-time multi-user state (requires abandoning the single-user data model).
9. **Security + Trust** — E2EE for sensitive data, key management, full security hardening audit, privacy transparency.
10. **"Best Version" Pass** — cross-cutting UX/performance/reliability/AI-quality/cross-platform audit; finalize the ₹0/month deployment; complete documentation; a final "does this feel like a serious product?" gate.

**The North Star for V2:** turn a functionally-complete but engineer-flavored deterministic backend into a product that feels genuinely good to use daily — without weakening the deterministic-core / proposal-first / AI-never-decides architecture that makes it trustworthy.
