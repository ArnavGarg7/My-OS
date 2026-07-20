# @myos/shared

**Cross-cutting primitives** shared by every package — validated environment config and small framework-agnostic utilities. The lowest layer in the dependency graph: it imports nothing from the workspace.

## Purpose

One validated source of truth for environment variables (via zod) and a home for tiny helpers that would otherwise be duplicated. Keeping these here prevents circular dependencies and keeps `@myos/core` / `@myos/ai` free of env-parsing concerns.

## Architecture

```
src/
  env.ts     zod-validated process.env (throws early on misconfig)
  index.ts   public barrel
```

## Dependencies

- `zod`. **No workspace dependencies** — this is the base of the layering.

## Public API

```ts
import { env } from "@myos/shared";
// env.DATABASE_URL, env.ANTHROPIC_API_KEY, … all typed + validated
```

## Extending

Add a variable to the zod schema in `env.ts` (mark optional with `.optional()` if not required to boot), and document it in `.env.example`. Never read `process.env` directly elsewhere — go through this module so validation stays centralized. Secrets belong only in the gitignored `.env`, never in source or `.env.example`.
