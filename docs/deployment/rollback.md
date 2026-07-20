# Backup & Rollback Procedure

## Backup (before every deploy)

```bash
# Database snapshot
docker exec myos-dev-postgres-1 pg_dump -U myos -d myos > backup_$(date +%Y%m%d_%H%M%S).sql

# Record the currently deployed git tag + latest migration
git describe --tags
tail -n 20 packages/db/migrations/meta/_journal.json
```

## Rollback

### Application

1. Redeploy the previous release tag.
2. `rm -rf apps/web/.next` on the host and rebuild (stale chunks are a known failure mode).

### Database

Migrations are **forward-only** (Drizzle). To roll back schema:

1. Stop the app + worker.
2. Restore the pre-deploy dump: `psql -U myos -d myos < backup_<ts>.sql`.
3. Re-deploy the matching application tag (schema and code must agree).

> Because migrations don't ship down-scripts, a schema rollback is a **restore**, not a reverse-migration. Always snapshot first. New destructive migrations should be additive where possible (add columns/tables; deprecate before dropping) so a code-only rollback stays safe.

## Verify after rollback

- `node scripts/migration-validator.mjs` → PASS.
- App boots; `/ai` Overview healthy; no console errors on main paths.
