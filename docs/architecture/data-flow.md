# Data Flow (Phase 4.5)

How a request travels through the layers, where determinism is enforced, and where observability
and security boundaries sit.

## Mutation (write) path

```
Client component
  │  tRPC client (typed)
  ▼
/api/trpc/[trpc]/route.ts          fetchRequestHandler, force-dynamic
  │
  ▼
observability middleware           request id · resolve identity · start timer   (server/trpc.ts)
  │
  ▼
protectedProcedure                 inject non-null identity (via IdentityService → Clerk)
  │
  ▼
router → service                   validate (zod) · compose pure core with repository
  │                                   • pure core: deterministic derivation from injected now/id
  │                                   • repository: Drizzle write to Postgres
  ▼
service success
  │  emit ephemeral timeline/analytics event (lib/timeline, lib/analytics)
  ▼
observability middleware           emit structured log line (module.operation, durationMs, status=ok)
  │
  ▼
response → client                  TimelinePersistenceBridge records the event asynchronously
```

On failure the middleware logs `status=error` with a log-safe `{ name, message }` (no stack, no
PII) and the error surfaces to the client; a thrown error in a shell route renders the
`app/(shell)/error.tsx` boundary, which reports through the same structured shape client-side.

## Query (read) path

```
Client → tRPC query → observability middleware → protectedProcedure → router
  → service.summary()/signals()/dashboard()   (a READ MODEL)
      → repository reads rows
      → pure core derivation (bands, scores, rollups) — recomputed, never cached as truth
  → aggregated, classified-safe view → client
```

Read models are the **derived-never-stored** boundary: net worth, allocation, depreciation,
relationship strength, life scores, attention, and all analytics are computed on every read.

## Where the boundaries sit

| Boundary | Location | Guarantee |
| --- | --- | --- |
| Determinism | `packages/core/src/<domain>` | No I/O; time + ids injected. |
| Auth | `protectedProcedure` (server/trpc.ts) | Identity via IdentityService; never references Clerk elsewhere. |
| Observability | observability middleware (server/trpc.ts) | One structured line per procedure. |
| Error containment | `app/global-error.tsx`, `app/(shell)/error.tsx` | Client boundaries; server errors logged + surfaced. |
| Data classification | `apps/web/lib/security/classification.ts` | Every domain classified; AI-safe surfaces allowlisted. |
| Cross-domain composition | server services + `composer.ts`/`bridge.ts` | The only place domains meet. |

## Cross-module event flow (Timeline/Analytics)

1. A service mutation succeeds.
2. It emits an event to the in-memory emitter (`lib/timeline`, `lib/analytics`).
3. `TimelinePersistenceBridge` subscribes and calls `timeline.record` — the emitting module is
   unchanged and unaware.
4. Analytics reads the same stream plus domain summaries to compute metrics on demand.

This one-way, subscribe-don't-import flow is why adding a domain never edits Timeline or Analytics.
