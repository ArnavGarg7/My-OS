# Debugging Guide

## Structured logs

Every tRPC procedure is logged by the `observed` middleware: `{module, operation, status, durationMs}`. Grep the dev server output by module/operation to trace a request.

## AI requests

Use the **AI Developer Console** (`/ai`): Traces (replayable execution traces), Performance (stage budgets), Reliability (failure drills), Security (injection scan + secret diagnostics), Cost, Benchmark, Evaluation. Every AI request records a trace ([ADR-009](../adr/ADR-009.md)).

## Common issues

- **`Cannot find module vendor-chunks/@clerk…` / queries hang** — the dev server's `.next` was corrupted (usually by running `--filter @myos/web build` while `dev` was running). Fix: stop the preview, `rm -rf apps/web/.next`, restart.
- **Stale page after a rebuild** — the PWA service worker is serving a cached shell. Unregister it + clear caches, then hard reload.
- **AI "Loading…" forever** — a slow query in a shared tRPC batch (e.g. `healthAll` pinging providers with no network). Hot-path endpoints race such calls against a short timeout.
- **Full `apps/web` vitest OOMs** — run focused suites (`vitest run <path> --pool=forks`), not the whole app at once.

## Database

```bash
docker exec myos-dev-postgres-1 psql -U myos -d myos -c "\dt"
node scripts/migration-validator.mjs   # journal/order/snapshot consistency
```
