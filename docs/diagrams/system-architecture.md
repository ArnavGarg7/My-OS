# System Architecture

The layered architecture. Dependencies point **downward** only — a higher layer never imported by a lower one. Enforced by `scripts/dependency-graph.mjs` + `scripts/export-validator.mjs`.

```mermaid
flowchart TD
  App["apps/web (Next.js App Router + UI)"]
  Worker["apps/worker (pg-boss jobs)"]
  AI["@myos/ai — AI platform / Chief / Assistant"]
  Server["apps/web/server/* — repositories · services · tRPC routers"]
  Core["@myos/core — deterministic domains"]
  DB["@myos/db — Drizzle schema + client"]
  UI["@myos/ui — design system"]
  Shared["@myos/shared — env + primitives"]

  App --> UI
  App --> Server
  Server --> AI
  Server --> Core
  Server --> DB
  AI --> Shared
  Core --> Shared
  DB --> Shared
  UI --> Shared
  Worker --> Core
  Worker --> DB
```

- **The server layer is the only seam** that composes core + AI + DB.
- `@myos/ai` imports **no** business domain and **no** DB — cloud clients + persistence are injected server-side.
- `@myos/core` is pure and imports only `@myos/shared`.
