# Contributing

## Workflow

1. Branch from `main`.
2. Follow the [module recipe](../guides/development.md) — pure core → DB → server → UI.
3. Keep changes within the [layered architecture](../diagrams/dependency-graph.md); do not break a frozen public API without an ADR + migration ([ADR-010](../adr/ADR-010.md)).
4. Add colocated, deterministic tests ([testing](../guides/testing.md)).
5. Run the gates locally before pushing:

```bash
corepack pnpm -r typecheck
corepack pnpm format && corepack pnpm -r lint
node scripts/repository-audit.mjs
corepack pnpm --filter @myos/web build   # stop the dev server first
```

## Standards

- [Coding standards](../standards/coding.md) · [Naming standards](../standards/naming.md) · [Package standards](../standards/packages.md).
- No secrets in source or `.env.example`. New env vars go through `@myos/shared`.
- New DB tables must be classified in `apps/web/lib/security/classification.ts`.

## Commits & PRs

- Small, focused commits; describe *why*.
- A PR must pass CI (typecheck, lint, tests, architecture audit, migration validation, docs validation, build). See [.github/workflows](../../.github/workflows).
