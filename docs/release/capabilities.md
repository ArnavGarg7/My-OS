# Capabilities — v1.0.0

What My OS does, grouped by layer. Every capability is deterministic unless explicitly AI-assisted, and
every AI-assisted surface is grounded in deterministic engine output. 32 navigable routes.

## Daily operating system

- **Today / Morning Briefing** — an editorial daily briefing; deterministic recommendations logged to decision history.
- **Chief of Staff** (`/chief`, default home) — grounded "what should I do now?", Morning Intelligence, Optimize / Rescue / Night; conversational chat with citations. Every plan change is a proposal.
- **Tomorrow Studio** — an 8-step guided evening flow to close today and plan tomorrow.
- **Planner / Calendar** — deterministic day timeline; RFC-5545 recurrence, free-busy, conflict detection; meetings are fixed blocks the planner respects.
- **Tasks / Inbox / Projects / Goals** — canonical work model, single capture surface, long-term outcomes, life objectives with habits and key results.
- **Focus Mode** — a pure deep-work timer with derived metrics.

## Life domains

- **Health** — sleep → recovery → readiness, hydration / nutrition / energy / body / correlations.
- **Journal** — reflections, reviews, mood and streaks, keyword search.
- **Finance** — accounts (derived balances), signed transactions, budgets, subscriptions, savings, cashflow forecast (single-currency ₹, manual entry).
- **Knowledge** — second brain: markdown notes, wiki backlinks, spaced-repetition flashcards, memory resurfacing.
- **Life / Resources** — habits and routines; investments, assets, vehicles, insurance, documents, travel, and a lightweight CRM.
- **Timeline / Analytics / Intelligence** — an immutable unified activity feed, deterministic metrics and reviews, and an executive dashboard.

## Autonomous Intelligence (Phase 6)

- **Signals** (`/signals`) — Event Intelligence: environment changes → ranked, explainable, immutable signals.
- **Prediction** (`/prediction`) — 8 deterministic forecast models with confidence bands; simulations (what-ifs) that never mutate.
- **Autopilot** (`/autopilot`) — Proposal-First Automation: propose → approve → execute → verify → rollback → audit. Reversible, verified, idempotent, auditable.
- **Connectors** (`/connectors`) — external services (Google Calendar, Gmail, GitHub, Drive, Slack, Weather) as normalized event sources. Credentials AES-256-GCM encrypted, server-only, AI-inaccessible. Read-first, offline by default.
- **Personal Intelligence** (`/adaptation`) — a deterministic Personal Profile learned from behaviour and feedback: preferences, habits, routines, decision styles — confidence-scored, evidence-backed, user-editable.

## AI platform

- **Provider-agnostic** — Anthropic / OpenAI / Gemini / Groq / Local, interchangeable. The **Local provider** is a complete offline fallback: the OS is fully functional with no API keys.
- **AI Developer Console** (`/ai`) — traces + replay, benchmarking, cost intelligence, performance budgets, reliability drills, security diagnostics.
- **Settings** (`/settings`) — identity, preferences, platform (PWA / install / notifications / push), and AI credentials.

## Platform

- **PWA** — installable, offline shell, service worker, update lifecycle, web push.
- **Single-user, self-hosted** — Docker Compose + Caddy on one VPS; Postgres 16 + pgvector; a Node worker for jobs, schedulers, notifications, and backups.
