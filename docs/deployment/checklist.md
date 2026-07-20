# Deployment Checklist

## Pre-deploy

- [ ] `corepack pnpm install --frozen-lockfile` succeeds.
- [ ] `corepack pnpm -r typecheck` clean.
- [ ] `corepack pnpm format:check` and `corepack pnpm -r lint` clean.
- [ ] `node scripts/repository-audit.mjs` → PASS (architecture, exports, migrations, packages, docs, security).
- [ ] `corepack pnpm --filter @myos/web build` succeeds (dev server stopped).
- [ ] Focused test suites green (core + server).
- [ ] `.env` has all required variables (`@myos/shared` validates on boot). AI keys optional.

## Database

- [ ] Backup taken (see [rollback](rollback.md)).
- [ ] `node scripts/migration-validator.mjs` → PASS.
- [ ] `corepack pnpm db:migrate` applied; verify latest tag with `psql \dt`.

## Release

- [ ] Version tag matches `package.json` (`v1.0.0-rc1`).
- [ ] [Release notes](../release/release-notes.md), [breaking changes](../release/breaking-changes.md), [known limitations](../release/known-limitations.md) reviewed.

## Post-deploy

- [ ] Web app + worker healthy; `/ai` Overview shows provider health.
- [ ] Zero new console errors on the main navigation paths.
