# Changelog

All notable changes to My OS are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and the project adheres to
[Semantic Versioning](https://semver.org/). Dates are ISO-8601.

## [1.0.0] — 2026-07-22

The first stable release. Phases 1–6 complete. Architecture frozen (ADR-010).

### Added — Phase 6: Autonomous Intelligence

- **Event Intelligence Engine** (6.1) — `@myos/core/events`; environment changes → ranked, explainable,
  immutable Signals feeding the Chief. Deterministic ranking (the AI never ranks). Migration 0035
  (8 signal tables). `/signals` dashboard.
- **Predictive Intelligence Engine** (6.2) — `@myos/core/prediction`; 8 forecast models → confidence-
  scored, immutable Predictions → Prediction Signals. No AI, no randomness; predictions never mutate or
  trigger. Migration 0036 (8 tables). `/prediction` center.
- **Proposal-First Automation Engine** (6.3) — `@myos/core/autopilot`; propose → approve → execute →
  verify → rollback → audit. Every mutation reversible, verified, idempotent, auditable. The AI never
  executes. Migration 0037 (12 `autopilot_*` tables). `/autopilot` center.
- **External Ecosystem & Connector Platform** (6.4) — `@myos/core/connectors`; Google Calendar / Gmail /
  GitHub / Drive / Slack / Weather become normalized event sources feeding the unchanged intelligence
  stack. Credential vault (AES-256-GCM, server-only, AI-inaccessible). Migration 0038 (12 `connector_*`
  tables). `/connectors` center. New env `MYOS_CONNECTOR_SECRET`.
- **Adaptive Personal Intelligence Engine** (6.5) — `@myos/core/adaptation`; a deterministic Personal
  Profile learned from behaviour + feedback (preferences, habits, routines, decision styles). Every
  learned value is confidence-scored, evidence-backed, user-editable, reversible. The AI never learns
  on its own. Migrations 0039 + 0040 (12 tables). `/adaptation` center. The Chief consumes the profile
  as an additional read model.

### Changed

- Bumped all workspace packages and the application from `1.0.0-rc.1` to `1.0.0`.
- Navigation grew from 27 to 32 routes across Phase 6.
- Refreshed the root README, architecture doc, and release documentation to reflect Phases 1–6.

### Removed

- Unused `SESSION_SECRET` environment variable (Clerk owns authentication via the IdentityService; the
  variable was never read). Removed from `packages/shared/src/env.ts`, `.env.example`, and the
  architecture doc.

### Security

- Documented `MYOS_CONNECTOR_SECRET` in `.env.example` — the AES-256-GCM key for connector credentials,
  kept distinct from `MYOS_AI_CREDENTIALS_SECRET` so connector secrets remain isolated from the AI
  subsystem. See the [v1.0.0 security review](docs/security/release-review-v1.0.0.md).

## [1.0.0-rc.1] — Phase 5 finale

- Architecture freeze and Release Candidate. Developer tooling (export / migration / package-health /
  docs / repository validators), the full documentation set (ADRs, diagrams, guides, standards), and
  the RC version. No user-facing features.

## [0.5.0] — Phase 5: AI

- AI Core Platform, AI Chief of Staff, Conversational Chief, AI Production Readiness. Provider-agnostic
  and offline-capable (Local provider). Migrations 0031–0034.

## [0.4.0] — Phase 4: Knowledge, Life, Resource, Intelligence

- Knowledge platform, Personal Life platform, Resource & Relationship platform, Intelligence Dashboard.
  Migrations 0022–0030.

## [0.3.0] — Phase 3: Orchestration

- Tomorrow Studio, Focus Mode, Notification, Automation, Orchestration engines. Migrations 0016–0021.

## [0.2.0] — Phase 2: Core Life OS

- Today, Morning Briefing, Decision, Inbox, Task, Planner, Calendar, Project, Health, Journal, Finance,
  Goal, Timeline, Analytics engines. Migrations 0003–0015.

## [0.1.0] — Phase 1: Foundation

- Monorepo, identity (Clerk behind IdentityService), command palette, PWA / platform layer.
  Migrations 0000–0002.

[1.0.0]: #100--2026-07-22
[1.0.0-rc.1]: #100-rc1--phase-5-finale
