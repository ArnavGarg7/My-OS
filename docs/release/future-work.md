# Future Roadmap

Phase 6 — Autonomous Intelligence — is complete and shipped in v1.0.0. What comes next should be driven
by the **product vision**, not by adding features for their own sake. Before planning the next phase,
decide the long-term intent: personal product, portfolio project, open-source platform, or commercial
SaaS — the answer reshapes everything below.

## Candidate directions (vision-dependent)

- **Always-on scheduling** — an event bus in the worker driving signals / prediction / notification / automation / orchestration continuously, instead of on-demand per request.
- **Live connector adapters** — turn the `liveFetch` seams into real OAuth/HTTP integrations for Google Calendar, Gmail, GitHub, Drive, Slack, and Weather (credentials already vaulted with AES-256-GCM).
- **Real behavioural ingestion for Adaptation** — watchers that persist real per-module observations so the Personal Profile learns from lived behaviour, not a deterministic seed.
- **Proactive Chief** — acting on triggers (freed time, disruptions, deadlines) without being asked, still strictly proposal-first.
- **Real streaming voice** — a full speech UI on top of the existing voice-ready seams.
- **Optional embedding search** — a pluggable retrieval strategy kept behind the deterministic default.
- **Multi-device sync hardening** for the PWA.

## Non-negotiable constraints for any future work

All future work must preserve the guarantees this release is built on:

- Determinism, proposal-first execution, explainability, auditability, replayability.
- Frozen public APIs — any change ships an ADR + a forward migration ([ADR-010](../adr/ADR-010.md)).
- The AI never ranks, predicts, executes, or learns on its own.
- No secret ever reaches the client; credentials stay server-only and AI-inaccessible.

## Recommended next step

Tag `v1.0.0`, snapshot the release (this documentation bundle + the git tag), then choose the product
vision **before** scoping a "Phase 7". The codebase is now substantial enough that direction should
lead the roadmap.
