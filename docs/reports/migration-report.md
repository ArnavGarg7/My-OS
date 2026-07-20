# Migration Report

Generated for the `v1.0.0-rc1` architecture freeze. Validated by `scripts/migration-validator.mjs`.

## Summary

- **Total migrations:** 35 (`0000` … `0034`), contiguous, no gaps.
- **SQL files:** 35 · **Snapshots:** 35 — every journal entry is paired with a `.sql` and a `NNNN_snapshot.json`.
- **Dialect:** PostgreSQL (journal version 7). Extensions ensured at migrate time: `pgvector`, `pg_trgm`, `citext`.
- **Naming:** all tags follow `NNNN_snake_case`.
- **Single-user:** no `user_id` columns anywhere (05 §0).

## Phase map

| Range | Phase / area |
|---|---|
| 0000–0001 | Identity (auth_users, user_preferences), platform/push |
| 0002–0005 | Today, Morning, Decision, Inbox |
| 0006–0009 | Task, Planner, Calendar, Project |
| 0010–0015 | Health, Journal, Finance, Goal, Timeline, Analytics |
| 0016–0021 | Tomorrow, Focus, Notification, Automation, Orchestration (+ timeline_source) |
| 0022–0030 | Knowledge, Life, Resource, Intelligence (+ timeline_source splits) |
| 0031–0034 | AI platform, Chief, Assistant, AI production-readiness |

## Standards verified

- ✅ Migration order contiguous from 0 (journal `idx` matches position).
- ✅ Every migration has a matching snapshot; no orphans.
- ✅ Naming consistent (`NNNN_snake_case`).
- ✅ Indexes present on foreign-key / lookup columns (per-schema `index(...)`).
- ✅ Enum-add migrations split from table migrations where drizzle bundled them (0021/0023/0028/0030).

## Rollback posture

Migrations are forward-only; schema rollback is a **restore from backup** ([deployment/rollback.md](../deployment/rollback.md)). New migrations should be additive (add/deprecate before drop) so code-only rollbacks stay safe.
