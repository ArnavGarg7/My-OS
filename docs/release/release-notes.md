# Release Notes — v1.0.0

**My OS — 1.0.0.** The first stable release: a single-user, self-hosted, deterministic personal life
operating system with a grounded AI Chief of Staff and a complete **Autonomous Intelligence** stack.
The system observes its environment, forecasts likely outcomes, proposes safe and reversible actions,
connects to external services, and adapts to the individual over time — all while preserving
determinism, proposal-first execution, explainability, auditability, and complete user control.
Architecture is **frozen** ([ADR-010](../adr/ADR-010.md)).

## The full stack (Phases 1–6)

```
External World → Connectors → Normalized Events → Event Intelligence → Signals
   → Predictive Intelligence → Proposal Automation → Adaptive Personal Intelligence → AI Chief of Staff
```

## Highlights

- **Deterministic life OS** — 25+ pure `@myos/core` domains (today, morning, decision, inbox, task,
  planner, calendar, project, health, journal, finance, goal, timeline, analytics, tomorrow, focus,
  notification, automation, orchestration, knowledge, life, resource, intelligence, events,
  prediction, autopilot, connectors, adaptation), each with a server + UI.
- **AI Chief of Staff** — grounded "what should I do now?", Morning Intelligence, Optimize/Rescue/Night;
  every plan change is a **proposal** ([ADR-003](../adr/ADR-003.md), [ADR-004](../adr/ADR-004.md)).
- **Conversational interface** — multi-turn, tool-grounded, cited; says so when the OS doesn't know.
- **Provider-agnostic AI** — Anthropic / OpenAI / Gemini / Groq / Local, interchangeable; **Local is a
  complete offline fallback** — the OS is fully functional with no API keys
  ([ADR-002](../adr/ADR-002.md), [ADR-005](../adr/ADR-005.md)).
- **Event Intelligence (6.1)** — environment changes become ranked, explainable, immutable **Signals**.
  The AI never ranks; ranking is deterministic.
- **Predictive Intelligence (6.2)** — 8 deterministic forecast models with confidence bands. The OS
  predicts; the AI only explains. Predictions never mutate data or trigger actions.
- **Proposal-First Automation (6.3)** — the OS can execute approved work: propose → approve → execute →
  verify → rollback → audit. Every mutation is reversible, verified, idempotent, and auditable. The AI
  never executes.
- **External Connectors (6.4)** — Google Calendar, Gmail, GitHub, Drive, Slack, Weather become
  normalized event sources. Credentials are encrypted with **AES-256-GCM**, server-only, and never
  reachable by the AI. Read-first, provider-agnostic, offline by default.
- **Adaptive Personal Intelligence (6.5)** — a deterministic Personal Profile learned from behaviour
  and explicit feedback: preferences, habits, routines, decision styles. Every learned value is
  confidence-scored, evidence-backed, user-editable, and reversible. The AI never learns on its own.
- **AI Developer Console** — traces + replay, benchmarking, cost intelligence, performance budgets,
  reliability drills, security diagnostics ([ADR-009](../adr/ADR-009.md)).
- **Engineering discipline** — frozen public APIs, single-barrel packages, contiguous validated
  migrations (0000–0040), ADRs, package READMEs, and an automated repository auditor enforced in CI.

## What changed since v1.0.0-rc.1

Phase 6 — Autonomous Intelligence — landed in full: the Event, Prediction, Automation, Connector, and
Adaptation engines (Sprints 6.1–6.5), each added as a new deterministic layer that the existing
intelligence stack consumes **without any architectural change**. The v1.0.0 release sprint then
performed repository cleanup (removed the unused `SESSION_SECRET`, documented `MYOS_CONNECTOR_SECRET`),
the version bump to 1.0.0, a documentation refresh, and the security / performance / reliability
reviews recorded in this bundle. No new user-facing features were added during the release sprint.

## Verification

- All 8 workspace projects typecheck; lint + format clean.
- Focused core + server test suites pass across every domain.
- `node scripts/repository-audit.mjs` → **8/8 PASS** (architecture frozen and consistent).
- Browser verification: every major page renders with zero console errors.

See [capabilities](capabilities.md), [known limitations](known-limitations.md),
[future work / roadmap](future-work.md), [breaking changes](breaking-changes.md), the
[security review](../security/release-review-v1.0.0.md), the
[performance review](../performance/release-review-v1.0.0.md), and the
[release checklist](checklist-v1.0.0.md).
