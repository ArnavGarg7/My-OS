# @myos/web

**The My OS web application** — the Next.js 15 App Router front end, the tRPC API, and the server-side domain layer that binds the deterministic core and the AI platform to the database.

## Purpose

The single deployable surface users interact with: the shell (sidebar/topbar/status bar/context panel/command palette), every feature page, the Chief of Staff homepage + conversational chat, and the AI Developer Console.

## Architecture

```
app/                Next App Router routes; (shell)/* are authed feature pages
components/          feature UIs (one folder per domain) + shell + design-system usage
server/
  <domain>/         repository + service + router (import "server-only")
  routers/_app.ts   root tRPC router (mounts every domain)
  trpc.ts           context + protected/observed procedures
  identity.ts       Clerk behind IdentityService
lib/                client-side providers, trpc client, shell nav, security classification
```

Request flow: **Client → tRPC → protectedProcedure (identity + `observed` logging) → service → `@myos/core`/`@myos/ai` + `@myos/db` → read model → client.** See [docs/diagrams/system-architecture.md](../../docs/diagrams/system-architecture.md).

## Dependencies

- `@myos/core`, `@myos/ai`, `@myos/db`, `@myos/ui`, `@myos/shared`. This is the **only** place the core + AI + DB are composed; the server layer is the seam.

## Running

```
corepack pnpm --filter @myos/web dev       # dev server (use the Browser preview tools, not raw)
corepack pnpm --filter @myos/web typecheck
corepack pnpm --filter @myos/web build
```

⚠️ Never run `--filter @myos/web build` while the dev server is running — it corrupts the live `.next` (`Cannot find vendor-chunks/@clerk…`). Fix: stop preview, `rm -rf apps/web/.next`, restart.

## Extending

Add a feature by creating `server/<domain>/{repository,service,router}.ts` (import the pure core), mounting the router in `server/routers/_app.ts`, building the UI under `components/<domain>/`, adding the route under `app/(shell)/`, and registering nav in `lib/shell/nav.ts`. Full recipe in [docs/guides/development.md](../../docs/guides/development.md).
