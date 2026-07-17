# Integration Seams (Phase 4.5)

Domains stay independent (no cross-domain core imports) yet the product feels unified. That is
achieved through a small, fixed set of **seams** — the only places one domain learns about
another. Each seam is server-side and traffics in read models, so no seam couples two cores. The
AI layer (Phase 5) plugs into these same seams; it introduces no new coupling.

## 1. Read models (the primary seam)

Every domain's server layer exposes a stable, aggregated view consumed by others:

- `summary(...)` — the domain's current state as bands/counts/scores (no free text).
- `signals(...)` — inputs the Decision engine and Notification rules consume.
- `portfolio(...)` / `dashboard(...)` / `statistics(...)` — richer derived rollups where relevant.

These are the **AI-safe surfaces** (see [../security/data-classification.md](../security/data-classification.md)):
aggregated, non-identifying, safe to compose into AI context. Raw rows never cross a seam.

## 2. DecisionContext

`packages/core/src/decision` defines a `DecisionContext` — a plain struct every module contributes
signals to (`decision`, `focusMode`, `notifications`, `automation`, `orchestration`, `knowledge`,
`life`, `resources`, `dashboard`, …). The server assembles it from each domain's `signals()` read
model, then the pure rules engine scores and explains. Rules are deterministic; no rule imports a
foreign core.

## 3. Timeline & Analytics emitters

On successful mutation, a domain's service emits an ephemeral event (`lib/timeline`,
`lib/analytics` provider/emitter/registry). The `TimelinePersistenceBridge` subscribes and calls
`timeline.record` — so Timeline aggregates everything with **no changes to the emitting module**.
Analytics consumes the same stream plus domain summaries.

## 4. Morning & Tomorrow slots

Morning (read-only briefing) and Tomorrow (evening planning) render **slots** filled by each
domain's summary. Adding a domain to the briefing is a slot registration, not a dependency.

## 5. Status bar & context-panel inspector registry

The status bar renders one segment per domain from its status signal. The context panel uses a
unified **inspector registry** — a domain registers an inspector for its entity type; the panel
renders whichever entity is selected without knowing the domains.

## 6. Domain-extension bridges

Where a domain builds on another it uses one explicit bridge file, never a core import:

- **Resource ↔ Finance** — `apps/web/server/resource/bridge.ts` is the ONE meeting point. It reads
  Finance's own `accounts()` balances (cash + liabilities), **excludes investment accounts** to
  avoid double-counting, and never imports `@myos/core/finance`.
- **Life ↔ Health/Goals**, **Knowledge ↔ Journal** — analogous: neutral baselines and server-side
  reads, no core coupling.

## 7. Intelligence composer

`apps/web/server/intelligence/composer.ts` is the single place that reads every owning module's
read model to build the executive dashboard input. The intelligence **core imports no other core**
— the composer does all cross-domain reading. This is the template for how the Phase 5 AI layer
should gather context: one server-side composer, read models only.

## Seam invariants

- A seam reads a **read model**, never raw tables of another domain.
- A seam writes through the owning domain's **service**, never its tables.
- No seam adds a cross-domain **core** import (audited by `scripts/dependency-graph.mjs`).
