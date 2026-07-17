# Developer Handbook (Phase 4.5)

Everything you need to work in this codebase safely. Read [architecture/overview.md](./architecture/overview.md)
first for the big picture; this is the operational reference.

## Prerequisites

- Node **v22.16.0** (root `package.json` is ESM, `type: module`).
- `pnpm` via corepack. Gate commands assume `export PATH="$HOME/.corepack-bin:$PATH"`.
- Postgres via Docker (`myos-dev-postgres-1`, role/db `myos`).

## The module pattern (how every domain is built)

Build a new capability in this order — each step imports the previous:

1. **Pure core** — `packages/core/src/<domain>/` with a subpath export in
   `packages/core/package.json`. Types, constants, deterministic logic, `fixtures.ts`, tests.
   Inject `now`/`newId`; never read them ambiently. Import **no other core domain**.
2. **Schema** — `packages/db/src/schema/<domain>.ts`, add to `index.ts`, then
   `cd packages/db && corepack pnpm generate` and `corepack pnpm db:migrate` from root. Verify with
   `docker exec myos-dev-postgres-1 psql -U myos -d myos -c "\d <table>"`. Add a
   classification entry in `apps/web/lib/security/classification.ts`.
3. **Server** — `apps/web/server/<domain>/` with `import "server-only"`: repository (Drizzle),
   service (composes core + repo, emits timeline/analytics on success), router (tRPC). Expose the
   read models (`summary`/`signals`/…) other domains and the AI layer will consume.
4. **UI** — `apps/web/components/<domain>/` + `apps/web/app/(shell)/<route>/page.tsx`. Use
   `@myos/ui` primitives (`EmptyState`, `Text`, `Button`, `Card`). Talk to the server only via tRPC.
5. **Integrations** — register Morning/Tomorrow slots, status-bar segment, context-panel inspector,
   commands, and DecisionContext signals as needed.
6. **Gates → browser verify → memory.**

## Gate commands

```bash
export PATH="$HOME/.corepack-bin:$PATH"
corepack pnpm -r typecheck
corepack pnpm format            # writes; use format:check in CI
corepack pnpm -r lint
corepack pnpm --filter @myos/web build
# core tests (run focused — full apps/web vitest OOMs at ~93 files/1 process):
cd packages/core && corepack pnpm exec vitest run src/<domain> --pool=forks
```

## Architecture audits (Phase 4.5)

Pure filesystem+regex scripts — no build, no Postgres — run locally and in CI:

```bash
node scripts/api-audit.mjs          # frozen public API surface
node scripts/dependency-graph.mjs   # 0 cross-domain imports, 0 cycles
node scripts/schema-audit.mjs       # tables, indexes, knowledge-link coverage
node scripts/security-audit.mjs     # every schema file classified
node scripts/benchmark.mjs --write  # core derivation baseline (via vitest)
node scripts/bundle-report.mjs      # first-load JS per route (needs a prod build)
```

Each writes a doc under `docs/` with `--write`. See the generated docs in
[api/](./api/), [architecture/](./architecture/), [database/](./database/),
[performance/](./performance/), [security/](./security/).

## Common pitfalls (learned the hard way)

- **`exactOptionalPropertyTypes`** is on — optional fields need `| undefined` explicitly, and
  object spreads must guard `undefined` (`...(x !== undefined ? { x } : {})`).
- **Name collisions** across `export *` — grep before adding `byType`/`isExpired`/`completed`-style
  names; domain-prefix them.
- **New columns break hand-built test row fixtures** — update every literal row.
- **Drizzle bundles enum-adds into the tables migration** — split manually and copy the snapshot
  json (see migrations 0029/0030).
- **`@myos/ui`**: `EmptyState` is from `@myos/ui` (not framework); `Text` has `display-m` not
  `display-s`; `Button` variants are `primary`/`secondary`/`ghost`/`danger` (no `accent`).
- **`--filter @myos/web build` wipes a running dev server's `.next`.**
- **PWA service worker** can serve a stale freshly-built page — clear SW + caches when verifying.

## Observability

Every tRPC procedure is auto-logged (request id, module, operation, duration, status) by the
middleware in `apps/web/server/trpc.ts`. Emit ad-hoc structured lines via
`@/lib/observability` (`emit`, `logOperation`). Client boundaries report via `reportClientError`.
