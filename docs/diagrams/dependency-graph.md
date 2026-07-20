# Dependency Graph

Package-level dependency direction (generated + validated by `scripts/dependency-graph.mjs` and `scripts/export-validator.mjs`). No cycles; no forbidden edges.

```mermaid
flowchart TD
  shared["@myos/shared"]
  core["@myos/core"]
  db["@myos/db"]
  ui["@myos/ui"]
  ai["@myos/ai"]
  web["@myos/web"]
  worker["@myos/worker"]

  core --> shared
  db --> shared
  ui --> shared
  ai --> shared
  web --> core
  web --> ai
  web --> db
  web --> ui
  web --> shared
  worker --> core
  worker --> db
  worker --> shared
```

**Forbidden (asserted in CI):**
- `@myos/core` → `@myos/ai` / `@myos/db` / any server (core is pure).
- `@myos/ai` → `@myos/core` / `@myos/db` (AI consumes read models via the server seam only).
- any deep import (`@myos/x/src/...`) or undeclared subpath.
