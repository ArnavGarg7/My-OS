# @myos/worker

**The background job worker** — the out-of-band process that runs scheduled and queued work (pg-boss) separately from the request path.

## Purpose

Keep long-running / periodic work off the web request cycle: notification generation, sync jobs, and any future autonomous (Phase 6) tasks. Shares the same database and deterministic core as the web app, so results are consistent with what users see.

## Architecture

```
src/
  index.ts     worker entry — registers job handlers, starts the queue
```

Jobs call the same `@myos/core` domain logic and `@myos/db` client the web server uses; the worker owns no business rules of its own.

## Dependencies

- `@myos/core`, `@myos/db`, `@myos/shared`, `pg-boss`. No UI, no Next.js.

## Running

```
corepack pnpm --filter @myos/worker dev
corepack pnpm --filter @myos/worker typecheck
```

## Extending

Register a new job type and handler in `src/index.ts`, delegating the actual work to a `@myos/core` function (keep the handler thin). Schedule it via pg-boss. Anything time-based takes `now` from the job payload / clock injection so it stays testable.
