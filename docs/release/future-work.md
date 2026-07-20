# Future Work

## Phase 6 — Autonomous Intelligence (next)

The frozen `v1.0.0-rc1` architecture is the foundation for:

- **Proactive Chief** — acting on triggers (freed time, disruptions, deadlines) without being asked, still proposal-first.
- **Always-on scheduling** — an event bus driving notification/automation/orchestration in the worker, not on-demand.
- **Autonomous task execution** — the assistant carrying multi-step plans to completion under explicit, revocable authorization.

## Beyond

- Real streaming voice on top of the existing voice-ready seams.
- Optional embedding search as a pluggable retrieval strategy (kept behind the deterministic default).
- Wearable / bank / calendar provider sync where a provider seam already exists.
- Multi-device sync hardening for the PWA.

All future work must preserve the frozen public APIs or ship an ADR + migration ([ADR-010](../adr/ADR-010.md)).
