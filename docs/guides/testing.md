# Testing Guide

## Layers

- **Pure core** — colocated `*.test.ts` beside the domain code; deterministic (inject `now`).
- **Server** — mock the boundaries (repository, engine, providers) and assert the service composes correctly.
- **Repository / architecture** — the `.mjs` validators in `scripts/` (run by `repository-audit.mjs`).

## Running

```bash
# focused (preferred — the full apps/web suite OOMs)
corepack pnpm --filter @myos/ai exec vitest run src/<file>.test.ts --pool=forks
corepack pnpm --filter @myos/web exec vitest run server/<domain>/<file>.test.ts --pool=forks

# architecture + standards
node scripts/repository-audit.mjs
```

## Conventions

- Assert **structure/properties**, not string-exact output (evals do this too).
- Every AI capability must pass on the **Local** provider with no keys/network.
- New public read-model exports must stay in `scripts/api-audit.mjs`'s frozen contract.
- Add tests in the same PR as the code; keep them deterministic.
