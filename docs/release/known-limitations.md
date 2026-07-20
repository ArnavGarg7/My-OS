# Known Limitations — v1.0.0-rc1

- **Single user** — no multi-tenancy; no `user_id` scoping. By design.
- **Migrations are forward-only** — schema rollback is a restore-from-backup, not a down-migration ([deployment/rollback.md](../deployment/rollback.md)).
- **AI cloud providers require network** — with no keys/network the Local provider serves everything (simpler outputs). Cloud health checks can be slow without connectivity; hot-path endpoints time them out.
- **Search is keyword/weight-band based** — no vector/embedding search anywhere (knowledge, memory, resource). Deterministic by choice ([ADR-008](../adr/ADR-008.md)).
- **Voice is infrastructure-only** — streaming + adapter seams exist; no full speech UI yet.
- **Background scheduling is on-demand** — notification/automation/orchestration generate on request; the worker runs jobs but there is no always-on event bus yet.
- **Full `apps/web` vitest run OOMs** — run focused suites.
- **Dev-server `.next` fragility** — running a production build against a live dev server corrupts chunks; documented workaround in [debugging](../guides/debugging.md).
- **Finance is single-currency (₹), manual entry** — no bank sync.
