# Known Limitations — v1.0.0

Deliberate scope boundaries and honest constraints of the 1.0.0 release. None block production use for
the single-owner deployment the OS is designed for.

## By design

- **Single user** — no multi-tenancy, no `user_id` scoping. The OS is a personal operating system.
- **Migrations are forward-only** — schema rollback is a restore-from-backup, not a down-migration ([deployment/rollback.md](../deployment/rollback.md)).
- **Deterministic by choice** — no vector/embedding search anywhere (knowledge, memory, resource); search is keyword + weight-band ranked ([ADR-008](../adr/ADR-008.md)). The AI never ranks, predicts, executes, or learns on its own — those are deterministic engine responsibilities.
- **Finance is single-currency (₹), manual entry** — no bank sync.

## Connectors (6.4) — offline-first

- **Connectors run in deterministic offline mode by default.** Live OAuth/HTTP is an injectable seam (`liveFetch`) that activates when credentials are present; the shipped default returns a deterministic sample feed so the full pipeline is exercisable without network or keys. Provider-specific live adapters are seams, not turnkey integrations, in 1.0.0.

## Adaptation (6.5) — learning from seeded observations

- **Behavioral observations are a deterministic seed** until watchers persist real per-module observations. The learning framework (preferences, habits, routines, confidence, reviews) is complete and tested; richer real-behaviour ingestion is future work. Feedback is already real and persisted.

## Platform

- **AI cloud providers require network** — with no keys/network the Local provider serves everything (simpler outputs). Cloud health checks can be slow without connectivity; hot-path endpoints time them out.
- **Background scheduling is on-demand** — notification / automation / orchestration / signals / prediction cycles run on request; the worker runs jobs but there is no always-on event bus yet.
- **Voice is infrastructure-only** — streaming + adapter seams exist; no full speech UI yet.

## Developer ergonomics

- **Full `apps/web` vitest run OOMs** — run focused suites (documented in [guides/testing.md](../guides/testing.md)).
- **Dev-server `.next` fragility** — running a production build against a live dev server corrupts chunks; documented workaround in [guides/debugging.md](../guides/debugging.md).
