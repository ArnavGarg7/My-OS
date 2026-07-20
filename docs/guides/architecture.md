# Architecture Guide

My OS is a single-user, self-hosted, **deterministic** life operating system with an AI layer that reasons over — but never replaces — the deterministic truth.

## Layers

`@myos/shared` → `@myos/core` / `@myos/db` / `@myos/ui` → `apps/web/server` → `@myos/ai` (server-wired) → `apps/web` app. Direction is downward only ([dependency graph](../diagrams/dependency-graph.md), [ADR-010](../adr/ADR-010.md)).

## Principles

- **Deterministic core** — all calculations pure ([ADR-001](../adr/ADR-001.md)).
- **AI composes, never duplicates** — reads pre-computed read models via the server seam ([ADR-003](../adr/ADR-003.md)).
- **Grounded + proposal-first** — answers come from tools; mutations are proposals ([ADR-004](../adr/ADR-004.md), [ADR-007](../adr/ADR-007.md)).
- **Offline-first** — the Local provider is a complete fallback ([ADR-005](../adr/ADR-005.md)).
- **Observable** — every request is traced and reproducible ([ADR-009](../adr/ADR-009.md)).

## Flows

- [System architecture](../diagrams/system-architecture.md)
- [AI pipeline](../diagrams/ai-pipeline.md)
- [Chief pipeline](../diagrams/chief-pipeline.md)
- [Planner pipeline](../diagrams/planner-pipeline.md)

## Domains

The deterministic domains and their frozen public read-model surface are catalogued in [docs/architecture/domains.md](../architecture/domains.md) and [docs/api/public-api.md](../api/public-api.md).
