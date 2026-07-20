# Development Guide

Get productive in ~30 minutes.

## Prerequisites

- Node 20+, `corepack` (pnpm), Docker (Postgres).
- Copy `.env.example` → `.env` and fill values. Secrets live only in `.env` (gitignored) — never in source.

## Setup

```bash
corepack pnpm install
docker compose up -d            # starts myos-dev-postgres-1
corepack pnpm db:migrate        # applies migrations
corepack pnpm --filter @myos/web dev   # dev server (prefer the Browser preview tools)
```

## The module recipe (adding a feature)

1. **Pure core** — `packages/core/src/<module>/` (types, constants, schemas, rules, selectors, `index.ts`). No IO; take `now` as a param.
2. **DB** — add tables in `packages/db/src/schema/<module>.ts`, `generate` + `migrate`, classify in `apps/web/lib/security/classification.ts`.
3. **Server** — `apps/web/server/<module>/{repository,service,router}.ts` (`import "server-only"`), mount in `server/routers/_app.ts`.
4. **UI** — `apps/web/components/<module>/`, route under `app/(shell)/`, nav in `lib/shell/nav.ts`.
5. **Gates** — see [testing.md](testing.md); browser-verify; write memory.

## Gate commands

```bash
corepack pnpm -r typecheck
corepack pnpm format && corepack pnpm -r lint
corepack pnpm --filter @myos/web build     # NOT while dev server runs (corrupts .next)
node scripts/repository-audit.mjs          # architecture + standards
```

Full architecture in [architecture.md](architecture.md); debugging in [debugging.md](debugging.md).
