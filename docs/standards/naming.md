# Naming Standards

- **Packages** — `@myos/<name>`; publishable packages live in `packages/`, deployables in `apps/`.
- **Domains** — singular, lowercase (`task`, `planner`, `calendar`). The same name is used for the core module, the server folder, and the UI folder.
- **Files** — kebab or domain-conventional within a folder; tests are `<name>.test.ts` beside the code.
- **Read-model builders** — verb-first and consistent across domains: `buildSummary`/`summary`, `computeSignals`/`signals`, `portfolio`, `search`, `statistics`. These form the frozen public surface ([../api/public-api.md](../api/public-api.md)).
- **Migrations** — `NNNN_snake_case` (drizzle-generated); never renamed or reordered ([reports/migration-report](../reports/migration-report.md)).
- **DB** — snake_case tables/columns; one schema file per domain.
- **tRPC** — `router.procedure` mirrors `domain.operation`; mutations are verbs, queries are nouns.
- **Grep before adding** a shared name — collisions across domains (e.g. `habits`, `completed`) have bitten before.
