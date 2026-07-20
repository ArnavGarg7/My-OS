# Coding Standards

- **TypeScript strict** everywhere — plus `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`. Optional props take `| undefined`; index access is checked (`arr[0]!` only when provably safe).
- **Purity in core/AI** — no IO, clock, or randomness in `@myos/core` and `@myos/ai`. Inject `now` and clients.
- **Server-only boundaries** — server files start with `import "server-only"`; the DB and real HTTP clients live only there.
- **Formatting/lint** — Prettier + ESLint are the source of truth: `corepack pnpm format && corepack pnpm -r lint`. Don't hand-format.
- **Comments** — explain *why*, at the altitude of the surrounding code; match existing density. No restating the code.
- **Errors** — fail loudly at boundaries (env validation, schema parsing); recover deterministically inside the AI pipeline ([ADR-005](../adr/ADR-005.md)).
- **No secrets in source** — ever. Only in the gitignored `.env` ([../security/data-classification.md](../security/data-classification.md)).
- **Tests colocated**, deterministic, structural assertions.
