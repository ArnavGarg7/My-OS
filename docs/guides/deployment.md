# Deployment Guide

My OS is single-user and self-hosted. It ships as the `@myos/web` Next.js app + the `@myos/worker` background process, backed by one Postgres database.

## Build

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm -r typecheck && corepack pnpm -r lint
node scripts/repository-audit.mjs          # architecture gate
corepack pnpm --filter @myos/web build
```

## Runtime

- **Database** — Postgres with `pgvector`, `pg_trgm`, `citext` (the migrate step ensures them). Apply migrations before starting: `corepack pnpm db:migrate`.
- **Env** — set the validated variables from `.env.example` (`@myos/shared` throws early if any required one is missing). AI keys are optional — without them the Local provider serves everything.
- **Processes** — start the web app and the worker; both read the same `DATABASE_URL`.

## Checklists

- Pre-deploy: [../deployment/checklist.md](../deployment/checklist.md)
- Rollback: [../deployment/rollback.md](../deployment/rollback.md)

See also [known limitations](../release/known-limitations.md).
