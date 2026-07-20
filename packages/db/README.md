# @myos/db

**The database layer** — Drizzle ORM schema, the typed `Database` client, and the migration history for the single-user Postgres instance.

## Purpose

Own the persisted shape of the system. Every table is defined here in `src/schema/<domain>.ts`; migrations in `migrations/` are the append-only evolution record. Single user (05 §0: no `user_id` columns).

## Architecture

```
src/
  schema/           one file per domain (index.ts re-exports all)
  index.ts          Database type + client factory
  migrate.ts        migration runner (ensures pgvector/pg_trgm/citext)
migrations/
  NNNN_tag.sql      generated SQL (drizzle-kit)
  meta/_journal.json + NNNN_snapshot.json   history
```

## Dependencies

- `drizzle-orm`, `postgres`. Consumed by `apps/web/server/*` and `apps/worker`. Never imports business logic.

## Public API

```ts
import { getDb, type Database } from "@myos/db";
import { tasks, aiConversations } from "@myos/db/schema";
```

## Workflow

1. Edit `src/schema/<domain>.ts`.
2. `cd packages/db && corepack pnpm generate` → creates `migrations/NNNN_*.sql` + snapshot.
3. `corepack pnpm db:migrate` (from root) → applies to Postgres.
4. Verify: `docker exec myos-dev-postgres-1 psql -U myos -d myos -c "\dt"`.

`scripts/migration-validator.mjs` asserts the journal stays contiguous and every migration is paired with a snapshot. Drizzle sometimes bundles an enum-add into the tables migration — split it manually and copy the snapshot json when that happens.

## Extending

Add a `pgTable` in the relevant domain file (create one if the domain is new), re-export from `schema/index.ts`, generate + apply, then classify the domain in `apps/web/lib/security/classification.ts` (the security audit requires it).
