# @myos/core

**The deterministic domain core of My OS.** Every business module (task, planner, calendar, health, finance, goal, timeline, analytics, tomorrow, focus, notification, automation, orchestration, knowledge, life, resource, intelligence, decision, morning, inbox, today, journal, project) lives here as a **pure** sub-package: types, constants, schemas, rules, and selectors with **no IO, no dates-from-the-clock, no randomness** — everything is a function of its inputs.

## Purpose

Own the truth. All calculations (scores, progress, forecasts, readiness, availability, recurrence) are deterministic and testable in isolation. The AI layer never re-implements any of this — it reads the read models these modules produce (see [ADR-001](../../docs/adr/ADR-001.md)).

## Architecture

```
@myos/core/<module>/
  types.ts        domain types
  constants.ts    tunable knobs (pure data)
  schemas.ts      zod input schemas
  <rules>.ts      pure decision/derivation logic
  selectors.ts    read-model builders (summary/signals/…)
  index.ts        the module's public barrel
```

Each module is imported by its **server** counterpart in `apps/web/server/<module>` (repository + service + tRPC router), which is the only layer that touches the database.

## Dependencies

- `@myos/shared` (env + shared utilities). **Nothing else.** Core imports no server, no UI, no AI, no DB driver.

## Public API

Import from the package root or a declared subpath only — never a deep `src/…` path:

```ts
import { taskCounts, searchTasks } from "@myos/core/task";
import { computeAvailability } from "@myos/core/calendar";
```

The frozen read-model surface per domain is enforced by `scripts/api-audit.mjs`.

## Extending

Add a new module by creating `src/<module>/` with the file layout above, exporting a barrel, and registering it in `src/index.ts`. Pair it with a server module. Keep it pure — if you need `now`, take it as a parameter. Add `*.test.ts` beside the code (run focused; the full suite is large).
