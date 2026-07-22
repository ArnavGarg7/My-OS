# Release Checklist — v1.0.0

The go/no-go checklist for tagging `v1.0.0`. Every item verified during the release sprint.

## Architecture

- [x] Architecture frozen ([ADR-010](../adr/ADR-010.md)); no changes in this sprint.
- [x] `node scripts/repository-audit.mjs` → **8/8 PASS**.
- [x] Public-API export boundaries hold (single barrel per package, no deep imports).
- [x] Dependency direction enforced (`ui → ∅ · shared → ∅ · core → shared · db → shared · ai → core/db/shared · apps → all`).
- [x] Architecture guardrail test (`apps/web/lib/architecture.test.ts`) passes.

## Security

- [x] Connector vault AES-256-GCM; server-only; ciphertext never returned.
- [x] `decryptSecret` / `loadCredential` not called from any query path (grep-verified).
- [x] AI secrets server-only; only public `NEXT_PUBLIC_*` values reach the client.
- [x] 31/31 schema files classified; `connector_credentials` = `private`, AI-inaccessible.
- [x] Baseline HTTP security headers added at Caddy (HSTS, nosniff, frame-options, referrer, permissions).
- [x] Unused `SESSION_SECRET` removed; `MYOS_CONNECTOR_SECRET` documented.
- [x] Follow-ups recorded (app-side CSP, API rate limiting) — non-blocking for single-owner deploy.
- [x] Full report: [security/release-review-v1.0.0.md](../security/release-review-v1.0.0.md).

## Performance

- [x] Phase 6 added **no new dependencies** → shared bundle baseline unchanged.
- [x] New routes follow the established Center pattern → same route-specific band.
- [x] Lazy loading (`ssr:false` Intelligence Wheel), route splitting, 120 DB indexes.
- [x] Core derivations sub-millisecond (baseline preserved).
- [x] Full report: [performance/release-review-v1.0.0.md](../performance/release-review-v1.0.0.md).

## Documentation

- [x] Root README updated (v1.0.0 status, package list).
- [x] Release notes, capabilities, known limitations, future roadmap refreshed.
- [x] `CHANGELOG.md` created (root).
- [x] Architecture doc config list corrected (secrets).
- [x] `node scripts/docs-validator.mjs` → PASS (31 required docs, 7 package READMEs).

## Testing

- [x] `pnpm -r typecheck` → PASS (8 projects).
- [x] `pnpm format:check` → PASS.
- [x] `pnpm --filter @myos/web lint` → clean (1 pre-existing non-blocking warning).
- [x] Phase 6 core suites → 60 passed; server + nav + architecture → 42 passed.

## Migration

- [x] `node scripts/migration-validator.mjs` → PASS (0000–0040 contiguous, snapshots paired).
- [x] Migrations forward-only; rollback = restore-from-backup (documented).
- [x] All Phase 6 migrations applied and verified in the dev database.

## Deployment

- [x] `.env.example` complete and current (connector secret added, session secret removed).
- [x] Docker Compose + Caddy config present; security headers set.
- [x] Deployment guide + rollback runbook present ([deployment/](../deployment/), [guides/deployment.md](../guides/deployment.md)).
- [x] Health endpoint (`system.health`) intact.

## Release readiness

- [x] All 8 `package.json` at `1.0.0`.
- [x] Dev-database test artifacts cleaned (connector + adaptation test rows).
- [x] Browser verification: 12 major pages, **zero console errors**.
- [x] Git prepared for a `v1.0.0` tag (commit staged on a release branch; **not pushed, not tagged, not published** per instructions).

## Sign-off

Repository is **ready to tag as v1.0.0**. Recommended: create the annotated tag locally, snapshot this
documentation bundle, then decide the product vision before scoping the next phase (see
[future-work.md](future-work.md)).
