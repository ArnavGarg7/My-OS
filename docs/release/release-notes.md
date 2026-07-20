# Release Notes — v1.0.0-rc1

**My OS — Release Candidate 1.** The first stable, production-grade candidate: a deterministic personal life operating system with a grounded AI Chief of Staff, a conversational interface, and a production-hardened AI platform. Architecture is **frozen** ([ADR-010](../adr/ADR-010.md)).

## Highlights

- **Deterministic life OS** — 20+ domains (task, planner, calendar, health, finance, goal, timeline, analytics, tomorrow, focus, notification, automation, orchestration, knowledge, life, resource, intelligence, …), each a pure `@myos/core` module with a server + UI.
- **AI Chief of Staff** — grounded "what should I do now?", Morning Intelligence, Optimize/Rescue/Night, all proposal-first ([ADR-003](../adr/ADR-003.md), [ADR-004](../adr/ADR-004.md)).
- **Conversational interface** — multi-turn, tool-grounded, cited; says so when the OS doesn't know.
- **Provider-agnostic AI** — Anthropic / Gemini / Groq / Local, interchangeable; **Local is a complete offline fallback** ([ADR-002](../adr/ADR-002.md), [ADR-005](../adr/ADR-005.md)).
- **AI Developer Console** — traces + replay, benchmarking, cost intelligence, performance budgets, reliability drills, security diagnostics ([ADR-009](../adr/ADR-009.md)).
- **Engineering discipline** — frozen public APIs, single-barrel packages, contiguous validated migrations, ADRs, package READMEs, and an automated repository auditor enforced in CI.

## What's new in 5.5

No user-facing features. Architecture freeze, developer tooling (export/migration/package-health/docs/repository validators), the full documentation set (this bundle + ADRs + diagrams + guides + standards), and the RC version.

## Verification

- All packages typecheck; lint + format clean.
- Focused core + server test suites pass.
- `node scripts/repository-audit.mjs` → PASS.
- Browser verification: main navigation + AI console render with zero new console errors.

See [known limitations](known-limitations.md), [breaking changes](breaking-changes.md), and [future work](future-work.md).
