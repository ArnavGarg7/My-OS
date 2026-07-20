# @myos/ai

**The provider-agnostic, deterministic AI platform.** Ships the AI *infrastructure*, the *Chief of Staff*, the *conversational assistant*, and the *production-readiness* tooling — all as pure, dependency-free modules. No vendor SDK is installed; the **Local provider** is a complete offline default so the platform runs identically in tests and CI ([ADR-005](../../docs/adr/ADR-005.md)).

## Purpose

Let any AI capability compose one pipeline rather than reinventing it:

```
Application → Gateway → Context → Budget → Tools → Provider → Structured → Telemetry
```

The AI **reasons**; the operating system **owns the truth**. Every answer is grounded in deterministic tool results; mutations are proposals ([ADR-004](../../docs/adr/ADR-004.md)); if the OS doesn't know, the Chief says so.

## Architecture

- **Infra** (5.1): `gateway`, `providers` (anthropic/openai/gemini/groq/local), `prompts`, `context`, `tools`, `memory`, `telemetry`, `streaming`, `structured`, `cost`, `evals`, `config`, `schemas`.
- **Chief** (5.2): `chief/` — grounded Now/Morning/Optimize/Rescue/Night + provider policy + personal profile.
- **Assistant** (5.3): `assistant/` — multi-turn, context-router, tool-loop, reasoning, citations, streaming.
- **Production** (5.4): `observability`, `performance`, `security`, `benchmark`, `reliability` + `prompts/lifecycle`, `cost/intelligence`, `evals/scenarios`.

Cloud clients are **injected server-side** (`apps/web/server/{ai,chief,assistant}`) reading env keys — this package stays keyless.

## Dependencies

- `@myos/shared`. No `@myos/core`, no DB, no network. (The server layer wires DB + real HTTP clients.)

## Public API

Root + declared subpaths only:

```ts
import { createAiEngine } from "@myos/ai";
import { runTurn } from "@myos/ai/assistant";
import { buildTrace, replayTrace } from "@myos/ai/observability";
```

## Extending

Add a subpath by creating `src/<name>/index.ts`, exporting it from `src/index.ts`, and adding it to `package.json` `exports`. Keep it pure and take `now`/clients as injected deps. New providers implement the `CloudClient` shape and register in the provider registry — never add provider-specific logic outside the provider layer ([ADR-002](../../docs/adr/ADR-002.md)).
