# Architecture Overview (Phase 4.5)

My OS is a single-user, self-hosted personal life operating system. Every feature is **fully
deterministic** — no AI, no randomness, no demo data. This document is the map: the layers, the
module pattern every domain follows, and the invariants the Phase 5 AI layer must preserve.

## Monorepo layout

```
packages/
  core/     Pure domain logic — 23 self-contained domains (no I/O, no framework)
  db/       Drizzle schema + migrations (Postgres)
  ui/       Design-system primitives (@myos/ui)
apps/
  web/      Next.js 15 App Router — server (tRPC) + client (React 19)
scripts/    Phase 4.5 architecture/audit scripts (pure filesystem+regex, no build)
docs/       This documentation set
```

## The four layers

1. **Pure core** (`packages/core/src/<domain>`). Deterministic domain logic exposed via a subpath
   export (`@myos/core/<domain>`). Takes plain inputs, returns plain outputs. No database, no
   network, no `Date.now()` — time is always injected. Each domain is independently testable and
   imports **no other core domain** (enforced by `scripts/dependency-graph.mjs`).
2. **Server** (`apps/web/server/<domain>`). `import "server-only"`. A repository (Drizzle),
   a service (composes the pure core with persistence), and a tRPC router. Cross-domain
   composition happens **only here**, via read models — never by importing another domain's core.
3. **UI** (`apps/web/components/<domain>` + `apps/web/app/(shell)/<route>`). React components and
   the route page. Talks to the server exclusively through the tRPC client.
4. **Integration seams**. Timeline/Analytics emitters, the Decision engine's `DecisionContext`,
   Morning/Tomorrow slots, the status bar, and the context-panel inspector registry. These wire
   domains together at the edges without coupling their cores.

## Request lifecycle

```
Client component → tRPC client → /api/trpc → observability middleware (request id, timing, log)
  → protectedProcedure (identity) → router → service → repository → Postgres
  → pure core derivation → response → structured log line
```

Every procedure is wrapped by the observability middleware (`apps/web/server/trpc.ts`), which
assigns a request id, resolves the acting identity, times the call, and emits one structured log
line (`module`, `operation`, `durationMs`, `status`). See [data-flow.md](./data-flow.md).

## Scale (as of the Phase 4.5 freeze)

- **23** pure-core domains, each with a matching server domain.
- **25** shell routes.
- **31** database migrations (0000–0030).
- **219** core test files.
- **0** cross-domain core imports, **0** circular dependencies (see
  [dependency-graph.md](./dependency-graph.md)).

## Invariants (must hold through Phase 5)

- **Determinism.** Same input → same output. Time and ids are injected, never read ambiently in
  pure code.
- **Domain independence.** No core domain imports another; composition is server-only.
- **Derived-never-stored.** Net worth, allocation, depreciation, relationship strength, life
  scores, attention, all analytics — recomputed on read, never persisted as source of truth.
- **One owner per domain.** See [domains.md](./domains.md).
- **Classified data.** Every persisted domain has a sensitivity class and an AI-safe boundary; see
  [../security/data-classification.md](../security/data-classification.md).

## Related documents

- [domains.md](./domains.md) — every domain and its owner.
- [integrations.md](./integrations.md) — the cross-module seams.
- [data-flow.md](./data-flow.md) — the request/read-model lifecycle.
- [dependency-graph.md](./dependency-graph.md) — generated import-graph audit.
- [../api/public-api.md](../api/public-api.md) — the frozen public API surface.
- [../ai-readiness/certification.md](../ai-readiness/certification.md) — the readiness report.
