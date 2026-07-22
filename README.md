# My OS

**The Operating System for My Life.**

A single-user, self-hosted, AI-augmented personal operating system. This repository
is the implementation; the design is fully specified in the nine documents at the
repo root (`01_Vision.md` … `09_Future_Versions.md`) — those are the source of truth.

> **Status:** **v1.0.0** — Phases 1–6 complete. A deterministic personal life OS with
> 20+ domains, a grounded AI Chief of Staff, and the full Autonomous Intelligence stack
> (Event Intelligence → Predictive Intelligence → Proposal-First Automation → External
> Connectors → Adaptive Personal Intelligence). Architecture is frozen
> ([ADR-010](docs/adr/ADR-010.md)). See [release notes](docs/release/release-notes.md).

## Stack

TypeScript · pnpm workspaces + Turborepo · Next.js 15 / React 19 · tRPC v11 ·
Tailwind CSS v4 · Drizzle ORM · PostgreSQL 16 + pgvector · pg-boss · Node worker ·
Docker Compose + Caddy. Full rationale: `04_System_Architecture.md §1`.

## Layout

```
apps/
  web/       Next.js app (UI + tRPC API + SSE)
  worker/    Node worker (jobs, schedulers, notifications, backups)
packages/
  ui/        Design system (tokens + components)
  db/        Drizzle schema, migrations, query helpers
  core/      Pure domain logic (no IO) — 25+ deterministic domain modules
  shared/    Zod schemas, env validation, constants
  ai/        Provider-agnostic AI platform (Anthropic / OpenAI / Gemini / Groq / Local)
infra/       Docker Compose, Caddy, Dockerfiles, runbooks
docs/        Architecture, ADRs, guides, release notes, security & performance reports
```

Import direction is enforced by ESLint (`08 §1`):
`ui → ∅ · shared → ∅ · core → shared · db → shared · ai → core/db/shared · apps → all`.

## Prerequisites

- Node ≥ 22, pnpm ≥ 9 (via `corepack enable`), Docker + Docker Compose.

## Local development

```bash
corepack enable                              # activate pnpm
pnpm install
cp .env.example .env                         # defaults match the dev DB below
docker compose -f infra/compose.dev.yml up -d   # Postgres (pgvector)
pnpm db:migrate                              # extensions + empty baseline
pnpm db:check                                # verify connectivity
pnpm dev                                     # web → http://localhost:3000
pnpm worker:dev                              # worker (separate terminal)
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Run web + worker in watch mode |
| `pnpm build` | Build all apps |
| `pnpm lint` | ESLint across the workspace |
| `pnpm typecheck` | `tsc --noEmit` across the workspace |
| `pnpm format` / `format:check` | Prettier |
| `pnpm db:migrate` / `db:check` / `db:studio` | Database ops |
| `pnpm worker:dev` | Run the worker |

## Production (single VPS)

```bash
cp .env.example .env   # fill secrets; set MYOS_DOMAIN
docker compose -f infra/docker-compose.yml up -d --build
```
